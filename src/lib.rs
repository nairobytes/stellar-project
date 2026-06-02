#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address, Env,
};

const BASIS_POINTS_DIVISOR: u32 = 10_000;
const INVESTOR_YIELD_BPS: u32 = 500;

#[derive(Clone)]
#[contracttype]
pub struct InvoiceCreatedEvent {
    pub invoice_id: u64,
    pub supplier: Address,
    pub buyer: Address,
    pub amount: i128,
    pub maturity_time: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct InvoiceFundedEvent {
    pub invoice_id: u64,
    pub investor: Address,
    pub amount: i128,
    pub timestamp: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct InvoiceRepaidEvent {
    pub invoice_id: u64,
    pub total_repaid: i128,
    pub investor_yield: i128,
    pub timestamp: u64,
}

#[derive(Clone)]
#[contracttype]
pub struct InvoiceDefaultedEvent {
    pub invoice_id: u64,
    pub timestamp: u64,
}

#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[contracttype]
pub enum InvoiceStatus {
    Pending = 0,
    Funded = 1,
    Repaid = 2,
    Overdue = 3,
    Defaulted = 4,
}

#[derive(Clone)]
#[contracttype]
pub struct Invoice {
    pub id: u64,
    pub supplier: Address,
    pub buyer: Address,
    pub amount: i128,
    pub discount_bps: u32,
    pub funded_amount: i128,
    pub status: InvoiceStatus,
    pub maturity_time: u64,
    pub investor: Option<Address>,
    pub creation_time: u64,
    pub repaid_amount: i128,
}

#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Invoice(u64),
    SupplierInvoices(Address),
    CreditScore(Address),
}

#[contract]
pub struct InvoiceFinanceContract;

#[contractimpl]
impl InvoiceFinanceContract {
    pub fn init(env: Env, usdc_contract: Address) {
        let usdc_key = symbol_short!("usdc");
        require!(
            !env.storage().instance().has(&usdc_key),
            "Contract already initialized"
        );

        let contract_address = env.current_contract_address();
        env.storage().instance().set(&usdc_key, &usdc_contract);
        env.storage()
            .instance()
            .set(&symbol_short!("admin"), &contract_address);
    }

    pub fn create_invoice(
        env: Env,
        supplier: Address,
        buyer: Address,
        amount: i128,
        discount_bps: u32,
        maturity_time: u64,
    ) -> u64 {
        supplier.require_auth();

        require!(amount > 0, "Invoice amount must be positive");
        require!(
            discount_bps <= BASIS_POINTS_DIVISOR,
            "Discount cannot exceed 100%"
        );
        require!(
            maturity_time > env.ledger().timestamp(),
            "Maturity time must be in the future"
        );
        require!(supplier != buyer, "Supplier and buyer must be different");

        let invoice_id = Self::get_next_invoice_id(&env);

        let invoice = Invoice {
            id: invoice_id,
            supplier: supplier.clone(),
            buyer: buyer.clone(),
            amount,
            discount_bps,
            funded_amount: 0,
            status: InvoiceStatus::Pending,
            maturity_time,
            investor: None,
            creation_time: env.ledger().timestamp(),
            repaid_amount: 0,
        };

        let key = DataKey::Invoice(invoice_id);
        env.storage().persistent().set(&key, &invoice);

        let mut supplier_invoices = Self::get_supplier_invoices_internal(&env, &supplier);
        supplier_invoices.push_back(invoice_id);
        let supplier_key = DataKey::SupplierInvoices(supplier.clone());
        env.storage().persistent().set(&supplier_key, &supplier_invoices);

        env.events().publish(
            (symbol_short!("InvoiceCr"), invoice_id),
            InvoiceCreatedEvent {
                invoice_id,
                supplier,
                buyer,
                amount,
                maturity_time,
            },
        );

        invoice_id
    }

