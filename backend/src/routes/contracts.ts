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

    // Validate contract constraints
    if (Number(quantity) <= 0) {
      res.status(400).json({ error: 'Contract quantity must be positive' });
      return;
    }
    if (Number(unit_price) <= 0) {
      res.status(400).json({ error: 'Unit price must be positive' });
      return;
    }
    if (start_date && end_date && end_date <= start_date) {
      res.status(400).json({ error: 'End date must be after start date' });
      return;
    }
    // Verify supply availability
    if (supply_id) {
      const { data: supply } = await supabase
        .from('co2_supplies')
        .select('available_quantity, status')
        .eq('supply_id', supply_id)
        .single();
      if (supply && Number(quantity) > Number(supply.available_quantity)) {
        res.status(400).json({ error: `Contract quantity (${quantity}) exceeds available supply (${supply.available_quantity})` });
        return;
      }
    }

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


    // Deduct contracted quantity from supply
    if (supply_id) {
      const { data: currentSupply } = await supabase
        .from('co2_supplies')
        .select('available_quantity')
        .eq('supply_id', supply_id)
        .single();
      if (currentSupply) {
        const newQty = Math.max(0, Number(currentSupply.available_quantity) - Number(quantity));
        const supplyUpdate: any = { available_quantity: newQty };
        if (newQty === 0) supplyUpdate.status = 'SOLD_OUT';
        await supabase.from('co2_supplies').update(supplyUpdate).eq('supply_id', supply_id);
      }
    }

    res.status(201).json({ message: 'Contract created successfully in database', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
