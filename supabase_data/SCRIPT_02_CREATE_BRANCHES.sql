-- SCRIPT_02_CREATE_BRANCHES.sql
-- Creates branches table with sample data

-- ============================================================================
-- CREATE BRANCHES TABLE
-- ============================================================================

CREATE TABLE IF NOT EXISTS public.branches (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  location TEXT,
  manager_id TEXT REFERENCES public.users(id) ON DELETE SET NULL,
  manager_name TEXT,
  phone TEXT,
  email TEXT,
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- ============================================================================
-- INSERT SAMPLE BRANCHES
-- ============================================================================

INSERT INTO public.branches (id, name, location, manager_name, phone, email, status) VALUES
('branch1', 'Main Branch', 'Nairobi CBD', 'John Mwangi', '+254722111111', 'main@edentop.co.ke', 'active'),
('branch2', 'Westlands Branch', 'Westlands', 'Jane Kipchoge', '+254722222222', 'westlands@edentop.co.ke', 'active'),
('branch3', 'Karen Branch', 'Karen', 'Peter Otieno', '+254722333333', 'karen@edentop.co.ke', 'active')
ON CONFLICT (id) DO UPDATE SET
  name = EXCLUDED.name,
  location = EXCLUDED.location,
  manager_name = EXCLUDED.manager_name,
  phone = EXCLUDED.phone,
  email = EXCLUDED.email,
  status = EXCLUDED.status;

-- ============================================================================
-- ADD RLS POLICIES (if needed)
-- ============================================================================

-- Allow reading branches (public)
ALTER TABLE public.branches ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read branches" ON public.branches
  FOR SELECT USING (true);

CREATE POLICY "Allow admin update branches" ON public.branches
  FOR UPDATE USING (auth.role() = 'admin');

-- ============================================================================
-- SUCCESS MESSAGE
-- ============================================================================
-- ✅ Branches table created with 3 sample branches
-- ✅ RLS policies enabled for security
-- ✅ Sales tab can now show branch names instead of IDs
