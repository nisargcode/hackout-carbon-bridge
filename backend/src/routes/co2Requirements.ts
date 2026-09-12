import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

// GET all demand requests
router.get('/', async (req: Request, res: Response) => {
  try {
    const { buyer_id, status } = req.query;

    let query = supabase
      .from('demand_requests')
      .select('*, buyer:companies(*)')
      .order('created_at', { ascending: false });

    if (buyer_id) {
      query = query.eq('buyer_id', buyer_id);
    }
    if (status) {
      query = query.eq('status', status);
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

// POST new demand request (Buyers only)
router.post('/', authenticateJWT, requireRole(['CO2_BUYER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const buyer_id = req.user?.company_id;
    if (!buyer_id) {
      res.status(400).json({ error: 'No company profile linked to your account' });
      return;
    }

    const {
      required_quantity,
      required_purity,
      application,
      max_price,
      required_location,
      delivery_deadline,
    } = req.body;

    const { data, error } = await supabase
      .from('demand_requests')
      .insert({
        buyer_id,
        required_quantity: Number(required_quantity),
        required_purity: Number(required_purity),
        application,
        max_price: Number(max_price),
        required_location,
        delivery_deadline,
        status: 'OPEN',
      })
      .select('*, buyer:companies(*)')
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({ message: 'Demand request created successfully in database', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
