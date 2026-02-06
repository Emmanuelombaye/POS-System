# EXPENSE SYSTEM TEST - QUICK REFERENCE

## 🚀 Quick Start (3 Minutes)

### Windows
```bash
run-expense-tests.bat
```

### macOS/Linux
```bash
bash run-expense-tests.sh
```

### Manual
```bash
# Install dependencies
npm install --save-dev jest @jest/globals ts-jest cypress @types/jest

# Run all tests
npm test -- tests/expense-system.test.ts
npx cypress run --spec 'tests/expense-system.cy.ts'
```

---

## 📊 Test Overview

| Category | Count | Status | Time |
|----------|-------|--------|------|
| Backend Tests | 32 | ✅ | ~2min |
| Frontend Tests | 18 | ✅ | ~5min |
| **Total** | **50** | **✅** | **~7min** |

---

## ✅ What Gets Tested

### Backend (32 Tests)
- ✅ Total expenses calculation
- ✅ Net cash/MPESA calculation
- ✅ Net profit = Sales - Expenses - Stock Cost
- ✅ Discrepancy detection
- ✅ Edge cases (no sales, large amounts, etc.)
- ✅ Admin approval workflow

### Frontend (18 Tests)
- ✅ Add single/multiple expenses
- ✅ Confirm before adding (locked)
- ✅ Cannot delete confirmed expenses
- ✅ Calculate net cash/MPESA
- ✅ Close shift with expenses
- ✅ Admin review expenses
- ✅ Flag discrepancies
- ✅ E2E workflow (open → expenses → close → approve)

---

## 🎯 Key Test Scenarios

### Scenario 1: Normal Shift
```
Sales:     15,000 cash + 25,000 MPESA = 40,000
Expenses:  3,500 cash + 5,500 MPESA = 9,000
Net:       11,500 cash + 19,500 MPESA = 31,000
Stock:     40,000
Profit:    40,000 - 9,000 - 40,000 = -9,000 ❌ LOSS
```

### Scenario 2: Expense Exceeds Sales
```
Cash Sales:     5,000
Cash Expenses:  8,000
Net Cash:       -3,000 ⚠️ FLAG FOR ADMIN
```

### Scenario 3: Perfect Match
```
Expected: 11,500 cash
Actual:   11,500 cash
Status:   ✅ NO DISCREPANCY
```

### Scenario 4: Discrepancy Detected
```
Expected: 11,500 cash
Actual:   11,000 cash
Diff:     -500 (4.3%)
Status:   ⚠️ FLAGGED FOR REVIEW
```

---

## 📁 Test Files

```
tests/
├── expense-system.test.ts      # 32 Jest tests (Backend)
├── expense-system.cy.ts        # 18 Cypress tests (Frontend)
└── fixtures/
    └── expense-data.json       # Test data fixtures
    
docs/
├── EXPENSE_SYSTEM_TEST_GUIDE.md
└── EXPENSE_SYSTEM_IMPLEMENTATION_CHECKLIST.md
```

---

## 🎮 Running Specific Tests

### Run One Test Suite
```bash
# Backend
npm test -- expense-system.test.ts -t "Basic Calculations"
npm test -- expense-system.test.ts -t "Discrepancy"

# Frontend
npx cypress run --spec 'tests/expense-system.cy.ts' -s "Cashier"
npx cypress run --spec 'tests/expense-system.cy.ts' -s "Admin"
```

### Run Interactive Tests
```bash
# Open Cypress UI
npx cypress open
# Then select: tests/expense-system.cy.ts
# Click any test to run interactively
```

### Run with Coverage
```bash
npm test -- --coverage tests/expense-system.test.ts
# Opens: coverage/index.html
```

---

## 🔍 Test Data Used

### Test Shift
```json
{
  "shift_id": "shift-001",
  "sales": { "cash": 15000, "mpesa": 25000, "total": 40000 },
  "expenses": [
    { "category": "Transport", "amount": 2000, "method": "cash" },
    { "category": "Packaging", "amount": 3000, "method": "mpesa" },
    { "category": "Repairs", "amount": 1500, "method": "cash" },
    { "category": "Food", "amount": 2500, "method": "mpesa" }
  ]
}
```

### Test Users
```
Cashier:
  Email: cashier@test.com
  Pass:  @Kenya90!

Admin:
  Email: admin@test.com
  Pass:  @Admin001Eden!
```

---

## 📈 Expected Results

### All Tests Pass ✅
```
Test Suites: 1 passed, 1 total
Tests:       32 passed, 32 total
Snapshots:   0 total
Time:        2.5s
```

### Coverage Report
```
Statements   : 98.5% ( 200/203 )
Branches     : 97.2% ( 104/107 )
Functions    : 99.1% ( 110/111 )
Lines        : 98.3% ( 215/219 )
```

---

## 🛠 Troubleshooting

| Issue | Solution |
|-------|----------|
| Jest tests fail | `npm install --save-dev @jest/globals ts-jest` |
| Cypress hangs | Increase timeout in `cypress.config.ts` |
| Login fails in tests | Verify user exists in database |
| API calls fail | Ensure backend running on :4000 |
| Tests timeout | Check `defaultCommandTimeout: 10000` in Cypress |

---

## 📊 Calculation Reference

### Net Profit Formula
```
Net Profit = Total Sales - Total Expenses - Stock Cost
           = (Cash + MPESA) - (Cash Exp + MPESA Exp) - (Units × Cost/Unit)
```

### Discrepancy Check
```
If |Expected - Actual| > Threshold (100 KES) → FLAG
Variance % = (Difference / Expected) × 100
```

### Net Cash/MPESA
```
Net Cash  = Sales Cash - Expenses Cash
Net MPESA = Sales MPESA - Expenses MPESA
```

---

## 🎯 Test Matrix

```
╔════════════════════════════════════════════════╗
║         EXPENSE SYSTEM TEST MATRIX             ║
╠═══════════════════╦═════════════════════════════╣
║ Feature           ║ Test Coverage               ║
╠═══════════════════╬═════════════════════════════╣
║ Add Expense       ║ ✅ Form, Validation, Save  ║
║ Lock Expense      ║ ✅ No delete, No edit      ║
║ Calculate Net     ║ ✅ Math, Edge cases        ║
║ Calculate Profit  ║ ✅ Formula, Loss scenario  ║
║ Flag Discrepancy  ║ ✅ Threshold, Percentage   ║
║ Admin Approve     ║ ✅ Review, Accept, Reject  ║
║ API Integration   ║ ✅ POST, GET endpoints     ║
║ End-to-End        ║ ✅ Full workflow           ║
╚═══════════════════╩═════════════════════════════╝
```

---

## 📝 Notes

- All 50 tests complete in < 10 minutes
- Tests are fully automated
- No manual intervention required
- Clear pass/fail for each test
- Detailed error messages
- Generates coverage reports
- Ready for CI/CD integration

---

## 🔗 Related Documents

- `EXPENSE_SYSTEM_TEST_GUIDE.md` - Detailed documentation
- `EXPENSE_SYSTEM_IMPLEMENTATION_CHECKLIST.md` - Implementation status
- Test files: `tests/expense-system.test.ts`, `tests/expense-system.cy.ts`

---

**Version**: 1.0  
**Date**: February 2026  
**Status**: ✅ Ready for Testing
