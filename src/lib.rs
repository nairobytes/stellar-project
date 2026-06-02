#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, symbol_short, token, Address,
    Env,
};

// ============================================================================
// CONSTANTS
// ============================================================================

const INVOICE_DATA_KEY: &str = "invoice";
const INVOICES_BY_SUPPLIER_KEY: &str = "invoices_by_supplier";
const CREDIT_SCORE_KEY: &str = "credit_score";

// Basis points for discount calculations (1 bp = 0.01%)
const BASIS_POINTS_DIVISOR: u32 = 10_000;

// Yield rate for investors (in basis points, e.g., 500 = 5%)
const INVESTOR_YIELD_BPS: u32 = 500;

// ============================================================================
// EVENTS
// ============================================================================

/// Event emitted when an invoice is created
#[derive(Clone)]
#[contracttype]
pub struct InvoiceCreatedEvent {
    pub invoice_id: u64,
    pub supplier: Address,
    pub buyer: Address,
    pub amount: i128,
    pub maturity_time: u64,
}

/// Event emitted when an invoice is funded by an investor
#[derive(Clone)]
#[contracttype]
pub struct InvoiceFundedEvent {
    pub invoice_id: u64,
    pub investor: Address,
    pub amount: i128,
    pub timestamp: u64,
}

/// Event emitted when an invoice is repaid
#[derive(Clone)]
#[contracttype]
pub struct InvoiceRepaidEvent {
    pub invoice_id: u64,
    pub total_repaid: i128,
    pub investor_yield: i128,
    pub timestamp: u64,
}

/// Event emitted when an invoice is marked as defaulted
#[derive(Clone)]
#[contracttype]
pub struct InvoiceDefaultedEvent {
    pub invoice_id: u64,
    pub timestamp: u64,
}

// ============================================================================
// ENUMS AND DATA STRUCTURES
// ============================================================================

/// Invoice status enum representing the lifecycle of an invoice
#[derive(Clone, Copy, Debug, PartialEq, Eq)]
#[contracttype]
pub enum InvoiceStatus {
    Pending = 0,   // Invoice created, awaiting funding
    Funded = 1,    // Invoice funded by investor
    Repaid = 2,    // Invoice repaid in full
    Overdue = 3,   // Invoice past maturity, not yet repaid
    Defaulted = 4, // Invoice defaulted, investor will take loss
}

/// Invoice struct representing a financing invoice in the system
#[derive(Clone)]
#[contracttype]
pub struct Invoice {
    pub id: u64,
    pub supplier: Address,
    pub buyer: Address,
    pub amount: i128,                           // Amount in USDC stroops (1 USDC = 1e7 stroops)
    pub discount_bps: u32,                      // Discount in basis points
    pub funded_amount: i128,                    // Amount funded so far
    pub status: InvoiceStatus,                  // Current status
    pub maturity_time: u64,                     // Unix timestamp when invoice matures
    pub investor: Option<Address>,              // Investor funding the invoice
    pub creation_time: u64,                     // When invoice was created
    pub repaid_amount: i128,                    // Amount already repaid
}

// ============================================================================
// CONTRACT
// ============================================================================

#[contract]
pub struct InvoiceFinanceContract;

#[contractimpl]
impl InvoiceFinanceContract {
    /// Initialize the contract (called once on deployment)
    /// Sets up the contract state and validates configuration
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    pub fn init(env: Env) {
        let contract_address = env.current_contract_address();
        env.storage()
            .instance()
            .set(&symbol_short!("admin"), &contract_address);
    }

