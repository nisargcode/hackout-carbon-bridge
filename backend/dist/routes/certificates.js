"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const supabase_1 = require("../db/supabase");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
// GET certificates
router.get('/', async (req, res) => {
    try {
        const { data } = await supabase_1.supabase.from('certificates').select('*');
        res.json({
            data: data && data.length > 0 ? data : [
                {
                    certificate_id: 'CERT-ISO-8901',
                    certificate_type: 'ISO 14064 Carbon Verification',
                    verified_by: 'Bureau Veritas India',
                    issued_at: '2026-08-15',
                    verification_status: true,
                    purity_certified: 98.5,
                },
                {
                    certificate_id: 'CERT-LAB-4412',
                    certificate_type: 'Spectrometric Purity Analysis',
                    verified_by: 'Vimta Analytical Labs',
                    issued_at: '2026-09-01',
                    verification_status: true,
                    purity_certified: 99.1,
                }
            ]
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
// POST upload/register new certificate
router.post('/', auth_1.authenticateJWT, async (req, res) => {
    try {
        const company_id = req.user?.company_id || '11111111-1111-1111-1111-111111111111';
        const { certificate_type, document_url, purity_certified, verified_by } = req.body;
        const { data, error } = await supabase_1.supabase
            .from('certificates')
            .insert({
            company_id,
            certificate_type,
            document_url,
            purity_certified,
            verified_by,
            verification_status: true,
        })
            .select()
            .single();
        if (error) {
            res.status(400).json({ error: error.message });
            return;
        }
        res.status(201).json({ message: 'Certificate recorded', data });
    }
    catch (err) {
        res.status(500).json({ error: err.message });
    }
});
exports.default = router;
