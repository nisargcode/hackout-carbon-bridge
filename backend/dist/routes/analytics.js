"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET dashboard analytics based on role
router.get('/', auth_1.authenticateJWT, (req, res) => {
    const role = req.user?.company_type || 'EMITTER';
    if (role === 'EMITTER') {
        res.json({
            role,
            data: {
                total_captured: 4500,
                total_sold: 3700,
                unused_capacity: 800,
                revenue: '₹1.57 Cr',
                active_buyers: 12,
                utilization_percentage: 82,
                avg_selling_price: '₹4,243/ton',
            }
        });
        return;
    }
    if (role === 'CO2_BUYER') {
        res.json({
            role,
            data: {
                total_required: 2400,
                current_suppliers: 8,
                avg_price: '₹4,100/ton',
                active_contracts: 6,
                upcoming_deliveries: 3,
                total_utilized: 2110,
                cost_savings: '₹12.4L',
            }
        });
        return;
    }
    if (role === 'LOGISTICS_PROVIDER') {
        res.json({
            role,
            data: {
                active_routes: 2,
                completed_jobs: 47,
                monthly_revenue: '₹3.2L',
                available_jobs: 3,
            }
        });
        return;
    }
    // REGULATOR
    res.json({
        role,
        data: {
            total_transactions: 284,
            verified_certs: 231,
            pending_review: 12,
            total_co2_tracked: 48200,
        }
    });
});
exports.default = router;
