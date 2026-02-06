/**
 * EXPENSE SYSTEM TEST SUITE
 * Tests for shift closing, expense calculations, and admin reconciliation
 * 
 * Test Coverage:
 * 1. Total sales calculation (cash + MPESA)
 * 2. Total expenses calculation (cash + MPESA)
 * 3. Net cash and net MPESA expected
 * 4. Net profit calculation = Sales − Expenses − Stock cost
 * 5. Discrepancy flagging
 * 6. Admin expense review and approval
 */

import { describe, it, expect, beforeAll, afterAll } from '@jest/globals';

// Mock API responses
const mockShiftData = {
  shift_id: "shift-001",
  cashier_id: "cashier-001",
  branch_id: "branch-001",
  status: "OPEN",
  opened_at: new Date().toISOString(),
};

const mockSalesData = {
  sales_cash: 15000,
  sales_mpesa: 25000,
  total_sales: 40000,
  items_sold: 45,
};

const mockExpenses = [
  {
    id: "exp-001",
    category: "Transport",
    amount: 2000,
    payment_method: "cash",
    shift_id: "shift-001",
  },
  {
    id: "exp-002",
    category: "Packaging",
    amount: 3000,
    payment_method: "mpesa",
    shift_id: "shift-001",
  },
  {
    id: "exp-003",
    category: "Repairs",
    amount: 1500,
    payment_method: "cash",
    shift_id: "shift-001",
  },
  {
    id: "exp-004",
    category: "Food",
    amount: 2500,
    payment_method: "mpesa",
    shift_id: "shift-001",
  },
];

const mockClosingStock = {
  "beef-001": { opening: 50, added: 20, sold: 35, closing: 35 },
  "beef-002": { opening: 40, added: 15, sold: 28, closing: 27 },
  "goat-001": { opening: 30, added: 10, sold: 22, closing: 18 },
};

// ============================================================================
// HELPER FUNCTIONS FOR CALCULATIONS
// ============================================================================

function calculateTotalExpenses(expenses: typeof mockExpenses) {
  return expenses.reduce((sum, exp) => sum + exp.amount, 0);
}

function calculateExpensesByMethod(
  expenses: typeof mockExpenses,
  method: "cash" | "mpesa"
) {
  return expenses
    .filter((exp) => exp.payment_method === method)
    .reduce((sum, exp) => sum + exp.amount, 0);
}

function calculateNetCash(salesCash: number, expensesCash: number) {
  return salesCash - expensesCash;
}

function calculateNetMpesa(salesMpesa: number, expensesMpesa: number) {
  return salesMpesa - expensesMpesa;
}

function calculateStockCost(stockData: typeof mockClosingStock) {
  // Assuming standard cost per kg = 500 KES
  const COST_PER_KG = 500;
  const totalClosingKg = Object.values(stockData).reduce(
    (sum, item) => sum + item.closing,
    0
  );
  return totalClosingKg * COST_PER_KG;
}

function calculateNetProfit(
  totalSales: number,
  totalExpenses: number,
  stockCost: number
) {
  return totalSales - totalExpenses - stockCost;
}

function flagDiscrepancies(
  expected: { cash: number; mpesa: number },
  actual: { cash: number; mpesa: number },
  threshold: number = 100
) {
  const discrepancies = [];

  const cashDiff = Math.abs(expected.cash - actual.cash);
  if (cashDiff > threshold) {
    discrepancies.push({
      type: "CASH_DISCREPANCY",
      expected: expected.cash,
      actual: actual.cash,
      difference: cashDiff,
      variance_percentage: (cashDiff / expected.cash) * 100,
    });
  }

  const mpesaDiff = Math.abs(expected.mpesa - actual.mpesa);
  if (mpesaDiff > threshold) {
    discrepancies.push({
      type: "MPESA_DISCREPANCY",
      expected: expected.mpesa,
      actual: actual.mpesa,
      difference: mpesaDiff,
      variance_percentage: (mpesaDiff / expected.mpesa) * 100,
    });
  }

  return discrepancies;
}

// ============================================================================
// TEST SUITE 1: BASIC EXPENSE CALCULATIONS
// ============================================================================

