const express = require('express');
const router = express.Router();
const uploadConfig = require('../config/upload');
const isAdmin = require('../middleware/isAdmin');
const login = require('../middleware/login');
const blogService = require('../services/blogService');
const functions = require('../utils/functions');

router.post('/upload-editor', login, isAdmin, uploadConfig.getUploadMiddleware(['upload']), async (req, res) => {
    try {
        if (!req.files || !req.files['upload']) {
            let response = functions.createResponse("Nenhum arquivo enviado", null, "POST", 400);
            return res.status(400).send(response);
        }
        
        const fileUrl = req.files['upload'][0].location;
        let response = functions.createResponse("Upload realizado com sucesso", { url: fileUrl }, "POST", 200);
        return res.status(200).send(response);
    } catch (error) {
        let response = functions.createResponse("Erro no upload", error.message || error, "POST", 500);
        return res.status(500).send(response);
    }
});

router.post('/ai-copywriter', login, isAdmin, async (req, res) => {
    try {
        const { prompt } = req.body;
        const generatedText = await blogService.generateAIText(prompt);
        
        let response = functions.createResponse("Texto gerado com sucesso", generatedText, "POST", 200);
        return res.status(200).send(response);
    } catch (error) {
        let response = functions.createResponse("Erro ao gerar texto com IA", error.message || error, "POST", 500);
        return res.status(500).send(response);
    }
});

router.post('/posts', login, isAdmin, async (req, res) => {
    try {
        const insertId = await blogService.createPost(req.body, req.usuario.id);
        
        let response = functions.createResponse("Post criado com sucesso", { id: insertId }, "POST", 201);
        return res.status(201).send(response);
    } catch (error) {
        let response = functions.createResponse("Erro ao salvar o post no banco de dados", error.message || error, "POST", 500);
        return res.status(500).send(response);
    }
});

router.get('/posts', async (req, res) => {
    try {
        const posts = await blogService.getPublishedPosts();
        
        let response = functions.createResponse("Posts recuperados com sucesso", posts, "GET", 200);
        return res.status(200).send(response);
    } catch (error) {
        let response = functions.createResponse("Erro ao buscar posts", error.message || error, "GET", 500);
        return res.status(500).send(response);
    }
});

router.get('/admin/posts', login, isAdmin, async (req, res) => {
    try {
        const posts = await blogService.getAllPosts();
        
        let response = functions.createResponse("Todos os posts recuperados", posts, "GET", 200);
        return res.status(200).send(response);
    } catch (error) {
        let response = functions.createResponse("Erro ao buscar posts", error.message || error, "GET", 500);
        return res.status(500).send(response);
    }
});

router.get('/posts/id/:id', login, isAdmin, async (req, res) => {
    try {
        const post = await blogService.getPostById(req.params.id);
        res.status(200).send(functions.createResponse("Sucesso", post, "GET", 200));
    } catch (error) {
        res.status(500).send(functions.createResponse("Erro", error, "GET", 500));
    }
});

router.put('/posts/:id', login, isAdmin, async (req, res) => {
    try {
        await blogService.updatePost(req.params.id, req.body);
        res.status(200).send(functions.createResponse("Post atualizado", null, "PUT", 200));
    } catch (error) {
        res.status(500).send(functions.createResponse("Erro ao atualizar", error, "PUT", 500));
    }
});

router.delete('/posts/:id', login, isAdmin, async (req, res) => {
    try {
        await blogService.deletePost(req.params.id);
        res.status(200).send(functions.createResponse("Post excluído", null, "DELETE", 200));
    } catch (error) {
        res.status(500).send(functions.createResponse("Erro ao excluir", error, "DELETE", 500));
    }
});

router.get('/posts/:slug', async (req, res) => {
    try {
        const clientIp = req.headers['x-forwarded-for'] || req.socket.remoteAddress;
        
        const post = await blogService.getPostBySlug(req.params.slug, clientIp);
        
        if (!post) {
            let response = functions.createResponse("Post não encontrado", null, "GET", 404);
            return res.status(404).send(response);
        }
        
        let response = functions.createResponse("Post recuperado com sucesso", post, "GET", 200);
        return res.status(200).send(response);
    } catch (error) {
        let response = functions.createResponse("Erro ao processar requisição do post", error.message || error, "GET", 500);
        return res.status(500).send(response);
    }
});

router.get('/categorias', async (req, res) => {
    try {
        const categorias = await blogService.getCategorias();
        res.status(200).send(functions.createResponse("Sucesso", categorias, "GET", 200));
    } catch (error) {
        res.status(500).send(functions.createResponse("Erro", error, "GET", 500));
    }
});

router.post('/categorias', login, isAdmin, async (req, res) => {
    try {
        const id = await blogService.createCategoria(req.body);
        res.status(201).send(functions.createResponse("Criado com sucesso", { id }, "POST", 201));
    } catch (error) {
        res.status(500).send(functions.createResponse("Erro", error, "POST", 500));
    }
});

router.delete('/categorias/:id', login, isAdmin, async (req, res) => {
    try {
        await blogService.deleteCategoria(req.params.id);
        res.status(200).send(functions.createResponse("Deletado com sucesso", null, "DELETE", 200));
    } catch (error) {
        res.status(500).send(functions.createResponse("Erro", error, "DELETE", 500));
    }
});

module.exports = router;