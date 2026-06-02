#![no_std]

use soroban_sdk::{
    contract, contractimpl, contracttype, token, 
    Address, Env, Symbol, Vec,
    symbol_short, log,
};

// ============================================================
// DATA STRUCTURES
// ============================================================

/// Status of an invoice through its lifecycle
#[contracttype]
#[derive(Clone, PartialEq, Debug)]
pub enum InvoiceStatus {
    Pending,    // Created, waiting for investor to fund
    Funded,     // Investor has locked USDC in escrow
    Repaid,     // Corporate buyer paid — funds distributed
    Overdue,    // Maturity passed, not yet repaid
    Defaulted,  // Grace period passed, marked as default
}

/// Core invoice data stored on-chain in Soroban persistent ledger
#[contracttype]
#[derive(Clone)]
pub struct Invoice {
    pub id: u64,
    pub supplier: Address,          // Supplier's Stellar public key
    pub buyer: Address,             // Corporate buyer's Stellar public key
    pub amount: i128,               // Face value in USDC stroops (1 USDC = 10_000_000 stroops)
    pub discount_bps: u32,          // Discount in basis points e.g. 500 = 5%
    pub funded_amount: i128,        // Amount investor actually sends (amount - discount)
    pub status: InvoiceStatus,
    pub maturity_time: u64,         // Unix timestamp when repayment is due
    pub investor: Option<Address>,  // Set when invoice is funded
    pub created_at: u64,            // Block timestamp at creation
    pub repaid_at: u64,             // Block timestamp at repayment (0 if not repaid)
}

/// On-chain credit score for suppliers (0 - 1000)
#[contracttype]
#[derive(Clone)]
pub struct CreditScore {
    pub score: u32,           // 0 to 1000
    pub total_invoices: u32,
    pub repaid_count: u32,
    pub defaulted_count: u32,
}

// ============================================================
// STORAGE KEYS
// ============================================================

#[contracttype]
pub enum DataKey {
    Invoice(u64),           // Invoice by ID
    InvoiceCount,           // Total invoices created (auto-increment ID)
    SupplierInvoices(Address), // List of invoice IDs per supplier
    CreditScore(Address),   // Credit score per supplier
    Admin,                  // Platform admin address
}

// ============================================================
// EVENTS
// ============================================================
// Emitted on every state change so the frontend can listen via Horizon

const INVOICE_CREATED: Symbol  = symbol_short!("INV_CREAT");
const INVOICE_FUNDED: Symbol   = symbol_short!("INV_FUND");
const INVOICE_REPAID: Symbol   = symbol_short!("INV_REPAY");
const INVOICE_OVERDUE: Symbol  = symbol_short!("INV_OVER");
const INVOICE_DEFAULT: Symbol  = symbol_short!("INV_DEF");

// ============================================================
// CONTRACT
// ============================================================

#[contract]
pub struct InvoiceFi;

#[contractimpl]
impl InvoiceFi {

    // ----------------------------------------------------------
    // INITIALIZE
    // Sets the admin (platform deployer). Call once after deploy.
    // ----------------------------------------------------------
    pub fn initialize(env: Env, admin: Address) {
        // Prevent re-initialization
        if env.storage().instance().has(&DataKey::Admin) {
            panic!("Already initialized");
        }
        env.storage().instance().set(&DataKey::Admin, &admin);
        env.storage().instance().set(&DataKey::InvoiceCount, &0u64);
    }

