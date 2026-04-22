const express = require('express');
const router = express.Router();
const axios = require('axios');
const analyticsService = require('../services/analyticsService');
const functions = require('../utils/functions');
const login = require('../middleware/login'); 
const isAdmin = require('../middleware/isAdmin');

router.post('/track', async (req, res) => {
    try {
        let clientIp = req.socket.remoteAddress;
        const forwardedFor = req.headers['x-forwarded-for'];
        
        if (forwardedFor) {
            clientIp = forwardedFor.split(',')[0].trim();
        }

        let geoData = { country: null, regionName: null, city: null };
        
        let isLocal = clientIp === '::1' || clientIp === '127.0.0.1' || clientIp.startsWith('192.168.');
        
        if (!isLocal && clientIp) {
            try {
                const geoRes = await axios.get(`http://ip-api.com/json/${clientIp}`);
                if (geoRes.data.status === 'success') {
                    geoData = geoRes.data;
                }
            } catch (e) {
                console.error("Erro ao buscar geolocalização do IP:", e.message);
            }
        }

        await analyticsService.trackVisit(req.body, clientIp, geoData);
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
        let response = functions.createResponse("Erro ao carregar métricas", error.message || error, "GET", 500);
        return res.status(500).send(response);
    }
});

module.exports = router;