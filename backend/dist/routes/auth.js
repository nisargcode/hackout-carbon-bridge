"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const supabase_1 = require("../db/supabase");
const router = (0, express_1.Router)();
router.post('/register', async (req, res) => {
    try {
        const { email, password, name, company_type, industry, location } = req.body;
        // Use Supabase Auth for user creation
        const { data: authData, error: authError } = await supabase_1.supabase.auth.signUp({
            email,
            password,
        });
        if (authError) {
            res.status(400).json({ error: authError.message });
            return;
        }
        const userId = authData.user?.id;
        // Insert into public.companies
        const { data: company, error: companyError } = await supabase_1.supabase
            .from('companies')
            .insert({
            user_id: userId,
            name,
            company_type,
            industry,
            location,
            verification_status: false,
            sustainability_score: 80.0,
            contact_details: { email },
        })
            .select()
            .single();
        if (companyError) {
            res.status(400).json({ error: companyError.message });
            return;
        }
        const secret = process.env.JWT_SECRET || 'carbon-bridge-secret';
        const token = jsonwebtoken_1.default.sign({
            user_id: userId,
            email,
            company_id: company?.company_id,
            company_type: company?.company_type,
        }, secret, { expiresIn: '7d' });
        res.status(201).json({
            message: 'Registration successful',
            token,
            company,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Server error' });
    }
});
router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const { data: authData, error: authError } = await supabase_1.supabase.auth.signInWithPassword({
            email,
            password,
        });
        if (authError) {
            res.status(401).json({ error: authError.message });
            return;
        }
        const userId = authData.user?.id;
        const { data: company } = await supabase_1.supabase
            .from('companies')
            .select('*')
            .eq('user_id', userId)
            .single();
        const secret = process.env.JWT_SECRET || 'carbon-bridge-secret';
        const token = jsonwebtoken_1.default.sign({
            user_id: userId,
            email,
            company_id: company?.company_id,
            company_type: company?.company_type,
        }, secret, { expiresIn: '7d' });
        res.json({
            message: 'Login successful',
            token,
            company,
        });
    }
    catch (err) {
        res.status(500).json({ error: err.message || 'Server error' });
    }
});
exports.default = router;
