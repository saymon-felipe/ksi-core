require('dotenv').config();
const email = require('../config/email');

let sendEmail = {
    sendEmail: async function (emailHtml, emailTitle, to, replyTo) {
        const message = await email.sendMail({
            html: emailHtml,
            subject: emailTitle,
            from: process.env.USER_EMAIL,
            to: [to],
            replyTo: replyTo || undefined
        });
        console.log(`E-mail enviado: ${message.messageId}`);
        return true;
    }
}

module.exports = sendEmail;
