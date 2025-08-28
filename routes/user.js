const express = require('express');
const router = express.Router();
const login = require("../middleware/login");
const _usersService = require("../services/usersService");
const functions = require("../utils/functions");

router.post("/login", (req, res, next) => {
    _usersService.login(req.body.token).then((results) => {
        res.cookie('jwtToken', results.token, {
            httpOnly: true, // Isso torna o cookie inacessível via JavaScript
            secure: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test', // Use 'secure' apenas em HTTPS
            sameSite: process.env.NODE_ENV === 'production' || process.env.NODE_ENV === 'test' ? 'None' : 'strict',
            maxAge: 28800000 // Tempo de expiração do cookie em milissegundos (8 horas)
        });

        let response = functions.createResponse("Usuário autenticado com sucesso", results.user, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    });
});

router.get("/", login, (req, res, next) => {
    let response = functions.createResponse("Retorno do usuário", req.usuario, "GET", 200);
    return res.status(200).send(response);
})

router.get('/logout', (req, res) => {
  res.clearCookie('jwtToken');

  let response = functions.createResponse("Logout bem sucedido", null, "GET", 200);
    return res.status(200).send(response);
});

module.exports = router;