    /// Create a new invoice for financing
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `supplier` - Address of the invoice supplier (must authenticate)
    /// * `buyer` - Address of the buyer
    /// * `amount` - Invoice amount in USDC stroops
    /// * `discount_bps` - Discount percentage in basis points (0-10000)
    /// * `maturity_time` - Unix timestamp when invoice matures
    ///
    /// # Returns
    /// * `u64` - The newly created invoice ID
    pub fn create_invoice(
        env: Env,
        supplier: Address,
        buyer: Address,
        amount: i128,
        discount_bps: u32,
        maturity_time: u64,
    ) -> u64 {
        // Authentication: supplier must sign the transaction
        supplier.require_auth();

        // Validation
        require!(amount > 0, "Invoice amount must be positive");
        require!(
            discount_bps <= BASIS_POINTS_DIVISOR,
            "Discount cannot exceed 100%"
        );
        require!(
            maturity_time > env.ledger().timestamp(),
            "Maturity time must be in the future"
        );
        require!(
            supplier != buyer,
            "Supplier and buyer must be different"
        );

        // Generate new invoice ID (simple counter-based approach)
        let invoice_id = Self::get_next_invoice_id(&env);

        // Create invoice struct
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

        // Store invoice
        let key = DataKey::Invoice(invoice_id);
        env.storage().persistent().set(&key, &invoice);

        // Add to supplier's invoice list
        let mut supplier_invoices = Self::get_supplier_invoices_internal(&env, &supplier);
        supplier_invoices.push_back(invoice_id);
        let supplier_key = DataKey::SupplierInvoices(supplier.clone());
        env.storage()
            .persistent()
            .set(&supplier_key, &supplier_invoices);

        // Emit event
        env.events().publish(
            (symbol_short!("InvoiceCr"), invoice_id),
            InvoiceCreatedEvent {
                invoice_id,
                supplier: supplier.clone(),
                buyer: buyer.clone(),
                amount,
                maturity_time,
            },
        );

        invoice_id
    }

    /// Fund an invoice using USDC tokens
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `invoice_id` - ID of the invoice to fund
    /// * `investor` - Address of the investor funding the invoice
    /// * `usdc_contract` - Address of the USDC token contract
    /// * `amount` - Amount to fund in USDC stroops
    ///
    /// # Returns
    /// * `bool` - true if funding succeeded
    pub fn fund_invoice(
        env: Env,
        invoice_id: u64,
        investor: Address,
        usdc_contract: Address,
        amount: i128,
    ) -> bool {
        // Authentication: investor must sign
        investor.require_auth();

        // Retrieve and validate invoice
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

        // Transfer USDC from investor to contract escrow
        let client = token::Client::new(&env, &usdc_contract);
        client.transfer(
            &investor,
            &env.current_contract_address(),
            &amount,
        );

        // Update invoice
        invoice.funded_amount += amount;
        if invoice.funded_amount >= invoice.amount {
            // Fully funded
            invoice.status = InvoiceStatus::Funded;
            invoice.investor = Some(investor.clone());
        }

        // Store updated invoice
        let key = DataKey::Invoice(invoice_id);
        env.storage().persistent().set(&key, &invoice);

        // Emit event
        env.events().publish(
            (symbol_short!("InvoiceFn"), invoice_id),
            InvoiceFundedEvent {
                invoice_id,
                investor: investor.clone(),
                amount,
                timestamp: env.ledger().timestamp(),
            },
        );

        true
    }

