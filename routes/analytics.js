const express = require('express');
const router = express.Router();
const analyticsService = require('../services/analyticsService');
const functions = require('../utils/functions');
const login = require('../middleware/login'); 
const isAdmin = require('../middleware/isAdmin');

router.post('/track', async (req, res) => {
    try {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        await analyticsService.trackVisit(req.body, clientIp);
        res.status(200).send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false });
    }
});

router.get('/dashboard', login, isAdmin, async (req, res) => {
    try {
        const stats = await analyticsService.getDashboardStats();
        let response = functions.createResponse("Métricas carregadas", stats, "GET", 200);
        return res.status(200).send(response);
    } catch (error) {
        let response = functions.createResponse("Erro ao carregar métricas", error, "GET", 500);
        return res.status(500).send(response);
    }
});

module.exports = router;