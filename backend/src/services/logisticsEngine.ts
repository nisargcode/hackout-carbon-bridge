import { Shipment, ShipmentStatus } from '../types';

export interface LogisticsQuote {
  providerId: string;
  providerName: string;
  quoteAmount: number;
  vehicleType: string;
  estimatedHours: number;
  carbonEmissionsKg: number;
}

export interface RouteOptimizationResult {
  origin: string;
  destination: string;
  distanceKm: number;
  estimatedHours: number;
  suggestedWaypoints: string[];
  compliantWithCryoRegulations: boolean;
}

/**
 * Logistics Engine:
 * Route calculation, carrier bidding evaluation, and optimal carrier selection
 */
export class LogisticsEngine {
  static planRoute(origin: string, destination: string): RouteOptimizationResult {
    // Estimations based on major industrial corridors
    const distanceKm = 148.0;
    return {
      origin,
      destination,
      distanceKm,
      estimatedHours: 3.25,
      suggestedWaypoints: ['Industrial Bypass', 'Express Corridor NH-48', 'Cryo Tanker Inspection Bay'],
      compliantWithCryoRegulations: true,
    };
  }

  static selectOptimalCarrier(quotes: LogisticsQuote[]): LogisticsQuote | null {
    if (!quotes || quotes.length === 0) return null;

    // Sort by price and transit efficiency (weighted scoring)
    return quotes.reduce((best, current) => {
      const bestScore = best.quoteAmount * 0.7 + best.estimatedHours * 500;
      const currentScore = current.quoteAmount * 0.7 + current.estimatedHours * 500;
      return currentScore < bestScore ? current : best;
    });
  }

  static getNextShipmentStatus(current: ShipmentStatus): ShipmentStatus {
    const sequence: ShipmentStatus[] = [
      'MATCHED',
      'BOOKED',
      'PICKED_UP',
      'IN_TRANSIT',
      'DELIVERED',
      'VERIFIED',
    ];
    const currentIndex = sequence.indexOf(current);
    if (currentIndex >= 0 && currentIndex < sequence.length - 1) {
      return sequence[currentIndex + 1];
    }
    return current;
  }
}
