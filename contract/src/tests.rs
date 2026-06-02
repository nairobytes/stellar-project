use super::*;
use soroban_sdk::{
    testutils::{Address as _, Ledger, LedgerInfo},
    token::StellarAssetClient,
    Env, Address,
};

fn setup() -> (Env, Address, Address, Address, Address, Address) {
    let env = Env::default();
    env.mock_all_auths();

    let admin    = Address::generate(&env);
    let supplier = Address::generate(&env);
    let buyer    = Address::generate(&env);
    let investor = Address::generate(&env);

    let usdc_admin = Address::generate(&env);
    let usdc = env.register_stellar_asset_contract_v2(usdc_admin.clone());
    let usdc_address = usdc.address();

    let usdc_asset = StellarAssetClient::new(&env, &usdc_address);
    usdc_asset.mint(&investor, &1_000_000_000i128);
    usdc_asset.mint(&buyer,    &1_000_000_000i128);

    let contract_id = env.register_contract(None, InvoiceFi);
    let client = InvoiceFiClient::new(&env, &contract_id);
    client.initialize(&admin);

    (env, contract_id, supplier, buyer, investor, usdc_address)
}

#[test]
fn test_create_invoice() {
    let (env, contract_id, supplier, buyer, _investor, _usdc) = setup();
    let client = InvoiceFiClient::new(&env, &contract_id);

    let maturity = env.ledger().timestamp() + 2_592_000;
    let invoice_id = client.create_invoice(
        &supplier, &buyer, &100_000_000i128, &500u32, &maturity,
    );

    assert_eq!(invoice_id, 1);
    let invoice = client.get_invoice(&1u64);
    assert_eq!(invoice.status, InvoiceStatus::Pending);
    assert_eq!(invoice.supplier, supplier);
    assert_eq!(invoice.amount, 100_000_000);
}

#[test]
#[should_panic(expected = "Invoice is not available for funding")]
fn test_cannot_fund_already_funded_invoice() {
    let (env, contract_id, supplier, buyer, investor, usdc) = setup();
    let client = InvoiceFiClient::new(&env, &contract_id);

    let maturity = env.ledger().timestamp() + 2_592_000;
    let invoice_id = client.create_invoice(
        &supplier, &buyer, &100_000_000i128, &500u32, &maturity,
    );
    client.fund_invoice(&investor, &invoice_id, &usdc);
    client.fund_invoice(&investor, &invoice_id, &usdc);
}

#[test]
#[should_panic(expected = "Caller is not the invoice buyer")]
fn test_wrong_buyer_cannot_repay() {
    let (env, contract_id, supplier, buyer, investor, usdc) = setup();
    let client = InvoiceFiClient::new(&env, &contract_id);

    let maturity = env.ledger().timestamp() + 2_592_000;
    let invoice_id = client.create_invoice(
        &supplier, &buyer, &100_000_000i128, &500u32, &maturity,
    );
    client.fund_invoice(&investor, &invoice_id, &usdc);

    let wrong_buyer = Address::generate(&env);
    client.repay_invoice(&wrong_buyer, &invoice_id, &usdc);
}

#[test]
#[should_panic(expected = "Invoice has not yet matured")]
fn test_cannot_mark_overdue_before_maturity() {
    let (env, contract_id, supplier, buyer, investor, usdc) = setup();
    let client = InvoiceFiClient::new(&env, &contract_id);

    let maturity = env.ledger().timestamp() + 2_592_000;
    let invoice_id = client.create_invoice(
        &supplier, &buyer, &100_000_000i128, &500u32, &maturity,
    );
    client.fund_invoice(&investor, &invoice_id, &usdc);
    client.mark_overdue(&invoice_id);
}

#[test]
fn test_mark_overdue_after_maturity() {
    let (env, contract_id, supplier, buyer, investor, usdc) = setup();
    let client = InvoiceFiClient::new(&env, &contract_id);

    let maturity = env.ledger().timestamp() + 100;
    let invoice_id = client.create_invoice(
        &supplier, &buyer, &100_000_000i128, &500u32, &maturity,
    );
    client.fund_invoice(&investor, &invoice_id, &usdc);

    env.ledger().set(LedgerInfo {
        timestamp: maturity + 1,
        ..env.ledger().get()
    });

    client.mark_overdue(&invoice_id);
    assert_eq!(client.get_invoice(&invoice_id).status, InvoiceStatus::Overdue);
}

#[test]
fn test_credit_score_increases_on_repayment() {
    let (env, contract_id, supplier, buyer, investor, usdc) = setup();
    let client = InvoiceFiClient::new(&env, &contract_id);

    let maturity = env.ledger().timestamp() + 2_592_000;
    let invoice_id = client.create_invoice(
        &supplier, &buyer, &100_000_000i128, &500u32, &maturity,
    );
    client.fund_invoice(&investor, &invoice_id, &usdc);

    let score_before = client.get_credit_score(&supplier).score;
    client.repay_invoice(&buyer, &invoice_id, &usdc);
    let score_after = client.get_credit_score(&supplier).score;

    assert_eq!(score_after, score_before + 50);
}

#[test]
fn test_happy_path_full_lifecycle() {
    let (env, contract_id, supplier, buyer, investor, usdc) = setup();
    let client = InvoiceFiClient::new(&env, &contract_id);

    let maturity = env.ledger().timestamp() + 2_592_000;

    let invoice_id = client.create_invoice(
        &supplier, &buyer, &100_000_000i128, &500u32, &maturity,
    );
    assert_eq!(client.get_invoice(&invoice_id).status, InvoiceStatus::Pending);

    client.fund_invoice(&investor, &invoice_id, &usdc);
    assert_eq!(client.get_invoice(&invoice_id).status, InvoiceStatus::Funded);

    client.repay_invoice(&buyer, &invoice_id, &usdc);
    assert_eq!(client.get_invoice(&invoice_id).status, InvoiceStatus::Repaid);

    let cs = client.get_credit_score(&supplier);
    assert_eq!(cs.repaid_count, 1);
    assert!(cs.score > 500);
}