    // ----------------------------------------------------------
    // CREATE INVOICE
    // Called by a verified supplier to list an invoice for financing.
    //
    // Parameters:
    //   supplier     - The supplier's Stellar address (must sign)
    //   buyer        - The corporate buyer's Stellar address
    //   amount       - Face value of invoice in USDC stroops
    //   discount_bps - Discount rate in basis points (e.g. 500 = 5%)
    //   maturity_time - Unix timestamp when the buyer must repay
    //
    // Returns: invoice_id (u64)
    // ----------------------------------------------------------
    pub fn create_invoice(
        env: Env,
        supplier: Address,
        buyer: Address,
        amount: i128,
        discount_bps: u32,
        maturity_time: u64,
    ) -> u64 {
        // Supplier must sign this transaction
        supplier.require_auth();

        // Validate inputs
        if amount <= 0 {
            panic!("Invoice amount must be positive");
        }
        if discount_bps == 0 || discount_bps >= 10_000 {
            panic!("Discount must be between 1 and 9999 basis points");
        }
        if maturity_time <= env.ledger().timestamp() {
            panic!("Maturity time must be in the future");
        }

        // Calculate how much investor pays (face value minus discount)
        // e.g. 100 USDC at 5% discount → investor pays 95 USDC
        let funded_amount = amount - (amount * discount_bps as i128 / 10_000);

        // Auto-increment invoice ID
        let invoice_id: u64 = env.storage().instance().get(&DataKey::InvoiceCount)
            .unwrap_or(0u64);
        let next_id = invoice_id + 1;
        env.storage().instance().set(&DataKey::InvoiceCount, &next_id);

        // Build the invoice struct
        let invoice = Invoice {
            id: next_id,
            supplier: supplier.clone(),
            buyer,
            amount,
            discount_bps,
            funded_amount,
            status: InvoiceStatus::Pending,
            maturity_time,
            investor: None,
            created_at: env.ledger().timestamp(),
            repaid_at: 0,
        };

        // Store invoice in persistent ledger
        env.storage().persistent().set(&DataKey::Invoice(next_id), &invoice);

        // Add invoice ID to supplier's list
        let mut supplier_invoices: Vec<u64> = env.storage().persistent()
            .get(&DataKey::SupplierInvoices(supplier.clone()))
            .unwrap_or(Vec::new(&env));
        supplier_invoices.push_back(next_id);
        env.storage().persistent().set(
            &DataKey::SupplierInvoices(supplier.clone()),
            &supplier_invoices
        );

        // Initialise credit score if first invoice
        if !env.storage().persistent().has(&DataKey::CreditScore(supplier.clone())) {
            let initial_score = CreditScore {
                score: 500,
                total_invoices: 0,
                repaid_count: 0,
                defaulted_count: 0,
            };
            env.storage().persistent().set(
                &DataKey::CreditScore(supplier.clone()),
                &initial_score
            );
        }

        // Emit event for frontend to pick up via Horizon streaming
        env.events().publish((INVOICE_CREATED, next_id), (supplier, next_id, amount));

        log!(&env, "Invoice {} created for amount {} stroops", next_id, amount);

        next_id
    }

    // ----------------------------------------------------------
    // FUND INVOICE
    // Called by an investor to finance a pending invoice.
    // Transfers USDC from investor wallet → contract escrow.
    // Immediately forwards funded_amount to supplier.
    //
    // Parameters:
    //   investor   - Investor's Stellar address (must sign)
    //   invoice_id - ID of the invoice to fund
    //   usdc_token - Address of the USDC token contract on Stellar
    // ----------------------------------------------------------
    pub fn fund_invoice(
        env: Env,
        investor: Address,
        invoice_id: u64,
        usdc_token: Address,
    ) {
        // Investor must sign this transaction
        investor.require_auth();

        // Load invoice — panic if not found
        let mut invoice: Invoice = env.storage().persistent()
            .get(&DataKey::Invoice(invoice_id))
            .expect("Invoice not found");

        // Must be PENDING to be funded
        if invoice.status != InvoiceStatus::Pending {
            panic!("Invoice is not available for funding");
        }

        // Cannot fund an expired invoice
        if env.ledger().timestamp() >= invoice.maturity_time {
            panic!("Invoice has already matured");
        }

        // Transfer USDC from investor to this contract (escrow)
        // funded_amount = face value minus discount (what investor pays)
        let usdc = token::Client::new(&env, &usdc_token);
        usdc.transfer(
            &investor,
            &env.current_contract_address(),
            &invoice.funded_amount,
        );

        // Immediately pay supplier their advance
        // Supplier gets funded_amount now; investor gets full face value at maturity
        usdc.transfer(
            &env.current_contract_address(),
            &invoice.supplier,
            &invoice.funded_amount,
        );

        // Update invoice status
        invoice.status = InvoiceStatus::Funded;
        invoice.investor = Some(investor.clone());
        env.storage().persistent().set(&DataKey::Invoice(invoice_id), &invoice);

        // Emit event
        env.events().publish(
            (INVOICE_FUNDED, invoice_id),
            (investor, invoice_id, invoice.funded_amount)
        );

        log!(&env, "Invoice {} funded by investor. Supplier paid {} stroops", 
             invoice_id, invoice.funded_amount);
    }

