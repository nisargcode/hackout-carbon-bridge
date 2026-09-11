"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const router = (0, express_1.Router)();
// GET mass-balance carbon tracking analytics
router.get('/', (req, res) => {
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
exports.default = router;
