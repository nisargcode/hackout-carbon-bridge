import { BidType, BidStatus } from '../types';

export interface PricingEvaluation {
  approved: boolean;
  recommendation: string;
  nextStatus: BidStatus;
  suggestedCounterPrice?: number;
}

/**
 * Dynamic Pricing Engine supporting:
 * BUY NOW, REQUEST QUOTE, BID, NEGOTIATE, and LONG-TERM CONTRACTS
 */
export function evaluatePricingAction(
  type: BidType,
  offeredPrice: number,
  listPrice: number,
  volumeTons: number
): PricingEvaluation {
  switch (type) {
    case 'BUY_NOW':
      return {
        approved: true,
        recommendation: 'Instant execution at list price.',
        nextStatus: 'ACCEPTED',
      };

    case 'BID':
      if (offeredPrice >= listPrice) {
        return {
          approved: true,
          recommendation: 'Bid meets or exceeds asking price. Auto-clearing suggested.',
          nextStatus: 'ACCEPTED',
        };
      } else if (offeredPrice >= listPrice * 0.92) {
        return {
          approved: false,
          recommendation: 'Within competitive margin (within 8%). Open for seller review.',
          nextStatus: 'PENDING',
        };
      } else {
        return {
          approved: false,
          recommendation: 'Bid below threshold margin. Counter-offer advised.',
          nextStatus: 'COUNTERED',
          suggestedCounterPrice: Math.round(listPrice * 0.95),
        };
      }

    case 'NEGOTIATE':
      return {
        approved: false,
        recommendation: 'Active bilateral negotiation initiated.',
        nextStatus: 'PENDING',
        suggestedCounterPrice: Math.round((offeredPrice + listPrice) / 2),
      };

    case 'REQUEST_QUOTE':
      const volumeDiscount = volumeTons > 500 ? 0.9 : volumeTons > 200 ? 0.95 : 1.0;
      return {
        approved: true,
        recommendation: `Volume-tiered estimated quote generated: ₹${Math.round(listPrice * volumeDiscount)}/ton.`,
        nextStatus: 'PENDING',
        suggestedCounterPrice: Math.round(listPrice * volumeDiscount),
      };

    case 'LONG_TERM_CONTRACT':
      return {
        approved: true,
        recommendation: 'Offtake contract candidate with guaranteed multi-quarter pricing.',
        nextStatus: 'PENDING',
        suggestedCounterPrice: Math.round(listPrice * 0.92),
      };

    default:
      return {
        approved: false,
        recommendation: 'Standard auction review.',
        nextStatus: 'PENDING',
      };
  }
}
