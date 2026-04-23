const express = require('express');
const router = express.Router();
const uploadConfig = require('../config/upload');
const isAdmin = require('../middleware/isAdmin');
const login = require('../middleware/login');
const blogService = require('../services/blogService');
const functions = require('../utils/functions');

const aiJobs = new Map();

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

router.post('/ai-copywriter', login, isAdmin, (req, res) => {
    try {
        const { prompt } = req.body;
        const jobId = Date.now().toString();
        
        aiJobs.set(jobId, { status: 'processing', result: null, error: null });

        blogService.generateAIText(prompt)
            .then(generatedText => {
                aiJobs.set(jobId, { status: 'completed', result: generatedText });
            })
            .catch(error => {
                console.error("Erro no processamento background da IA:", error);
                aiJobs.set(jobId, { status: 'error', error: error.message || error });
            });
        
        let response = functions.createResponse("Processamento iniciado", { jobId }, "POST", 202);
        return res.status(202).send(response);
    } catch (error) {
        let response = functions.createResponse("Erro ao iniciar IA", error.message || error, "POST", 500);
        return res.status(500).send(response);
    }
});

router.get('/ai-copywriter/status/:jobId', login, isAdmin, (req, res) => {
    const job = aiJobs.get(req.params.jobId);

    if (!job) {
        let response = functions.createResponse("Job não encontrado", null, "GET", 404);
        return res.status(404).send(response);
    }

    if (job.status === 'completed') {
        const data = job.result;
        aiJobs.delete(req.params.jobId); 
        let response = functions.createResponse("Texto gerado com sucesso", data, "GET", 200);
        return res.status(200).send(response);
    }

    if (job.status === 'error') {
        const err = job.error;
        aiJobs.delete(req.params.jobId); 
        let response = functions.createResponse("Erro na IA", err, "GET", 500);
        return res.status(500).send(response);
    }

    let response = functions.createResponse("Processando", { status: 'processing' }, "GET", 200);
    return res.status(200).send(response);
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

router.get('/posts/:id/comentarios', async (req, res) => {
    try {
        const comentarios = await blogService.getComentarios(req.params.id);
        res.status(200).send(functions.createResponse("Sucesso", comentarios, "GET", 200));
    } catch (error) {
        res.status(500).send(functions.createResponse("Erro", error, "GET", 500));
    }
});

router.post('/posts/:id/comentarios', login, async (req, res) => {
    try {
        const { comentario } = req.body;
        await blogService.addComentario(req.params.id, req.usuario.id, comentario);
        res.status(201).send(functions.createResponse("Comentário adicionado", null, "POST", 201));
    } catch (error) {
        res.status(500).send(functions.createResponse("Erro", error, "POST", 500));
    }
});

router.get('/posts/:id/interacoes', async (req, res) => {
    try {
        let userId = null;
        if (req.cookies && req.cookies.jwtToken) {
            const jwt = require('jsonwebtoken');
            try {
                const decoded = jwt.verify(req.cookies.jwtToken, process.env.JWT_KEY);
                userId = decoded.id;
            } catch (e) {}
        }
        
        const interacoes = await blogService.getInteracoesResumo(req.params.id, userId);
        res.status(200).send(functions.createResponse("Sucesso", interacoes, "GET", 200));
    } catch (error) {
        res.status(500).send(functions.createResponse("Erro", error, "GET", 500));
    }
});

router.post('/posts/:id/like', login, async (req, res) => {
    try {
        const result = await blogService.toggleLike(req.params.id, req.usuario.id);
        res.status(200).send(functions.createResponse("Sucesso", result, "POST", 200));
    } catch (error) {
        res.status(500).send(functions.createResponse("Erro", error, "POST", 500));
    }
});

router.post('/posts/:id/share', async (req, res) => {
    try {
        await blogService.addCompartilhamento(req.params.id);
        res.status(200).send(functions.createResponse("Sucesso", null, "POST", 200));
    } catch (error) {
        res.status(500).send(functions.createResponse("Erro", error, "POST", 500));
    }
});

router.get('/admin/comentarios', login, isAdmin, async (req, res) => {
    try {
        const comentarios = await blogService.getAllComentariosAdmin();
        res.status(200).send(functions.createResponse("Sucesso", comentarios, "GET", 200));
    } catch (error) {
        res.status(500).send(functions.createResponse("Erro", error, "GET", 500));
    }
});

router.delete('/admin/comentarios/:id', login, isAdmin, async (req, res) => {
    try {
        await blogService.deleteComentario(req.params.id);
        res.status(200).send(functions.createResponse("Comentário deletado", null, "DELETE", 200));
    } catch (error) {
        res.status(500).send(functions.createResponse("Erro", error, "DELETE", 500));
    }
});

module.exports = router;