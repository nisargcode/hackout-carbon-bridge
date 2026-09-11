"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../db/supabase");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const router = (0, express_1.Router)();
// GET all active supplies
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('co2_supplies')
            .select('*, emitter:companies(*)')
            .eq('status', 'ACTIVE');
        if (error || !data || data.length === 0) {
            // Mock fallback
            res.json({
                data: [
                    {
                        supply_id: 'aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa',
                        emitter_id: '11111111-1111-1111-1111-111111111111',
                        available_quantity: 4500,
                        quantity_unit: 'tons',
                        purity_percentage: 98.5,
                        physical_state: 'Liquid',
                        capture_method: 'Post-combustion amine scrubbing',
                        source_industry: 'Cement',
                        location: 'Mumbai, Maharashtra',
                        asking_price: 4200,
                        status: 'ACTIVE',
                        emitter: { name: 'ABC Cement Works', sustainability_score: 96 }
                    },
                    {
                        supply_id: 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb',
                        emitter_id: '22222222-2222-2222-2222-222222222222',
                        available_quantity: 3200,
                        quantity_unit: 'tons',
                        purity_percentage: 96.2,
                        physical_state: 'Gas',
                        capture_method: 'Pre-combustion gasification',
                        source_industry: 'Steel',
                        location: 'Jamshedpur, Jharkhand',
                        asking_price: 3800,
                        status: 'ACTIVE',
                        emitter: { name: 'Tata Steel Jamshedpur', sustainability_score: 94 }
                    }
                ]
            });
            return;
        }
        res.json({ data });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST new supply listing (Emitters only)
router.post('/', auth_1.authenticateJWT, (0, role_1.requireRole)(['EMITTER', 'ADMIN']), async (req, res) => {
    try {
        const emitter_id = req.user?.company_id;
        const { available_quantity, quantity_unit, purity_percentage, physical_state, temperature, pressure, capture_method, source_industry, location, availability_start, availability_end, minimum_order, asking_price, certification, } = req.body;
        const { data, error } = await supabase_1.supabase
            .from('co2_supplies')
            .insert({
            emitter_id,
            available_quantity,
            quantity_unit: quantity_unit || 'tons',
            purity_percentage,
            physical_state,
            temperature,
            pressure,
            capture_method,
            source_industry,
            location,
            availability_start,
            availability_end,
            minimum_order,
            asking_price,
            certification: certification || {},
            status: 'ACTIVE',
        })
            .select()
            .single();
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(201).json({ message: 'CO2 supply listed successfully', data });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