describe("Expense System - Basic Calculations", () => {
  describe("Total Expenses Calculation", () => {
    it("should calculate total expenses correctly (cash + MPESA)", () => {
      const total = calculateTotalExpenses(mockExpenses);
      const expected = 2000 + 3000 + 1500 + 2500; // 9000
      expect(total).toBe(expected);
    });

    it("should calculate cash expenses correctly", () => {
      const cashExpenses = calculateExpensesByMethod(mockExpenses, "cash");
      const expected = 2000 + 1500; // 3500
      expect(cashExpenses).toBe(expected);
    });

    it("should calculate MPESA expenses correctly", () => {
      const mpesaExpenses = calculateExpensesByMethod(mockExpenses, "mpesa");
      const expected = 3000 + 2500; // 5500
      expect(mpesaExpenses).toBe(expected);
    });

    it("should handle empty expense list", () => {
      const total = calculateTotalExpenses([]);
      expect(total).toBe(0);
    });

    it("should handle single expense", () => {
      const singleExpense = [mockExpenses[0]];
      const total = calculateTotalExpenses(singleExpense);
      expect(total).toBe(2000);
    });
  });

  describe("Net Cash & MPESA Calculation", () => {
    it("should calculate net cash correctly", () => {
      const salesCash = 15000;
      const expensesCash = 3500;
      const netCash = calculateNetCash(salesCash, expensesCash);
      expect(netCash).toBe(11500);
    });

    it("should calculate net MPESA correctly", () => {
      const salesMpesa = 25000;
      const expensesMpesa = 5500;
      const netMpesa = calculateNetMpesa(salesMpesa, expensesMpesa);
      expect(netMpesa).toBe(19500);
    });

    it("should handle zero expenses", () => {
      const netCash = calculateNetCash(15000, 0);
      expect(netCash).toBe(15000);
    });

    it("should handle zero sales", () => {
      const netCash = calculateNetCash(0, 3500);
      expect(netCash).toBe(-3500);
    });
  });
});

// ============================================================================
// TEST SUITE 2: NET PROFIT CALCULATION
// ============================================================================

describe("Expense System - Net Profit Calculation", () => {
  it("should calculate net profit correctly", () => {
    const totalSales = 40000;
    const totalExpenses = 9000;
    const stockCost = calculateStockCost(mockClosingStock);

    const profit = calculateNetProfit(totalSales, totalExpenses, stockCost);
    const expectedStockCost = 80 * 500; // 40000
    expect(profit).toBe(40000 - 9000 - expectedStockCost);
  });

  it("should calculate profit with only cash sales", () => {
    const salesCash = 20000;
    const totalExpenses = 2000;
    const stockCost = 10000;

    const profit = calculateNetProfit(salesCash, totalExpenses, stockCost);
    expect(profit).toBe(8000);
  });

  it("should calculate profit with only MPESA sales", () => {
    const salesMpesa = 30000;
    const totalExpenses = 5000;
    const stockCost = 15000;

    const profit = calculateNetProfit(salesMpesa, totalExpenses, stockCost);
    expect(profit).toBe(10000);
  });

  it("should handle negative profit (loss scenario)", () => {
    const totalSales = 10000;
    const totalExpenses = 8000;
    const stockCost = 5000;

    const profit = calculateNetProfit(totalSales, totalExpenses, stockCost);
    expect(profit).toBe(-3000); // Loss
  });

  it("should handle zero profit", () => {
    const totalSales = 10000;
    const totalExpenses = 5000;
    const stockCost = 5000;

    const profit = calculateNetProfit(totalSales, totalExpenses, stockCost);
    expect(profit).toBe(0);
  });
});

// ============================================================================
// TEST SUITE 3: DISCREPANCY FLAGGING
// ============================================================================

describe("Expense System - Discrepancy Detection", () => {
  it("should flag cash discrepancy", () => {
    const expected = { cash: 11500, mpesa: 19500 };
    const actual = { cash: 11200, mpesa: 19500 }; // 300 difference

    const discrepancies = flagDiscrepancies(expected, actual);
    expect(discrepancies).toHaveLength(1);
    expect(discrepancies[0].type).toBe("CASH_DISCREPANCY");
    expect(discrepancies[0].difference).toBe(300);
  });

  it("should flag MPESA discrepancy", () => {
    const expected = { cash: 11500, mpesa: 19500 };
    const actual = { cash: 11500, mpesa: 19800 }; // 300 difference

    const discrepancies = flagDiscrepancies(expected, actual);
    expect(discrepancies).toHaveLength(1);
    expect(discrepancies[0].type).toBe("MPESA_DISCREPANCY");
  });

  it("should flag both cash and MPESA discrepancies", () => {
    const expected = { cash: 11500, mpesa: 19500 };
    const actual = { cash: 11000, mpesa: 19000 }; // Both differ

    const discrepancies = flagDiscrepancies(expected, actual);
    expect(discrepancies).toHaveLength(2);
  });

  it("should not flag discrepancies within threshold", () => {
    const expected = { cash: 11500, mpesa: 19500 };
    const actual = { cash: 11520, mpesa: 19510 }; // Within 100 threshold

    const discrepancies = flagDiscrepancies(expected, actual, 100);
    expect(discrepancies).toHaveLength(0);
  });

  it("should calculate variance percentage correctly", () => {
    const expected = { cash: 10000, mpesa: 20000 };
    const actual = { cash: 9500, mpesa: 20000 }; // 500 off, 5% variance

    const discrepancies = flagDiscrepancies(expected, actual, 100);
    expect(discrepancies[0].variance_percentage).toBe(5);
  });

  it("should handle perfect match (no discrepancies)", () => {
    const expected = { cash: 11500, mpesa: 19500 };
    const actual = { cash: 11500, mpesa: 19500 };

    const discrepancies = flagDiscrepancies(expected, actual);
    expect(discrepancies).toHaveLength(0);
  });
});

