#!/usr/bin/env node
/**
 * Eden Top POS - MVP Verification (Simple curl-based test)
 * Run: node MVP_VERIFICATION_SIMPLE.mjs
 */

import { execSync } from 'child_process';

const API = "http://localhost:4000";
const colors = {
  reset: '\x1b[0m',
  green: '\x1b[32m',
  red: '\x1b[31m',
  yellow: '\x1b[33m',
  cyan: '\x1b[36m',
  bold: '\x1b[1m',
};

const log = (color, msg) => console.log(color + msg + colors.reset);

const curl = async (method, path, data = null, token = null) => {
  let cmd = `curl -s -X ${method} "http://localhost:4000${path}"`;
  cmd += ` -H "Content-Type: application/json"`;
  if (token) cmd += ` -H "Authorization: Bearer ${token}"`;
  if (data) cmd += ` -d '${JSON.stringify(data).replace(/'/g, "'\\''")}'`;
  
  try {
    const output = execSync(cmd, { encoding: 'utf-8' });
    return JSON.parse(output);
  } catch (error) {
    throw new Error(`Curl failed: ${error.message}`);
  }
};

const main = async () => {
  log(colors.bold + colors.cyan, "\n🧪 EDEN DROP 001 POS - QUICK VERIFICATION TEST\n");
  
  let passed = 0, failed = 0;
  let tokens = {};
  let sharedData = {};

  const test = async (name, fn) => {
    try {
      log(colors.cyan, `⏳ ${name}...`);
      await fn();
      log(colors.green, `✅ ${name}`);
      passed++;
    } catch (e) {
      log(colors.red, `❌ ${name}: ${e.message}`);
      failed++;
    }
  };

  // Test 1: Health
  await test("Backend health check", async () => {
    const result = await curl("GET", "/health");
    if (!result.status) throw new Error("No health status");
  });

  // Test 2: Users
  let cashier, admin;
  await test("Database has users", async () => {
    const result = await curl("GET", "/debug/users");
    if (!result.users || result.users.length === 0) throw new Error("No users");
    cashier = result.users.find(u => u.role === "cashier");
    admin = result.users.find(u => u.role === "admin");
    if (!cashier || !admin) throw new Error("Missing cashier/admin");
  });

  // Test 3: Cashier login
  await test("Cashier login", async () => {
    const result = await curl("POST", "/api/auth/login", { userId: cashier.id, password: "@AdminEdenDrop001" });
    if (!result.token) throw new Error("No token");
    tokens.cashier = result.token;
  });

  // Test 4: Admin login
  await test("Admin login", async () => {
    const result = await curl("POST", "/api/auth/login", { userId: admin.id, password: "@AdminEdenDrop001" });
    if (!result.token) throw new Error("No token");
    tokens.admin = result.token;
  });

  // Test 5: Fetch products
  let product;
  await test("Cashier fetch products", async () => {
    const result = await curl("GET", "/api/products", null, tokens.cashier);
    if (!Array.isArray(result) || result.length === 0) throw new Error("No products");
    product = result.find(p => p.is_active !== false);
    if (!product) throw new Error("No active products");
    sharedData.product = product;
  });

  // Test 6: Open shift
  let shift;
  await test("Cashier open shift", async () => {
    const result = await curl("POST", "/api/shifts/open", { cashier_id: cashier.id, branch_id: "branch1" }, tokens.cashier);
    if (!result.id || result.status !== "OPEN") throw new Error("Shift not opened");
    shift = result;
  });

  // Test 7: Add stock
  await test("Cashier add stock to shift", async () => {
    const result = await curl("POST", "/api/shift/add-stock", {
      shift_id: shift.id,
      product_id: product.id,
      quantity_kg: 2.5,
      supplier: "Test Supplier",
      notes: "MVP Test",
      batch: "B-001"
    }, tokens.cashier);
    if (!result.id) throw new Error("Stock not added");
  });

  // Test 8: Complete sale
  let transaction;
  await test("Cashier complete sale", async () => {
    transaction = {
      id: `tx-${Date.now()}`,
      cashier_id: cashier.id,
      shift_id: shift.id,
      created_at: new Date().toISOString(),
      items: [{
        productId: product.id,
        weightKg: 0.75,
        pricePerKg: product.price_per_kg || 500,
        totalPrice: 0.75 * (product.price_per_kg || 500)
      }],
      discount: null,
      subtotal: 0.75 * (product.price_per_kg || 500),
      total: 0.75 * (product.price_per_kg || 500),
      payment_method: "cash"
    };
    const result = await curl("POST", "/api/transactions", transaction, tokens.cashier);
    if (!result.id) throw new Error("Transaction not completed");
    sharedData.transaction = result;
  });

  // Test 9: View transactions (cashier)
  await test("Cashier view transactions", async () => {
    const result = await curl("GET", "/api/transactions", null, tokens.cashier);
    if (!Array.isArray(result)) throw new Error("Not an array");
    const found = result.find(tx => tx.id === transaction.id);
    if (!found) throw new Error("Transaction not found");
  });

  // Test 10: Admin view transactions
  await test("Admin view all transactions", async () => {
    const result = await curl("GET", "/api/transactions", null, tokens.admin);
    if (!Array.isArray(result)) throw new Error("Not an array");
    const found = result.find(tx => tx.id === transaction.id);
    if (!found) throw new Error("Transaction not found");
  });

  // Test 11: Admin view shifts
  await test("Admin view all shifts", async () => {
    const result = await curl("GET", "/api/shifts", null, tokens.admin);
    if (!Array.isArray(result)) throw new Error("Not an array");
    const found = result.find(s => s.id === shift.id);
    if (!found) throw new Error("Shift not found");
  });

  // Test 12: Stock summary
  await test("Admin view stock summary", async () => {
    const today = new Date().toISOString().split("T")[0];
    const result = await curl("GET", `/api/shift-stock/summary?branch_id=branch1&date=${today}`, null, tokens.admin);
    if (!result) throw new Error("No summary");
  });

  // Test 13: Role-based access control
  await test("Cashier cannot create users", async () => {
    try {
      await curl("POST", "/api/users", { id: "test", name: "Test", role: "cashier" }, tokens.cashier);
      throw new Error("Should have been denied");
    } catch (e) {
      if (!e.message.includes("Should have")) return; // Expected to fail
      throw e;
    }
  });

  // Test 14: Admin can create users
  let newUser;
  await test("Admin create new user", async () => {
    const userId = `user-${Date.now()}`;
    const result = await curl("POST", "/api/users", { id: userId, name: "New User", role: "cashier" }, tokens.admin);
    if (!result.id) throw new Error("User not created");
    newUser = result;
  });

  // Test 15: New user can login
  await test("New user login", async () => {
    const result = await curl("POST", "/api/auth/login", { userId: newUser.id, password: "@AdminEdenDrop001" });
    if (!result.token) throw new Error("No token");
  });

  // Summary
  const total = passed + failed;
  const pct = total > 0 ? Math.round((passed / total) * 100) : 0;
  
  log(colors.bold + colors.cyan, `\n📊 RESULTS: ${passed}/${total} passed (${pct}%)`);
  if (failed > 0) {
    log(colors.red, `❌ ${failed} test(s) failed`);
  } else {
    log(colors.green, `✅ All tests passed - MVP is ready for deployment!`);
  }
  
  process.exit(failed > 0 ? 1 : 0);
};

main().catch(e => {
  log(colors.red, `Fatal error: ${e.message}`);
  process.exit(1);
});
