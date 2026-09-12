import express, { Request, Response, NextFunction } from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Import routes
import authRoutes from './routes/auth';
import companiesRoutes from './routes/companies';
import co2SupplyRoutes from './routes/co2Supply';
import co2RequirementsRoutes from './routes/co2Requirements';
import marketplaceRoutes from './routes/marketplace';
import matchesRoutes from './routes/matches';
import bidsRoutes from './routes/bids';
import ordersRoutes from './routes/orders';
import contractsRoutes from './routes/contracts';
import verificationRoutes from './routes/verification';
import carbonTrackingRoutes from './routes/carbonTracking';
import certificatesRoutes from './routes/certificates';
import analyticsRoutes from './routes/analytics';
import aiRoutes from './routes/ai';

dotenv.config();

const app = express();
const port = process.env.PORT || 4000;

// Middleware
app.use(cors({
  origin: process.env.FRONTEND_URL || '*',
  credentials: true,
}));
app.use(express.json());

// Health Check
app.get('/health', (req: Request, res: Response) => {
  res.json({ status: 'ok', service: 'Carbon Bridge Backend API', timestamp: new Date().toISOString() });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/companies', companiesRoutes);
app.use('/api/co2/supplies', co2SupplyRoutes);
app.use('/api/co2/requirements', co2RequirementsRoutes);
app.use('/api/marketplace', marketplaceRoutes);
app.use('/api/matches', matchesRoutes);
app.use('/api/bids', bidsRoutes);
app.use('/api/orders', ordersRoutes);
app.use('/api/contracts', contractsRoutes);
app.use('/api/verification', verificationRoutes);
app.use('/api/carbon-tracking', carbonTrackingRoutes);
app.use('/api/certificates', certificatesRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/regulator', regulatorRoutes);

// Global 404 Handler
app.use((req: Request, res: Response) => {
  res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});

// Global Error Handler
app.use((err: any, req: Request, res: Response, next: NextFunction) => {
  console.error('[API Error]:', err);
  res.status(err.status || 500).json({
    error: err.message || 'Internal Server Error',
  });
});

app.listen(port, () => {
  console.log(`🚀 Carbon Bridge Backend API running on port ${port}`);
});
