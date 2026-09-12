import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { authenticateJWT } from '../middleware/auth';
import { evaluatePricingAction } from '../services/pricingEngine';

const router = Router();

// GET genuine bids from database
router.get('/', async (req: Request, res: Response) => {
  try {
    const { company_id, supply_id } = req.query;

    let query = supabase
      .from('bids')
      .select('*, bidder:companies(*), supply:co2_supplies(*, emitter:companies(*))')
      .order('created_at', { ascending: false });

    if (company_id) {
      // either incoming or outgoing
      query = query.or(`bidder_id.eq.${company_id}`);
    }
    if (supply_id) {
      query = query.eq('supply_id', supply_id);
    }

    const { data, error } = await query;

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ data: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST new bid
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const bidder_id = req.user?.company_id;
    if (!bidder_id) {
      res.status(400).json({ error: 'Authenticated company profile required to submit a bid' });
      return;
    }

    const { supply_id, demand_id, amount, quantity, bid_type, listPrice, notes } = req.body;

    // Evaluate dynamic pricing action
    const evaluation = evaluatePricingAction(bid_type, Number(amount), Number(listPrice || amount), Number(quantity));

    const { data, error } = await supabase
      .from('bids')
      .insert({
        supply_id,
        demand_id: demand_id || null,
        bidder_id,
        amount: Number(amount),
        quantity: Number(quantity),
        bid_type: bid_type || 'BID',
        status: evaluation.nextStatus,
        notes,
      })
      .select('*, bidder:companies(*), supply:co2_supplies(*)')
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({
      message: 'Bid successfully recorded in database',
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

    const updatePayload: any = {
      status,
      updated_at: new Date().toISOString()
    };
    if (counter_amount) {
      updatePayload.amount = Number(counter_amount);
    }

    const { data, error } = await supabase
      .from('bids')
      .update(updatePayload)
      .eq('bid_id', id)
      .select('*, bidder:companies(*), supply:co2_supplies(*)')
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ message: `Bid updated to ${status} in database`, data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
