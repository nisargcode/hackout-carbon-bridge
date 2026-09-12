import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

// GET genuine reputation scores and audit history
router.get('/reputation/:companyId', async (req: Request, res: Response) => {
  try {
    const { companyId } = req.params;
    const { data, error } = await supabase
      .from('reputation_scores')
      .select('*, company:companies(*)')
      .eq('company_id', companyId)
      .maybeSingle();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    if (data) {
      res.json({ data });
      return;
    }

    // If company exists but no reputation row created yet, return baseline new account stats
    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('company_id', companyId)
      .maybeSingle();

    res.json({
      data: {
        company_id: companyId,
        company_name: company?.name || 'Company',
        reliability: 100.0,
        quality: 100.0,
        delivery: 100.0,
        documentation: 100.0,
        overall_score: company?.sustainability_score || 85.0,
        is_new_account: true,
      }
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
