const express = require('express');
const router = express.Router();
const _utilsService = require("../services/utilsService");
const functions = require("../utils/functions");

router.post("/contact", (req, res, next) => {
    _utilsService.sendContact(req.body.name, req.body.email, req.body.tel, req.body.obs, req.body.requestType, req.ip).then(() => {
        let response = functions.createResponse("Contato enviado com sucesso", null, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    });
});
module.exports = router;