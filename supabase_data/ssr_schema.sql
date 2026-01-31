-- SSR Schema Extension

-- 1. Shifts table
CREATE TABLE IF NOT EXISTS shifts (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  cashier_id TEXT NOT NULL REFERENCES users(id),
  opened_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  closed_at TIMESTAMP WITH TIME ZONE,
  status TEXT NOT NULL DEFAULT 'OPEN' CHECK (status IN ('OPEN', 'PENDING_REVIEW', 'APPROVED')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Stock Additions table (Pending deliveries)
CREATE TABLE IF NOT EXISTS stock_additions (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID REFERENCES shifts(id),
  item_id TEXT REFERENCES products(id),
  quantity_kg DECIMAL(10, 2) NOT NULL,
  supplier TEXT,
  notes TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED')),
  created_by TEXT REFERENCES users(id),
  approved_by TEXT REFERENCES users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Inventory Ledger (Append-only record of all changes)
CREATE TABLE IF NOT EXISTS inventory_ledger (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  item_id TEXT REFERENCES products(id),
  event_type TEXT NOT NULL CHECK (event_type IN ('OPENING_SNAPSHOT', 'SALE', 'STOCK_ADDED', 'WASTAGE', 'SHIFT_CLOSE', 'MANUAL_ADJUST')),
  quantity_kg DECIMAL(10, 2) NOT NULL,
  shift_id UUID REFERENCES shifts(id),
  user_id TEXT REFERENCES users(id),
  reference_id TEXT, -- ID of transaction or stock_addition
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Shift Stock Snapshots (Summary for reconciliation)
CREATE TABLE IF NOT EXISTS shift_stock_snapshots (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shift_id UUID REFERENCES shifts(id),
  item_id TEXT REFERENCES products(id),
  opening_kg DECIMAL(10, 2) NOT NULL,
  expected_closing_kg DECIMAL(10, 2),
  actual_closing_kg DECIMAL(10, 2),
  variance_kg DECIMAL(10, 2),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(shift_id, item_id)
);

-- Enable Realtime for new tables
ALTER PUBLICATION supabase_realtime ADD TABLE shifts;
ALTER PUBLICATION supabase_realtime ADD TABLE stock_additions;
ALTER PUBLICATION supabase_realtime ADD TABLE inventory_ledger;
ALTER PUBLICATION supabase_realtime ADD TABLE shift_stock_snapshots;
