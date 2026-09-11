"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const logisticsEngine_1 = require("../services/logisticsEngine");
const router = (0, express_1.Router)();
// GET optimal route and distance calculation
router.get('/', (req, res) => {
    const { origin = 'Mumbai, Maharashtra', destination = 'Pune, Maharashtra' } = req.query;
    const result = logisticsEngine_1.LogisticsEngine.planRoute(origin, destination);
    res.json({ data: result });
});
exports.default = router;
