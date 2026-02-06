/**
 * EXPENSE SYSTEM - CYPRESS E2E TESTS
 * Frontend integration tests for shift closing and expense reconciliation
 * 
 * Scenarios:
 * 1. Add expenses during shift closing
 * 2. Calculate and verify net profit
 * 3. Flag discrepancies
 * 4. Admin review and approve expenses
 */

describe("Expense System - E2E Tests", () => {
  const testUser = {
    email: "cashier@test.com",
    password: "@Kenya90!",
  };

  const adminUser = {
    email: "admin@test.com",
    password: "@Admin001Eden",
  };

  beforeEach(() => {
    cy.clearCookies();
    cy.clearLocalStorage();
  });

  // ============================================================================
  // TEST SUITE 1: CASHIER SHIFT CLOSING WITH EXPENSES
  // ============================================================================

  describe("Cashier: Shift Closing with Expenses", () => {
    it("should open shift successfully", () => {
      cy.visit("http://localhost:5173/login");
      cy.get('input[type="email"]').type(testUser.email);
      cy.get('input[type="password"]').type(testUser.password);
      cy.get('button[type="submit"]').click();

      // Wait for dashboard
      cy.url().should("include", "/cashier");
      cy.contains("Open New Shift", { timeout: 10000 }).click();
      cy.contains("Shift Started").should("be.visible");
    });

    it("should add single expense during shift closing", () => {
      // Navigate to shift closing
      cy.visit("http://localhost:5173/cashier");
      cy.wait(2000);

      // Find and click close shift button
      cy.contains("button", /close|closing/i, { timeout: 5000 }).click({
        force: true,
      });

      // Fill in cash and MPESA
      cy.get('input[placeholder*="Cash"]').first().type("15000");
      cy.get('input[placeholder*="M-Pesa"]').first().type("25000");

      // Scroll to expenses section
      cy.contains("Add Expenses").scrollIntoView();

      // Add first expense - Transport
      cy.get('select').first().select("Transport");
      cy.get('input[placeholder*="Amount"]').first().type("2000");
      cy.contains("button", "Cash").click();
      cy.contains("button", "+ Add Expense").click();

      // Confirm expense
      cy.contains("button", "Confirm").click();

      // Verify expense appears as locked
      cy.contains("Transport").should("be.visible");
      cy.contains("🔒 Locked").should("be.visible");
      cy.contains("KES 2000").should("be.visible");
    });

    it("should add multiple expenses with different payment methods", () => {
      cy.visit("http://localhost:5173/cashier");
      cy.wait(2000);
      cy.contains("button", /close|closing/i, { timeout: 5000 }).click({
        force: true,
      });

      cy.get('input[placeholder*="Cash"]').first().type("15000");
      cy.get('input[placeholder*="M-Pesa"]').first().type("25000");

      // Expense 1: Cash
      cy.contains("Add Expenses").scrollIntoView();
      cy.get('select').first().select("Transport");
      cy.get('input[placeholder*="Amount"]').eq(0).clear().type("2000");
      cy.contains("button", "Cash").first().click();
      cy.contains("button", "+ Add Expense").first().click();
      cy.contains("button", "Confirm").click();

      // Verify first expense
      cy.contains("Transport").should("be.visible");

      // Expense 2: MPESA
      cy.get('select').first().select("Packaging");
      cy.get('input[placeholder*="Amount"]').eq(0).clear().type("3000");
      cy.contains("button", "M-Pesa").first().click();
      cy.contains("button", "+ Add Expense").first().click();
      cy.contains("button", "Confirm").click();

      // Verify both expenses
      cy.contains("Transport").should("be.visible");
      cy.contains("Packaging").should("be.visible");
      cy.contains("Total Expenses: KES 5000").should("be.visible");
    });

    it("should not allow deleting confirmed expenses", () => {
      cy.visit("http://localhost:5173/cashier");
      cy.wait(2000);
      cy.contains("button", /close|closing/i, { timeout: 5000 }).click({
        force: true,
      });

      cy.get('input[placeholder*="Cash"]').first().type("15000");
      cy.get('input[placeholder*="M-Pesa"]').first().type("25000");

      // Add expense
      cy.contains("Add Expenses").scrollIntoView();
      cy.get('select').first().select("Repairs");
      cy.get('input[placeholder*="Amount"]').eq(0).clear().type("1500");
      cy.contains("button", "+ Add Expense").first().click();
      cy.contains("button", "Confirm").click();

      // Verify no delete button appears
      cy.get('button:contains("✕")').should("not.exist");
      cy.contains("🔒 Locked").should("be.visible");
    });

    it("should show expense confirmation dialog before adding", () => {
      cy.visit("http://localhost:5173/cashier");
      cy.wait(2000);
      cy.contains("button", /close|closing/i, { timeout: 5000 }).click({
        force: true,
      });

      cy.get('input[placeholder*="Cash"]').first().type("15000");
      cy.get('input[placeholder*="M-Pesa"]').first().type("25000");

      // Add expense
      cy.contains("Add Expenses").scrollIntoView();
      cy.get('select').first().select("Food");
      cy.get('input[placeholder*="Amount"]').eq(0).clear().type("2500");
      cy.contains("button", "+ Add Expense").first().click();

      // Confirm dialog should appear
      cy.contains("Confirm Expense").should("be.visible");
      cy.contains("Food").should("be.visible");
      cy.contains("KES 2500").should("be.visible");
      cy.contains("💰 Cash").should("be.visible");

      // Verify cancel works
      cy.contains("button", "Cancel").click();
      cy.contains("Confirm Expense").should("not.exist");
    });

    it("should calculate correct net cash and net MPESA", () => {
      cy.visit("http://localhost:5173/cashier");
      cy.wait(2000);
      cy.contains("button", /close|closing/i, { timeout: 5000 }).click({
        force: true,
      });

      // Sales: 15000 cash, 25000 MPESA
      cy.get('input[placeholder*="Cash"]').first().type("15000");
      cy.get('input[placeholder*="M-Pesa"]').first().type("25000");

      // Expenses: 3500 cash (2000 + 1500), 5500 MPESA (3000 + 2500)
      cy.contains("Add Expenses").scrollIntoView();

      // Cash expense 1
      cy.get('select').first().select("Transport");
      cy.get('input[placeholder*="Amount"]').eq(0).clear().type("2000");
      cy.contains("button", "+ Add Expense").first().click();
      cy.contains("button", "Confirm").click();

      // Cash expense 2
      cy.get('select').first().select("Repairs");
      cy.get('input[placeholder*="Amount"]').eq(0).clear().type("1500");
      cy.contains("button", "+ Add Expense").first().click();
      cy.contains("button", "Confirm").click();

      // MPESA expense 1
      cy.get('select').first().select("Packaging");
      cy.get('input[placeholder*="Amount"]').eq(0).clear().type("3000");
      cy.contains("button", "M-Pesa").first().click();
      cy.contains("button", "+ Add Expense").first().click();
      cy.contains("button", "Confirm").click();

      // MPESA expense 2
      cy.get('select').first().select("Food");
      cy.get('input[placeholder*="Amount"]').eq(0).clear().type("2500");
      cy.contains("button", "M-Pesa").first().click();
      cy.contains("button", "+ Add Expense").first().click();
      cy.contains("button", "Confirm").click();

      // Verify totals
      cy.contains("After expenses: KES 11500").should("be.visible"); // 15000 - 3500
      cy.contains("After expenses: KES 19500").should("be.visible"); // 25000 - 5500
    });

    it("should close shift and save all data", () => {
      cy.visit("http://localhost:5173/cashier");
      cy.wait(2000);
      cy.contains("button", /close|closing/i, { timeout: 5000 }).click({
        force: true,
      });

      // Fill shift data
      cy.get('input[placeholder*="Cash"]').first().type("15000");
      cy.get('input[placeholder*="M-Pesa"]').first().type("25000");

      // Add expenses
      cy.contains("Add Expenses").scrollIntoView();
      cy.get('select').first().select("Transport");
      cy.get('input[placeholder*="Amount"]').eq(0).clear().type("2000");
      cy.contains("button", "+ Add Expense").first().click();
      cy.contains("button", "Confirm").click();

      // Close shift
      cy.contains("button", "Close Shift").click({ force: true });

      // Verify success message
      cy.contains("Shift Closed", { timeout: 10000 }).should("be.visible");
      cy.contains("Admin is reviewing").should("be.visible");
    });
  });

  // ============================================================================
  // TEST SUITE 2: EDGE CASES
  // ============================================================================

  describe("Expense System - Edge Cases", () => {
    it("should handle expense amount exceeding cash sales", () => {
      cy.visit("http://localhost:5173/cashier");
      cy.wait(2000);
      cy.contains("button", /close|closing/i, { timeout: 5000 }).click({
        force: true,
      });

      // Only 5000 cash sales
      cy.get('input[placeholder*="Cash"]').first().type("5000");
      cy.get('input[placeholder*="M-Pesa"]').first().type("25000");

      // Try to add 8000 cash expense
      cy.contains("Add Expenses").scrollIntoView();
      cy.get('select').first().select("Transport");
      cy.get('input[placeholder*="Amount"]').eq(0).clear().type("8000");
      cy.contains("button", "+ Add Expense").first().click();

      // Should still allow (net would be negative)
      cy.contains("Confirm Expense").should("be.visible");
      cy.contains("button", "Confirm").click();

      // Verify negative net is shown
      cy.contains("After expenses: KES -3000").should("be.visible");
    });

    it("should validate minimum expense amount", () => {
      cy.visit("http://localhost:5173/cashier");
      cy.wait(2000);
      cy.contains("button", /close|closing/i, { timeout: 5000 }).click({
        force: true,
      });

      cy.get('input[placeholder*="Cash"]').first().type("15000");
      cy.get('input[placeholder*="M-Pesa"]').first().type("25000");

      // Try to add zero amount
      cy.contains("Add Expenses").scrollIntoView();
      cy.get('select').first().select("Transport");
      cy.get('input[placeholder*="Amount"]').eq(0).clear().type("0");
      cy.contains("button", "+ Add Expense").first().click();

      // Should show error
      cy.contains("valid amount", { matchCase: false }).should("be.visible");
    });

    it("should handle large decimal amounts", () => {
      cy.visit("http://localhost:5173/cashier");
      cy.wait(2000);
      cy.contains("button", /close|closing/i, { timeout: 5000 }).click({
        force: true,
      });

      cy.get('input[placeholder*="Cash"]').first().type("50000.50");
      cy.get('input[placeholder*="M-Pesa"]').first().type("75000.75");

      // Add expense with decimals
      cy.contains("Add Expenses").scrollIntoView();
      cy.get('select').first().select("Transport");
      cy.get('input[placeholder*="Amount"]').eq(0).clear().type("2500.50");
      cy.contains("button", "+ Add Expense").first().click();
      cy.contains("button", "Confirm").click();

      // Verify decimal is preserved
      cy.contains("KES 2500.50").should("be.visible");
    });
  });

  // ============================================================================
  // TEST SUITE 3: ADMIN REVIEW & APPROVAL
  // ============================================================================

  describe("Admin: Expense Review & Approval", () => {
    it("should display shift with pending expenses for review", () => {
      cy.visit("http://localhost:5173/login");
      cy.get('input[type="email"]').type(adminUser.email);
      cy.get('input[type="password"]').type(adminUser.password);
      cy.get('button[type="submit"]').click();

      // Navigate to shift reconciliation
      cy.url().should("include", "/admin");
      cy.contains("a", /reconciliation|shifts/i, { timeout: 5000 }).click();

      // Find pending shift
      cy.contains("PENDING_REVIEW", { timeout: 5000 }).should("be.visible");
    });

    it("should show expense breakdown by category", () => {
      cy.visit("http://localhost:5173/login");
      cy.get('input[type="email"]').type(adminUser.email);
      cy.get('input[type="password"]').type(adminUser.password);
      cy.get('button[type="submit"]').click();

      cy.contains("a", /reconciliation|shifts/i, { timeout: 5000 }).click();
      cy.contains("PENDING_REVIEW").click({ force: true });

      // Verify expense breakdown
      cy.contains("Transport").should("be.visible");
      cy.contains("Packaging").should("be.visible");
      cy.contains("Repairs").should("be.visible");
      cy.contains("Food").should("be.visible");
    });

    it("should display net profit calculation", () => {
      cy.visit("http://localhost:5173/login");
      cy.get('input[type="email"]').type(adminUser.email);
      cy.get('input[type="password"]').type(adminUser.password);
      cy.get('button[type="submit"]').click();

      cy.contains("a", /reconciliation|shifts/i, { timeout: 5000 }).click();
      cy.contains("PENDING_REVIEW").click({ force: true });

      // Look for profit metrics
      cy.contains(/profit|revenue|net/i, { timeout: 5000 }).should("be.visible");
    });

    it("should allow admin to approve all expenses", () => {
      cy.visit("http://localhost:5173/login");
      cy.get('input[type="email"]').type(adminUser.email);
      cy.get('input[type="password"]').type(adminUser.password);
      cy.get('button[type="submit"]').click();

      cy.contains("a", /reconciliation|shifts/i, { timeout: 5000 }).click();
      cy.contains("PENDING_REVIEW").click({ force: true });

      // Click approve button
      cy.contains("button", /approve|confirm/i, { timeout: 5000 }).click({
        force: true,
      });

      // Verify success
      cy.contains("approved", { matchCase: false, timeout: 5000 }).should(
        "be.visible"
      );
    });

    it("should flag discrepancies if cash doesn't match", () => {
      // This test assumes backend has logic to flag discrepancies
      cy.visit("http://localhost:5173/login");
      cy.get('input[type="email"]').type(adminUser.email);
      cy.get('input[type="password"]').type(adminUser.password);
      cy.get('button[type="submit"]').click();

      cy.contains("a", /reconciliation|shifts/i, { timeout: 5000 }).click();

      // Look for shift with discrepancy flag
      cy.contains(/discrepancy|variance|mismatch/i, { timeout: 5000 }).should(
        "exist"
      );
    });
  });

  // ============================================================================
  // TEST SUITE 4: COMPLETE WORKFLOW
  // ============================================================================

  describe("Complete Workflow: Open Shift → Add Sales → Add Expenses → Close → Approve", () => {
    it("should complete full workflow from cashier to admin", () => {
      // STEP 1: Cashier opens shift
      cy.visit("http://localhost:5173/login");
      cy.get('input[type="email"]').type(testUser.email);
      cy.get('input[type="password"]').type(testUser.password);
      cy.get('button[type="submit"]').click();
      cy.url().should("include", "/cashier");

      // STEP 2: Make some sales (simulated via API or UI)
      // Assuming sales are recorded through normal POS flow
      cy.wait(2000);

      // STEP 3: Close shift with expenses
      cy.contains("button", /close|closing/i, { timeout: 5000 }).click({
        force: true,
      });

      cy.get('input[placeholder*="Cash"]').first().type("20000");
      cy.get('input[placeholder*="M-Pesa"]').first().type("30000");

      cy.contains("Add Expenses").scrollIntoView();
      cy.get('select').first().select("Transport");
      cy.get('input[placeholder*="Amount"]').eq(0).clear().type("2000");
      cy.contains("button", "+ Add Expense").first().click();
      cy.contains("button", "Confirm").click();

      // STEP 4: Submit shift close
      cy.contains("button", "Close Shift").click({ force: true });
      cy.contains("Shift Closed", { timeout: 10000 }).should("be.visible");

      // STEP 5: Admin logs in and reviews
      cy.clearCookies();
      cy.clearLocalStorage();

      cy.visit("http://localhost:5173/login");
      cy.get('input[type="email"]').type(adminUser.email);
      cy.get('input[type="password"]').type(adminUser.password);
      cy.get('button[type="submit"]').click();

      // STEP 6: Admin reviews shift
      cy.contains("a", /reconciliation|shifts/i, { timeout: 5000 }).click();
      cy.contains("PENDING_REVIEW", { timeout: 5000 }).should("be.visible");

      // STEP 7: Admin approves
      cy.contains("button", /approve|confirm/i, { timeout: 5000 }).click({
        force: true,
      });

      cy.contains("approved", { matchCase: false, timeout: 5000 }).should(
        "be.visible"
      );
    });
  });
});

