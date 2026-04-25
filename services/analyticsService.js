const functions = require("../utils/functions");

let analyticsService = {
    trackVisit: function (data, ip, geoData) {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    INSERT INTO site_analytics 
                    (session_id, ip_address, page_url, utm_source, utm_medium, utm_campaign, country, region, city, user_agent, device_type, browser, os) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const values = [
                    data.session_id, ip, data.page_url, 
                    data.utm_source || null, data.utm_medium || null, data.utm_campaign || null,
                    geoData.country, geoData.regionName, geoData.city,
                    data.user_agent, data.device_type, data.browser, data.os
                ];
                
                await functions.executeSql(query, values);
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    },

    updateEngagementMetrics: function (sessionId, pageUrl, duration, maxScroll, clicks, quadrants) {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    UPDATE site_analytics 
                    SET duration_seconds = ?, 
                        max_scroll_percentage = GREATEST(max_scroll_percentage, ?), 
                        clicks_data = ?, 
                        quadrant_data = ? 
                    WHERE session_id = ? AND page_url = ? 
                    ORDER BY id DESC LIMIT 1
                `;
                const values = [
                    duration, 
                    maxScroll, 
                    JSON.stringify(clicks), 
                    JSON.stringify(quadrants), 
                    sessionId, 
                    pageUrl
                ];
                
                await functions.executeSql(query, values);
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    },

    getDashboardStats: function (periodo = 'mes', cidade = 'todas') {
        return new Promise(async (resolve, reject) => {
            try {
                let interval, groupBy, dateFormat;

                switch (periodo) {
                    case 'dia':
                        interval = 'INTERVAL 24 HOUR';
                        groupBy = 'HOUR(visited_at)';
                        dateFormat = '%H:00';
                        break;
                    case 'semana':
                        interval = 'INTERVAL 7 DAY';
                        groupBy = 'DATE(visited_at)';
                        dateFormat = '%d/%m';
                        break;
                    case 'mes':
                    default:
                        interval = 'INTERVAL 30 DAY';
                        groupBy = 'DATE(visited_at)';
                        dateFormat = '%d/%m';
                        break;
                }

                let cityCondition = "";
                let queryParams = [];
                if (cidade && cidade !== 'todas') {
                    cityCondition = " AND city = ?";
                    queryParams.push(cidade);
                }

                const allCities = await functions.executeSql(`SELECT DISTINCT city, region, country FROM site_analytics WHERE city IS NOT NULL AND visited_at >= NOW() - ${interval} ORDER BY city ASC`, []);

                const visitas = await functions.executeSql(`SELECT COUNT(DISTINCT session_id) as total FROM site_analytics WHERE visited_at >= NOW() - ${interval} ${cityCondition}`, queryParams);
                
                const acessosBlog = await functions.executeSql(`SELECT COUNT(*) as total FROM blog_views`, []); 
                
                const timeline = await functions.executeSql(`SELECT DATE_FORMAT(visited_at, '${dateFormat}') as label, COUNT(DISTINCT session_id) as acessos FROM site_analytics WHERE visited_at >= NOW() - ${interval} ${cityCondition} GROUP BY ${groupBy} ORDER BY visited_at ASC`, queryParams);

                const paginasData = await functions.executeSql(`SELECT page_url, COUNT(id) as visualizacoes, COUNT(DISTINCT session_id) as sessoes, AVG(duration_seconds) as retencao FROM site_analytics WHERE visited_at >= NOW() - ${interval} ${cityCondition} GROUP BY page_url ORDER BY visualizacoes DESC LIMIT 15`, queryParams);
                
                const clicksDataRows = await functions.executeSql(`SELECT page_url, clicks_data FROM site_analytics WHERE clicks_data IS NOT NULL AND visited_at >= NOW() - ${interval} ${cityCondition}`, queryParams);
                
                let pageEvents = {};
                clicksDataRows.forEach(row => {
                    try {
                        let clicks = typeof row.clicks_data === 'string' ? JSON.parse(row.clicks_data) : row.clicks_data;
                        let sum = 0;
                        if (clicks) {
                            Object.values(clicks).forEach(v => sum += Number(v));
                        }
                        pageEvents[row.page_url] = (pageEvents[row.page_url] || 0) + sum;
                    } catch(e) {}
                });

                const paginas = paginasData.map(p => ({
                    page_url: p.page_url,
                    visualizacoes: p.visualizacoes,
                    sessoes: p.sessoes,
                    retencao: Math.round(p.retencao || 0),
                    eventos: pageEvents[p.page_url] || 0
                }));

                const origens = await functions.executeSql(`SELECT utm_source, COUNT(*) as acessos FROM site_analytics WHERE utm_source IS NOT NULL AND visited_at >= NOW() - ${interval} ${cityCondition} GROUP BY utm_source ORDER BY acessos DESC LIMIT 5`, queryParams);
                const localidades = await functions.executeSql(`SELECT city, region, country, COUNT(DISTINCT session_id) as acessos FROM site_analytics WHERE city IS NOT NULL AND visited_at >= NOW() - ${interval} ${cityCondition} GROUP BY city, region, country ORDER BY acessos DESC LIMIT 5`, queryParams);

                const devices = await functions.executeSql(`SELECT device_type, COUNT(DISTINCT session_id) as acessos FROM site_analytics WHERE device_type IS NOT NULL AND visited_at >= NOW() - ${interval} ${cityCondition} GROUP BY device_type ORDER BY acessos DESC`, queryParams);
                const browsers = await functions.executeSql(`SELECT browser, COUNT(DISTINCT session_id) as acessos FROM site_analytics WHERE browser IS NOT NULL AND browser != 'Unknown' AND visited_at >= NOW() - ${interval} ${cityCondition} GROUP BY browser ORDER BY acessos DESC LIMIT 5`, queryParams);
                const os = await functions.executeSql(`SELECT os, COUNT(DISTINCT session_id) as acessos FROM site_analytics WHERE os IS NOT NULL AND os != 'Unknown' AND visited_at >= NOW() - ${interval} ${cityCondition} GROUP BY os ORDER BY acessos DESC LIMIT 5`, queryParams);

                const engagement = await functions.executeSql(`SELECT AVG(duration_seconds) as avg_duration, AVG(max_scroll_percentage) as avg_scroll FROM site_analytics WHERE duration_seconds > 0 AND visited_at >= NOW() - ${interval} ${cityCondition}`, queryParams);

                const quadrantsData = await functions.executeSql(`SELECT quadrant_data FROM site_analytics WHERE quadrant_data IS NOT NULL AND visited_at >= NOW() - ${interval} ${cityCondition}`, queryParams);
                let totalQ = { q1: 0, q2: 0, q3: 0, q4: 0 };
                quadrantsData.forEach(row => {
                    try {
                        let parsed = typeof row.quadrant_data === 'string' ? JSON.parse(row.quadrant_data) : row.quadrant_data;
                        if (parsed) {
                            totalQ.q1 += parsed.q1 || 0; totalQ.q2 += parsed.q2 || 0;
                            totalQ.q3 += parsed.q3 || 0; totalQ.q4 += parsed.q4 || 0;
                        }
                    } catch (e) {}
                });
                const totalTimeQuadrants = totalQ.q1 + totalQ.q2 + totalQ.q3 + totalQ.q4;
                const quadrantsPerc = totalTimeQuadrants > 0 ? {
                    q1: Math.round((totalQ.q1 / totalTimeQuadrants) * 100), q2: Math.round((totalQ.q2 / totalTimeQuadrants) * 100),
                    q3: Math.round((totalQ.q3 / totalTimeQuadrants) * 100), q4: Math.round((totalQ.q4 / totalTimeQuadrants) * 100),
                } : { q1: 0, q2: 0, q3: 0, q4: 0 };

                const userStats = await functions.executeSql(`SELECT (SELECT COUNT(*) FROM usuarios) as total_users, (SELECT COUNT(*) FROM usuarios WHERE data_registro >= NOW() - ${interval}) as new_users, (SELECT COUNT(*) FROM login_history WHERE data_login >= NOW() - ${interval}) as logins_periodo`, []);
                const demografia = await functions.executeSql(`SELECT sexo, COUNT(*) as quantidade FROM usuarios WHERE sexo IS NOT NULL GROUP BY sexo ORDER BY quantidade DESC`, []);

                resolve({
                    filtroCidades: allCities, 
                    visitasPeriodo: visitas[0].total || 0,
                    acessosBlog: acessosBlog[0].total || 0,
                    paginas: paginas, 
                    timeline: timeline,
                    origens: origens,
                    localidades: localidades,
                    demografia: demografia,
                    tecnologia: { devices, browsers, os },
                    engajamento: {
                        avg_duration: Math.round(engagement[0]?.avg_duration || 0),
                        avg_scroll: Math.round(engagement[0]?.avg_scroll || 0),
                        quadrants: quadrantsPerc
                    },
                    users: {
                        total: userStats[0].total_users || 0,
                        novos_periodo: userStats[0].new_users || 0,
                        logins_periodo: userStats[0].logins_periodo || 0
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
};

module.exports = analyticsService;