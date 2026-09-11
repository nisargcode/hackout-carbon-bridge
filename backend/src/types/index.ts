export type CompanyType = 'EMITTER' | 'CO2_BUYER' | 'LOGISTICS_PROVIDER' | 'REGULATOR' | 'ADMIN';
export type ShipmentStatus = 'MATCHED' | 'BOOKED' | 'PICKED_UP' | 'IN_TRANSIT' | 'DELIVERED' | 'VERIFIED';
export type BidType = 'BUY_NOW' | 'REQUEST_QUOTE' | 'BID' | 'NEGOTIATE' | 'LONG_TERM_CONTRACT';
export type BidStatus = 'PENDING' | 'ACCEPTED' | 'REJECTED' | 'WITHDRAWN' | 'COUNTERED';

export interface Company {
  company_id: string;
  user_id?: string;
  name: string;
  industry: string;
  company_type: CompanyType;
  location: string;
  verification_status: boolean;
  sustainability_score: number;
  contact_details?: Record<string, unknown>;
  created_at?: string;
}

export interface CO2Supply {
  supply_id: string;
  emitter_id: string;
  available_quantity: number;
  quantity_unit: string;
  purity_percentage: number;
  physical_state: string;
  temperature?: number;
  pressure?: number;
  capture_method: string;
  source_industry: string;
  location: string;
  availability_start: string;
  availability_end: string;
  minimum_order: number;
  asking_price: number;
  certification?: Record<string, unknown>;
  status: string;
  created_at?: string;
}

export interface DemandRequest {
  request_id: string;
  buyer_id: string;
  required_quantity: number;
  required_purity: number;
  application: string;
  max_price: number;
  required_location: string;
  delivery_deadline: string;
  status: string;
  created_at?: string;
}

export interface Shipment {
  shipment_id: string;
  contract_id?: string;
  supplier_id: string;
  buyer_id: string;
  logistics_provider_id?: string | null;
  quantity: number;
  pickup_location: string;
  destination: string;
  route?: Record<string, unknown>;
  estimated_distance_km?: number;
  transportation_cost?: number;
  estimated_delivery?: string;
  status: ShipmentStatus;
  created_at?: string;
}

export interface Bid {
  bid_id: string;
  match_id?: string;
  supply_id?: string;
  demand_id?: string;
  bidder_id: string;
  amount: number;
  quantity: number;
  bid_type: BidType;
  status: BidStatus;
  notes?: string;
  created_at?: string;
}

export interface Contract {
  contract_id: string;
  supply_id: string;
  buyer_id: string;
  seller_id: string;
  quantity: number;
  unit_price: number;
  total_value: number;
  contract_type: string;
  start_date: string;
  end_date: string;
  status: string;
  created_at?: string;
}
