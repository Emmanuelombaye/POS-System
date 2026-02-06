const API = "http://localhost:4000";

const pretty = (label, value) => {
  console.log(`\n=== ${label} ===`);
  console.log(typeof value === "string" ? value : JSON.stringify(value, null, 2));
};

const request = async (path, options = {}) => {
  const res = await fetch(`${API}${path}`, {
    headers: { "Content-Type": "application/json", ...(options.headers || {}) },
    ...options,
  });
  const text = await res.text();
  let json;
  try { json = JSON.parse(text); } catch { json = text; }
  if (!res.ok) {
    const err = typeof json === "string" ? json : JSON.stringify(json);
    throw new Error(`${res.status} ${res.statusText}: ${err}`);
  }
  return json;
};

const run = async () => {
  // Health
  const health = await request("/health");
  pretty("Health", health);

  // Users
  const users = await request("/debug/users");
  pretty("Users", users);

  const cashier = (users.users || []).find((u) => u.role === "cashier") || users.users?.[0];
  const admin = (users.users || []).find((u) => u.role === "admin") || users.users?.[0];
  if (!cashier || !admin) {
    throw new Error("No cashier/admin users found in database.");
  }

  // Login as cashier
  const cashierLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ userId: cashier.id, password: "@AdminEdenDrop001" }),
  });
  pretty("Cashier login", { id: cashier.id, name: cashier.name, token: cashierLogin.token?.slice(0, 16) + "..." });

  // Login as admin
  const adminLogin = await request("/api/auth/login", {
    method: "POST",
    body: JSON.stringify({ userId: admin.id, password: "@AdminEdenDrop001" }),
  });
  pretty("Admin login", { id: admin.id, name: admin.name, token: adminLogin.token?.slice(0, 16) + "..." });

  // Fetch products (admin)
  const products = await request("/products", {
    headers: { Authorization: `Bearer ${adminLogin.token}` },
  });
  pretty("Products", { count: products.length });

  const product = (products || []).find((p) => p.is_active !== false) || products[0];
  if (!product) throw new Error("No products found.");

  // Open shift (cashier)
  const shift = await request("/shifts/open", {
    method: "POST",
    headers: { Authorization: `Bearer ${cashierLogin.token}` },
    body: JSON.stringify({ cashier_id: cashier.id, branch_id: "branch1" }),
  });
  pretty("Open shift", shift);

  // Add stock (cashier)
  const addStock = await request("/shift/add-stock", {
    method: "POST",
    headers: { Authorization: `Bearer ${cashierLogin.token}` },
    body: JSON.stringify({
      shift_id: shift.id,
      product_id: product.id,
      quantity_kg: 1.5,
      supplier: "Test Supplier",
      notes: "Test addition",
      batch: "B-TEST",
    }),
  });
  pretty("Add stock", addStock);

  // Cash sale (cashier)
  const cashSale = await request("/transactions", {
    method: "POST",
    headers: { Authorization: `Bearer ${cashierLogin.token}` },
    body: JSON.stringify({
      id: `tx-${Date.now()}`,
      cashier_id: cashier.id,
      shift_id: shift.id,
      created_at: new Date().toISOString(),
      items: [{ productId: product.id, weightKg: 0.5, pricePerKg: product.price_per_kg || 100, totalPrice: 50 }],
      discount: null,
      subtotal: 50,
      total: 50,
      payment_method: "cash",
    }),
  });
  pretty("Cash sale", cashSale);

  // M-Pesa sale (cashier)
  const mpesaSale = await request("/transactions", {
    method: "POST",
    headers: { Authorization: `Bearer ${cashierLogin.token}` },
    body: JSON.stringify({
      id: `tx-${Date.now()}-m`,
      cashier_id: cashier.id,
      shift_id: shift.id,
      created_at: new Date().toISOString(),
      items: [{ productId: product.id, weightKg: 0.4, pricePerKg: product.price_per_kg || 100, totalPrice: 40 }],
      discount: null,
      subtotal: 40,
      total: 40,
      payment_method: "mpesa",
    }),
  });
  pretty("M-Pesa sale", mpesaSale);

  // Shift stock entries
  const shiftStock = await request(`/shift-stock?shift_id=${shift.id}`, {
    headers: { Authorization: `Bearer ${cashierLogin.token}` },
  });
  pretty("Shift stock", shiftStock);

  // Close shift (cashier)
  const closeShift = await request(`/shifts/${shift.id}/close`, {
    method: "POST",
    headers: { Authorization: `Bearer ${cashierLogin.token}` },
    body: JSON.stringify({ actual_counts: { [product.id]: 0 } }),
  });
  pretty("Close shift", closeShift);

  console.log("\n✅ Feature connectivity check completed.");
};

run().catch((err) => {
  console.error("\n❌ Feature connectivity check failed:", err.message);
  process.exit(1);
});
