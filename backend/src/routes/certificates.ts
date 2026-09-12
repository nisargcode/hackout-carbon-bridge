import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// GET certificates from genuine database
router.get('/', async (req: Request, res: Response) => {
  try {
    const { company_id } = req.query;

    let query = supabase
      .from('certificates')
      .select('*, company:companies(*), supply:co2_supplies(*)')
      .order('created_at', { ascending: false });

    if (company_id) {
      query = query.eq('company_id', company_id);
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

// POST upload/register new certificate
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const company_id = req.user?.company_id;
    if (!company_id) {
      res.status(400).json({ error: 'Company profile required to record certificate' });
      return;
    }

    const { certificate_type, certificate_number, document_url, purity_certified, verified_by, supply_id } = req.body;

    const { data, error } = await supabase
      .from('certificates')
      .insert({
        company_id,
        supply_id: supply_id || null,
        certificate_type,
        certificate_number: certificate_number || `CERT-${Date.now().toString(36).toUpperCase()}`,
        document_url,
        purity_certified: purity_certified ? Number(purity_certified) : null,
        verified_by,
        verification_status: true,
      })
      .select('*, company:companies(*)')
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({ message: 'Certificate successfully recorded in database', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
