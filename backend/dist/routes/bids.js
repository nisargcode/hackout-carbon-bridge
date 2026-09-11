"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../db/supabase");
const auth_1 = require("../middleware/auth");
const pricingEngine_1 = require("../services/pricingEngine");
const router = (0, express_1.Router)();
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase.from('bids').select('*, bidder:companies(*)');
        if (error || !data || data.length === 0) {
            res.json({
                data: [
                    {
                        bid_id: 'BID-101',
                        partner: 'CleanFuel Synthesis Ltd',
                        quantity: '200 tons',
                        amount: 4100,
                        originalPrice: 4200,
                        bid_type: 'BID',
                        status: 'PENDING',
                        created_at: new Date().toISOString()
                    },
                    {
                        bid_id: 'BID-102',
                        partner: 'GreenGrow AgriTech',
                        quantity: '150 tons',
                        amount: 4200,
                        originalPrice: 4200,
                        bid_type: 'BUY_NOW',
                        status: 'ACCEPTED',
                        created_at: new Date().toISOString()
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
router.post('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const bidder_id = req.user?.company_id || '33333333-3333-3333-3333-333333333333';
        const { supply_id, demand_id, amount, quantity, bid_type, listPrice, notes } = req.body;
        // Evaluate dynamic pricing action
        const evaluation = (0, pricingEngine_1.evaluatePricingAction)(bid_type, amount, listPrice || amount, quantity);
        const { data, error } = await supabase_1.supabase
            .from('bids')
            .insert({
            supply_id,
            demand_id,
            bidder_id,
            amount,
            quantity,
            bid_type: bid_type || 'BID',
            status: evaluation.nextStatus,
            notes,
        })
            .select()
            .single();
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(201).json({
            message: 'Bid submitted',
            data,
            evaluation,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// Update bid status (Accept, Reject, Counter)
router.patch('/:id/status', auth_1.authenticateJWT, async (req, res) => {
    try {
        const { id } = req.params;
        const { status, counter_amount } = req.body;
        const updatePayload = { status };
        if (counter_amount) {
            updatePayload.amount = counter_amount;
        }
        const { data, error } = await supabase_1.supabase
            .from('bids')
            .update(updatePayload)
            .eq('bid_id', id)
            .select()
            .single();
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.json({ message: `Bid updated to ${status}`, data });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
