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
            } catch (e) {}
        }

        const userAgent = req.headers['user-agent'] || '';
        const deviceType = /Mobile|Android|iP(hone|od|ad)/i.test(userAgent) ? 'Mobile' : 'Desktop';
        
        let browser = 'Unknown';
        if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('SamsungBrowser')) browser = 'Samsung Internet';
        else if (userAgent.includes('Opera') || userAgent.includes('OPR')) browser = 'Opera';
        else if (userAgent.includes('Edg')) browser = 'Edge';
        else if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Safari')) browser = 'Safari';

        let os = 'Unknown';
        if (userAgent.includes('Win')) os = 'Windows';
        else if (userAgent.includes('Mac')) os = 'MacOS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('like Mac')) os = 'iOS';

        const clientData = {
            ...req.body,
            user_agent: userAgent,
            device_type: deviceType,
            browser: browser,
            os: os
        };

        await analyticsService.trackVisit(clientData, clientIp, geoData);
        res.status(200).send({ success: true });
    } catch (error) {
        res.status(500).send({ success: false });
    }
});

router.post('/metrics', async (req, res) => {
    try {
        const payload = req.body.data ? JSON.parse(req.body.data) : req.body;

        const { session_id, page_url, duration, maxScroll, clicks, quadrants } = payload;
        
        await analyticsService.updateEngagementMetrics(session_id, page_url, duration, maxScroll, clicks, quadrants);
        
        res.status(200).send({ success: true });
    } catch (error) {
        console.error("Erro ao salvar métricas:", error);
        res.status(500).send({ success: false });
    }
});

router.get('/dashboard', login, isAdmin, async (req, res) => {
    try {
        const { periodo, cidade } = req.query; 
        const stats = await analyticsService.getDashboardStats(periodo, cidade);
        let response = functions.createResponse("Métricas carregadas", stats, "GET", 200);
        return res.status(200).send(response);
    } catch (error) {
        let response = functions.createResponse("Erro ao carregar métricas", error.message, "GET", 500);
        return res.status(500).send(response);
    }
});

module.exports = router;