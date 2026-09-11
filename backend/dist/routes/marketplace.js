"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../db/supabase");
const router = (0, express_1.Router)();
// GET marketplace listings with filtering
router.get('/', async (req, res) => {
    try {
        const { min_purity, max_price, state, search } = req.query;
        let query = supabase_1.supabase.from('co2_supplies').select('*, emitter:companies(*)').eq('status', 'ACTIVE');
        if (min_purity) {
            query = query.gte('purity_percentage', Number(min_purity));
        }
        if (max_price) {
            query = query.lte('asking_price', Number(max_price));
        }
        if (state && state !== 'all') {
            query = query.ilike('physical_state', `%${state}%`);
        }
        const { data, error } = await query;
        if (error || !data || data.length === 0) {
            res.json({
                data: [
                    {
                        supply_id: 'S001',
                        company: 'Steel Corp India',
                        location: 'Mumbai, MH',
                        quantity: '500 tons',
                        purity: 98.5,
                        price: 4200,
                        captureMethod: 'Post-combustion',
                        physicalState: 'Liquid',
                        certification: true,
                        matchScore: 94,
                    },
                    {
                        supply_id: 'S002',
                        company: 'PowerGen Ltd.',
                        location: 'Surat, GJ',
                        quantity: '800 tons',
                        purity: 96.2,
                        price: 3800,
                        captureMethod: 'Pre-combustion',
                        physicalState: 'Gas',
                        certification: true,
                        matchScore: 87,
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
exports.default = router;
