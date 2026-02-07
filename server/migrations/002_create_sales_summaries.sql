-- Create sales summary tables for analytics growth timeline

CREATE TABLE IF NOT EXISTS public.sales_daily (
  date DATE PRIMARY KEY,
  total_sales NUMERIC(12, 2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  avg_basket_value NUMERIC(12, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales_weekly (
  week_start DATE PRIMARY KEY,
  total_sales NUMERIC(12, 2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  avg_basket_value NUMERIC(12, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS public.sales_monthly (
  month_start DATE PRIMARY KEY,
  total_sales NUMERIC(12, 2) DEFAULT 0,
  transaction_count INTEGER DEFAULT 0,
  avg_basket_value NUMERIC(12, 2) DEFAULT 0,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_sales_daily_date ON public.sales_daily(date);
CREATE INDEX IF NOT EXISTS idx_sales_weekly_week_start ON public.sales_weekly(week_start);
CREATE INDEX IF NOT EXISTS idx_sales_monthly_month_start ON public.sales_monthly(month_start);