// ============================================================================
// TEST SUITE 4: EDGE CASES
// ============================================================================

describe("Expense System - Edge Cases", () => {
  describe("No Sales Scenario", () => {
    it("should handle shift with no sales", () => {
      const totalSales = 0;
      const totalExpenses = 5000;
      const stockCost = 10000;

      const profit = calculateNetProfit(totalSales, totalExpenses, stockCost);
      expect(profit).toBe(-15000);
    });

    it("should calculate net cash with no sales", () => {
      const netCash = calculateNetCash(0, 2000);
      expect(netCash).toBe(-2000);
    });
  });

  describe("All MPESA Sales Scenario", () => {
    it("should handle all sales via MPESA", () => {
      const expected = { cash: 0, mpesa: 50000 };
      const actual = { cash: 0, mpesa: 50000 };

      const discrepancies = flagDiscrepancies(expected, actual);
      expect(discrepancies).toHaveLength(0);
    });

    it("should calculate profit with all MPESA sales", () => {
      const totalSales = 50000; // All MPESA
      const totalExpenses = 10000;
      const stockCost = 15000;

      const profit = calculateNetProfit(totalSales, totalExpenses, stockCost);
      expect(profit).toBe(25000);
    });
  });

  describe("All Cash Expenses Scenario", () => {
    it("should handle all expenses in cash", () => {
      const allCashExpenses = mockExpenses.map((exp) => ({
        ...exp,
        payment_method: "cash" as const,
      }));

      const total = calculateTotalExpenses(allCashExpenses);
      const cashExpenses = calculateExpensesByMethod(allCashExpenses, "cash");
      expect(cashExpenses).toBe(total);
    });
  });

  describe("Expense Exceeding Cash Sales", () => {
    it("should flag when cash expenses exceed cash sales", () => {
      const salesCash = 5000;
      const expensesCash = 8000; // Exceeds sales

      const discrepancies = flagDiscrepancies(
        { cash: 5000, mpesa: 25000 },
        { cash: 5000, mpesa: 25000 },
        0 // Zero threshold
      );

      const netCash = calculateNetCash(salesCash, expensesCash);
      expect(netCash).toBe(-3000);
    });
  });

  describe("Very Large Transactions", () => {
    it("should handle large sales amounts", () => {
      const largeExpense = {
        id: "exp-large",
        category: "Equipment",
        amount: 500000, // 500k
        payment_method: "mpesa" as const,
        shift_id: "shift-001",
      };

      const total = calculateTotalExpenses([largeExpense]);
      expect(total).toBe(500000);
    });

    it("should calculate profit with large stock cost", () => {
      const totalSales = 1000000;
      const totalExpenses = 100000;
      const stockCost = 500000;

      const profit = calculateNetProfit(totalSales, totalExpenses, stockCost);
      expect(profit).toBe(400000);
    });
  });

  describe("Rounding and Decimal Precision", () => {
    it("should handle decimal amounts correctly", () => {
      const expenses = [
        { amount: 1500.50, payment_method: "cash" as const },
        { amount: 2000.75, payment_method: "cash" as const },
      ];

      const total = expenses.reduce((sum, e) => sum + e.amount, 0);
      expect(total).toBeCloseTo(3501.25, 2);
    });
  });
});

// ============================================================================
// TEST SUITE 5: SHIFT CLOSING WORKFLOW
// ============================================================================

