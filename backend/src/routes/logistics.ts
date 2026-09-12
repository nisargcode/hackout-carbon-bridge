import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

// GET available transportation jobs open for bidding from database
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('*, supplier:companies!shipments_supplier_id_fkey(*), buyer:companies!shipments_buyer_id_fkey(*)')
      .in('status', ['MATCHED', 'BOOKED'])
      .order('created_at', { ascending: false });

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({ data: data || [] });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// Carrier places a bid on a logistics job
router.post('/bid', authenticateJWT, requireRole(['LOGISTICS_PROVIDER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const logistics_provider_id = req.user?.company_id;
    if (!logistics_provider_id) {
      res.status(400).json({ error: 'Company profile required to submit logistics quote' });
      return;
    }

    const { shipment_id, bid_amount, vehicle_type, estimated_transit_hours } = req.body;

    const { data, error } = await supabase
      .from('logistics_bids')
      .insert({
        shipment_id,
        logistics_provider_id,
        bid_amount: Number(bid_amount),
        vehicle_type: vehicle_type || 'Cryogenic Tanker',
        estimated_transit_hours: estimated_transit_hours ? Number(estimated_transit_hours) : null,
        status: 'PENDING',
      })
      .select('*, carrier:companies(*), shipment:shipments(*)')
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({ message: 'Logistics bid submitted successfully in database', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