// ============================================================================
// API INTEGRATION TESTS
// ============================================================================

describe("Expense System - API Integration", () => {
  it("should POST expense to /api/expenses endpoint", () => {
    cy.intercept("POST", "/api/expenses", { statusCode: 200 }).as(
      "createExpense"
    );

    // Trigger expense creation
    cy.visit("http://localhost:5173/login");
    cy.get('input[type="email"]').type("cashier@test.com");
    cy.get('input[type="password"]').type("@Kenya90!");
    cy.get('button[type="submit"]').click();

    cy.wait(2000);
    cy.contains("button", /close|closing/i).click({ force: true });

    cy.get('input[placeholder*="Cash"]').first().type("15000");
    cy.get('input[placeholder*="M-Pesa"]').first().type("25000");

    cy.contains("Add Expenses").scrollIntoView();
    cy.get('select').first().select("Transport");
    cy.get('input[placeholder*="Amount"]').eq(0).clear().type("2000");
    cy.contains("button", "+ Add Expense").first().click();
    cy.contains("button", "Confirm").click();

    cy.contains("button", "Close Shift").click({ force: true });

    // Verify API call
    cy.wait("@createExpense").should((xhr) => {
      expect(xhr.request.body).to.include({
        amount: 2000,
        category: "Transport",
      });
    });
  });

  it("should GET expenses for shift from /api/expenses endpoint", () => {
    cy.intercept("GET", "/api/expenses*", {
      statusCode: 200,
      body: [
        {
          id: "exp-001",
          shift_id: "shift-001",
          amount: 2000,
          category: "Transport",
          payment_method: "cash",
        },
      ],
    }).as("getExpenses");

    cy.visit("http://localhost:5173/login");
    cy.get('input[type="email"]').type("admin@test.com");
    cy.get('input[type="password"]').type("@Admin001Eden");
    cy.get('button[type="submit"]').click();

    cy.contains("a", /reconciliation|shifts/i, { timeout: 5000 }).click();

    cy.wait("@getExpenses");
  });
});
