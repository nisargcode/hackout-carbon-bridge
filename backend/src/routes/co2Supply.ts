import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { authenticateJWT } from '../middleware/auth';
import { requireRole } from '../middleware/role';

const router = Router();

// GET all active supplies
router.get('/', async (req: Request, res: Response) => {
  try {
    const { emitter_id, min_purity, max_price } = req.query;

    let query = supabase
      .from('co2_supplies')
      .select('*, emitter:companies(*)')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (emitter_id) {
      query = query.eq('emitter_id', emitter_id);
    }
    if (min_purity) {
      query = query.gte('purity_percentage', Number(min_purity));
    }
    if (max_price) {
      query = query.lte('asking_price', Number(max_price));
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

// GET single supply by ID
router.get('/:id', async (req: Request, res: Response) => {
  try {
    const { id } = req.params;
    const { data, error } = await supabase
      .from('co2_supplies')
      .select('*, emitter:companies(*)')
      .eq('supply_id', id)
      .single();

    if (error) {
      res.status(404).json({ error: error.message });
      return;
    }

    res.json({ data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST new supply listing (Emitters only)
router.post('/', authenticateJWT, requireRole(['EMITTER', 'ADMIN']), async (req: Request, res: Response) => {
  try {
    const emitter_id = req.user?.company_id;
    if (!emitter_id) {
      res.status(400).json({ error: 'No company profile linked to your account' });
      return;
    }

    const {
      available_quantity,
      quantity_unit,
      purity_percentage,
      physical_state,
      temperature,
      pressure,
      capture_method,
      source_industry,
      location,
      availability_start,
      availability_end,
      minimum_order,
      asking_price,
      certification,
    } = req.body;

    const { data, error } = await supabase
      .from('co2_supplies')
      .insert({
        emitter_id,
        available_quantity: Number(available_quantity),
        quantity_unit: quantity_unit || 'tons',
        purity_percentage: Number(purity_percentage),
        physical_state,
        temperature: temperature ? Number(temperature) : null,
        pressure: pressure ? Number(pressure) : null,
        capture_method,
        source_industry,
        location,
        availability_start,
        availability_end,
        minimum_order: minimum_order ? Number(minimum_order) : 10,
        asking_price: Number(asking_price),
        certification: certification || {},
        status: 'ACTIVE',
      })
      .select('*, emitter:companies(*)')
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({ message: 'CO2 supply listed successfully in database', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