    pub fn fund_invoice(
        env: Env,
        invoice_id: u64,
        investor: Address,
        usdc_contract: Address,
        amount: i128,
    ) -> bool {
        investor.require_auth();

        let mut invoice = Self::get_invoice_internal(&env, invoice_id);
        require!(
            invoice.status == InvoiceStatus::Pending,
            "Invoice must be in Pending status to fund"
        );
        require!(amount > 0, "Funding amount must be positive");
        require!(
            invoice.funded_amount + amount <= invoice.amount,
            "Funding amount exceeds invoice amount"
        );
        require!(
            usdc_contract == Self::get_usdc_contract(&env),
            "Invalid USDC contract"
        );

        let client = token::Client::new(&env, &usdc_contract);
        client.transfer(&investor, &env.current_contract_address(), &amount);

        invoice.funded_amount += amount;
        if invoice.funded_amount >= invoice.amount {
            invoice.status = InvoiceStatus::Funded;
            invoice.investor = Some(investor.clone());
        }

        let key = DataKey::Invoice(invoice_id);
        env.storage().persistent().set(&key, &invoice);

        env.events().publish(
            (symbol_short!("InvoiceFn"), invoice_id),
            InvoiceFundedEvent {
                invoice_id,
                investor,
                amount,
                timestamp: env.ledger().timestamp(),
            },
        );

        true
    }

    pub fn repay_invoice(
        env: Env,
        invoice_id: u64,
        buyer: Address,
        usdc_contract: Address,
        repayment_amount: i128,
    ) -> bool {
        buyer.require_auth();

        let mut invoice = Self::get_invoice_internal(&env, invoice_id);
        require!(
            invoice.status == InvoiceStatus::Funded || invoice.status == InvoiceStatus::Overdue,
            "Invoice must be funded or overdue to repay"
        );
        require!(buyer == invoice.buyer, "Only the buyer can repay");
        require!(repayment_amount > 0, "Repayment amount must be positive");
        require!(
            usdc_contract == Self::get_usdc_contract(&env),
            "Invalid USDC contract"
        );

        let investor = invoice.investor.clone().unwrap();
        let principal = invoice.amount;
        let yield_amount = (principal as u128)
            .saturating_mul(INVESTOR_YIELD_BPS as u128)
            .checked_div(BASIS_POINTS_DIVISOR as u128)
            .unwrap_or(0) as i128;
        let total_due = principal + yield_amount;

        require!(repayment_amount >= total_due, "Repayment amount insufficient");

        let client = token::Client::new(&env, &usdc_contract);
        client.transfer(&buyer, &env.current_contract_address(), &repayment_amount);
        client.transfer(&env.current_contract_address(), &investor, &total_due);

        let supplier_amount = repayment_amount - total_due;
        if supplier_amount > 0 {
            client.transfer(&env.current_contract_address(), &invoice.supplier, &supplier_amount);
        }

        invoice.status = InvoiceStatus::Repaid;
        invoice.repaid_amount = repayment_amount;

        let credit_key = DataKey::CreditScore(invoice.supplier.clone());
        let current_score = env
            .storage()
            .persistent()
            .get::<DataKey, u32>(&credit_key)
            .unwrap_or(500);
        let updated_score = core::cmp::min(current_score.saturating_add(20), 1000);
        env.storage().persistent().set(&credit_key, &updated_score);

        let key = DataKey::Invoice(invoice_id);
        env.storage().persistent().set(&key, &invoice);

        env.events().publish(
            (symbol_short!("InvoiceRp"), invoice_id),
            InvoiceRepaidEvent {
                invoice_id,
                total_repaid: repayment_amount,
                investor_yield: yield_amount,
                timestamp: env.ledger().timestamp(),
            },
        );

        true
    }

    pub fn get_invoice(env: Env, invoice_id: u64) -> Invoice {
        Self::get_invoice_internal(&env, invoice_id)
    }

    pub fn get_supplier_invoices(env: Env, supplier: Address) -> soroban_sdk::Vec<u64> {
        Self::get_supplier_invoices_internal(&env, &supplier)
    }

