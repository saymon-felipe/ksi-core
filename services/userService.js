const functions = require("../utils/functions");
const bcrypt = require('bcrypt');
const sendEmails = require("../config/sendEmail");
const emailTemplates = require("../templates/emailTemplates");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');

let userService = {
    register: function (name, email, password) {
        return new Promise((resolve, reject) => {
            bcrypt.hash(password, 10, (errBcrypt, hash) => {
                if (errBcrypt) {
                    reject(errBcrypt);
                }

                functions.executeSql(
                    `
                        INSERT INTO
                            users
                            (name, email, password)
                        VALUES
                            (?, ?, ?)
                    `, [
                        name, 
                        email, 
                        hash
                    ]
                ).then((results2) => {

                    let createdUser = {
                        id: results2.insertId,
                        email: email
                    }

                    resolve(createdUser);
                }).catch((error2) => {
                    reject(error2);
                })
            });     
        })
    },
    login: function (email, password) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    SELECT
                        *
                    FROM
                        users
                    WHERE
                        email = ?
                `, [email]
            ).then((results) => {
                if (results.length < 1) {
                    reject("Falha na autenticação");
                } else {
                    bcrypt.compare(password, results[0].password, (error2, result) => {
                        if (error2) {
                            reject("Falha na autenticação");
                        }

                        if (result) {
                            let token = jwt.sign({
                                id: results[0].id,
                                email: results[0].email,
                                name: results[0].name
                            }, 
                            process.env.JWT_KEY,
                            {
                                expiresIn: "8h"
                            })

                            resolve({jwtToken: token, id: results[0].id});
                        }

                        reject("Falha na autenticação");
                    });
                }
            }).catch((error) => {
                reject(error);
            })
        })
    },
    googleLogin: function (user_id) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    SELECT
                        *
                    FROM
                        users
                    WHERE
                        id = ?
                `, [user_id]
            ).then((results) => {
                let token = jwt.sign({
                    id: user_id,
                    email: results[0].email,
                    name: results[0].name
                }, 
                process.env.JWT_KEY,
                {
                    expiresIn: "8h"
                })

                resolve(token);
            }).catch((error) => {
                reject(error);
            })
        })
    },
    checkJwt: function (tokenParam) {
        return new Promise((resolve, reject) => {
            let token = tokenParam.split(" ")[1];
            jwt.verify(token, process.env.JWT_KEY, (err, decoded) => {
                if (err) {
                    reject("Token inválido");
                } else {
                    let newToken = jwt.sign({
                        id: decoded.id,
                        email: decoded.email,
                        name: decoded.name
                    }, process.env.JWT_KEY, {expiresIn: "8h"});
                    
                    resolve(newToken);
                }
            })
        })
    },
    returnUser: function (user_id, company_id, clearCache = false) {
        return new Promise((resolve, reject) => {
            let companySQL = `
                SELECT
                    c.id
                FROM
                    companies c
                INNER JOIN
                    company_members cm ON cm.company_id = c.id
                WHERE
                    cm.user_id = ${user_id}
            `;

            functions.executeSql(companySQL, []).then((companies) => {
                if (!company_id && companies.length) {
                    company_id = companies[0].id;
                }

                functions.executeSql(
                    `
                        SELECT
                            u.id,
                            u.name,
                            u.email,
                            u.url_photo,
                            u.tel,
                            u.zip_code,
                            u.address,
                            u.city,
                            u.state,
                            (SELECT ccr.permission FROM config_company_roles ccr INNER JOIN config_users_roles cur ON cur.role_id = ccr.id WHERE ccr.company_id = ? AND cur.user_id = ?) AS permission
                        FROM
                            users u
                        WHERE
                            u.id = ?
                    `, [company_id, user_id, user_id], !clearCache, 60
                ).then((results) => {
                    this.returnUserCompanies(user_id).then((results2) => {
                        let user = {
                            id: results[0].id,
                            name: results[0].name,
                            email: results[0].email,
                            url_photo: results[0].url_photo,
                            tel: results[0].tel,
                            zip_code: results[0].zip_code,
                            address: results[0].address,
                            city: results[0].city,
                            state: results[0].state,
                            country: results[0].country,
                            companies: results2,
                            permission: results[0].permission
                        }
    
                        resolve(user);
                    }).catch((error) => {
                        reject(error);
                    })
                }).catch((error) => {
                    reject(error);
                })
            }).catch((error) => {
                reject(error);
            })
        })
    }
}

module.exports = userService;