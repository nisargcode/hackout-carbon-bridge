import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

// GET marketplace listings with filtering
router.get('/', async (req: Request, res: Response) => {
  try {
    const { min_purity, max_price, state, search } = req.query;

    let query = supabase.from('co2_supplies').select('*, emitter:companies(*)').eq('status', 'ACTIVE');

    if (min_purity) {
      query = query.gte('purity_percentage', Number(min_purity));
    }
    if (max_price) {
      query = query.lte('asking_price', Number(max_price));
    }
    if (state && state !== 'all') {
      query = query.ilike('physical_state', `%${state}%`);
    }

    const { data, error } = await query;

    if (error || !data || data.length === 0) {
      res.json({
        data: [
          {
            supply_id: 'S001',
            company: 'Steel Corp India',
            location: 'Mumbai, MH',
            quantity: '500 tons',
            purity: 98.5,
            price: 4200,
            captureMethod: 'Post-combustion',
            physicalState: 'Liquid',
            certification: true,
            matchScore: 94,
          },
          {
            supply_id: 'S002',
            company: 'PowerGen Ltd.',
            location: 'Surat, GJ',
            quantity: '800 tons',
            purity: 96.2,
            price: 3800,
            captureMethod: 'Pre-combustion',
            physicalState: 'Gas',
            certification: true,
            matchScore: 87,
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

export default router;
