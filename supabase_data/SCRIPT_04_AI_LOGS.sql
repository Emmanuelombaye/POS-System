-- ============================================================================
-- AI ASSISTANT AUDIT LOG TABLE
-- ============================================================================
-- Stores AI chat interactions for audit, analysis, and compliance

CREATE TABLE IF NOT EXISTS public.ai_logs (
  id TEXT PRIMARY KEY DEFAULT gen_random_uuid()::text,
  admin_id TEXT NOT NULL REFERENCES public.users(id) ON DELETE CASCADE,
  query TEXT NOT NULL,
  response TEXT NOT NULL,
  context_summary TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- Index for fast queries by admin
CREATE INDEX IF NOT EXISTS idx_ai_logs_admin_date
ON public.ai_logs(admin_id, created_at DESC);

-- Index for searching by date
CREATE INDEX IF NOT EXISTS idx_ai_logs_date
ON public.ai_logs(created_at DESC);

-- ============================================================================
-- COMMENTS
-- ============================================================================
COMMENT ON TABLE public.ai_logs IS 'Audit log for AI assistant interactions - stores all admin queries and AI responses for compliance and analysis';
COMMENT ON COLUMN public.ai_logs.admin_id IS 'Foreign key to users table - admin who made the query';
COMMENT ON COLUMN public.ai_logs.query IS 'The admin''s question or request to the AI assistant';
COMMENT ON COLUMN public.ai_logs.response IS 'The AI''s response to the query';
COMMENT ON COLUMN public.ai_logs.context_summary IS 'Summary of system context used to generate response (e.g., low-stock count, discrepancies)';
