import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// GET all orders / contracts from database
router.get('/', async (req: Request, res: Response) => {
  try {
    const { company_id } = req.query;

    let query = supabase
      .from('contracts')
      .select('*, supply:co2_supplies(*), buyer:companies!contracts_buyer_id_fkey(*), seller:companies!contracts_seller_id_fkey(*)')
      .order('created_at', { ascending: false });

    if (company_id) {
      query = query.or(`buyer_id.eq.${company_id},seller_id.eq.${company_id}`);
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

// POST create contract from accepted bid
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { supply_id, buyer_id, seller_id, quantity, unit_price, contract_type, start_date, end_date } = req.body;
    const total_value = Number(quantity) * Number(unit_price);

    const { data, error } = await supabase
      .from('contracts')
      .insert({
        supply_id,
        buyer_id,
        seller_id,
        quantity: Number(quantity),
        unit_price: Number(unit_price),
        total_value,
        contract_type: contract_type || 'SPOT',
        start_date: start_date || new Date().toISOString().split('T')[0],
        end_date: end_date || new Date(Date.now() + 30 * 86400000).toISOString().split('T')[0],
        status: 'ACTIVE',
      })
      .select('*, supply:co2_supplies(*), buyer:companies!contracts_buyer_id_fkey(*), seller:companies!contracts_seller_id_fkey(*)')
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    // Also automatically create initial shipment record in database for logistics fulfillment!
    await supabase.from('shipments').insert({
      contract_id: data.contract_id,
      supplier_id: seller_id,
      buyer_id: buyer_id,
      quantity: Number(quantity),
      pickup_location: data.supply?.location || 'Origin Terminal',
      destination: data.buyer?.location || 'Destination Facility',
      status: 'MATCHED',
    });

    res.status(201).json({ message: 'Contract created successfully in database', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
