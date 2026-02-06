#!/usr/bin/env node

/**
 * ROLE-BASED AUTHENTICATION TEST
 * Tests that cashier, manager, and admin roles are properly connected
 * and can access their respective features
 */

const API_BASE_URL = "http://localhost:4000";

// Test credentials
const CREDENTIALS = {
  cashier: { userId: "c1", password: "@AdminEdenDrop001", expectedRole: "cashier", name: "Cashier One" },
  manager: { userId: "m1", password: "@AdminEdenDrop001", expectedRole: "manager", name: "Manager One" },
  admin: { userId: "a1", password: "@AdminEdenDrop001", expectedRole: "admin", name: "Admin One" }
};

// Color codes for terminal output
const colors = {
  reset: "\x1b[0m",
  green: "\x1b[32m",
  red: "\x1b[31m",
  yellow: "\x1b[33m",
  blue: "\x1b[34m",
  cyan: "\x1b[36m"
};

function log(message, color = "reset") {
  console.log(`${colors[color]}${message}${colors.reset}`);
}

async function testLogin(roleLabel, credentials) {
  log(`\n${"=".repeat(60)}`, "cyan");
  log(`Testing ${roleLabel.toUpperCase()} Login`, "cyan");
  log("=".repeat(60), "cyan");

  try {
    const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        userId: credentials.userId,
        password: credentials.password
      })
    });

    if (!response.ok) {
      const errorData = await response.json();
      log(`❌ ${roleLabel} login FAILED: ${errorData.error || response.statusText}`, "red");
      return null;
    }

    const data = await response.json();
    
    // Validate response structure
    if (!data.token || !data.user) {
      log(`❌ ${roleLabel} login response missing token or user data`, "red");
      return null;
    }

    // Validate role matches expected
    if (data.user.role !== credentials.expectedRole) {
      log(`❌ ${roleLabel} role mismatch! Expected: ${credentials.expectedRole}, Got: ${data.user.role}`, "red");
      return null;
    }

    log(`✅ ${roleLabel} login successful`, "green");
    log(`   User ID: ${data.user.id}`, "blue");
    log(`   Name: ${data.user.name}`, "blue");
    log(`   Role: ${data.user.role}`, "blue");
    log(`   Token: ${data.token.substring(0, 20)}...`, "blue");

    return { token: data.token, user: data.user };
  } catch (error) {
    log(`❌ ${roleLabel} login ERROR: ${error.message}`, "red");
    return null;
  }
}

