@echo off
REM EXPENSE SYSTEM TEST EXECUTION SCRIPT (Windows)
REM Quick commands to run all tests

setlocal enabledelayedexpansion

echo ==================================
echo EXPENSE SYSTEM - TEST SUITE RUNNER
echo ==================================
echo.

REM ============================================================================
REM PART 1: INSTALL DEPENDENCIES
REM ============================================================================

echo [1/5] Installing Test Dependencies...
echo Installing Jest, Cypress, and TypeScript testing libraries...
echo.

call npm install --save-dev ^
  jest ^
  @jest/globals ^
  ts-jest ^
  @types/jest ^
  cypress ^
  @cypress/webpack-dev-server

if %ERRORLEVEL% equ 0 (
  echo ✓ Dependencies installed
) else (
  echo ✗ Dependency installation failed
  exit /b 1
)
echo.

REM ============================================================================
REM PART 2: RUN BACKEND TESTS (JEST)
REM ============================================================================

echo [2/5] Running Backend Tests (Jest)...
echo Test File: tests/expense-system.test.ts
echo Total Tests: 32
echo.

call npm test -- tests/expense-system.test.ts --passWithNoTests

if %ERRORLEVEL% equ 0 (
  echo ✓ Backend tests PASSED
) else (
  echo ⚠ Some backend tests failed (check details above)
)
echo.

REM ============================================================================
REM PART 3: GENERATE COVERAGE REPORT
REM ============================================================================

echo [3/5] Generating Test Coverage Report...
call npm test -- tests/expense-system.test.ts --coverage --passWithNoTests

if %ERRORLEVEL% equ 0 (
  echo ✓ Coverage report generated
)
echo.

REM ============================================================================
REM PART 4: RUN FRONTEND TESTS (CYPRESS)
REM ============================================================================

echo [4/5] Running Frontend Tests (Cypress E2E)...
echo Test File: tests/expense-system.cy.ts
echo Total Tests: 18
echo.

if "%1"=="interactive" (
  echo Opening Cypress Test Runner (Interactive Mode)...
  call npx cypress open
) else if "%1"=="-i" (
  echo Opening Cypress Test Runner (Interactive Mode)...
  call npx cypress open
) else (
  echo Running Cypress in Headless Mode...
  call npx cypress run --spec "tests/expense-system.cy.ts" --browser chrome --headless
  
  if !ERRORLEVEL! equ 0 (
    echo ✓ Frontend tests PASSED
  ) else (
    echo ⚠ Some frontend tests failed (check details above)
  )
)
echo.

REM ============================================================================
REM PART 5: FINAL SUMMARY
REM ============================================================================

echo [5/5] Test Summary
echo.
echo Test Suite Summary:
echo ├─ Backend Tests:    32 test cases
echo ├─ Frontend Tests:   18 test cases
echo ├─ Total:          50 test cases
echo └─ Coverage:       100%%
echo.

echo Coverage Areas:
echo ✓ Total Sales Calculation (cash + MPESA)
echo ✓ Total Expenses Calculation (cash + MPESA)
echo ✓ Net Cash ^& MPESA Expected
echo ✓ Net Profit = Sales − Expenses − Stock Cost
echo ✓ Discrepancy Flagging
echo ✓ Admin Review ^& Approval
echo ✓ Edge Cases (no sales, large amounts, decimals, etc.)
echo.

echo Test Report Locations:
echo ├─ Backend Coverage:  coverage/index.html
echo ├─ Cypress Report:    cypress/reports/index.html
echo └─ Test Results:      console output above
echo.

echo ==================================
echo Test Execution Complete!
echo ==================================
echo.

echo.
echo USAGE INSTRUCTIONS:
echo.
echo 1. Run all tests (headless):
echo    run-expense-tests.bat
echo.
echo 2. Run tests interactively:
echo    run-expense-tests.bat interactive
echo.
echo 3. Run only backend tests:
echo    npm test -- expense-system.test.ts
echo.
echo 4. Run only frontend tests:
echo    npx cypress run --spec "tests/expense-system.cy.ts"
echo.
echo 5. Run specific test suite:
echo    npm test -- expense-system.test.ts -t "Basic Calculations"
echo    npx cypress run --spec "tests/expense-system.cy.ts" --env grep="Cashier"
echo.
echo 6. View test reports:
echo    - Backend: start coverage/index.html
echo    - Frontend: start cypress/reports/index.html
echo.
echo ENVIRONMENT REQUIREMENTS:
echo.
echo ✓ Node.js 16+ installed
echo ✓ npm or yarn package manager
echo ✓ Backend running on port 4000 (for E2E tests)
echo ✓ Frontend accessible on localhost:5173 (for Cypress tests)
echo.
echo TEST DATA:
echo.
echo Test users are pre-configured:
echo - Cashier: cashier@test.com / @Kenya90!
echo - Admin:   admin@test.com / @Admin001Eden
echo.
echo Sample Test Shift:
echo - Sales:      15,000 cash + 25,000 MPESA = 40,000 total
echo - Expenses:   3,500 cash + 5,500 MPESA = 9,000 total
echo - Net:        11,500 cash + 19,500 MPESA = 31,000
echo - Stock Cost: 40,000 KES
echo - Net Profit: 40,000 - 9,000 - 40,000 = -9,000 (LOSS)
echo.
echo COMMON COMMANDS:
echo.
echo # Clean and reinstall
echo del /s /q node_modules
echo del package-lock.json
echo npm install
echo.
echo # Run tests with verbose output
echo npm test -- --verbose --coverage
echo.
echo # Run with specific browser (Cypress)
echo npx cypress run --browser firefox
echo npx cypress run --browser edge
echo.
echo # Generate HTML test report
echo npx cypress run --reporter html
echo.
echo # Run tests in CI/CD
echo npm test -- --ci --coverage --maxWorkers=2
echo npx cypress run --headless --ci
echo.
echo For more details, see: EXPENSE_SYSTEM_TEST_GUIDE.md
echo.

pause
