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

        _utilsService.uploadVideo(req.usuario.id, req.body.title, req.body.description, thumbnailUrl, videoUrl).then(() => {
            let response = functions.createResponse("Video enviado com sucesso", null, "POST", 200);
            return res.status(200).send(response);
        }).catch((error) => {
            return res.status(500).send(error);
        });
});

router.patch(
    "/videos/:id", 
    login, 
    isAdmin, 
    uploadConfig.getUploadMiddleware(['thumbnail']),
    (req, res, next) => {
        const thumbnailFile = req.files['thumbnail'][0];
        const thumbnailUrl = thumbnailFile.location;

        _utilsService.editVideo(req.params.id, req.body.title, req.body.description, thumbnailUrl).then(() => {
            let response = functions.createResponse("Video salvo com sucesso", null, "PATCH", 200);
            return res.status(200).send(response);
        }).catch((error) => {
            return res.status(500).send(error);
        });
});

router.get(
    "/get-videos",
    (req, res, next) => {
        _utilsService.returnVideos().then((results) => {
            let response = functions.createResponse("Retorno dos videos", results, "GET", 200);
            return res.status(200).send(response);
        }).catch((error) => {
            return res.status(500).send(error);
        });
});

router.get(
    "/view-video/:id",
    (req, res, next) => {
        _utilsService.viewVideo(req.params.id).then(() => {
            let response = functions.createResponse("Video visualizado", null, "GET", 200);
            return res.status(200).send(response);
        }).catch((error) => {
            return res.status(500).send(error);
        });
});

router.get(
    "/get-video-comments/:id",
    (req, res, next) => {
        _utilsService.returnVideoComments(req.params.id).then((results) => {
            let response = functions.createResponse("Retorno dos comentários do video", results, "GET", 200);
            return res.status(200).send(response);
        }).catch((error) => {
            return res.status(500).send(error);
        });
});

router.post(
    "/post-comment/:id",
    login,
    (req, res, next) => {
        _utilsService.postComment(req.params.id, req.usuario.id, req.body.comment).then(() => {
            let response = functions.createResponse("Comentário enviado com sucesso", null, "POST", 200);
            return res.status(200).send(response);
        }).catch((error) => {
            return res.status(500).send(error);
        });
});

router.get(
    "/video-interaction-status/:id",
    login,
    (req, res, next) => {
        _utilsService.getVideoInteractionStatus(req.usuario.id, req.params.id).then((results) => {
            let response = functions.createResponse("Video visualizado", results, "GET", 200);
            return res.status(200).send(response);
        }).catch((error) => {
            return res.status(500).send(error);
        });
});

router.post(
    "/video-like/:id",
    login,
    (req, res, next) => {
        _utilsService.toggleLikeDeslike(req.usuario.id, req.params.id, "like").then((results) => {
            let response = functions.createResponse("Curtida realizada", null, "POST", 200);
            return res.status(200).send(response);
        }).catch((error) => {
            return res.status(500).send(error);
        });
});

router.post(
    "/video-deslike/:id",
    login,
    (req, res, next) => {
        _utilsService.toggleLikeDeslike(req.usuario.id, req.params.id, "deslike").then((results) => {
            let response = functions.createResponse("Não gostei realizado", null, "POST", 200);
            return res.status(200).send(response);
        }).catch((error) => {
            return res.status(500).send(error);
        });
});

router.delete(
    "/videos/:id",
    login,
    isAdmin, 
    (req, res, next) => {
        _utilsService.excludeVideo(req.params.id).then(() => {
            let response = functions.createResponse("Video excluido", null, "DELETE", 200);
            return res.status(200).send(response);
        }).catch((error) => {
            return res.status(500).send(error);
        });
});

module.exports = router;