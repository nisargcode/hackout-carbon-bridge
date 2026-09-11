import { Request, Response, NextFunction } from 'express';
import { CompanyType } from '../types';

export const requireRole = (allowedRoles: CompanyType[]) => {
  return (req: Request, res: Response, next: NextFunction): void => {
    if (!req.user || !req.user.company_type) {
      res.status(401).json({ error: 'Unauthorized: No authenticated company role identified' });
      return;
    }

    if (!allowedRoles.includes(req.user.company_type) && req.user.company_type !== 'ADMIN') {
      res.status(403).json({
        error: `Forbidden: Action requires one of [${allowedRoles.join(', ')}] role(s)`
      });
      return;
    }

    next();
  };
};
