"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../db/supabase");
const matchingEngine_1 = require("../services/matchingEngine");
const router = (0, express_1.Router)();
// GET calculated AI matches for a demand request
router.get('/', async (req, res) => {
    try {
        const { demand_id } = req.query;
        // Fetch demand request
        let demand = null;
        if (demand_id) {
            const { data } = await supabase_1.supabase
                .from('demand_requests')
                .select('*')
                .eq('request_id', demand_id)
                .single();
            demand = data;
        }
        if (!demand) {
            demand = {
                request_id: 'default-demand',
                buyer_id: '33333333-3333-3333-3333-333333333333',
                required_quantity: 200,
                required_purity: 97.0,
                application: 'Fuel synthesis',
                max_price: 4500,
                required_location: 'Pune, Maharashtra',
                delivery_deadline: '2026-10-15',
                status: 'OPEN',
            };
        }
        // Fetch active supplies
        const { data: supplies } = await supabase_1.supabase
            .from('co2_supplies')
            .select('*, emitter:companies(*)')
            .eq('status', 'ACTIVE');
        const supplyList = (supplies && supplies.length > 0) ? supplies : [
            {
                supply_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                emitter_id: '11111111-1111-1111-1111-111111111111',
                available_quantity: 4500,
                quantity_unit: 'tons',
                purity_percentage: 98.5,
                physical_state: 'Liquid',
                capture_method: 'Post-combustion',
                source_industry: 'Cement',
                location: 'Mumbai, Maharashtra',
                availability_start: '2026-09-01',
                availability_end: '2027-03-01',
                minimum_order: 50,
                asking_price: 4200,
                certification: { standard: 'ISO 14064' },
                status: 'ACTIVE',
                emitter: { name: 'ABC Cement Works', location: 'Mumbai, MH' }
            },
            {
                supply_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                emitter_id: '22222222-2222-2222-2222-222222222222',
                available_quantity: 3200,
                quantity_unit: 'tons',
                purity_percentage: 96.2,
                physical_state: 'Gas',
                capture_method: 'Pre-combustion',
                source_industry: 'Steel',
                location: 'Jamshedpur, Jharkhand',
                availability_start: '2026-09-01',
                availability_end: '2026-12-01',
                minimum_order: 100,
                asking_price: 3800,
                certification: { standard: 'Bureau Veritas' },
                status: 'ACTIVE',
                emitter: { name: 'Tata Steel Jamshedpur', location: 'Jamshedpur, JH' }
            }
        ];
        // Compute scores
        const matches = supplyList.map((supply) => {
            const matchResult = (0, matchingEngine_1.calculateMatchScore)(supply, demand);
            return {
                supply,
                demand_id: demand?.request_id,
                match_score: matchResult.totalScore,
                breakdown: matchResult.breakdown,
                compatible: matchResult.compatible,
            };
        }).sort((a, b) => b.match_score - a.match_score);
        res.json({ data: matches });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
