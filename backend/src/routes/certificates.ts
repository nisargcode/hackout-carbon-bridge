import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// GET certificates
router.get('/', async (req: Request, res: Response) => {
  try {
    const { data } = await supabase.from('certificates').select('*');
    res.json({
      data: data && data.length > 0 ? data : [
        {
          certificate_id: 'CERT-ISO-8901',
          certificate_type: 'ISO 14064 Carbon Verification',
          verified_by: 'Bureau Veritas India',
          issued_at: '2026-08-15',
          verification_status: true,
          purity_certified: 98.5,
        },
        {
          certificate_id: 'CERT-LAB-4412',
          certificate_type: 'Spectrometric Purity Analysis',
          verified_by: 'Vimta Analytical Labs',
          issued_at: '2026-09-01',
          verification_status: true,
          purity_certified: 99.1,
        }
      ]
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

// POST upload/register new certificate
router.post('/', authenticateJWT, async (req: Request, res: Response) => {
  try {
    const company_id = req.user?.company_id || '11111111-1111-1111-1111-111111111111';
    const { certificate_type, document_url, purity_certified, verified_by } = req.body;

    const { data, error } = await supabase
      .from('certificates')
      .insert({
        company_id,
        certificate_type,
        document_url,
        purity_certified,
        verified_by,
        verification_status: true,
      })
      .select()
      .single();

    if (error) {
      res.status(400).json({ error: error.message });
      return;
    }

    res.status(201).json({ message: 'Certificate recorded', data });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
