import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { authenticateJWT } from '../middleware/auth';
import { LogisticsEngine } from '../services/logisticsEngine';
import { ShipmentStatus } from '../types';

const router = Router();

// GET all shipments from database
router.get('/', async (req: Request, res: Response) => {
  try {
    const { company_id, status } = req.query;

    let query = supabase
      .from('shipments')
      .select('*, supplier:companies!shipments_supplier_id_fkey(*), buyer:companies!shipments_buyer_id_fkey(*), carrier:companies!shipments_logistics_provider_id_fkey(*)')
      .order('created_at', { ascending: false });

    if (company_id) {
      query = query.or(`supplier_id.eq.${company_id},buyer_id.eq.${company_id},logistics_provider_id.eq.${company_id}`);
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

// Update shipment status (e.g. advance MATCHED → BOOKED → PICKED_UP → IN_TRANSIT → DELIVERED → VERIFIED)
router.patch('/:id/advance', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { current_status } = req.body;

    const nextStatus = LogisticsEngine.getNextShipmentStatus(current_status as ShipmentStatus);

    const { data, error } = await supabase
      .from('shipments')
      .update({ status: nextStatus, updated_at: new Date().toISOString() })
      .eq('shipment_id', id)
      .select('*, supplier:companies!shipments_supplier_id_fkey(*), buyer:companies!shipments_buyer_id_fkey(*), carrier:companies!shipments_logistics_provider_id_fkey(*)')
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.json({
      message: `Shipment advanced to ${nextStatus}`,
      data,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