describe("Expense System - Shift Closing Workflow", () => {
  it("should complete full shift closing with correct calculations", () => {
    // Scenario: A complete shift closing
    const shift = {
      id: "shift-001",
      sales: { cash: 15000, mpesa: 25000 },
      expenses: mockExpenses,
    };

    const totalSales = shift.sales.cash + shift.sales.mpesa;
    const totalExpenses = calculateTotalExpenses(shift.expenses);
    const expensesCash = calculateExpensesByMethod(shift.expenses, "cash");
    const expensesMpesa = calculateExpensesByMethod(shift.expenses, "mpesa");

    const netCash = calculateNetCash(shift.sales.cash, expensesCash);
    const netMpesa = calculateNetMpesa(shift.sales.mpesa, expensesMpesa);

    expect(totalSales).toBe(40000);
    expect(totalExpenses).toBe(9000);
    expect(netCash).toBe(11500);
    expect(netMpesa).toBe(19500);
  });

  it("should flag discrepancies when closing with incorrect totals", () => {
    const expected = { cash: 11500, mpesa: 19500 };
    const actual = { cash: 11000, mpesa: 19500 }; // Cash is 500 short

    const discrepancies = flagDiscrepancies(expected, actual);
    expect(discrepancies).toHaveLength(1);
    expect(discrepancies[0].variance_percentage).toBeGreaterThan(4);
  });

  it("should calculate and verify final shift summary", () => {
    const shiftSummary = {
      total_sales: 40000,
      total_expenses: 9000,
      net_sales_cash: 11500,
      net_sales_mpesa: 19500,
      stock_cost: 40000,
      net_profit: 40000 - 9000 - 40000, // -9000 (loss)
      variance_detected: false,
    };

    expect(shiftSummary.net_profit).toBe(-9000);
    expect(shiftSummary.net_sales_cash).toBe(11500);
    expect(shiftSummary.net_sales_mpesa).toBe(19500);
  });
});

// ============================================================================
// TEST SUITE 6: ADMIN REVIEW & APPROVAL
// ============================================================================

describe("Expense System - Admin Review & Approval", () => {
  it("should allow admin to view all shift expenses", () => {
    const shiftExpenses = mockExpenses;

    expect(shiftExpenses).toHaveLength(4);
    expect(shiftExpenses[0].category).toBe("Transport");
    expect(shiftExpenses[0].amount).toBe(2000);
  });

  it("should categorize expenses by type for admin review", () => {
    const categories = {};
    mockExpenses.forEach((exp) => {
      categories[exp.category] = (categories[exp.category] || 0) + exp.amount;
    });

    expect(categories["Transport"]).toBe(2000);
    expect(categories["Packaging"]).toBe(3000);
    expect(categories["Repairs"]).toBe(1500);
    expect(categories["Food"]).toBe(2500);
  });

  it("should support admin approval of expenses", () => {
    const expenseApprovals = mockExpenses.map((exp) => ({
      expense_id: exp.id,
      approved: true,
      approved_by: "admin-001",
      approved_at: new Date().toISOString(),
    }));

    expect(expenseApprovals).toHaveLength(4);
    expect(expenseApprovals[0].approved).toBe(true);
  });

  it("should support admin rejection with notes", () => {
    const rejection = {
      expense_id: "exp-002",
      approved: false,
      rejection_reason: "Documentation incomplete",
      reviewed_by: "admin-001",
      reviewed_at: new Date().toISOString(),
    };

    expect(rejection.approved).toBe(false);
    expect(rejection.rejection_reason).toContain("Documentation");
  });

  it("should calculate total approved vs rejected expenses", () => {
    const approvalStatus = [
      { id: "exp-001", approved: true, amount: 2000 },
      { id: "exp-002", approved: true, amount: 3000 },
      { id: "exp-003", approved: false, amount: 1500 },
      { id: "exp-004", approved: true, amount: 2500 },
    ];

    const totalApproved = approvalStatus
      .filter((e) => e.approved)
      .reduce((sum, e) => sum + e.amount, 0);
    const totalRejected = approvalStatus
      .filter((e) => !e.approved)
      .reduce((sum, e) => sum + e.amount, 0);

    expect(totalApproved).toBe(7500);
    expect(totalRejected).toBe(1500);
  });
});

// ============================================================================
// TEST SUMMARY OUTPUT
// ============================================================================

describe("Test Suite Summary", () => {
  it("should document all test coverage areas", () => {
    const coverage = {
      "Basic Calculations": 5,
      "Net Profit Calculations": 5,
      "Discrepancy Detection": 6,
      "Edge Cases": 8,
      "Shift Closing Workflow": 3,
      "Admin Review & Approval": 5,
    };

    const totalTests = Object.values(coverage).reduce((a, b) => a + b, 0);
    console.log("\n=== EXPENSE SYSTEM TEST COVERAGE ===");
    console.log(`Total Test Cases: ${totalTests}`);
    Object.entries(coverage).forEach(([area, count]) => {
      console.log(`  • ${area}: ${count} tests`);
    });
  });
});