    pub fn get_credit_score(env: Env, supplier: Address) -> u32 {
        let key = DataKey::CreditScore(supplier);
        env.storage()
            .persistent()
            .get::<DataKey, u32>(&key)
            .unwrap_or(500)
    }

    pub fn mark_overdue(env: Env, invoice_id: u64) -> bool {
        let mut invoice = Self::get_invoice_internal(&env, invoice_id);

        require!(
            env.ledger().timestamp() > invoice.maturity_time,
            "Invoice has not reached maturity time"
        );

        if invoice.status != InvoiceStatus::Funded {
            return false;
        }

        invoice.status = InvoiceStatus::Overdue;
        let key = DataKey::Invoice(invoice_id);
        env.storage().persistent().set(&key, &invoice);
        true
    }

    pub fn mark_defaulted(env: Env, invoice_id: u64) -> bool {
        let mut invoice = Self::get_invoice_internal(&env, invoice_id);

        require!(
            invoice.status == InvoiceStatus::Overdue,
            "Only overdue invoices can be marked as defaulted"
        );

        invoice.status = InvoiceStatus::Defaulted;

        let credit_key = DataKey::CreditScore(invoice.supplier.clone());
        let current_score = env
            .storage()
            .persistent()
            .get::<DataKey, u32>(&credit_key)
            .unwrap_or(500);
        let updated_score = current_score.saturating_sub(40);
        env.storage().persistent().set(&credit_key, &updated_score);

        let key = DataKey::Invoice(invoice_id);
        env.storage().persistent().set(&key, &invoice);

        env.events().publish(
            (symbol_short!("InvoiceDf"), invoice_id),
            InvoiceDefaultedEvent {
                invoice_id,
                timestamp: env.ledger().timestamp(),
            },
        );

        true
    }

    pub fn update_credit_score(env: Env, supplier: Address, new_score: u32) {
        supplier.require_auth();
        require!(new_score <= 1000, "Credit score must be between 0 and 1000");
        let key = DataKey::CreditScore(supplier);
        env.storage().persistent().set(&key, &new_score);
    }

    pub fn get_configured_usdc_contract(env: Env) -> Address {
        Self::get_usdc_contract(&env)
    }

    fn get_invoice_internal(env: &Env, invoice_id: u64) -> Invoice {
        let key = DataKey::Invoice(invoice_id);
        env.storage()
            .persistent()
            .get::<DataKey, Invoice>(&key)
            .unwrap_or_else(|| panic!("Invoice not found"))
    }

    fn get_supplier_invoices_internal(env: &Env, supplier: &Address) -> soroban_sdk::Vec<u64> {
        let key = DataKey::SupplierInvoices(supplier.clone());
        env.storage()
            .persistent()
            .get::<DataKey, soroban_sdk::Vec<u64>>(&key)
            .unwrap_or_else(|| soroban_sdk::Vec::new(env))
    }

    fn get_next_invoice_id(env: &Env) -> u64 {
        let key = symbol_short!("inv_id");
        let current_id: u64 = env.storage().instance().get::<_, u64>(&key).unwrap_or(0);
        let next_id = current_id + 1;
        env.storage().instance().set(&key, &next_id);
        next_id
    }

