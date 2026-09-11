import { CO2Supply, DemandRequest } from '../types';

export interface MatchScoreResult {
  totalScore: number;
  breakdown: {
    purity: number;      // max 25
    quantity: number;    // max 20
    price: number;       // max 20
    availability: number;// max 15
    distance: number;    // max 10
    certification: number;// max 10
  };
  compatible: boolean;
}

/**
 * Weighted Intelligent Matching Algorithm based on raw-data.txt requirements:
 * Match Score = Purity + Quantity + Distance + Price + Availability + Delivery reliability + Certification
 */
export function calculateMatchScore(
  supply: CO2Supply,
  demand: DemandRequest,
  distanceKm: number = 150
): MatchScoreResult {
  let purityScore = 0;
  let quantityScore = 0;
  let priceScore = 0;
  let availabilityScore = 0;
  let distanceScore = 0;
  let certScore = 0;

  // 1. Purity Compatibility (25 pts)
  // Higher purity than requested is acceptable or perfect
  if (supply.purity_percentage >= demand.required_purity) {
    purityScore = 25;
  } else {
    const deficit = demand.required_purity - supply.purity_percentage;
    purityScore = Math.max(0, 25 - deficit * 5);
  }

  // 2. Quantity Compatibility (20 pts)
  if (supply.available_quantity >= demand.required_quantity) {
    quantityScore = 20;
  } else {
    const ratio = supply.available_quantity / demand.required_quantity;
    quantityScore = Math.round(ratio * 20);
  }

  // 3. Price Compatibility (20 pts)
  if (supply.asking_price <= demand.max_price) {
    priceScore = 20;
  } else {
    const overageRatio = (supply.asking_price - demand.max_price) / demand.max_price;
    priceScore = Math.max(0, Math.round(20 - overageRatio * 40));
  }

  // 4. Availability Window (15 pts)
  const deadline = new Date(demand.delivery_deadline).getTime();
  const start = new Date(supply.availability_start).getTime();
  const end = new Date(supply.availability_end).getTime();

  if (deadline >= start && deadline <= end) {
    availabilityScore = 15;
  } else if (deadline > end) {
    availabilityScore = 5;
  } else {
    availabilityScore = 10;
  }

  // 5. Distance & Logistics Proximity (10 pts)
  // Closer distance is more economic and lower logistics emissions
  if (distanceKm <= 100) {
    distanceScore = 10;
  } else if (distanceKm <= 300) {
    distanceScore = 8;
  } else if (distanceKm <= 600) {
    distanceScore = 5;
  } else {
    distanceScore = 2;
  }

  // 6. Certification & Traceability (10 pts)
  if (supply.certification && Object.keys(supply.certification).length > 0) {
    certScore = 10;
  } else {
    certScore = 4;
  }

  const totalScore = purityScore + quantityScore + priceScore + availabilityScore + distanceScore + certScore;

  return {
    totalScore,
    breakdown: {
      purity: purityScore,
      quantity: quantityScore,
      price: priceScore,
      availability: availabilityScore,
      distance: distanceScore,
      certification: certScore,
    },
    compatible: totalScore >= 60,
  };
}