    /// Repay an invoice with principal and yield to investor
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `invoice_id` - ID of the invoice to repay
    /// * `buyer` - Address of the buyer making repayment
    /// * `usdc_contract` - Address of the USDC token contract
    /// * `repayment_amount` - Amount being repaid in USDC stroops
    ///
    /// # Returns
    /// * `bool` - true if repayment succeeded
    pub fn repay_invoice(
        env: Env,
        invoice_id: u64,
        buyer: Address,
        usdc_contract: Address,
        repayment_amount: i128,
    ) -> bool {
        // Authentication: buyer must sign
        buyer.require_auth();

        // Retrieve and validate invoice
        let mut invoice = Self::get_invoice_internal(&env, invoice_id);
        require!(
            invoice.status == InvoiceStatus::Funded || invoice.status == InvoiceStatus::Overdue,
            "Invoice must be funded or overdue to repay"
        );
        require!(buyer == invoice.buyer, "Only the buyer can repay");
        require!(repayment_amount > 0, "Repayment amount must be positive");

        // Calculate amounts to distribute
        let investor = invoice.investor.clone().unwrap();
        let principal = invoice.amount;

        // Calculate yield based on investor's yield rate
        let yield_amount = (principal as u128)
            .saturating_mul(INVESTOR_YIELD_BPS as u128)
            .checked_div(BASIS_POINTS_DIVISOR as u128)
            .unwrap_or(0) as i128;

        let total_due = principal + yield_amount;

        require!(
            repayment_amount >= total_due,
            "Repayment amount insufficient"
        );

        // Transfer USDC from buyer to contract (repayment)
        let client = token::Client::new(&env, &usdc_contract);
        client.transfer(&buyer, &env.current_contract_address(), &repayment_amount);

        // Distribute to investor (principal + yield)
        client.transfer(
            &env.current_contract_address(),
            &investor,
            &total_due,
        );

        // Calculate remainder for supplier
        let supplier_amount = repayment_amount - total_due;
        if supplier_amount > 0 {
            client.transfer(
                &env.current_contract_address(),
                &invoice.supplier,
                &supplier_amount,
            );
        }

        // Update invoice status
        invoice.status = InvoiceStatus::Repaid;
        invoice.repaid_amount = repayment_amount;

        // Store updated invoice
        let key = DataKey::Invoice(invoice_id);
        env.storage().persistent().set(&key, &invoice);

        // Emit event
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

    /// Get invoice details by ID
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `invoice_id` - ID of the invoice to retrieve
    ///
    /// # Returns
    /// * `Invoice` - The invoice struct
    pub fn get_invoice(env: Env, invoice_id: u64) -> Invoice {
        Self::get_invoice_internal(&env, invoice_id)
    }

    /// Get all invoices for a specific supplier
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `supplier` - Address of the supplier
    ///
    /// # Returns
    /// * `Vec<u64>` - Vector of invoice IDs for the supplier
    pub fn get_supplier_invoices(env: Env, supplier: Address) -> soroban_sdk::Vec<u64> {
        Self::get_supplier_invoices_internal(&env, &supplier)
    }

    /// Get the credit score for a supplier
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `supplier` - Address of the supplier
    ///
    /// # Returns
    /// * `u32` - Credit score (0-1000, where 1000 is perfect)
    pub fn get_credit_score(env: Env, supplier: Address) -> u32 {
        let key = DataKey::CreditScore(supplier);
        env.storage()
            .persistent()
            .get::<DataKey, u32>(&key)
            .unwrap_or(500)
    }

    /// Mark an invoice as overdue
    ///
    /// Can only be called by any address after maturity time has passed.
    /// This function allows the system to track overdue invoices.
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `invoice_id` - ID of the invoice to mark as overdue
    ///
    /// # Returns
    /// * `bool` - true if invoice was marked overdue
    pub fn mark_overdue(env: Env, invoice_id: u64) -> bool {
        let mut invoice = Self::get_invoice_internal(&env, invoice_id);

        // Verify maturity time has passed
        require!(
            env.ledger().timestamp() > invoice.maturity_time,
            "Invoice has not reached maturity time"
        );

        // Only mark if currently Funded
        if invoice.status != InvoiceStatus::Funded {
            return false;
        }

        invoice.status = InvoiceStatus::Overdue;

        // Store updated invoice
        let key = DataKey::Invoice(invoice_id);
        env.storage().persistent().set(&key, &invoice);

        true
    }

    /// Mark an invoice as defaulted
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `invoice_id` - ID of the invoice to mark as defaulted
    ///
    /// # Returns
    /// * `bool` - true if invoice was marked defaulted
    pub fn mark_defaulted(env: Env, invoice_id: u64) -> bool {
        let mut invoice = Self::get_invoice_internal(&env, invoice_id);

        // Only mark as defaulted if it's overdue
        require!(
            invoice.status == InvoiceStatus::Overdue,
            "Only overdue invoices can be marked as defaulted"
        );

        invoice.status = InvoiceStatus::Defaulted;

        // Store updated invoice
        let key = DataKey::Invoice(invoice_id);
        env.storage().persistent().set(&key, &invoice);

        // Emit event
        env.events().publish(
            (symbol_short!("InvoiceDf"), invoice_id),
            InvoiceDefaultedEvent {
                invoice_id,
                timestamp: env.ledger().timestamp(),
            },
        );

        true
    }

    /// Update credit score for a supplier based on repayment history
    ///
    /// # Arguments
    /// * `env` - The Soroban environment
    /// * `supplier` - Address of the supplier
    /// * `new_score` - New credit score (0-1000)
    pub fn update_credit_score(env: Env, supplier: Address, new_score: u32) {
        // Only contract admin can update scores (in this case, we require supplier auth as a guard)
        supplier.require_auth();

        require!(new_score <= 1000, "Credit score must be between 0 and 1000");

        let key = DataKey::CreditScore(supplier);
        env.storage().persistent().set(&key, &new_score);
    }

    // ========================================================================
    // INTERNAL HELPER FUNCTIONS
    // ========================================================================

    /// Internal function to retrieve an invoice or panic if not found
    fn get_invoice_internal(env: &Env, invoice_id: u64) -> Invoice {
        let key = DataKey::Invoice(invoice_id);
        env.storage()
            .persistent()
            .get(&key)
            .expect("Invoice not found")
            .expect("Failed to deserialize invoice")
    }

    /// Internal function to get supplier's invoice list
    fn get_supplier_invoices_internal(
        env: &Env,
        supplier: &Address,
    ) -> soroban_sdk::Vec<u64> {
        let key = DataKey::SupplierInvoices(supplier.clone());
        env.storage()
            .persistent()
            .get::<DataKey, soroban_sdk::Vec<u64>>(&key)
            .ok()
            .flatten()
            .unwrap_or_else(|| soroban_sdk::Vec::new(env))
    }

    /// Generate next invoice ID by incrementing counter
    fn get_next_invoice_id(env: &Env) -> u64 {
        let key = symbol_short!("inv_id");
        let current_id: u64 = env
            .storage()
            .instance()
            .get::<_, u64>(&key)
            .unwrap_or(0);

        let next_id = current_id + 1;
        env.storage().instance().set(&key, &next_id);

        next_id
    }
}

// ============================================================================
// DATA KEY ENUM FOR STORAGE
// ============================================================================

/// Enum for organizing storage keys in contract persistent storage
#[derive(Clone)]
#[contracttype]
pub enum DataKey {
    Invoice(u64),
    SupplierInvoices(Address),
    CreditScore(Address),
}

// ============================================================================
// HELPER MACROS AND FUNCTIONS
// ============================================================================

/// Require macro - similar to assert! but works in contract context
#[macro_export]
macro_rules! require {
    ($cond:expr, $msg:expr) => {
        if !$cond {
            panic!($msg)
        }
    };
}

// ============================================================================
// TESTS
// ============================================================================

#[cfg(test)]
mod tests {
    use super::*;
    use soroban_sdk::{
        testutils::{Address as _, AuthorizedFunction, AuthorizedInvocation},
        IntoVal,
    };