    // ----------------------------------------------------------
    // REPAY INVOICE
    // Called by the corporate buyer on or before maturity.
    // Buyer sends the full face value. Contract pays investor
    // their principal + yield (the full amount = their profit).
    //
    // Parameters:
    //   buyer      - Corporate buyer address (must sign + match invoice)
    //   invoice_id - ID of the invoice being repaid
    //   usdc_token - Address of the USDC token contract
    // ----------------------------------------------------------
    pub fn repay_invoice(
        env: Env,
        buyer: Address,
        invoice_id: u64,
        usdc_token: Address,
    ) {
        // Buyer must sign
        buyer.require_auth();

        // Load invoice
        let mut invoice: Invoice = env.storage().persistent()
            .get(&DataKey::Invoice(invoice_id))
            .expect("Invoice not found");

        // Only the correct buyer can repay
        if invoice.buyer != buyer {
            panic!("Caller is not the invoice buyer");
        }

        // Must be FUNDED or OVERDUE to repay
        if invoice.status != InvoiceStatus::Funded && invoice.status != InvoiceStatus::Overdue {
            panic!("Invoice cannot be repaid in current status");
        }

        // Get investor address — must exist since invoice is FUNDED
        let investor = invoice.investor.clone().expect("No investor on funded invoice");

        let usdc = token::Client::new(&env, &usdc_token);

        // Buyer transfers full face value to contract
        usdc.transfer(
            &buyer,
            &env.current_contract_address(),
            &invoice.amount,
        );

        // Investor receives full face value (their funded_amount + yield)
        // Yield = invoice.amount - invoice.funded_amount
        usdc.transfer(
            &env.current_contract_address(),
            &investor,
            &invoice.amount,
        );

        // Update invoice
        invoice.status = InvoiceStatus::Repaid;
        invoice.repaid_at = env.ledger().timestamp();
        env.storage().persistent().set(&DataKey::Invoice(invoice_id), &invoice);

        // Update supplier credit score — successful repayment = +50 points
        Self::update_credit_score(&env, &invoice.supplier, true);

        // Emit event
        env.events().publish(
            (INVOICE_REPAID, invoice_id),
            (buyer, invoice_id, invoice.amount)
        );

        log!(&env, "Invoice {} repaid. Investor received {} stroops", 
             invoice_id, invoice.amount);
    }

    // ----------------------------------------------------------
    // MARK OVERDUE
    // Can be called by anyone after maturity timestamp passes.
    // Flags the invoice as OVERDUE so the system can track it.
    //
    // Parameters:
    //   invoice_id - ID of the overdue invoice
    // ----------------------------------------------------------
    pub fn mark_overdue(env: Env, invoice_id: u64) {
        let mut invoice: Invoice = env.storage().persistent()
            .get(&DataKey::Invoice(invoice_id))
            .expect("Invoice not found");

        // Must be FUNDED and past maturity
        if invoice.status != InvoiceStatus::Funded {
            panic!("Invoice is not in FUNDED status");
        }
        if env.ledger().timestamp() < invoice.maturity_time {
            panic!("Invoice has not yet matured");
        }

        invoice.status = InvoiceStatus::Overdue;
        env.storage().persistent().set(&DataKey::Invoice(invoice_id), &invoice);

        env.events().publish((INVOICE_OVERDUE, invoice_id), invoice_id);

        log!(&env, "Invoice {} marked as OVERDUE", invoice_id);
    }

