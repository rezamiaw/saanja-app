-- ====================================
-- CREATE WITHDRAWALS TABLE
-- ====================================
-- Run this SQL in Supabase SQL Editor to create withdrawals table

-- Drop table if exists (use only if you want to recreate)
-- DROP TABLE IF EXISTS withdrawals CASCADE;

CREATE TABLE IF NOT EXISTS public.withdrawals (
  id TEXT PRIMARY KEY,
  date DATE NOT NULL,
  amount NUMERIC NOT NULL,
  start_period DATE,
  end_period DATE,
  notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_withdrawals_date ON public.withdrawals(date DESC);
CREATE INDEX IF NOT EXISTS idx_withdrawals_created_at ON public.withdrawals(created_at DESC);

-- Enable RLS but allow all operations for now
ALTER TABLE public.withdrawals ENABLE ROW LEVEL SECURITY;

-- Create policies to allow all operations
DROP POLICY IF EXISTS "Allow all operations on withdrawals" ON public.withdrawals;
CREATE POLICY "Allow all operations on withdrawals" ON public.withdrawals
  FOR ALL
  USING (true)
  WITH CHECK (true);

-- ====================================
-- VERIFICATION QUERIES
-- ====================================

-- Check if table exists
SELECT table_name FROM information_schema.tables WHERE table_name = 'withdrawals';

-- Check table structure
SELECT column_name, data_type FROM information_schema.columns WHERE table_name = 'withdrawals';

-- Count rows (should be 0 initially)
SELECT COUNT(*) FROM withdrawals;