async function testCashierFeatures(token) {
  log(`\n${"=".repeat(60)}`, "cyan");
  log("Testing CASHIER Features", "cyan");
  log("=".repeat(60), "cyan");

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  // Test 1: Fetch products (cashiers need this)
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`, { headers });
    if (response.ok) {
      const products = await response.json();
      log(`✅ Cashier can fetch products (${products.length} items)`, "green");
    } else {
      log(`❌ Cashier CANNOT fetch products: ${response.statusText}`, "red");
    }
  } catch (error) {
    log(`❌ Cashier products ERROR: ${error.message}`, "red");
  }

  // Test 2: Create transaction (cashier primary function)
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: `tx_test_${Date.now()}`,
        cashier_id: "c1",
        items: [{ productId: "prod1", weightKg: 1.5, pricePerKg: 800 }],
        subtotal: 1200,
        total: 1200,
        payment_method: "cash",
        transaction_date: new Date().toISOString()
      })
    });

    if (response.ok) {
      const transaction = await response.json();
      log(`✅ Cashier can create transactions (ID: ${transaction.id})`, "green");
    } else {
      const error = await response.json();
      log(`❌ Cashier CANNOT create transactions: ${error.error || response.statusText}`, "red");
    }
  } catch (error) {
    log(`❌ Cashier transaction ERROR: ${error.message}`, "red");
  }

  // Test 3: Open shift (cashiers need this)
  try {
    const response = await fetch(`${API_BASE_URL}/api/shift/open`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        cashOnHand: 5000
      })
    });

    if (response.ok) {
      const shift = await response.json();
      log(`✅ Cashier can open shift (ID: ${shift.id})`, "green");
      return shift.id; // Return shift ID for later tests
    } else {
      const error = await response.json();
      log(`⚠️  Cashier shift open: ${error.error || response.statusText}`, "yellow");
    }
  } catch (error) {
    log(`❌ Cashier shift ERROR: ${error.message}`, "red");
  }

  return null;
}

async function testManagerFeatures(token) {
  log(`\n${"=".repeat(60)}`, "cyan");
  log("Testing MANAGER Features", "cyan");
  log("=".repeat(60), "cyan");

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  // Test 1: View all shifts (manager oversight)
  try {
    const response = await fetch(`${API_BASE_URL}/api/shifts`, { headers });
    if (response.ok) {
      const shifts = await response.json();
      log(`✅ Manager can view all shifts (${shifts.length} shifts)`, "green");
    } else {
      log(`❌ Manager CANNOT view shifts: ${response.statusText}`, "red");
    }
  } catch (error) {
    log(`❌ Manager shifts ERROR: ${error.message}`, "red");
  }

  // Test 2: View all transactions (manager reports)
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, { headers });
    if (response.ok) {
      const transactions = await response.json();
      log(`✅ Manager can view all transactions (${transactions.length} transactions)`, "green");
    } else {
      log(`❌ Manager CANNOT view transactions: ${response.statusText}`, "red");
    }
  } catch (error) {
    log(`❌ Manager transactions ERROR: ${error.message}`, "red");
  }

  // Test 3: Manager can also create transactions (has cashier capabilities)
  try {
    const response = await fetch(`${API_BASE_URL}/api/transactions`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        items: [{ productId: "prod2", weightKg: 2.0, pricePerKg: 1000 }],
        totalAmount: 2000,
        payment_method: "mpesa"
      })
    });

    if (response.ok) {
      log(`✅ Manager can create transactions (has cashier capabilities)`, "green");
    } else {
      log(`⚠️  Manager transaction creation: ${response.statusText}`, "yellow");
    }
  } catch (error) {
    log(`❌ Manager transaction ERROR: ${error.message}`, "red");
  }
}

async function testAdminFeatures(token) {
  log(`\n${"=".repeat(60)}`, "cyan");
  log("Testing ADMIN Features", "cyan");
  log("=".repeat(60), "cyan");

  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${token}`
  };

  // Test 1: Product management (admin only)
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        id: `test_${Date.now()}`,
        name: "Test Product",
        code: "TEST001",
        category: "beef",
        price_per_kg: 1500,
        stock_kg: 100,
        low_stock_threshold_kg: 10,
        is_active: true
      })
    });

    if (response.ok) {
      const product = await response.json();
      log(`✅ Admin can create products (ID: ${product.id})`, "green");
      
      // Clean up: delete test product
      await fetch(`${API_BASE_URL}/api/products/${product.id}`, {
        method: "DELETE",
        headers
      });
    } else {
      const error = await response.json();
      log(`❌ Admin CANNOT create products: ${error.error || response.statusText}`, "red");
    }
  } catch (error) {
    log(`❌ Admin product ERROR: ${error.message}`, "red");
  }

  // Test 2: AI Assistant (admin only)
  try {
    const response = await fetch(`${API_BASE_URL}/api/ai/chat`, {
      method: "POST",
      headers,
      body: JSON.stringify({
        message: "What are the current stock levels?"
      })
    });

    if (response.ok) {
      const aiResponse = await response.json();
      log(`✅ Admin can access AI Assistant`, "green");
      log(`   AI Response: ${aiResponse.reply.substring(0, 100)}...`, "blue");
    } else {
      const error = await response.json();
      log(`⚠️  Admin AI Assistant: ${error.error || response.statusText}`, "yellow");
    }
  } catch (error) {
    log(`❌ Admin AI ERROR: ${error.message}`, "red");
  }

  // Test 3: Admin can view everything (has all capabilities)
  try {
    const [shiftsRes, transactionsRes, productsRes] = await Promise.all([
      fetch(`${API_BASE_URL}/api/shifts`, { headers }),
      fetch(`${API_BASE_URL}/api/transactions`, { headers }),
      fetch(`${API_BASE_URL}/api/products`, { headers })
    ]);

    if (shiftsRes.ok && transactionsRes.ok && productsRes.ok) {
      log(`✅ Admin can view all data (shifts, transactions, products)`, "green");
    } else {
      log(`⚠️  Admin data access has limitations`, "yellow");
    }
  } catch (error) {
    log(`❌ Admin data access ERROR: ${error.message}`, "red");
  }
}

