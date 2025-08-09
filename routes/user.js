const express = require('express');
const router = express.Router();
const login = require("../middleware/login");
const _usersService = require("../services/usersService");
const functions = require("../utils/functions");

// Criar um agendamento
router.post("/", login, validate.validateRequest(validate.schemas.appointments.create), validate.validateCompanyAccess, (req, res, next) => {
    _appointmentsService.create(
        req.headers['selected-company'],
        req.body.customer_id,
        req.body.customer_name,
        req.body.date,
        req.body.duration,
        req.body.observations,
        req.body.services,
        req.body.status
    ).then(() => {
        let response = functions.createResponse("Agendamento criado com sucesso", null, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    });
});

module.exports = router;