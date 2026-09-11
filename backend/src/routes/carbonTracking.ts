import { Router, Request, Response } from 'express';

const router = Router();

// GET mass-balance carbon tracking analytics
router.get('/', (req: Request, res: Response) => {
  res.json({
    data: {
      total_captured_tons: 48200,
      total_recycled_tons: 42350,
      net_abatement_percentage: 87.8,
      verified_cems_stacks: 142,
      active_credit_rebates_inr: 4250000,
      co2_by_destination: {
        synthetic_fuels: 38.5,
        building_materials: 32.0,
        greenhouse_agriculture: 18.2,
        algae_farming: 11.3,
      }
    }
  });
});

export default router;
