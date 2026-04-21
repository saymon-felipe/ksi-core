// services/analyticsService.js
const functions = require("../utils/functions");

let analyticsService = {
    trackVisit: function (data, ip) {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    INSERT INTO site_analytics 
                    (session_id, ip_address, page_url, utm_source, utm_medium, utm_campaign) 
                    VALUES (?, ?, ?, ?, ?, ?)
                `;
                const values = [
                    data.session_id, ip, data.page_url, 
                    data.utm_source || null, data.utm_medium || null, data.utm_campaign || null
                ];
                
                await functions.executeSql(query, values);
                resolve(true);
            } catch (error) {
                reject(error);
            }
        });
    },

    getDashboardStats: function () {
        return new Promise(async (resolve, reject) => {
            try {
                const visitasMes = await functions.executeSql(`
                    SELECT COUNT(DISTINCT session_id) as total 
                    FROM site_analytics 
                    WHERE MONTH(visited_at) = MONTH(CURRENT_DATE()) 
                    AND YEAR(visited_at) = YEAR(CURRENT_DATE())
                `, []);

                const acessosBlog = await functions.executeSql(`
                    SELECT COUNT(*) as total FROM blog_views
                `, []);

                const origens = await functions.executeSql(`
                    SELECT utm_source, COUNT(*) as acessos 
                    FROM site_analytics 
                    WHERE utm_source IS NOT NULL 
                    GROUP BY utm_source 
                    ORDER BY acessos DESC LIMIT 5
                `, []);

                resolve({
                    visitasMes: visitasMes[0].total || 0,
                    acessosBlog: acessosBlog[0].total || 0,
                    origens: origens
                });
            } catch (error) {
                reject(error);
            }
        });
    }
};

module.exports = analyticsService;