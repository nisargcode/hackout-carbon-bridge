import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

// GET all demand requests
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('demand_requests')
      .select('*, buyer:companies(*)');

    if (error || !data || data.length === 0) {
      res.json({
        data: [
          {
            request_id: 'cccccccc-cccc-cccc-cccc-cccccccccccc',
            buyer_id: '33333333-3333-3333-3333-333333333333',
            required_quantity: 200,
            required_purity: 97.0,
            application: 'Fuel synthesis',
            max_price: 4500,
            required_location: 'Pune, Maharashtra',
            delivery_deadline: '2026-10-15',
            status: 'OPEN',
            buyer: { name: 'CleanFuel Synthesis Ltd', location: 'Pune, MH' }
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

// POST new demand request (Buyers only)
router.post('/', authenticateJWT, requireRole(['CO2_BUYER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const buyer_id = req.user?.company_id;
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
        required_quantity,
        required_purity,
        application,
        max_price,
        required_location,
        delivery_deadline,
        status: 'OPEN',
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({ message: 'Demand request created successfully', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
