/**
 * Financial Calculations Module
 * 
 * Provides accounting-standard financial computations with safe fallbacks
 * Used at shift close to create immutable financial snapshots
 */

// ============================================================================
// TYPES
// ============================================================================

export interface Transaction {
  amount?: number;
  total?: number;
  payment_method?: string;
}

export interface Expense {
  amount: number;
  payment_method: string;
}

export interface StockEntry {
  product_id: string;
  sold_stock: number;
  product?: {
    cost_per_kg?: number;
    unit_price?: number;
  };
}

export interface FinancialSnapshot {
  // Sales
  cash_sales_total: number;
  mpesa_sales_total: number;
  total_sales: number;

  // Expenses
  cash_expenses_total: number;
  mpesa_expenses_total: number;
  total_expenses: number;

  // COGS & Profit
  cogs_total: number;
  gross_profit: number;
  net_profit: number;
  profit_margin_pct: number;

  // Reconciliation
  opening_cash: number;
  opening_mpesa: number;
  expected_cash: number;
  expected_mpesa: number;
  actual_cash: number;
  actual_mpesa: number;
  cash_difference: number;
  mpesa_difference: number;
  cash_shortage_pct: number;
  mpesa_shortage_pct: number;

  // Flags
  has_cash_shortage: boolean;
  has_mpesa_shortage: boolean;
  shortage_flag_threshold: number;
}

// ============================================================================
// SAFE HELPERS WITH FALLBACKS
// ============================================================================

/**
 * Safely parse number from any value
 * @param value - Value to parse
 * @param defaultValue - Default if invalid (default: 0)
 */
export const parseNumber = (value: any, defaultValue: number = 0): number => {
  if (value === null || value === undefined) return defaultValue;
  const num = Number(value);
  return Number.isFinite(num) ? num : defaultValue;
};

/**
 * Compute individual sale amount
 * @param transaction - Transaction object
 */
export const getTransactionAmount = (transaction: any): number => {
  return parseNumber(transaction?.amount ?? transaction?.total, 0);
};

/**
 * Compute COGS for a single product with safe fallback
 * 
 * FALLBACK STRATEGY:
 * - Use provided cost_per_kg
 * - If missing: estimate from unit_price * 0.7 (assume 30% margin)
 * - If neither exists: return 0 (no data)
 * 
 * @param soldStockKg - Quantity sold in KG
 * @param costPerKg - Actual cost per KG (optional)
 * @param unitPrice - Sale price per KG (for fallback)
 */
export const computeProductCOGS = (
  soldStockKg: number,
  costPerKg?: number,
  unitPrice?: number
): number => {
  const stock = parseNumber(soldStockKg, 0);
  if (stock === 0) return 0;

  let cost = parseNumber(costPerKg, null);

  // Fallback: If no cost, estimate from unit price
  if (cost === null) {
    cost = parseNumber(unitPrice, 0) * 0.7; // Assume 30% margin
  }

  return stock * Math.max(0, cost); // Prevent negative COGS
};

/**
 * Compute total sales by payment method
 * @param transactions - Transaction array (or null)
 * @param paymentMethod - 'cash' or 'mpesa'
 */
export const computeSalesByPaymentMethod = (
  transactions: Transaction[] | null | undefined,
  paymentMethod: string
): number => {
  if (!transactions || transactions.length === 0) return 0;

  return transactions
    .filter((tx) => tx.payment_method === paymentMethod)
    .reduce((sum, tx) => sum + getTransactionAmount(tx), 0);
};

/**
 * Compute total expenses by payment method
 * @param expenses - Expense array (or null)
 * @param paymentMethod - 'cash' or 'mpesa'
 */
export const computeExpensesByPaymentMethod = (
  expenses: Expense[] | null | undefined,
  paymentMethod: string
): number => {
  if (!expenses || expenses.length === 0) return 0;

  return expenses
    .filter((exp) => exp.payment_method === paymentMethod)
    .reduce((sum, exp) => sum + parseNumber(exp.amount, 0), 0);
};

/**
 * Compute total COGS from all stock entries
 * @param stockEntries - Stock entries with sold quantities
 */
