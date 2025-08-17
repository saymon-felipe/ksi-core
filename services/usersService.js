const functions = require("../utils/functions");
const bcrypt = require('bcrypt');
const sendEmails = require("../config/sendEmail");
const emailTemplates = require("../templates/emailTemplates");
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const axios = require("axios");

let userService = {
    login: function (googleToken) {
        return new Promise(async (resolve, reject) => {
            try {
                const { data } = await axios.post("https://oauth2.googleapis.com/token", null, {
                    params: {
                        client_id: process.env.GOOGLE_CLIENT_ID,
                        client_secret: process.env.GOOGLE_CLIENT_SECRET,
                        redirect_uri: process.env.URL_SITE,
                        grant_type: "authorization_code",
                        code: googleToken
                    }
                });

                const accessToken = data.access_token;

                const { data: userInfo } = await axios.get("https://www.googleapis.com/oauth2/v2/userinfo", {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                const results = await functions.executeSql(
                    `
                        SELECT
                            *
                        FROM
                            usuarios
                        WHERE
                            codigo = ?
                    `, [userInfo.id]
                )

                let userId = results[0]?.id;

                if (results.length == 0) {
                    let insertedUser = await functions.executeSql(
                        `
                            INSERT INTO
                                usuarios
                                (codigo, nome, email, imagem)
                            VALUES
                                (?, ?, ?, ?)
                        `, [userInfo.id, userInfo.given_name, userInfo.email, userInfo.picture]
                    )

                    userId = insertedUser.insertId;
                }

                let token = jwt.sign({
                    id: userId,
                    nome: userInfo.given_name,
                    email: userInfo.email,
                    imagem: userInfo.picture
                }, 
                process.env.JWT_KEY,
                {
                    expiresIn: "8h"
                })

                let returnObj = {
                    user: {
                        id: userId,
                        nome: userInfo.given_name,
                        email: userInfo.email,
                        imagem: userInfo.picture
                    },
                    token: token
                }

                resolve(returnObj);     
            } catch (error) {
                reject(error)
            }
        })
    }
}

module.exports = userService;