import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

// GET marketplace listings with filtering from genuine database
router.get('/', async (req: Request, res: Response) => {
  try {
    const { min_purity, max_price, state, search, source_industry } = req.query;

    let query = supabase
      .from('co2_supplies')
      .select('*, emitter:companies(*)')
      .eq('status', 'ACTIVE')
      .order('created_at', { ascending: false });

    if (min_purity) {
      query = query.gte('purity_percentage', Number(min_purity));
    }
    if (max_price) {
      query = query.lte('asking_price', Number(max_price));
    }
    if (state && state !== 'all') {
      query = query.ilike('physical_state', `%${state}%`);
    }
    if (source_industry && source_industry !== 'all') {
      query = query.ilike('source_industry', `%${source_industry}%`);
    }
    if (search) {
      query = query.or(`location.ilike.%${search}%,capture_method.ilike.%${search}%,source_industry.ilike.%${search}%`);
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

export default router;
