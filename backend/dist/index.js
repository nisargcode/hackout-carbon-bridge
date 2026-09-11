"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
// Import routes
const auth_1 = __importDefault(require("./routes/auth"));
const companies_1 = __importDefault(require("./routes/companies"));
const co2Supply_1 = __importDefault(require("./routes/co2Supply"));
const co2Requirements_1 = __importDefault(require("./routes/co2Requirements"));
const marketplace_1 = __importDefault(require("./routes/marketplace"));
const matches_1 = __importDefault(require("./routes/matches"));
const bids_1 = __importDefault(require("./routes/bids"));
const orders_1 = __importDefault(require("./routes/orders"));
const contracts_1 = __importDefault(require("./routes/contracts"));
const logistics_1 = __importDefault(require("./routes/logistics"));
const routes_1 = __importDefault(require("./routes/routes"));
const shipments_1 = __importDefault(require("./routes/shipments"));
const verification_1 = __importDefault(require("./routes/verification"));
const carbonTracking_1 = __importDefault(require("./routes/carbonTracking"));
const certificates_1 = __importDefault(require("./routes/certificates"));
const analytics_1 = __importDefault(require("./routes/analytics"));
const ai_1 = __importDefault(require("./routes/ai"));
const regulator_1 = __importDefault(require("./routes/regulator"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const port = process.env.PORT || 4000;
// Middleware
app.use((0, cors_1.default)({
    origin: process.env.FRONTEND_URL || '*',
    credentials: true,
}));
app.use(express_1.default.json());
// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', service: 'Carbon Bridge Backend API', timestamp: new Date().toISOString() });
});
// API Routes
app.use('/api/auth', auth_1.default);
app.use('/api/companies', companies_1.default);
app.use('/api/co2/supplies', co2Supply_1.default);
app.use('/api/co2/requirements', co2Requirements_1.default);
app.use('/api/marketplace', marketplace_1.default);
app.use('/api/matches', matches_1.default);
app.use('/api/bids', bids_1.default);
app.use('/api/orders', orders_1.default);
app.use('/api/contracts', contracts_1.default);
app.use('/api/logistics', logistics_1.default);
app.use('/api/routes', routes_1.default);
app.use('/api/shipments', shipments_1.default);
app.use('/api/verification', verification_1.default);
app.use('/api/carbon-tracking', carbonTracking_1.default);
app.use('/api/certificates', certificates_1.default);
app.use('/api/analytics', analytics_1.default);
app.use('/api/ai', ai_1.default);
app.use('/api/regulator', regulator_1.default);
// Global 404 Handler
app.use((req, res) => {
    res.status(404).json({ error: `Route ${req.method} ${req.originalUrl} not found` });
});
// Global Error Handler
app.use((err, req, res, next) => {
    console.error('[API Error]:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    });
});
app.listen(port, () => {
    console.log(`🚀 Carbon Bridge Backend API running on port ${port}`);
});
