import { Router, Request, Response } from 'express';
import { LogisticsEngine } from '../services/logisticsEngine';

const router = Router();

// GET optimal route and distance calculation
router.get('/', (req: Request, res: Response) => {
  const { origin = 'Mumbai, Maharashtra', destination = 'Pune, Maharashtra' } = req.query;
  const result = LogisticsEngine.planRoute(origin as string, destination as string);
  res.json({ data: result });
});

export default router;
