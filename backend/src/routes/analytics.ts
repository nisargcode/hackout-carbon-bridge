import { Router, Request, Response } from 'express';
import { supabase } from '../db/supabase';
import { authenticateJWT } from '../middleware/auth';

const router = Router();

// GET dashboard analytics based on role
router.get('/', authenticateJWT, async (req: Request, res: Response) => {
  const role = req.user?.company_type || 'EMITTER';
  const companyId = req.user?.company_id;

  try {
    if (role === 'EMITTER') {
      const { data: supplies } = await supabase.from('co2_supplies').select('*').eq('emitter_id', companyId);
      const { data: contracts } = await supabase.from('contracts').select('*').eq('supplier_id', companyId);

      const totalCaptured = supplies?.reduce((sum: number, s: any) => sum + Number(s.available_quantity || 0), 0) || 0;
      const totalSold = contracts?.reduce((sum: number, c: any) => sum + Number(c.total_quantity || 0), 0) || 0;
      const totalRev = contracts?.reduce((sum: number, c: any) => sum + (Number(c.total_quantity || 0) * Number(c.unit_price || 0)), 0) || 0;
      const uniqueBuyers = new Set(contracts?.map((c: any) => c.buyer_id)).size;

      const avgPrice = contracts && contracts.length > 0
        ? Math.round(totalRev / (totalSold || 1))
        : (supplies && supplies.length > 0 ? Math.round(supplies.reduce((acc: number, s: any) => acc + Number(s.asking_price || 0), 0) / supplies.length) : 0);

      res.json({
        role,
        data: {
          total_captured: totalCaptured,
          total_sold: totalSold,
          unused_capacity: Math.max(0, totalCaptured - totalSold),
          revenue: totalRev > 100000 ? `₹${(totalRev / 100000).toFixed(1)}L` : `₹${totalRev.toLocaleString()}`,
          active_buyers: uniqueBuyers,
          utilization_percentage: totalCaptured > 0 ? Math.round((totalSold / totalCaptured) * 100) : 0,
          avg_selling_price: avgPrice > 0 ? `₹${avgPrice.toLocaleString()}/ton` : '₹0/ton',
        }
      });
      return;
    }

    if (role === 'CO2_BUYER') {
      const { data: demands } = await supabase.from('demand_requests').select('*').eq('buyer_id', companyId);
      const { data: contracts } = await supabase.from('contracts').select('*').eq('buyer_id', companyId);
      const { data: shipments } = await supabase.from('shipments').select('*').eq('buyer_id', companyId);

      const totalReq = demands?.reduce((sum: number, d: any) => sum + Number(d.required_quantity || 0), 0) || 0;
      const totalUtilized = contracts?.reduce((sum: number, c: any) => sum + Number(c.total_quantity || 0), 0) || 0;
      const uniqueSuppliers = new Set(contracts?.map((c: any) => c.supplier_id)).size;
      const activeContracts = contracts?.filter((c: any) => c.status === 'ACTIVE').length || 0;
      const upcoming = 0;

      const avgCost = contracts && contracts.length > 0
        ? Math.round(contracts.reduce((acc: number, c: any) => acc + Number(c.unit_price || 0), 0) / contracts.length)
        : 0;

      res.json({
        role,
        data: {
          total_required: totalReq,
          current_suppliers: uniqueSuppliers,
          avg_price: avgCost > 0 ? `₹${avgCost.toLocaleString()}/ton` : '₹0/ton',
          active_contracts: activeContracts,
          upcoming_deliveries: upcoming,
          total_utilized: totalUtilized,
          cost_savings: '₹0',
        }
      });
      return;
    }
  } catch (err: any) {
    res.status(500).json({ error: err.message });
  }
});

export default router;
