import { Router, Request, Response } from 'express';
import jwt from 'jsonwebtoken';
import { supabase } from '../db/supabase';

const router = Router();

router.post('/register', async (req: Request, res: Response) => {
  try {
    const { email, password, name, company_type, industry, location } = req.body;

    // Use Supabase Auth for user creation
    const { data: authData, error: authError } = await supabase.auth.signUp({
      email,
      password,
    });

    if (authError) {
      res.status(400).json({ error: authError.message });
      return;
    }

    const userId = authData.user?.id;

    // Insert into public.companies
    const { data: company, error: companyError } = await supabase
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
    const token = jwt.sign(
      {
        user_id: userId,
        email,
        company_id: company?.company_id,
        company_type: company?.company_type,
      },
      secret,
      { expiresIn: '7d' }
    );

    res.status(201).json({
      message: 'Registration successful',
      token,
      company,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

router.post('/login', async (req: Request, res: Response) => {
  try {
    const { email, password } = req.body;

    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (authError) {
      res.status(401).json({ error: authError.message });
      return;
    }

    const userId = authData.user?.id;

    const { data: company } = await supabase
      .from('companies')
      .select('*')
      .eq('user_id', userId)
      .single();

    const secret = process.env.JWT_SECRET || 'carbon-bridge-secret';
    const token = jwt.sign(
      {
        user_id: userId,
        email,
        company_id: company?.company_id,
        company_type: company?.company_type,
      },
      secret,
      { expiresIn: '7d' }
    );

    res.json({
      message: 'Login successful',
      token,
      company,
    });
  } catch (err: any) {
    res.status(500).json({ error: err.message || 'Server error' });
  }
});

export default router;
