"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../db/supabase");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { type } = req.query;
        let query = supabase_1.supabase.from('companies').select('*');
        if (type) {
            query = query.eq('company_type', type);
        }
        const { data, error } = await query;
        if (error) {
            // Fallback mock
            res.json({
                data: [
                    { company_id: '11111111-1111-1111-1111-111111111111', name: 'ABC Cement Works', company_type: 'EMITTER', location: 'Mumbai, MH', sustainability_score: 96.0 },
                    { company_id: '33333333-3333-3333-3333-333333333333', name: 'CleanFuel Synthesis', company_type: 'CO2_BUYER', location: 'Pune, MH', sustainability_score: 92.0 },
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
router.get('/:id', async (req, res) => {
    try {
        const { id } = req.params;
        const { data, error } = await supabase_1.supabase.from('companies').select('*').eq('company_id', id).single();
        if (error) {
            res.status(404).json({ error: 'Company not found' });
            return;
        }
        res.json({ data });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
