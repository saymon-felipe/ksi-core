const functions = require("../utils/functions");
const jwt = require('jsonwebtoken');
const axios = require("axios");

let userService = {
    login: function (googleToken) {
        return new Promise(async (resolve, reject) => {
            try {
                const { data } = await axios.post("https://oauth2.googleapis.com/token", null, {
                    params: {
                        client_id: process.env.GOOGLE_CLIENT_ID,
                        client_secret: process.env.GOOGLE_CLIENT_SECRET,
                        redirect_uri: "postmessage", 
                        grant_type: "authorization_code",
                        code: googleToken
                    }
                });

                const accessToken = data.access_token;

                const { data: peopleData } = await axios.get("https://people.googleapis.com/v1/people/me?personFields=names,emailAddresses,photos,genders,birthdays", {
                    headers: { Authorization: `Bearer ${accessToken}` }
                });

                const googleId = peopleData.resourceName.replace('people/', '');
                const nome = peopleData.names?.[0]?.displayName || "Usuário";
                const email = peopleData.emailAddresses?.[0]?.value;
                const imagem = peopleData.photos?.[0]?.url;
                
                let sexoDb = null;
                const googleGender = peopleData.genders?.[0]?.value;
                if (googleGender === 'male') sexoDb = 'Masculino';
                else if (googleGender === 'female') sexoDb = 'Feminino';
                else if (googleGender) sexoDb = 'Outro';

                let dataNascimento = null;
                if (peopleData.birthdays && peopleData.birthdays.length > 0) {
                    const bday = peopleData.birthdays.find(b => b.date && b.date.year) || peopleData.birthdays[0];
                    if (bday && bday.date && bday.date.year && bday.date.month && bday.date.day) {
                        const d = bday.date;
                        dataNascimento = `${d.year}-${d.month.toString().padStart(2, '0')}-${d.day.toString().padStart(2, '0')}`;
                    }
                }

                const results = await functions.executeSql(`SELECT * FROM usuarios WHERE codigo = ? OR email = ?`, [googleId, email]);
                let userId = results[0]?.id;
                let isAdmin = results[0]?.admin || 0;

                if (results.length === 0) {
                    let insertedUser = await functions.executeSql(
                        `INSERT INTO usuarios (codigo, nome, email, imagem, sexo, data_nascimento) VALUES (?, ?, ?, ?, ?, ?)`, 
                        [googleId, nome, email, imagem, sexoDb, dataNascimento]
                    );
                    userId = insertedUser.insertId;
                } else {
                    await functions.executeSql(
                        `UPDATE usuarios SET sexo = ?, data_nascimento = ?, imagem = ?, nome = ? WHERE id = ?`, 
                        [sexoDb, dataNascimento, imagem, nome, userId]
                    );
                }

                await functions.executeSql(`INSERT INTO login_history (usuario_id) VALUES (?)`, [userId]);

                let token = jwt.sign({
                    id: userId, nome: nome, email: email, imagem: imagem, admin: isAdmin
                }, process.env.JWT_KEY, { expiresIn: "8h" });

                resolve({
                    user: { id: userId, nome: nome, email: email, imagem: imagem, admin: isAdmin },
                    token: token
                });     
            } catch (error) {
                console.error("Erro no login do Google:", error.response?.data || error.message);
                reject(error);
            }
        });
    }
}

module.exports = userService;