    fn get_usdc_contract(env: &Env) -> Address {
        env.storage()
            .instance()
            .get::<_, Address>(&symbol_short!("usdc"))
            .unwrap_or_else(|| panic!("Contract not initialized"))
    }
}

#[macro_export]
macro_rules! require {
    ($cond:expr, $msg:expr) => {
        if !$cond {
            panic!($msg)
        }
    };
}

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, AuthorizedFunction, Ledger, MockAuth, MockAuthInvoke},
        IntoVal,
    };

    fn create_test_usdc(env: &Env) -> Address {
        let admin = Address::generate(env);
        env.register_stellar_asset_contract_v2(admin).address()
    }

    fn mint_usdc(env: &Env, usdc_contract: &Address, to: &Address, amount: i128) {
        let admin_client = token::StellarAssetClient::new(env, usdc_contract);
        admin_client.mint(to, &amount);
    }

    fn total_due(amount: i128) -> i128 {
        let yield_amount = (amount as u128)
            .saturating_mul(INVESTOR_YIELD_BPS as u128)
            .checked_div(BASIS_POINTS_DIVISOR as u128)
            .unwrap_or(0) as i128;
        amount + yield_amount
    }

    #[test]
    fn happy_path_create_fund_repay_and_balances() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let investor = Address::generate(&env);
        let maturity_time = env.ledger().timestamp() + 86_400;
        let amount = 1_000_000_000i128;
        let yield_amount = (amount as u128)
            .saturating_mul(INVESTOR_YIELD_BPS as u128)
            .checked_div(BASIS_POINTS_DIVISOR as u128)
            .unwrap_or(0) as i128;
        let total_due = amount + yield_amount;
        let repayment_amount = total_due + 50_000_000;

        env.mock_all_auths();
        mint_usdc(&env, &usdc_contract, &investor, 2_000_000_000);
        mint_usdc(&env, &usdc_contract, &buyer, 2_000_000_000);

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);
        let token_client = token::Client::new(&env, &usdc_contract);

        let invoice_id = client.create_invoice(&supplier, &buyer, &amount, &500, &maturity_time);
        client.fund_invoice(&invoice_id, &investor, &usdc_contract, &amount);
        client.repay_invoice(&invoice_id, &buyer, &usdc_contract, &repayment_amount);

        let invoice = client.get_invoice(&invoice_id);
        assert_eq!(invoice.status, InvoiceStatus::Repaid);
        assert_eq!(invoice.repaid_amount, repayment_amount);

        assert_eq!(token_client.balance(&investor), 2_050_000_000);
        assert_eq!(token_client.balance(&buyer), 900_000_000);
        assert_eq!(token_client.balance(&supplier), 50_000_000);
        assert_eq!(token_client.balance(&contract_id), 1_000_000_000);

        let _auth_type_marker = core::mem::size_of::<AuthorizedFunction>();
    }

    #[test]
    #[should_panic(expected = "Invoice amount must be positive")]
    fn create_invoice_with_zero_amount_fails() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let maturity_time = env.ledger().timestamp() + 86_400;

        env.mock_all_auths();
        let usdc_contract = create_test_usdc(&env);
        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);
        client.create_invoice(&supplier, &buyer, &0, &500, &maturity_time);
    }

    #[test]
    #[should_panic(expected = "Invoice amount must be positive")]
    fn create_invoice_with_negative_amount_fails() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let maturity_time = env.ledger().timestamp() + 86_400;

        env.mock_all_auths();
        let usdc_contract = create_test_usdc(&env);
        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);
        client.create_invoice(&supplier, &buyer, &-10, &500, &maturity_time);
    }

    #[test]
    #[should_panic(expected = "Invoice must be in Pending status to fund")]
    fn fund_invoice_on_already_funded_invoice_fails() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let investor = Address::generate(&env);
        let maturity_time = env.ledger().timestamp() + 86_400;

        env.mock_all_auths();
        mint_usdc(&env, &usdc_contract, &investor, 2_000_000_000);

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);
        let invoice_id = client.create_invoice(&supplier, &buyer, &1_000_000_000, &500, &maturity_time);
        client.fund_invoice(&invoice_id, &investor, &usdc_contract, &1_000_000_000);
        client.fund_invoice(&invoice_id, &investor, &usdc_contract, &1);
    }

    #[test]
    #[should_panic]
    fn repay_invoice_called_by_wrong_buyer_fails_auth() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let wrong_buyer = Address::generate(&env);
        let investor = Address::generate(&env);
        let maturity_time = env.ledger().timestamp() + 86_400;
        let amount = 1_000_000_000i128;
        let yield_amount = (amount as u128)
            .saturating_mul(INVESTOR_YIELD_BPS as u128)
            .checked_div(BASIS_POINTS_DIVISOR as u128)
            .unwrap_or(0) as i128;
        let total_due = amount + yield_amount;

        env.mock_all_auths();
        mint_usdc(&env, &usdc_contract, &investor, 2_000_000_000);
        mint_usdc(&env, &usdc_contract, &buyer, 2_000_000_000);

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);
        let invoice_id = client.create_invoice(&supplier, &buyer, &amount, &500, &maturity_time);
        client.fund_invoice(&invoice_id, &investor, &usdc_contract, &amount);

        env.set_auths(&[]);
        client
            .mock_auths(&[MockAuth {
                address: &wrong_buyer,
                invoke: &MockAuthInvoke {
                    contract: &contract_id,
                    fn_name: "repay_invoice",
                    args: (
                        invoice_id,
                        buyer.clone(),
                        usdc_contract.clone(),
                        total_due,
                    )
                        .into_val(&env),
                    sub_invokes: &[],
                },
            }])
            .repay_invoice(&invoice_id, &buyer, &usdc_contract, &total_due);
    }

    #[test]
    #[should_panic(expected = "Invoice has not reached maturity time")]
    fn mark_overdue_before_maturity_fails() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let investor = Address::generate(&env);
        let maturity_time = env.ledger().timestamp() + 86_400;

        env.mock_all_auths();
        mint_usdc(&env, &usdc_contract, &investor, 2_000_000_000);

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);
        let invoice_id = client.create_invoice(&supplier, &buyer, &1_000_000_000, &500, &maturity_time);
        client.fund_invoice(&invoice_id, &investor, &usdc_contract, &1_000_000_000);

        client.mark_overdue(&invoice_id);
    }

    #[test]
    fn mark_overdue_after_maturity_succeeds() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let investor = Address::generate(&env);
        let maturity_time = env.ledger().timestamp() + 86_400;

        env.mock_all_auths();
        mint_usdc(&env, &usdc_contract, &investor, 2_000_000_000);

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);
        let invoice_id = client.create_invoice(&supplier, &buyer, &1_000_000_000, &500, &maturity_time);
        client.fund_invoice(&invoice_id, &investor, &usdc_contract, &1_000_000_000);

        env.ledger().with_mut(|li| {
            li.timestamp = maturity_time + 1;
        });

        let marked = client.mark_overdue(&invoice_id);
        assert!(marked);
        assert_eq!(client.get_invoice(&invoice_id).status, InvoiceStatus::Overdue);
    }

    #[test]
    fn credit_score_increases_after_successful_repayment() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let investor = Address::generate(&env);
        let maturity_time = env.ledger().timestamp() + 86_400;
        let amount = 1_000_000_000i128;
        let yield_amount = (amount as u128)
            .saturating_mul(INVESTOR_YIELD_BPS as u128)
            .checked_div(BASIS_POINTS_DIVISOR as u128)
            .unwrap_or(0) as i128;
        let total_due = amount + yield_amount;

        env.mock_all_auths();
        mint_usdc(&env, &usdc_contract, &investor, 2_000_000_000);
        mint_usdc(&env, &usdc_contract, &buyer, 2_000_000_000);

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);
        assert_eq!(client.get_credit_score(&supplier), 500);

        let invoice_id = client.create_invoice(&supplier, &buyer, &amount, &500, &maturity_time);
        client.fund_invoice(&invoice_id, &investor, &usdc_contract, &amount);
        client.repay_invoice(&invoice_id, &buyer, &usdc_contract, &total_due);

        assert_eq!(client.get_credit_score(&supplier), 520);
    }

    #[test]
    fn credit_score_decreases_after_default() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let investor = Address::generate(&env);
        let maturity_time = env.ledger().timestamp() + 86_400;

        env.mock_all_auths();
        mint_usdc(&env, &usdc_contract, &investor, 2_000_000_000);

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);
        assert_eq!(client.get_credit_score(&supplier), 500);

        let invoice_id = client.create_invoice(&supplier, &buyer, &1_000_000_000, &500, &maturity_time);
        client.fund_invoice(&invoice_id, &investor, &usdc_contract, &1_000_000_000);

        env.ledger().with_mut(|li| {
            li.timestamp = maturity_time + 1;
        });
        client.mark_overdue(&invoice_id);
        client.mark_defaulted(&invoice_id);

        assert_eq!(client.get_credit_score(&supplier), 460);
    }

    #[test]
    fn test_get_supplier_invoices() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);

        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let maturity_time = env.ledger().timestamp() + 86_400;

        env.mock_all_auths();
        let usdc_contract = create_test_usdc(&env);

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);

        let id1 = client.create_invoice(&supplier, &buyer, &1_000_000_000, &500, &maturity_time);
        let id2 = client.create_invoice(&supplier, &buyer, &2_000_000_000, &300, &maturity_time);

        let invoices = client.get_supplier_invoices(&supplier);
        assert_eq!(invoices.len(), 2);
        assert_eq!(invoices.get(0).unwrap(), id1);
        assert_eq!(invoices.get(1).unwrap(), id2);
    }

    #[test]
    fn test_manual_credit_score_update() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let supplier = Address::generate(&env);
        let usdc_contract = create_test_usdc(&env);

        env.mock_all_auths();
        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);

        client.update_credit_score(&supplier, &950);
        assert_eq!(client.get_credit_score(&supplier), 950);
    }

    #[test]
    #[should_panic(expected = "Repayment amount insufficient")]
    fn partial_repayment_fails() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let investor = Address::generate(&env);
        let maturity_time = env.ledger().timestamp() + 86_400;
        let amount = 1_000_000_000i128;

        env.mock_all_auths();
        mint_usdc(&env, &usdc_contract, &investor, 2_000_000_000);
        mint_usdc(&env, &usdc_contract, &buyer, 2_000_000_000);

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);
        let invoice_id = client.create_invoice(&supplier, &buyer, &amount, &500, &maturity_time);
        client.fund_invoice(&invoice_id, &investor, &usdc_contract, &amount);

        client.repay_invoice(&invoice_id, &buyer, &usdc_contract, &(total_due(amount) - 1));
    }

    #[test]
    fn full_repayment_succeeds_and_distributes() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let investor = Address::generate(&env);
        let maturity_time = env.ledger().timestamp() + 86_400;
        let amount = 1_000_000_000i128;
        let due = total_due(amount);

        env.mock_all_auths();
        mint_usdc(&env, &usdc_contract, &investor, 2_000_000_000);
        mint_usdc(&env, &usdc_contract, &buyer, 2_000_000_000);

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);
        let token_client = token::Client::new(&env, &usdc_contract);

        let invoice_id = client.create_invoice(&supplier, &buyer, &amount, &500, &maturity_time);
        client.fund_invoice(&invoice_id, &investor, &usdc_contract, &amount);
        client.repay_invoice(&invoice_id, &buyer, &usdc_contract, &due);

        let invoice = client.get_invoice(&invoice_id);
        assert_eq!(invoice.status, InvoiceStatus::Repaid);
        assert_eq!(token_client.balance(&supplier), 0);
        assert_eq!(token_client.balance(&investor), 2_050_000_000);
        assert_eq!(token_client.balance(&buyer), 950_000_000);
    }

    #[test]
    #[should_panic(expected = "Invoice must be funded or overdue to repay")]
    fn double_repayment_fails() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let investor = Address::generate(&env);
        let maturity_time = env.ledger().timestamp() + 86_400;
        let amount = 1_000_000_000i128;
        let due = total_due(amount);

        env.mock_all_auths();
        mint_usdc(&env, &usdc_contract, &investor, 2_000_000_000);
        mint_usdc(&env, &usdc_contract, &buyer, 3_000_000_000);

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);
        let invoice_id = client.create_invoice(&supplier, &buyer, &amount, &500, &maturity_time);
        client.fund_invoice(&invoice_id, &investor, &usdc_contract, &amount);
        client.repay_invoice(&invoice_id, &buyer, &usdc_contract, &due);
        client.repay_invoice(&invoice_id, &buyer, &usdc_contract, &due);
    }

    #[test]
    fn repay_overdue_invoice_succeeds() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let investor = Address::generate(&env);
        let maturity_time = env.ledger().timestamp() + 86_400;
        let amount = 1_000_000_000i128;
        let due = total_due(amount);

        env.mock_all_auths();
        mint_usdc(&env, &usdc_contract, &investor, 2_000_000_000);
        mint_usdc(&env, &usdc_contract, &buyer, 2_000_000_000);

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);
        let invoice_id = client.create_invoice(&supplier, &buyer, &amount, &500, &maturity_time);
        client.fund_invoice(&invoice_id, &investor, &usdc_contract, &amount);

        env.ledger().with_mut(|li| {
            li.timestamp = maturity_time + 1;
        });
        assert!(client.mark_overdue(&invoice_id));
        client.repay_invoice(&invoice_id, &buyer, &usdc_contract, &due);
        assert_eq!(client.get_invoice(&invoice_id).status, InvoiceStatus::Repaid);
    }

    #[test]
    #[should_panic(expected = "Invoice must be funded or overdue to repay")]
    fn repay_defaulted_invoice_fails() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let investor = Address::generate(&env);
        let maturity_time = env.ledger().timestamp() + 86_400;
        let amount = 1_000_000_000i128;

        env.mock_all_auths();
        mint_usdc(&env, &usdc_contract, &investor, 2_000_000_000);
        mint_usdc(&env, &usdc_contract, &buyer, 2_000_000_000);

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);
        let invoice_id = client.create_invoice(&supplier, &buyer, &amount, &500, &maturity_time);
        client.fund_invoice(&invoice_id, &investor, &usdc_contract, &amount);

        env.ledger().with_mut(|li| {
            li.timestamp = maturity_time + 1;
        });
        assert!(client.mark_overdue(&invoice_id));
        assert!(client.mark_defaulted(&invoice_id));
        client.repay_invoice(&invoice_id, &buyer, &usdc_contract, &total_due(amount));
    }

    #[test]
    fn multiple_invoices_adjust_credit_score_consistently() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::generate(&env);
        let buyer = Address::generate(&env);
        let investor = Address::generate(&env);

        env.mock_all_auths();
        mint_usdc(&env, &usdc_contract, &investor, 5_000_000_000);
        mint_usdc(&env, &usdc_contract, &buyer, 5_000_000_000);

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);
        assert_eq!(client.get_credit_score(&supplier), 500);

        let mat1 = env.ledger().timestamp() + 86_400;
        let inv1 = client.create_invoice(&supplier, &buyer, &1_000_000_000, &500, &mat1);
        client.fund_invoice(&inv1, &investor, &usdc_contract, &1_000_000_000);
        client.repay_invoice(&inv1, &buyer, &usdc_contract, &total_due(1_000_000_000));
        assert_eq!(client.get_credit_score(&supplier), 520);

        let mat2 = env.ledger().timestamp() + 86_500;
        let inv2 = client.create_invoice(&supplier, &buyer, &1_000_000_000, &500, &mat2);
        client.fund_invoice(&inv2, &investor, &usdc_contract, &1_000_000_000);
        env.ledger().with_mut(|li| {
            li.timestamp = mat2 + 1;
        });
        assert!(client.mark_overdue(&inv2));
        assert!(client.mark_defaulted(&inv2));
        assert_eq!(client.get_credit_score(&supplier), 480);
    }

    #[test]
    #[should_panic(expected = "Invoice not found")]
    fn missing_invoice_record_panics() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);
        let client = InvoiceFinanceContractClient::new(&env, &contract_id);
        client.init(&usdc_contract);
        let _ = client.get_invoice(&999);
    }
}
