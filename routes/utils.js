const express = require('express');
const router = express.Router();
const _utilsService = require("../services/utilsService");
const functions = require("../utils/functions");
const isAdmin = require("../middleware/isAdmin");
const login = require("../middleware/login");
const uploadConfig = require('../config/upload');

router.post("/contact", (req, res, next) => {
    _utilsService.sendContact(req.body.name, req.body.email, req.body.tel, req.body.obs, req.body.requestType, req.ip).then(() => {
        let response = functions.createResponse("Contato enviado com sucesso", null, "POST", 200);
        return res.status(200).send(response);
    }).catch((error) => {
        return res.status(500).send(error);
    });
});

router.post(
    "/videos", 
    login, 
    isAdmin, 
    uploadConfig.getUploadMiddleware(['thumbnail', 'video']),
    (req, res, next) => {
        const thumbnailFile = req.files['thumbnail'][0];
        const videoFile = req.files['video'][0];
        const thumbnailUrl = thumbnailFile.location;
        const videoUrl = videoFile.location;
            console.log(req.body)
        _utilsService.uploadVideo(req.usuario.id, req.body.title, req.body.description, thumbnailUrl, videoUrl).then(() => {
            let response = functions.createResponse("Video enviado com sucesso", null, "POST", 200);
            return res.status(200).send(response);
        }).catch((error) => {
            console.log(error)
            return res.status(500).send(error);
        });
});

module.exports = router;