export const computeTotalCOGS = (
  stockEntries: StockEntry[] | null | undefined
): number => {
  if (!stockEntries || stockEntries.length === 0) return 0;

  return stockEntries.reduce((sum, entry) => {
    const soldKg = parseNumber(entry.sold_stock, 0);
    const costPerKg = parseNumber(entry.product?.cost_per_kg, null);
    const unitPrice = parseNumber(entry.product?.unit_price, 0);

    return sum + computeProductCOGS(soldKg, costPerKg, unitPrice);
  }, 0);
};

/**
 * Compute profit metrics with guard clauses
 */
export const computeProfit = (sales: number, cogs: number): number => {
  const s = parseNumber(sales, 0);
  const c = parseNumber(cogs, 0);
  return Math.max(0, s - c); // Gross profit ≥ 0
};

export const computeNetProfit = (
  sales: number,
  cogs: number,
  expenses: number
): number => {
  const gross = computeProfit(sales, cogs);
  const exp = parseNumber(expenses, 0);
  return Math.max(0, gross - exp); // Net profit ≥ 0
};

export const computeProfitMargin = (sales: number, profit: number): number => {
  const s = parseNumber(sales, 0);
  if (s === 0) return 0; // Avoid division by zero
  return (parseNumber(profit, 0) / s) * 100;
};

/**
 * Compute cash shortage percentage with guard clauses
 */
export const computeShortagePercentage = (
  shortage: number,
  total: number
): number => {
  const diff = parseNumber(shortage, 0);
  const t = parseNumber(total, 0);

  if (t === 0) return 0; // Avoid division by zero
  return (Math.abs(diff) / t) * 100;
};

// ============================================================================
// MAIN: COMPUTE FULL FINANCIAL SNAPSHOT
// ============================================================================

/**
 * Generate accounting-grade financial snapshot for shift close
 * 
 * This is the "source of truth" calculation - run once at shift close
 * and stored immutably. All reporting reads from this snapshot.
 * 
 * @param params - Input data from shift close
 */
export const computeFinancialSnapshot = (params: {
  transactions: Transaction[] | null;
  expenses: Expense[] | null;
  stockEntries: StockEntry[] | null;
  cashReceived: number;
  mpesaReceived: number;
  openingCash?: number;
  openingMpesa?: number;
  shortageThreshold?: number;
}): FinancialSnapshot => {
  const {
    transactions = [],
    expenses = [],
    stockEntries = [],
    cashReceived = 0,
    mpesaReceived = 0,
    openingCash = 0,
    openingMpesa = 0,
    shortageThreshold = 100, // KES
  } = params;

  // ========================================
  // SALES CALCULATION
  // ========================================
  const cash_sales_total = computeSalesByPaymentMethod(transactions, "cash");
  const mpesa_sales_total = computeSalesByPaymentMethod(transactions, "mpesa");
  const total_sales = cash_sales_total + mpesa_sales_total;

  // ========================================
  // EXPENSES CALCULATION
  // ========================================
  const cash_expenses_total = computeExpensesByPaymentMethod(expenses, "cash");
  const mpesa_expenses_total = computeExpensesByPaymentMethod(
    expenses,
    "mpesa"
  );
  const total_expenses = cash_expenses_total + mpesa_expenses_total;

  // ========================================
  // COGS & PROFIT CALCULATION
  // ========================================
  const cogs_total = computeTotalCOGS(stockEntries);
  const gross_profit = computeProfit(total_sales, cogs_total);
  const net_profit = computeNetProfit(total_sales, cogs_total, total_expenses);
  const profit_margin_pct = computeProfitMargin(total_sales, net_profit);

  // ========================================
  // CASH RECONCILIATION
  // ========================================
  const expected_cash = cash_sales_total - cash_expenses_total;
  const cash_difference = parseNumber(cashReceived, 0) - expected_cash;
  const cash_shortage_pct = computeShortagePercentage(
    cash_difference,
    cash_sales_total
  );
  const has_cash_shortage = Math.abs(cash_difference) > parseNumber(shortageThreshold, 100);

  // ========================================
  // MPESA RECONCILIATION
  // ========================================
  const expected_mpesa = mpesa_sales_total - mpesa_expenses_total;
  const mpesa_difference = parseNumber(mpesaReceived, 0) - expected_mpesa;
  const mpesa_shortage_pct = computeShortagePercentage(
    mpesa_difference,
    mpesa_sales_total
  );
  const has_mpesa_shortage = Math.abs(mpesa_difference) > parseNumber(shortageThreshold, 100);

  // ========================================
  // BUILD SNAPSHOT
  // ========================================
  const snapshot: FinancialSnapshot = {
    // Sales
    cash_sales_total,
    mpesa_sales_total,
    total_sales,

    // Expenses
    cash_expenses_total,
    mpesa_expenses_total,
    total_expenses,

    // COGS & Profit
    cogs_total,
    gross_profit,
    net_profit,
    profit_margin_pct,

    // Reconciliation
    opening_cash: parseNumber(openingCash, 0),
    opening_mpesa: parseNumber(openingMpesa, 0),
    expected_cash,
    expected_mpesa,
    actual_cash: parseNumber(cashReceived, 0),
    actual_mpesa: parseNumber(mpesaReceived, 0),
    cash_difference,
    mpesa_difference,
    cash_shortage_pct,
    mpesa_shortage_pct,

    // Flags
    has_cash_shortage,
    has_mpesa_shortage,
    shortage_flag_threshold: parseNumber(shortageThreshold, 100),
  };

  return snapshot;
};