    // Helper function to create a test USDC token contract
    fn create_test_usdc(env: &Env) -> Address {
        let usdc_contract =
            env.register_stellar_asset_contract_v2(soroban_sdk::xdr::Asset::Native);
        usdc_contract
    }

    // Helper function to mint test tokens to an address
    fn mint_usdc(env: &Env, usdc_contract: &Address, to: &Address, amount: i128) {
        let client = token::Client::new(env, usdc_contract);
        client.mint(to, &amount);
    }

    #[test]
    fn test_create_invoice() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);

        let supplier = Address::random(&env);
        let buyer = Address::random(&env);
        let maturity_time = env.ledger().timestamp() + 86400; // 1 day from now

        env.mock_all_auths();

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);

        let invoice_id = client.create_invoice(
            &supplier,
            &buyer,
            &1_000_000_000i128, // 100 USDC in stroops
            &500,               // 5% discount
            &maturity_time,
        );

        assert_eq!(invoice_id, 1);

        let invoice = client.get_invoice(&invoice_id);
        assert_eq!(invoice.id, 1);
        assert_eq!(invoice.supplier, supplier);
        assert_eq!(invoice.buyer, buyer);
        assert_eq!(invoice.amount, 1_000_000_000);
        assert_eq!(invoice.discount_bps, 500);
        assert_eq!(invoice.status, InvoiceStatus::Pending);
    }

    #[test]
    fn test_fund_invoice() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::random(&env);
        let buyer = Address::random(&env);
        let investor = Address::random(&env);
        let maturity_time = env.ledger().timestamp() + 86400;

        // Mint USDC to investor
        mint_usdc(&env, &usdc_contract, &investor, 10_000_000_000);

        env.mock_all_auths();

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);

        // Create invoice
        let invoice_id = client.create_invoice(
            &supplier,
            &buyer,
            &1_000_000_000i128,
            &500,
            &maturity_time,
        );

        // Fund invoice
        let funded = client.fund_invoice(
            &invoice_id,
            &investor,
            &usdc_contract,
            &1_000_000_000i128,
        );

        assert!(funded);

        let invoice = client.get_invoice(&invoice_id);
        assert_eq!(invoice.status, InvoiceStatus::Funded);
        assert_eq!(invoice.funded_amount, 1_000_000_000);
        assert_eq!(invoice.investor.unwrap(), investor);
    }

    #[test]
    fn test_repay_invoice() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::random(&env);
        let buyer = Address::random(&env);
        let investor = Address::random(&env);
        let maturity_time = env.ledger().timestamp() + 86400;

        let amount = 1_000_000_000i128; // 100 USDC

        // Mint USDC to investor and buyer
        mint_usdc(&env, &usdc_contract, &investor, 10_000_000_000);
        mint_usdc(&env, &usdc_contract, &buyer, 10_000_000_000);

        env.mock_all_auths();

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);

        // Create and fund invoice
        let invoice_id = client.create_invoice(
            &supplier,
            &buyer,
            &amount,
            &500,
            &maturity_time,
        );

        client.fund_invoice(&invoice_id, &investor, &usdc_contract, &amount);

        // Calculate expected repayment
        let yield_amount = (amount as u128)
            .saturating_mul(INVESTOR_YIELD_BPS as u128)
            .checked_div(BASIS_POINTS_DIVISOR as u128)
            .unwrap_or(0) as i128;
        let total_due = amount + yield_amount;
        let repayment = total_due + 100_000_000; // Add extra for supplier

        // Repay invoice
        let repaid = client.repay_invoice(&invoice_id, &buyer, &usdc_contract, &repayment);

        assert!(repaid);

        let invoice = client.get_invoice(&invoice_id);
        assert_eq!(invoice.status, InvoiceStatus::Repaid);
        assert_eq!(invoice.repaid_amount, repayment);
    }

    #[test]
    fn test_mark_overdue() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::random(&env);
        let buyer = Address::random(&env);
        let investor = Address::random(&env);
        let maturity_time = env.ledger().timestamp() + 86400;

        mint_usdc(&env, &usdc_contract, &investor, 10_000_000_000);

        env.mock_all_auths();

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);

        let invoice_id = client.create_invoice(
            &supplier,
            &buyer,
            &1_000_000_000i128,
            &500,
            &maturity_time,
        );

        client.fund_invoice(
            &invoice_id,
            &investor,
            &usdc_contract,
            &1_000_000_000i128,
        );

        // Try to mark as overdue before maturity - should fail
        let result = std::panic::catch_unwind(std::panic::AssertUnwindSafe(|| {
            client.mark_overdue(&invoice_id);
        }));
        assert!(result.is_err());

        // Advance ledger timestamp past maturity
        env.ledger().with_mut(|ledger| {
            ledger.timestamp = maturity_time + 1;
        });

        // Now mark as overdue should succeed
        let marked = client.mark_overdue(&invoice_id);
        assert!(marked);

        let invoice = client.get_invoice(&invoice_id);
        assert_eq!(invoice.status, InvoiceStatus::Overdue);
    }

    #[test]
    fn test_get_supplier_invoices() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);

        let supplier = Address::random(&env);
        let buyer = Address::random(&env);
        let maturity_time = env.ledger().timestamp() + 86400;

        env.mock_all_auths();

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);

        // Create multiple invoices for the same supplier
        let id1 = client.create_invoice(&supplier, &buyer, &1_000_000_000i128, &500, &maturity_time);
        let id2 = client.create_invoice(&supplier, &buyer, &2_000_000_000i128, &300, &maturity_time);

        let invoices = client.get_supplier_invoices(&supplier);
        assert_eq!(invoices.len(), 2);
        assert_eq!(invoices.get(0).unwrap(), id1);
        assert_eq!(invoices.get(1).unwrap(), id2);
    }

    #[test]
    fn test_credit_score() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);

        let supplier = Address::random(&env);

        env.mock_all_auths();

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);

        // Get default credit score
        let score = client.get_credit_score(&supplier);
        assert_eq!(score, 500); // Default score

        // Update credit score
        client.update_credit_score(&supplier, &950);

        let new_score = client.get_credit_score(&supplier);
        assert_eq!(new_score, 950);
    }

    #[test]
    fn test_mark_defaulted() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);
        let usdc_contract = create_test_usdc(&env);

        let supplier = Address::random(&env);
        let buyer = Address::random(&env);
        let investor = Address::random(&env);
        let maturity_time = env.ledger().timestamp() + 86400;

        mint_usdc(&env, &usdc_contract, &investor, 10_000_000_000);

        env.mock_all_auths();

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);

        let invoice_id = client.create_invoice(
            &supplier,
            &buyer,
            &1_000_000_000i128,
            &500,
            &maturity_time,
        );

        client.fund_invoice(
            &invoice_id,
            &investor,
            &usdc_contract,
            &1_000_000_000i128,
        );

        // Advance time to mark as overdue
        env.ledger().with_mut(|ledger| {
            ledger.timestamp = maturity_time + 1;
        });

        client.mark_overdue(&invoice_id);

        // Mark as defaulted
        let defaulted = client.mark_defaulted(&invoice_id);
        assert!(defaulted);

        let invoice = client.get_invoice(&invoice_id);
        assert_eq!(invoice.status, InvoiceStatus::Defaulted);
    }

    #[test]
    #[should_panic(expected = "Invoice amount must be positive")]
    fn test_create_invoice_zero_amount() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);

        let supplier = Address::random(&env);
        let buyer = Address::random(&env);
        let maturity_time = env.ledger().timestamp() + 86400;

        env.mock_all_auths();

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);

        client.create_invoice(&supplier, &buyer, &0, &500, &maturity_time);
    }

    #[test]
    #[should_panic(expected = "Discount cannot exceed 100%")]
    fn test_create_invoice_invalid_discount() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);

        let supplier = Address::random(&env);
        let buyer = Address::random(&env);
        let maturity_time = env.ledger().timestamp() + 86400;

        env.mock_all_auths();

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);

        client.create_invoice(
            &supplier,
            &buyer,
            &1_000_000_000i128,
            &15000, // >100%
            &maturity_time,
        );
    }

    #[test]
    #[should_panic(expected = "Maturity time must be in the future")]
    fn test_create_invoice_past_maturity() {
        let env = Env::default();
        let contract_id = env.register_contract(None, InvoiceFinanceContract);

        let supplier = Address::random(&env);
        let buyer = Address::random(&env);
        let maturity_time = env.ledger().timestamp() - 1; // Past time

        env.mock_all_auths();

        let client = InvoiceFinanceContractClient::new(&env, &contract_id);

        client.create_invoice(
            &supplier,
            &buyer,
            &1_000_000_000i128,
            &500,
            &maturity_time,
        );
    }
}
