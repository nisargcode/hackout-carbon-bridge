export type CompanyType = "EMITTER" | "CO2_BUYER" | "LOGISTICS_PROVIDER" | "REGULATOR" | "ADMIN";
export type ShipmentStatus = "MATCHED" | "BOOKED" | "PICKED_UP" | "IN_TRANSIT" | "DELIVERED" | "VERIFIED";
export type BidType = "BUY_NOW" | "REQUEST_QUOTE" | "BID" | "NEGOTIATE" | "LONG_TERM_CONTRACT";
export type SupplyStatus = "ACTIVE" | "INACTIVE" | "SOLD_OUT" | "PENDING_VERIFICATION";
export type DemandStatus = "OPEN" | "MATCHED" | "FULFILLED" | "CANCELLED";
export type ContractStatus = "DRAFT" | "ACTIVE" | "COMPLETED" | "TERMINATED";
export type BidStatus = "PENDING" | "ACCEPTED" | "REJECTED" | "WITHDRAWN";

export interface Company {
  company_id: string;
  user_id: string;
  name: string;
  industry: string;
  company_type: CompanyType;
  location: string;
  verification_status: boolean;
  sustainability_score: number;
  contact_details: Record<string, string>;
  created_at: string;
}

export interface CO2Supply {
  supply_id: string;
  emitter_id: string;
  available_quantity: number;
  quantity_unit: string;
  purity_percentage: number;
  physical_state: string;
  temperature: number;
  pressure: number;
  capture_method: string;
  source_industry: string;
  location: string;
  availability_start: string;
  availability_end: string;
  minimum_order: number;
  asking_price: number;
  certification: Record<string, unknown>;
  status: SupplyStatus;
  created_at: string;
  emitter?: Company;
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
  status: DemandStatus;
  created_at: string;
  buyer?: Company;
}

export interface Match {
  match_id: string;
  supply_id: string;
  demand_id: string;
  match_score: number;
  status: string;
  created_at: string;
  supply?: CO2Supply;
  demand?: DemandRequest;
}

export interface Bid {
  bid_id: string;
  match_id: string;
  bidder_id: string;
  amount: number;
  bid_type: BidType;
  status: BidStatus;
  created_at: string;
  bidder?: Company;
}

export interface Contract {
  contract_id: string;
  supply_id: string;
  buyer_id: string;
  quantity: number;
  price: number;
  start_date: string;
  end_date: string;
  status: ContractStatus;
  created_at: string;
}

export interface Shipment {
  shipment_id: string;
  supplier_id: string;
  buyer_id: string;
  logistics_provider: string | null;
  quantity: number;
  pickup_location: string;
  destination: string;
  route: Record<string, unknown>;
  estimated_distance: number;
  transportation_cost: number;
  estimated_delivery: string;
  status: ShipmentStatus;
  created_at: string;
  supplier?: Company;
  buyer?: Company;
}

export interface Certificate {
  certificate_id: string;
  company_id: string;
  supply_id: string | null;
  type: string;
  document_url: string;
  issued_at: string;
  verified_by: string | null;
  created_at: string;
}

export interface ReputationScore {
  company_id: string;
  reliability: number;
  quality: number;
  delivery: number;
  documentation: number;
  overall_score: number;
  updated_at: string;
}

export interface EmitterMetrics {
  total_captured: number;
  total_sold: number;
  unused_capacity: number;
  revenue: number;
  total_buyers: number;
  active_contracts: number;
  pending_requests: number;
  avg_selling_price: number;
  utilization_percentage: number;
}

export interface BuyerMetrics {
  total_required: number;
  current_suppliers: number;
  avg_price: number;
  active_contracts: number;
  upcoming_deliveries: number;
  total_utilized: number;
  cost_savings: number;
}
