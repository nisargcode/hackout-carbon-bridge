import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { authenticateJWT } from '../middleware/auth';
import { evaluatePricingAction } from '../services/pricingEngine';

const router = Router();

router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase.from('bids').select('*, bidder:companies(*)');
    if (error || !data || data.length === 0) {
      res.json({
        data: [
          {
            bid_id: 'BID-101',
            partner: 'CleanFuel Synthesis Ltd',
            quantity: '200 tons',
            amount: 4100,
            originalPrice: 4200,
            bid_type: 'BID',
            status: 'PENDING',
            created_at: new Date().toISOString()
          },
          {
            bid_id: 'BID-102',
            partner: 'GreenGrow AgriTech',
            quantity: '150 tons',
            amount: 4200,
            originalPrice: 4200,
            bid_type: 'BUY_NOW',
            status: 'ACCEPTED',
            created_at: new Date().toISOString()
          }
        ]
      });
      return;
    }
    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const bidder_id = req.user?.company_id || '33333333-3333-3333-3333-333333333333';
    const { supply_id, demand_id, amount, quantity, bid_type, listPrice, notes } = req.body;

    // Evaluate dynamic pricing action
    const evaluation = evaluatePricingAction(bid_type, amount, listPrice || amount, quantity);

    const { data, error } = await supabase
      .from('bids')
      .insert({
        supply_id,
        demand_id,
        bidder_id,
        amount,
        quantity,
        bid_type: bid_type || 'BID',
        status: evaluation.nextStatus,
        notes,
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({
      message: 'Bid submitted',
      data,
      evaluation,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Update bid status (Accept, Reject, Counter)
router.patch('/:id/status', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { status, counter_amount } = req.body;

    const updatePayload: any = { status };
    if (counter_amount) {
      updatePayload.amount = counter_amount;
    }

    const { data, error } = await supabase
      .from('bids')
      .update(updatePayload)
      .eq('bid_id', id)
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ message: `Bid updated to ${status}`, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
