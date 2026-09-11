-- =========================================================
-- CARBON BRIDGE - Supabase PostgreSQL Schema
-- =========================================================

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ENUM TYPES
DO $$ BEGIN
  CREATE TYPE company_type_enum AS ENUM ('EMITTER', 'CO2_BUYER', 'LOGISTICS_PROVIDER', 'REGULATOR', 'ADMIN');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE supply_status_enum AS ENUM ('ACTIVE', 'INACTIVE', 'SOLD_OUT', 'PENDING_VERIFICATION');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE demand_status_enum AS ENUM ('OPEN', 'MATCHED', 'FULFILLED', 'CANCELLED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE bid_type_enum AS ENUM ('BUY_NOW', 'REQUEST_QUOTE', 'BID', 'NEGOTIATE', 'LONG_TERM_CONTRACT');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE bid_status_enum AS ENUM ('PENDING', 'ACCEPTED', 'REJECTED', 'WITHDRAWN', 'COUNTER_OFFER');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE contract_status_enum AS ENUM ('DRAFT', 'ACTIVE', 'COMPLETED', 'TERMINATED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

DO $$ BEGIN
  CREATE TYPE shipment_status_enum AS ENUM ('MATCHED', 'BOOKED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'VERIFIED');
EXCEPTION
  WHEN duplicate_object THEN null;
END $$;

-- 1. COMPANIES TABLE
CREATE TABLE IF NOT EXISTS public.companies (
  company_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id UUID UNIQUE,
  name VARCHAR(255) NOT NULL,
  industry VARCHAR(100) NOT NULL,
  company_type company_type_enum NOT NULL,
  location VARCHAR(255) NOT NULL,
  verification_status BOOLEAN DEFAULT false,
  sustainability_score NUMERIC(5, 2) DEFAULT 80.00,
  contact_details JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 2. REPUTATION SCORES
CREATE TABLE IF NOT EXISTS public.reputation_scores (
  company_id UUID PRIMARY KEY REFERENCES public.companies(company_id) ON DELETE CASCADE,
  reliability NUMERIC(5, 2) DEFAULT 95.00,
  quality NUMERIC(5, 2) DEFAULT 95.00,
  delivery NUMERIC(5, 2) DEFAULT 92.00,
  documentation NUMERIC(5, 2) DEFAULT 98.00,
  overall_score NUMERIC(5, 2) DEFAULT 95.00,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 3. CO2 SUPPLIES (EMITTER INVENTORY)
CREATE TABLE IF NOT EXISTS public.co2_supplies (
  supply_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  emitter_id UUID NOT NULL REFERENCES public.companies(company_id) ON DELETE CASCADE,
  available_quantity NUMERIC(12, 2) NOT NULL,
  quantity_unit VARCHAR(50) DEFAULT 'tons',
  purity_percentage NUMERIC(5, 2) NOT NULL,
  physical_state VARCHAR(50) NOT NULL, -- Gas, Liquid, Solid, Supercritical
  temperature NUMERIC(8, 2),
  pressure NUMERIC(8, 2),
  capture_method VARCHAR(100) NOT NULL,
  source_industry VARCHAR(100) NOT NULL,
  location VARCHAR(255) NOT NULL,
  availability_start DATE NOT NULL,
  availability_end DATE NOT NULL,
  minimum_order NUMERIC(12, 2) DEFAULT 10.00,
  asking_price NUMERIC(12, 2) NOT NULL, -- in INR per unit
  certification JSONB DEFAULT '{}'::jsonb,
  status supply_status_enum DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 4. DEMAND REQUESTS (BUYER DEMANDS)
CREATE TABLE IF NOT EXISTS public.demand_requests (
  request_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  buyer_id UUID NOT NULL REFERENCES public.companies(company_id) ON DELETE CASCADE,
  required_quantity NUMERIC(12, 2) NOT NULL,
  required_purity NUMERIC(5, 2) NOT NULL,
  application VARCHAR(100) NOT NULL,
  max_price NUMERIC(12, 2) NOT NULL,
  required_location VARCHAR(255) NOT NULL,
  delivery_deadline DATE NOT NULL,
  status demand_status_enum DEFAULT 'OPEN',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 5. MATCHES (INTELLIGENT MATCHING RESULTS)
CREATE TABLE IF NOT EXISTS public.matches (
  match_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supply_id UUID NOT NULL REFERENCES public.co2_supplies(supply_id) ON DELETE CASCADE,
  demand_id UUID NOT NULL REFERENCES public.demand_requests(request_id) ON DELETE CASCADE,
  match_score NUMERIC(5, 2) NOT NULL,
  score_breakdown JSONB DEFAULT '{}'::jsonb,
  status VARCHAR(50) DEFAULT 'SUGGESTED', -- SUGGESTED, REVIEWED, ACCEPTED, DECLINED
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 6. BIDS & NEGOTIATIONS
CREATE TABLE IF NOT EXISTS public.bids (
  bid_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  match_id UUID REFERENCES public.matches(match_id) ON DELETE SET NULL,
  supply_id UUID REFERENCES public.co2_supplies(supply_id) ON DELETE CASCADE,
  demand_id UUID REFERENCES public.demand_requests(request_id) ON DELETE CASCADE,
  bidder_id UUID NOT NULL REFERENCES public.companies(company_id) ON DELETE CASCADE,
  amount NUMERIC(12, 2) NOT NULL, -- price per unit
  quantity NUMERIC(12, 2) NOT NULL,
  bid_type bid_type_enum DEFAULT 'BID',
  status bid_status_enum DEFAULT 'PENDING',
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 7. CONTRACTS (SPOT & LONG TERM)
CREATE TABLE IF NOT EXISTS public.contracts (
  contract_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  supply_id UUID NOT NULL REFERENCES public.co2_supplies(supply_id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
  seller_id UUID NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
  quantity NUMERIC(12, 2) NOT NULL,
  unit_price NUMERIC(12, 2) NOT NULL,
  total_value NUMERIC(14, 2) NOT NULL,
  contract_type VARCHAR(50) DEFAULT 'SPOT', -- SPOT, LONG_TERM
  start_date DATE NOT NULL,
  end_date DATE NOT NULL,
  terms JSONB DEFAULT '{}'::jsonb,
  status contract_status_enum DEFAULT 'ACTIVE',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 8. SHIPMENTS & LOGISTICS
CREATE TABLE IF NOT EXISTS public.shipments (
  shipment_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  contract_id UUID REFERENCES public.contracts(contract_id) ON DELETE SET NULL,
  supplier_id UUID NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
  buyer_id UUID NOT NULL REFERENCES public.companies(company_id) ON DELETE RESTRICT,
  logistics_provider_id UUID REFERENCES public.companies(company_id) ON DELETE SET NULL,
  quantity NUMERIC(12, 2) NOT NULL,
  pickup_location VARCHAR(255) NOT NULL,
  destination VARCHAR(255) NOT NULL,
  route JSONB DEFAULT '{}'::jsonb,
  estimated_distance_km NUMERIC(10, 2) DEFAULT 0,
  transportation_cost NUMERIC(12, 2) DEFAULT 0,
  estimated_delivery TIMESTAMPTZ,
  actual_delivery TIMESTAMPTZ,
  status shipment_status_enum DEFAULT 'MATCHED',
  tracking_updates JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 9. LOGISTICS BIDS
CREATE TABLE IF NOT EXISTS public.logistics_bids (
  bid_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  shipment_id UUID NOT NULL REFERENCES public.shipments(shipment_id) ON DELETE CASCADE,
  logistics_provider_id UUID NOT NULL REFERENCES public.companies(company_id) ON DELETE CASCADE,
  bid_amount NUMERIC(12, 2) NOT NULL,
  vehicle_type VARCHAR(100) NOT NULL,
  estimated_transit_hours NUMERIC(6, 2),
  status VARCHAR(50) DEFAULT 'PENDING',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 10. CERTIFICATES & VERIFICATION
CREATE TABLE IF NOT EXISTS public.certificates (
  certificate_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  company_id UUID NOT NULL REFERENCES public.companies(company_id) ON DELETE CASCADE,
  supply_id UUID REFERENCES public.co2_supplies(supply_id) ON DELETE SET NULL,
  certificate_type VARCHAR(100) NOT NULL, -- PURITY_TEST, EMISSION_AUDIT, ISO_14064, LAB_REPORT
  certificate_number VARCHAR(100) UNIQUE,
  document_url TEXT,
  purity_certified NUMERIC(5, 2),
  verified_by VARCHAR(255),
  issued_at TIMESTAMPTZ DEFAULT NOW(),
  expires_at TIMESTAMPTZ,
  verification_status BOOLEAN DEFAULT true,
  metadata JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- 11. AUDIT LOGS (FOR REGULATOR AND TRACEABILITY)
CREATE TABLE IF NOT EXISTS public.audit_logs (
  log_id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  entity_type VARCHAR(50) NOT NULL,
  entity_id UUID NOT NULL,
  action VARCHAR(50) NOT NULL,
  actor_id UUID,
  payload JSONB DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- SEED INITIAL MOCK DATA
INSERT INTO public.companies (company_id, name, industry, company_type, location, verification_status, sustainability_score, contact_details)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'ABC Cement Works', 'Cement', 'EMITTER', 'Mumbai, Maharashtra', true, 92.5, '{"email":"sales@abccement.com","phone":"+91-9876543210"}'),
  ('22222222-2222-2222-2222-222222222222', 'Tata Steel Jamshedpur', 'Steel', 'EMITTER', 'Jamshedpur, Jharkhand', true, 94.0, '{"email":"carbon@tatasteel.com"}'),
  ('33333333-3333-3333-3333-333333333333', 'CleanFuel Synthesis Ltd', 'Synthetic Fuels', 'CO2_BUYER', 'Pune, Maharashtra', true, 89.0, '{"email":"procurement@cleanfuel.in"}'),
  ('44444444-4444-4444-4444-444444444444', 'GreenGrow AgriTech', 'Greenhouse Agriculture', 'CO2_BUYER', 'Nashik, Maharashtra', true, 95.0, '{"email":"supply@greengrow.org"}'),
  ('55555555-5555-5555-5555-555555555555', 'CryoTrans Logistics', 'Cryogenic Freight', 'LOGISTICS_PROVIDER', 'Navi Mumbai, Maharashtra', true, 96.0, '{"email":"dispatch@cryotrans.in"}'),
  ('66666666-6666-6666-6666-666666666666', 'National Carbon Authority', 'Regulatory Body', 'REGULATOR', 'New Delhi, Delhi', true, 100.0, '{"email":"oversight@carbonreg.gov.in"}')
ON CONFLICT (company_id) DO NOTHING;

INSERT INTO public.reputation_scores (company_id, reliability, quality, delivery, documentation, overall_score)
VALUES
  ('11111111-1111-1111-1111-111111111111', 96.0, 98.0, 94.0, 100.0, 96.0),
  ('22222222-2222-2222-2222-222222222222', 95.0, 96.0, 93.0, 97.0, 95.0),
  ('33333333-3333-3333-3333-333333333333', 92.0, 94.0, 95.0, 98.0, 94.0),
  ('55555555-5555-5555-5555-555555555555', 98.0, 97.0, 99.0, 96.0, 98.0)
ON CONFLICT (company_id) DO NOTHING;

INSERT INTO public.co2_supplies (supply_id, emitter_id, available_quantity, quantity_unit, purity_percentage, physical_state, temperature, pressure, capture_method, source_industry, location, availability_start, availability_end, minimum_order, asking_price, certification, status)
VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', '11111111-1111-1111-1111-111111111111', 4500, 'tons', 98.5, 'Liquid', -20.0, 20.0, 'Post-combustion amine scrubbing', 'Cement', 'Mumbai, Maharashtra', CURRENT_DATE, CURRENT_DATE + INTERVAL '180 days', 50, 4200, '{"standard":"ISO 14064","lab":"Vimta Labs"}', 'ACTIVE'),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', '22222222-2222-2222-2222-222222222222', 3200, 'tons', 96.2, 'Gas', 25.0, 15.0, 'Pre-combustion gasification', 'Steel', 'Jamshedpur, Jharkhand', CURRENT_DATE, CURRENT_DATE + INTERVAL '90 days', 100, 3800, '{"standard":"Bureau Veritas"}', 'ACTIVE')
ON CONFLICT (supply_id) DO NOTHING;

INSERT INTO public.demand_requests (request_id, buyer_id, required_quantity, required_purity, application, max_price, required_location, delivery_deadline, status)
VALUES
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', '33333333-3333-3333-3333-333333333333', 200, 97.0, 'Fuel synthesis', 4500, 'Pune, Maharashtra', CURRENT_DATE + INTERVAL '30 days', 'OPEN'),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', '44444444-4444-4444-4444-444444444444', 150, 95.0, 'Greenhouse agriculture', 4000, 'Nashik, Maharashtra', CURRENT_DATE + INTERVAL '45 days', 'OPEN')
ON CONFLICT (request_id) DO NOTHING;

INSERT INTO public.shipments (shipment_id, supplier_id, buyer_id, logistics_provider_id, quantity, pickup_location, destination, route, estimated_distance_km, transportation_cost, estimated_delivery, status)
VALUES
  ('eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', '11111111-1111-1111-1111-111111111111', '33333333-3333-3333-3333-333333333333', '55555555-5555-5555-5555-555555555555', 200, 'Mumbai, Maharashtra', 'Pune, Maharashtra', '{"waypoints":["Panvel","Khopoli","Lonavala"]}', 150.0, 38000, NOW() + INTERVAL '2 days', 'IN_TRANSIT')
ON CONFLICT (shipment_id) DO NOTHING;
