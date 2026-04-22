const functions = require("../utils/functions");

let analyticsService = {
    trackVisit: function (data, ip, geoData) {
        return new Promise(async (resolve, reject) => {
            try {
                const query = `
                    INSERT INTO site_analytics 
                    (session_id, ip_address, page_url, utm_source, utm_medium, utm_campaign, country, region, city) 
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
                `;
                const values = [
                    data.session_id, ip, data.page_url, 
                    data.utm_source || null, data.utm_medium || null, data.utm_campaign || null,
                    geoData.country, geoData.regionName, geoData.city
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
                const visitasMes = await functions.executeSql(`SELECT COUNT(DISTINCT session_id) as total FROM site_analytics WHERE MONTH(visited_at) = MONTH(CURRENT_DATE()) AND YEAR(visited_at) = YEAR(CURRENT_DATE())`, []);
                const acessosBlog = await functions.executeSql(`SELECT COUNT(*) as total FROM blog_views`, []);
                const origens = await functions.executeSql(`SELECT utm_source, COUNT(*) as acessos FROM site_analytics WHERE utm_source IS NOT NULL GROUP BY utm_source ORDER BY acessos DESC LIMIT 5`, []);
                const localidades = await functions.executeSql(`SELECT city, region, country, COUNT(DISTINCT session_id) as acessos FROM site_analytics WHERE city IS NOT NULL GROUP BY city, region, country ORDER BY acessos DESC LIMIT 5`, []);
                const userStats = await functions.executeSql(`SELECT (SELECT COUNT(*) FROM usuarios) as total_users, (SELECT COUNT(*) FROM usuarios WHERE MONTH(data_registro) = MONTH(CURRENT_DATE()) AND YEAR(data_registro) = YEAR(CURRENT_DATE())) as new_users, (SELECT COUNT(*) FROM login_history WHERE MONTH(data_login) = MONTH(CURRENT_DATE()) AND YEAR(data_login) = YEAR(CURRENT_DATE())) as logins_mes`, []);
                
                const demografia = await functions.executeSql(`SELECT sexo, COUNT(*) as quantidade FROM usuarios WHERE sexo IS NOT NULL GROUP BY sexo ORDER BY quantidade DESC`, []);

                resolve({
                    visitasMes: visitasMes[0].total || 0,
                    acessosBlog: acessosBlog[0].total || 0,
                    origens: origens,
                    localidades: localidades,
                    demografia: demografia, 
                    users: {
                        total: userStats[0].total_users || 0,
                        novos_mes: userStats[0].new_users || 0,
                        logins_mes: userStats[0].logins_mes || 0
                    }
                });
            } catch (error) {
                reject(error);
            }
        });
    }
};

module.exports = analyticsService;