# Supabase Database Setup

## Tables to Create in Supabase Dashboard

Create the following tables in your Supabase dashboard:

### 1. products table
```sql
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  code TEXT NOT NULL,
  category TEXT NOT NULL,
  price_per_kg DECIMAL(10, 2) NOT NULL,
  stock_kg DECIMAL(10, 2) NOT NULL,
  low_stock_threshold_kg DECIMAL(10, 2),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 2. users table
```sql
CREATE TABLE users (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  role TEXT NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW()
);
```

### 3. transactions table
```sql
CREATE TABLE transactions (
  id TEXT PRIMARY KEY,
  cashier_id TEXT NOT NULL REFERENCES users(id),
  created_at TIMESTAMP DEFAULT NOW(),
  items JSONB,
  discount JSONB,
  subtotal DECIMAL(10, 2),
  total DECIMAL(10, 2),
  payment_method TEXT
);
```

### 4. audit_log table
```sql
CREATE TABLE audit_log (
  id TEXT PRIMARY KEY,
  actor_id TEXT,
  actor_name TEXT,
  role TEXT,
  action TEXT,
  created_at TIMESTAMP DEFAULT NOW()
);
```

## Environment Variables

The backend uses the following environment variables:
- `SUPABASE_URL`: Your Supabase project URL
- `SUPABASE_KEY`: Your Supabase public key (publishable key)
- `PORT`: Server port (default: 4000)

These are already configured in `.env`

## Running the Backend

```bash
cd server
npm install
npm run dev
```

The backend will connect to Supabase and serve API endpoints at `http://localhost:4000`