// ============================================================================
// VALIDATION & AUDIT
// ============================================================================

/**
 * Validate snapshot for accounting accuracy
 */
export const validateFinancialSnapshot = (snapshot: FinancialSnapshot): {
  valid: boolean;
  errors: string[];
} => {
  const errors: string[] = [];

  // Check for negative values (invalid)
  if (snapshot.cash_sales_total < 0)
    errors.push("Cash sales total cannot be negative");
  if (snapshot.mpesa_sales_total < 0)
    errors.push("MPESA sales total cannot be negative");
  if (snapshot.total_expenses < 0) errors.push( "Total expenses cannot be negative");
  if (snapshot.cogs_total < 0) errors.push("COGS cannot be negative");
  if (snapshot.net_profit < 0)
    errors.push("Net profit should not be negative (indicate loss)");

  // Check for mathematical consistency
  if (
    snapshot.total_sales !== snapshot.cash_sales_total + snapshot.mpesa_sales_total
  ) {
    errors.push("Total sales math does not match: cash + mpesa totals");
  }

  if (
    snapshot.total_expenses !==
    snapshot.cash_expenses_total + snapshot.mpesa_expenses_total
  ) {
    errors.push("Total expenses math does not match: cash + mpesa totals");
  }

  if (
    Math.abs(
      snapshot.gross_profit - (snapshot.total_sales - snapshot.cogs_total)
    ) > 0.01
  ) {
    errors.push("Gross profit calculation incorrect");
  }

  if (
    Math.abs(
      snapshot.net_profit -
        (snapshot.gross_profit - snapshot.total_expenses)
    ) > 0.01
  ) {
    errors.push("Net profit calculation incorrect");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

// ============================================================================
// FORMATTING FOR API RESPONSE
// ============================================================================

/**
 * Format snapshot for API response with 2 decimal places
 */
export const formatSnapshotForResponse = (
  snapshot: FinancialSnapshot
): FinancialSnapshot => {
  const round = (num: number) => Math.round(num * 100) / 100;

  return {
    ...snapshot,
    cash_sales_total: round(snapshot.cash_sales_total),
    mpesa_sales_total: round(snapshot.mpesa_sales_total),
    total_sales: round(snapshot.total_sales),
    cash_expenses_total: round(snapshot.cash_expenses_total),
    mpesa_expenses_total: round(snapshot.mpesa_expenses_total),
    total_expenses: round(snapshot.total_expenses),
    cogs_total: round(snapshot.cogs_total),
    gross_profit: round(snapshot.gross_profit),
    net_profit: round(snapshot.net_profit),
    expected_cash: round(snapshot.expected_cash),
    expected_mpesa: round(snapshot.expected_mpesa),
    cash_difference: round(snapshot.cash_difference),
    mpesa_difference: round(snapshot.mpesa_difference),
  };
};

export default {
  computeFinancialSnapshot,
  validateFinancialSnapshot,
  formatSnapshotForResponse,
  parseNumber,
  computeProductCOGS,
  computeSalesByPaymentMethod,
  computeExpensesByPaymentMethod,
  computeTotalCOGS,
};