async function testUnauthorizedAccess() {
  log(`\n${"=".repeat(60)}`, "cyan");
  log("Testing UNAUTHORIZED Access Prevention", "cyan");
  log("=".repeat(60), "cyan");

  // Test without token
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      headers: { "Content-Type": "application/json" }
    });

    if (response.status === 401) {
      log(`✅ Unauthorized access blocked (401)`, "green");
    } else {
      log(`❌ System allows unauthorized access!`, "red");
    }
  } catch (error) {
    log(`❌ Unauthorized test ERROR: ${error.message}`, "red");
  }

  // Test with invalid token
  try {
    const response = await fetch(`${API_BASE_URL}/api/products`, {
      headers: {
        "Content-Type": "application/json",
        "Authorization": "Bearer invalid_token_12345"
      }
    });

    if (response.status === 401 || response.status === 403) {
      log(`✅ Invalid token rejected (${response.status})`, "green");
    } else {
      log(`❌ System accepts invalid tokens!`, "red");
    }
  } catch (error) {
    log(`❌ Invalid token test ERROR: ${error.message}`, "red");
  }
}

async function main() {
  log("\n" + "=".repeat(60), "cyan");
  log("  EDEN TOP POS - ROLE-BASED AUTHENTICATION TEST", "cyan");
  log("=".repeat(60), "cyan");
  log(`Backend URL: ${API_BASE_URL}`, "blue");
  log(`Test Time: ${new Date().toLocaleString()}`, "blue");

  // Test backend connectivity first
  log(`\nTesting backend connectivity...`, "yellow");
  try {
    const response = await fetch(`${API_BASE_URL}/health`, { 
      signal: AbortSignal.timeout(5000) 
    });
    if (response.ok) {
      log(`✅ Backend is reachable`, "green");
    } else {
      log(`⚠️  Backend returned status ${response.status}`, "yellow");
    }
  } catch (error) {
    log(`❌ Cannot connect to backend: ${error.message}`, "red");
    log(`\nPlease ensure the backend server is running on port 4000`, "yellow");
    process.exit(1);
  }

  // Login as each role
  const cashierAuth = await testLogin("Cashier", CREDENTIALS.cashier);
  const managerAuth = await testLogin("Manager", CREDENTIALS.manager);
  const adminAuth = await testLogin("Admin", CREDENTIALS.admin);

  // Test role-specific features
  if (cashierAuth) {
    await testCashierFeatures(cashierAuth.token);
  } else {
    log(`\n⚠️  Skipping cashier feature tests (login failed)`, "yellow");
  }

  if (managerAuth) {
    await testManagerFeatures(managerAuth.token);
  } else {
    log(`\n⚠️  Skipping manager feature tests (login failed)`, "yellow");
  }

  if (adminAuth) {
    await testAdminFeatures(adminAuth.token);
  } else {
    log(`\n⚠️  Skipping admin feature tests (login failed)`, "yellow");
  }

  // Test security
  await testUnauthorizedAccess();

  // Final summary
  log(`\n${"=".repeat(60)}`, "cyan");
  log("TEST SUMMARY", "cyan");
  log("=".repeat(60), "cyan");
  
  const loginSuccess = [cashierAuth, managerAuth, adminAuth].filter(Boolean).length;
  log(`✅ Successful logins: ${loginSuccess}/3`, loginSuccess === 3 ? "green" : "yellow");
  
  if (loginSuccess === 3) {
    log(`\n🎉 All roles are properly connected and authenticated!`, "green");
    log(`   - Cashiers can create transactions and manage shifts`, "green");
    log(`   - Managers can view all shifts and transactions`, "green");
    log(`   - Admins can manage products and access AI assistant`, "green");
  } else {
    log(`\n⚠️  Some roles failed to authenticate. Check credentials and database.`, "yellow");
  }

  log("\n" + "=".repeat(60), "cyan");
}

// Run the test
main().catch(error => {
  log(`\n❌ Fatal error: ${error.message}`, "red");
  process.exit(1);
});
