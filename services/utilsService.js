const functions = require("../utils/functions");
const sendEmails = require("../config/sendEmail");
const emailTemplates = require("../templates/emailTemplates");

let utilsService = {
    sendContact: function (name, email, tel, obs, requestType, ip) {
        return new Promise(async (resolve, reject) => {
            let contatoId = await functions.executeSql(
                `
                    INSERT INTO
                        contatos_site
                        (
                            nome,
                            email,
                            tel,
                            obs,
                            tipo
                        )
                    VALUES
                        (?, ?, ?, ?, ?)
                `, [name, email, tel, obs, requestType]
            )

            if (contatoId) {
                let htmlReturnEmail = emailTemplates.contactReturn();
                let htmlAdminEmail = emailTemplates.contact(name, email, tel, obs, requestType, ip);

                sendEmails.sendEmail(htmlReturnEmail, "A Equipe KSI agradeçe o seu contato.", "ksikineticsolutions@gmail.com", email);
                sendEmails.sendEmail(htmlAdminEmail, "Contato de " + name + " pelo site da KSI.", "ksikineticsolutions@gmail.com", process.env.USER_EMAIL);
                sendEmails.sendEmail(htmlAdminEmail, "Contato de " + name + " pelo site da KSI.", "ksikineticsolutions@gmail.com", "linnubr@gmail.com");

                resolve();
            } else {
                reject("Ocorreu um erro ao enviar o contato");
            }
        })
    }
}

module.exports = utilsService;