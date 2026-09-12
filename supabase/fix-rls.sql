-- =============================================
-- FIX: Disable RLS or add permissive policies
-- Run this in your Supabase SQL Editor
-- =============================================

-- Option 1: Disable RLS on tables that are blocking reads/writes
-- (This is fine for a hackathon project)
ALTER TABLE public.messages DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.companies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.bids DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.co2_supplies DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.demand_requests DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.contracts DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.shipments DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.certificates DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.notifications DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.reputation_scores DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.audit_logs DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.matches DISABLE ROW LEVEL SECURITY;
ALTER TABLE public.logistics_bids DISABLE ROW LEVEL SECURITY;
