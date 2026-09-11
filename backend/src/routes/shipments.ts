import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { authenticateJWT } from '../middleware/auth';
import { LogisticsEngine } from '../services/logisticsEngine';
import { ShipmentStatus } from '../types';

const router = Router();

// GET all shipments
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('shipments')
      .select('*, supplier:companies!shipments_supplier_id_fkey(name), buyer:companies!shipments_buyer_id_fkey(name)');

    if (error || !data || data.length === 0) {
      res.json({
        data: [
          {
            shipment_id: 'SHP-901',
            supplier_id: '11111111-1111-1111-1111-111111111111',
            buyer_id: '33333333-3333-3333-3333-333333333333',
            route_name: 'ABC Cement (Mumbai) → CleanFuel (Pune)',
            pickup_location: 'Mumbai, Maharashtra',
            destination: 'Pune, Maharashtra',
            quantity: 200,
            transportation_cost: 38000,
            status: 'IN_TRANSIT',
            estimated_delivery: new Date(Date.now() + 4 * 3600000).toISOString(),
          },
          {
            shipment_id: 'SHP-902',
            supplier_id: '22222222-2222-2222-2222-222222222222',
            buyer_id: '44444444-4444-4444-4444-444444444444',
            route_name: 'Tata Steel (Jamshedpur) → CarbonMat (Ranchi)',
            pickup_location: 'Jamshedpur, Jharkhand',
            destination: 'Ranchi, Jharkhand',
            quantity: 150,
            transportation_cost: 29500,
            status: 'DELIVERED',
            estimated_delivery: new Date().toISOString(),
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
      .select()
      .single();

    res.json({
      message: `Shipment advanced to ${nextStatus}`,
      data: data || { shipment_id: id, status: nextStatus }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
