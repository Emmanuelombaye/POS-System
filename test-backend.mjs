// Test script to verify backend and database connection
const testBackend = async () => {
  try {
    console.log("Testing backend health...");
    const healthRes = await fetch("http://localhost:4000/health");
    const health = await healthRes.json();
    console.log("✅ Health check:", health);

    console.log("\nTesting users endpoint...");
    const usersRes = await fetch("http://localhost:4000/debug/users");
    const users = await usersRes.json();
    console.log("Users in database:", users);

    if (users.totalUsers === 0) {
      console.log("\n⚠️  No users found. You need to:");
      console.log("1. Open https://app.supabase.com");
      console.log("2. Go to SQL Editor");
      console.log("3. Paste content from SETUP_DATABASE.sql");
      console.log("4. Click Run");
    } else {
      console.log(`\n✅ Found ${users.totalUsers} users in database`);
      console.log("You can now login!");
    }

    console.log("\nTesting login with a1/admin...");
    const loginRes = await fetch("http://localhost:4000/api/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: "a1", password: "@AdminEdenDrop001" })
    });
    const loginData = await loginRes.json();
    if (loginRes.ok) {
      console.log("✅ Login successful!");
      console.log("Token:", loginData.token?.substring(0, 20) + "...");
    } else {
      console.log("❌ Login failed:", loginData.error);
    }
  } catch (error) {
    console.error("Error:", error);
  }
};

testBackend();
