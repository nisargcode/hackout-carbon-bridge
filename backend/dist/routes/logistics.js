"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../db/supabase");
const auth_1 = require("../middleware/auth");
const role_1 = require("../middleware/role");
const router = (0, express_1.Router)();
// GET available transportation jobs open for bidding
router.get('/', async (req, res) => {
    try {
        const { data, error } = await supabase_1.supabase
            .from('shipments')
            .select('*, supplier:companies!shipments_supplier_id_fkey(name), buyer:companies!shipments_buyer_id_fkey(name)')
            .in('status', ['MATCHED', 'BOOKED']);
        if (error || !data || data.length === 0) {
            res.json({
                data: [
                    {
                        job_id: 'JOB-401',
                        shipment_id: 'SHP-901',
                        route: 'Mumbai (ABC Cement) → Pune (CleanFuel)',
                        pickup_location: 'Mumbai, Maharashtra',
                        destination: 'Pune, Maharashtra',
                        quantity: '200 tons',
                        vehicle_requirements: 'Cryogenic Tanker (-20°C)',
                        deadline: '2026-09-20',
                        estimated_budget: 42000,
                        status: 'MATCHED',
                    },
                    {
                        job_id: 'JOB-402',
                        shipment_id: 'SHP-902',
                        route: 'Surat (PowerGen) → Ahmedabad (GreenTech)',
                        pickup_location: 'Surat, Gujarat',
                        destination: 'Ahmedabad, Gujarat',
                        quantity: '350 tons',
                        vehicle_requirements: 'Tube Trailer (20 bar)',
                        deadline: '2026-09-23',
                        estimated_budget: 60000,
                        status: 'MATCHED',
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
// Carrier places a bid on a logistics job
router.post('/bid', auth_1.authenticateJWT, (0, role_1.requireRole)(['LOGISTICS_PROVIDER', 'ADMIN']), async (req, res) => {
    try {
        const logistics_provider_id = req.user?.company_id || '55555555-5555-5555-5555-555555555555';
        const { shipment_id, bid_amount, vehicle_type, estimated_transit_hours } = req.body;
        const { data, error } = await supabase_1.supabase
            .from('logistics_bids')
            .insert({
            shipment_id,
            logistics_provider_id,
            bid_amount,
            vehicle_type: vehicle_type || 'Cryogenic Tanker',
            estimated_transit_hours: estimated_transit_hours || 4,
            status: 'PENDING',
        })
            .select()
            .single();
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(201).json({ message: 'Logistics bid submitted successfully', data });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
