import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// GET all orders / contracts
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data, error } = await supabase
      .from('contracts')
      .select('*, buyer:companies!contracts_buyer_id_fkey(name), seller:companies!contracts_seller_id_fkey(name)');

    if (error || !data || data.length === 0) {
      res.json({
        data: [
          {
            contract_id: 'CTR-2026-089',
            title: 'Annual High-Purity CO₂ Offtake Agreement',
            quantity: 2400,
            unit_price: 4150,
            total_value: 9960000,
            contract_type: 'LONG_TERM',
            status: 'ACTIVE',
            start_date: '2026-10-01',
            end_date: '2027-09-30',
          },
          {
            contract_id: 'CTR-2026-092',
            title: 'Spot Purchase Agreement #092',
            quantity: 150,
            unit_price: 4200,
            total_value: 630000,
            contract_type: 'SPOT',
            status: 'ACTIVE',
            start_date: '2026-09-10',
            end_date: '2026-09-30',
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

// POST create contract from accepted bid
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const { supply_id, buyer_id, seller_id, quantity, unit_price, contract_type, start_date, end_date } = req.body;
    const total_value = quantity * unit_price;

    const { data, error } = await supabase
      .from('contracts')
      .insert({
        supply_id,
        buyer_id,
        seller_id,
        quantity,
        unit_price,
        total_value,
        contract_type: contract_type || 'SPOT',
        start_date,
        end_date,
        status: 'ACTIVE',
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({ message: 'Contract created successfully', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
