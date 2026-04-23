const express = require('express');
const router = express.Router();
const login = require("../middleware/login");
const _usersService = require("../services/usersService");
const functions = require("../utils/functions");
const jwt = require('jsonwebtoken');

router.post("/google-login", (req, res, next) => {
    _usersService.login(req.body.token).then((results) => {
        res.cookie('jwtToken', results.token, {
            httpOnly: true, 
            secure: true,
            sameSite: 'None',
            maxAge: 28800000
        });

        let response = functions.createResponse("Usuário autenticado com sucesso", results, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    });
});

router.get("/", login, async (req, res, next) => {
    try {
        const results = await functions.executeSql('SELECT * FROM usuarios WHERE id = ?', [req.usuario.id]);
        
        if (results.length === 0) {
            return res.status(404).send(functions.createResponse("Usuário não encontrado", null, "GET", 404));
        }

        const dbUser = results[0];

        let token = jwt.sign({
            id: dbUser.id,
            nome: dbUser.nome,
            email: dbUser.email,
            imagem: dbUser.imagem,
            admin: dbUser.admin || 0
        }, 
        process.env.JWT_KEY,
        { expiresIn: "8h" });

        res.cookie('jwtToken', token, {
            httpOnly: true, 
            secure: true,
            sameSite: 'None',
            maxAge: 28800000
        });

        let returnObj = {
            id: dbUser.id,
            nome: dbUser.nome,
            email: dbUser.email,
            imagem: dbUser.imagem,
            admin: dbUser.admin || 0
        };

        let response = functions.createResponse("Retorno do usuário", returnObj, "GET", 200);
        return res.status(200).send(response);
    } catch (error) {
        return res.status(500).send(functions.createResponse("Erro ao buscar usuário", error, "GET", 500));
    }
});

router.get('/logout', (req, res) => {
    res.clearCookie('jwtToken');
    let response = functions.createResponse("Logout bem sucedido", null, "GET", 200);
    return res.status(200).send(response);
});

module.exports = router;