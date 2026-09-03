-- ============================================================
-- SECURITY FIX: Enable Row Level Security (RLS)
-- ============================================================
-- Resolves Supabase critical warning: "Table publicly accessible"
--
-- WHY THIS IS SAFE FOR THE APP:
--   * All data mutations (catalog, orders, admin) go through
--     server API routes using the SERVICE-ROLE key, which
--     BYPASSES RLS — so they keep working unchanged.
--   * The browser (anon key) only reads the current user's own
--     "users" profile row via session-provider.tsx.
--   * By default RLS denies everything to the public anon key,
--     which is exactly what we want.
--
-- HOW TO RUN:
--   Supabase Dashboard -> SQL Editor -> paste -> Run
-- ============================================================

-- 1. Enable RLS on every table
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE notifications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_product_overrides ENABLE ROW LEVEL SECURITY;
ALTER TABLE password_reset_tokens ENABLE ROW LEVEL SECURITY;

-- 2. Block the public "anon" key from ALL tables by default.
--    (With RLS on and no policies, anon can read/write nothing.
--     This is the critical protection against data exposure.)

-- 3. Allow an authenticated user to SELECT only their own profile row.
CREATE POLICY "users_select_own" ON users
  FOR SELECT TO authenticated
  USING ((select auth.uid()) = id);

-- 4. Allow an authenticated user to UPDATE only their own row.
--    (Used if profile editing from the browser is ever needed.)
CREATE POLICY "users_update_own" ON users
  FOR UPDATE TO authenticated
  USING ((select auth.uid()) = id)
  WITH CHECK ((select auth.uid()) = id);
