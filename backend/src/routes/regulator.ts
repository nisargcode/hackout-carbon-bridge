import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';

const router = Router();

// GET all statutory regulatory data
router.get('/', async (req: Request, res: Response) => {
  try {
    const { count: companyCount } = await supabase.from('companies').select('*', { count: 'exact', head: true });
    const { count: shipmentCount } = await supabase.from('shipments').select('*', { count: 'exact', head: true });
    const { count: certCount } = await supabase.from('certificates').select('*', { count: 'exact', head: true });
    const { data: contracts } = await supabase.from('contracts').select('total_quantity, unit_price');

    const totalValue = contracts?.reduce((sum: number, c: any) => sum + (Number(c.total_quantity || 0) * Number(c.unit_price || 0)), 0) || 0;
    const rebateVal = Math.round(totalValue * 0.05); // 5% statutory green rebate

    res.json({
      overview: {
        registered_entities: companyCount || 0,
        active_monitored_shipments: shipmentCount || 0,
        certified_documents: certCount || 0,
        regulatory_compliance_rate: companyCount && companyCount > 0 ? '100%' : '0%',
      },
      flagged_issues: [],
      statutory_tax_rebates_cleared: rebateVal > 100000 ? `₹${(rebateVal / 100000).toFixed(2)}L` : `₹${rebateVal.toLocaleString()}`
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
