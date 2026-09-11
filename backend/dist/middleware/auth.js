"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticateJWT = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const authenticateJWT = (req, res, next) => {
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
    jsonwebtoken_1.default.verify(token, secret, (err, decoded) => {
        if (err) {
            res.status(403).json({ error: 'Invalid or expired token' });
            return;
        }
        req.user = decoded;
        next();
    });
};
exports.authenticateJWT = authenticateJWT;