    // ----------------------------------------------------------
    // MARK DEFAULTED
    // Admin only. Called after grace period has passed with no repayment.
    // Penalises supplier credit score.
    //
    // Parameters:
    //   invoice_id - ID of the defaulted invoice
    // ----------------------------------------------------------
    pub fn mark_defaulted(env: Env, invoice_id: u64) {
        // Only admin can mark default
        let admin: Address = env.storage().instance()
            .get(&DataKey::Admin)
            .expect("Admin not set");
        admin.require_auth();

        let mut invoice: Invoice = env.storage().persistent()
            .get(&DataKey::Invoice(invoice_id))
            .expect("Invoice not found");

        if invoice.status != InvoiceStatus::Overdue {
            panic!("Invoice must be OVERDUE before marking DEFAULTED");
        }

        invoice.status = InvoiceStatus::Defaulted;
        env.storage().persistent().set(&DataKey::Invoice(invoice_id), &invoice);

        // Penalise supplier credit score — default = -100 points
        Self::update_credit_score(&env, &invoice.supplier, false);

        env.events().publish((INVOICE_DEFAULT, invoice_id), invoice_id);

        log!(&env, "Invoice {} marked as DEFAULTED", invoice_id);
    }

    // ============================================================
    // READ / VIEW FUNCTIONS
    // These are free — no transaction needed
    // ============================================================

    /// Get a single invoice by ID
    pub fn get_invoice(env: Env, invoice_id: u64) -> Invoice {
        env.storage().persistent()
            .get(&DataKey::Invoice(invoice_id))
            .expect("Invoice not found")
    }

    /// Get all invoice IDs created by a supplier
    pub fn get_supplier_invoices(env: Env, supplier: Address) -> Vec<u64> {
        env.storage().persistent()
            .get(&DataKey::SupplierInvoices(supplier))
            .unwrap_or(Vec::new(&env))
    }

    /// Get a supplier's on-chain credit score
    pub fn get_credit_score(env: Env, supplier: Address) -> CreditScore {
        env.storage().persistent()
            .get(&DataKey::CreditScore(supplier))
            .unwrap_or(CreditScore {
                score: 500,
                total_invoices: 0,
                repaid_count: 0,
                defaulted_count: 0,
            })
    }

    /// Get total number of invoices created on platform
    pub fn get_invoice_count(env: Env) -> u64 {
        env.storage().instance()
            .get(&DataKey::InvoiceCount)
            .unwrap_or(0u64)
    }

    // ============================================================
    // INTERNAL HELPERS
    // ============================================================

    /// Update supplier credit score after repayment or default
    fn update_credit_score(env: &Env, supplier: &Address, repaid: bool) {
        let mut cs: CreditScore = env.storage().persistent()
            .get(&DataKey::CreditScore(supplier.clone()))
            .unwrap_or(CreditScore {
                score: 500,
                total_invoices: 0,
                repaid_count: 0,
                defaulted_count: 0,
            });

        cs.total_invoices += 1;

        if repaid {
            cs.repaid_count += 1;
            // Successful repayment boosts score by 50, max 1000
            cs.score = (cs.score + 50).min(1000);
        } else {
            cs.defaulted_count += 1;
            // Default drops score by 100, floor at 0
            cs.score = cs.score.saturating_sub(100);
        }

        env.storage().persistent().set(
            &DataKey::CreditScore(supplier.clone()),
            &cs
        );
    }
}


#[cfg(test)]
mod tests;
