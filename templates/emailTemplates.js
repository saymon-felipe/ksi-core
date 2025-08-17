require('dotenv').config();
const contactReturn = require("./html/contact-return");
const contactHtml = require("./html/contact");

let templates = {
    contactReturn: function () {
        return contactReturn;
    },
    contact: function (name, email, tel, obs, requestType, ip) {
        let date = new Date();
        let now = `${date.getDate()}/${date.getMonth() - 1}/${date.getFullYear()} ${date.getHours()}:${date.getMinutes()}:${date.getSeconds()}`;
        let html = contactHtml.replace("{name}", name).replace("{email}", email).replace("{tel}", tel).replace("{obs}", obs).replace("{requestType}", requestType).replace("{ip}", ip).replace("{date}", now);
        return html;
    }
}

module.exports = templates;