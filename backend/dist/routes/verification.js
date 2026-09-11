"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../db/supabase");
const router = (0, express_1.Router)();
// GET reputation scores and audit history
router.get('/reputation/:companyId', async (req, res) => {
    try {
        const { companyId } = req.params;
        const { data } = await supabase_1.supabase
            .from('reputation_scores')
            .select('*')
            .eq('company_id', companyId)
            .single();
        res.json({
            data: data || {
                company_id: companyId,
                reliability: 96.0,
                quality: 98.0,
                delivery: 94.0,
                documentation: 100.0,
                overall_score: 96.0,
            }
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
