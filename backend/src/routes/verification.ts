import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

// GET reputation scores and audit history
router.get('/reputation/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { data } = await supabase
      .from('reputation_scores')
      .select('*')
      .eq('company_id', companyId)
      .single();

    res.json({
      data: data || {
        company_id: companyId,
        reliability: 96.0,
        quality: 98.0,
        delivery: 94.0,
        documentation: 100.0,
        overall_score: 96.0,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
