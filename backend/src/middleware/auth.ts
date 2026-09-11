import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { CompanyType } from '../types';

export interface AuthUser {
  user_id: string;
  email: string;
  company_id?: string;
  company_type?: CompanyType;
}

declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export const authenticateJWT = (req: Request, res: Response, next: NextFunction): void => {
  const authHeader = req.headers.authorization;

  if (!authHeader) {
    // Demo fallback for testing without active JWT token
    req.user = {
      user_id: 'mock-user-123',
      email: 'demo@carbonbridge.org',
      company_id: '11111111-1111-1111-1111-111111111111',
      company_type: 'EMITTER',
    };
    return next();
  }

  const token = authHeader.split(' ')[1];
  const secret = process.env.JWT_SECRET || 'carbon-bridge-secret';

  jwt.verify(token, secret, (err: any, decoded: any) => {
    if (err) {
      res.status(403).json({ error: 'Invalid or expired token' });
      return;
    }
    req.user = decoded as AuthUser;
    next();
  });
};
