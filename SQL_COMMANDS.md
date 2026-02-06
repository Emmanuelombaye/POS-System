# SQL Commands - Copy and Paste Ready

## 🚀 Fastest Way to Setup Database

### Step 1: Copy This Entire Section
Select and copy everything from `BEGIN` to `END` below.

---

### BEGIN - COPY FROM HERE

```sql
-- EDEN DROP 001 POS - Quick Setup
-- Paste this entire block into Supabase SQL Editor and click RUN

-- CREATE USERS TABLE
CREATE TABLE IF NOT EXISTS public.users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'manager', 'cashier')),
  email TEXT,
  phone TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INSERT ADMIN USER
INSERT INTO public.users (id, name, role, email, phone) 
VALUES ('a1', 'Admin Eden', 'admin', 'admin@edendrop001.com', '+254700000001')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role;

-- INSERT MANAGER USER
INSERT INTO public.users (id, name, role, email, phone) 
VALUES ('m1', 'Manager John', 'manager', 'manager@edendrop001.com', '+254700000002')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role;

-- INSERT CASHIER USERS
INSERT INTO public.users (id, name, role, email, phone) 
VALUES ('c1', 'Cashier David', 'cashier', 'cashier1@edendrop001.com', '+254700000003')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role;

INSERT INTO public.users (id, name, role, email, phone) 
VALUES ('c2', 'Cashier Mary', 'cashier', 'cashier2@edendrop001.com', '+254700000004')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role;

INSERT INTO public.users (id, name, role, email, phone) 
VALUES ('c3', 'Cashier Peter', 'cashier', 'cashier3@edendrop001.com', '+254700000005')
ON CONFLICT (id) DO UPDATE SET name=EXCLUDED.name, role=EXCLUDED.role;

-- CREATE PRODUCTS TABLE
CREATE TABLE IF NOT EXISTS public.products (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  name TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('beef', 'goat', 'offal', 'processed')),
  price DECIMAL(10, 2) NOT NULL,
  stock_kg DECIMAL(10, 2) DEFAULT 0,
  branch_id TEXT DEFAULT 'branch1',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- INSERT SAMPLE PRODUCTS
DELETE FROM public.products;

INSERT INTO public.products (name, category, price, stock_kg, branch_id) VALUES
  ('Beef Prime Cuts', 'beef', 1250.00, 50.0, 'branch1'),
  ('Goat Meat Mixed', 'goat', 950.00, 30.0, 'branch1'),
  ('Beef Liver', 'offal', 450.00, 20.0, 'branch1'),
  ('Minced Beef', 'processed', 750.00, 40.0, 'branch1');

-- CREATE TRANSACTIONS TABLE
CREATE TABLE IF NOT EXISTS public.transactions (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES public.users(id),
  product_id TEXT REFERENCES public.products(id),
  quantity_kg DECIMAL(10, 2) NOT NULL,
  total_amount DECIMAL(12, 2) NOT NULL,
  payment_method TEXT CHECK (payment_method IN ('cash', 'm-pesa', 'card')),
  branch_id TEXT,
  transaction_date TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- CREATE AUDIT LOG TABLE
CREATE TABLE IF NOT EXISTS public.audit_log (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  user_id TEXT REFERENCES public.users(id),
  action TEXT NOT NULL,
  description TEXT,
  timestamp TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- VERIFY DATA WAS INSERTED
SELECT 'Users' as table_name, COUNT(*) as count FROM public.users
UNION ALL
SELECT 'Products' as table_name, COUNT(*) as count FROM public.products;
```

### END - COPY UP TO HERE

---

## 📋 Instructions

1. **Go to Supabase Dashboard**
   - URL: https://app.supabase.com

2. **Select Your Project**
   - Project: eden-top

3. **Open SQL Editor**
   - Left sidebar → SQL Editor
   - Click "+ New Query"

4. **Paste the SQL**
   - Select all text between BEGIN and END above
   - Copy it (Ctrl+C)
   - Paste into Supabase SQL Editor (Ctrl+V)

5. **Run the Script**
   - Click the blue "RUN" button
   - Wait for success message

6. **Verify Success**
   - Check console shows: "5 rows affected"
   - Result should show 5 users and 4 products

---

## ✅ After Running SQL

You should see in the results panel:
```
table_name | count
-----------|------
Users      | 5
Products   | 4
```

This means all users and products were created successfully!

---

## 🔑 Login Credentials (Now Ready to Use)

```
User ID: a1  | Password: @AdminEdenDrop001 | Role: Admin
User ID: m1  | Password: @AdminEdenDrop001 | Role: Manager
User ID: c1  | Password: @AdminEdenDrop001 | Role: Cashier
User ID: c2  | Password: @AdminEdenDrop001 | Role: Cashier
User ID: c3  | Password: @AdminEdenDrop001 | Role: Cashier
```

---

## 🎯 Next: Try Logging In

1. Go to: http://localhost:5175
2. Fill in:
   - Role: Admin
   - User ID: a1
   - Password: @AdminEdenDrop001
3. Click "Sign In"
4. You should see the Admin Dashboard!

---

## 🆘 Troubleshooting

**Error: "syntax error at end of input"**
→ Make sure you copied the ENTIRE SQL block, including the final SELECT statement

**Error: "relation 'public.users' already exists"**
→ This is OK, it means the table already existed. Run it anyway.

**No results shown after running**
→ Check that all the SQL statements executed without errors
→ Look at the "Logs" tab if available

**Still can't login?**
→ Run this in a new query to verify users exist:
```sql
SELECT id, name, role FROM public.users ORDER BY id;
```
Should show 5 users.

---

**Everything done? Go to http://localhost:5175 to login! 🎉**
