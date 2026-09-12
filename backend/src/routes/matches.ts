import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { calculateMatchScore } from '../services/matchingEngine';
import { CO2Supply, DemandRequest } from '../types';

const router = Router();

// GET calculated AI matches between real demand requests and active supplies in the database
router.get('/', async (req: Request, res: Response) => {
  try {
    const { demand_id, buyer_id } = req.query;

    let demand: DemandRequest | null = null;
    if (demand_id) {
      const { data } = await supabase
        .from('demand_requests')
        .select('*')
        .eq('request_id', demand_id)
        .single();
      demand = data;
    } else if (buyer_id) {
      const { data } = await supabase
        .from('demand_requests')
        .select('*')
        .eq('buyer_id', buyer_id)
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      demand = data;
    } else {
      // Get the latest open demand in the system
      const { data } = await supabase
        .from('demand_requests')
        .select('*')
        .eq('status', 'OPEN')
        .order('created_at', { ascending: false })
        .limit(1)
        .maybeSingle();
      demand = data;
    }

    if (!demand) {
      res.json({
        message: 'No open demand request found to match against. Please create a demand request first.',
        data: [],
      });
      return;
    }

    // Fetch genuine active supplies from database
    const { data: supplies, error: supplyError } = await supabase
      .from('co2_supplies')
      .select('*, emitter:companies(*)')
      .eq('status', 'ACTIVE');

    if (supplyError) {
      res.status(400).json({ error: supplyError.message });
      return;
    }

    if (!supplies || supplies.length === 0) {
      res.json({
        message: 'No active CO2 supplies currently listed in the database.',
        data: [],
      });
      return;
    }

    // Compute genuine matching scores using the weighted algorithm
    const matches = supplies.map((supply) => {
      const matchResult = calculateMatchScore(supply as CO2Supply, demand as DemandRequest);
      return {
        supply,
        demand,
        match_score: matchResult.totalScore,
        breakdown: matchResult.breakdown,
        compatible: matchResult.compatible,
      };
    }).sort((a, b) => b.match_score - a.match_score);

    res.json({ data: matches });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
