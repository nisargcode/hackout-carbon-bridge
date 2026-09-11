"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.requireRole = void 0;
const requireRole = (allowedRoles) => {
    return (req, res, next) => {
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
exports.requireRole = requireRole;
