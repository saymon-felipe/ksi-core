const express = require('express');
const router = express.Router();
const login = require('../middleware/login');
const isAdmin = require('../middleware/isAdmin');
const uploadConfig = require('../config/upload');
const projectsService = require('../services/projectsService');
const projectCopyService = require('../services/projectCopyService');
const functions = require('../utils/functions');

const getImage = (req) => req.files && req.files.image ? req.files.image[0] : null;

// ================= ROTAS DE CATEGORIAS =================
router.get('/categories', async (req, res) => {
    try {
        const categories = await projectsService.getCategories();
        return res.status(200).send(functions.createResponse('Categorias recuperadas com sucesso', categories, 'GET', 200));
    } catch (error) {
        return res.status(500).send(functions.createResponse('Erro ao buscar categorias', error.message || error, 'GET', 500));
    }
});

router.post('/categories', login, isAdmin, async (req, res) => {
    try {
        const category = await projectsService.createCategory(req.body);
        return res.status(201).send(functions.createResponse('Categoria criada com sucesso', category, 'POST', 201));
    } catch (error) {
        return res.status(400).send(functions.createResponse('Erro ao criar categoria', error.message || error, 'POST', 400));
    }
});

router.put('/categories/:id', login, isAdmin, async (req, res) => {
    try {
        const category = await projectsService.updateCategory(req.params.id, req.body);
        return res.status(200).send(functions.createResponse('Categoria atualizada com sucesso', category, 'PUT', 200));
    } catch (error) {
        return res.status(400).send(functions.createResponse('Erro ao atualizar categoria', error.message || error, 'PUT', 400));
    }
});

router.delete('/categories/:id', login, isAdmin, async (req, res) => {
    try {
        await projectsService.deleteCategory(req.params.id);
        return res.status(200).send(functions.createResponse('Categoria excluída com sucesso', null, 'DELETE', 200));
    } catch (error) {
        return res.status(400).send(functions.createResponse('Erro ao excluir categoria', error.message || error, 'DELETE', 400));
    }
});

// ================= ROTAS DE TAGS =================
router.get('/tags', async (req, res) => {
    try {
        const tags = await projectsService.getTags();
        return res.status(200).send(functions.createResponse('Tags recuperadas com sucesso', tags, 'GET', 200));
    } catch (error) {
        return res.status(500).send(functions.createResponse('Erro ao buscar tags', error.message || error, 'GET', 500));
    }
});

router.post('/tags', login, isAdmin, async (req, res) => {
    try {
        const tag = await projectsService.createTag(req.body);
        return res.status(201).send(functions.createResponse('Tag criada com sucesso', tag, 'POST', 201));
    } catch (error) {
        return res.status(400).send(functions.createResponse('Erro ao criar tag', error.message || error, 'POST', 400));
    }
});

router.put('/tags/:id', login, isAdmin, async (req, res) => {
    try {
        const tag = await projectsService.updateTag(req.params.id, req.body);
        return res.status(200).send(functions.createResponse('Tag atualizada com sucesso', tag, 'PUT', 200));
    } catch (error) {
        return res.status(400).send(functions.createResponse('Erro ao atualizar tag', error.message || error, 'PUT', 400));
    }
});

router.delete('/tags/:id', login, isAdmin, async (req, res) => {
    try {
        await projectsService.deleteTag(req.params.id);
        return res.status(200).send(functions.createResponse('Tag excluída com sucesso', null, 'DELETE', 200));
    } catch (error) {
        return res.status(400).send(functions.createResponse('Erro ao excluir tag', error.message || error, 'DELETE', 400));
    }
});

// ================= ROTAS DE PROJETOS =================
router.get('/', async (req, res) => {
    try {
        const projects = await projectsService.getPublishedProjects();
        return res.status(200).send(functions.createResponse('Projetos recuperados com sucesso', projects, 'GET', 200));
    } catch (error) {
        return res.status(500).send(functions.createResponse('Erro ao buscar projetos', error.message || error, 'GET', 500));
    }
});

router.get('/admin', login, isAdmin, async (req, res) => {
    try {
        const projects = await projectsService.getAllProjects();
        return res.status(200).send(functions.createResponse('Projetos recuperados com sucesso', projects, 'GET', 200));
    } catch (error) {
        return res.status(500).send(functions.createResponse('Erro ao buscar projetos', error.message || error, 'GET', 500));
    }
});

router.get('/admin/:id', login, isAdmin, async (req, res) => {
    try {
        const project = await projectsService.getProjectById(req.params.id);
        if (!project) return res.status(404).send(functions.createResponse('Projeto não encontrado', null, 'GET', 404));
        return res.status(200).send(functions.createResponse('Projeto recuperado com sucesso', project, 'GET', 200));
    } catch (error) {
        return res.status(500).send(functions.createResponse('Erro ao buscar projeto', error.message || error, 'GET', 500));
    }
});

router.put('/admin/reorder', login, isAdmin, async (req, res) => {
    try {
        await projectsService.reorderProjects(req.body.ids);
        return res.status(200).send(functions.createResponse('Ordem dos projetos atualizada', null, 'PUT', 200));
    } catch (error) {
        return res.status(400).send(functions.createResponse('Erro ao reordenar projetos', error.message || error, 'PUT', 400));
    }
});

router.post('/generate-descriptions', login, isAdmin, async (req, res) => {
    try {
        const descriptions = await projectCopyService.generateDescriptions(req.body);
        return res.status(200).send(functions.createResponse('Descrições geradas com sucesso', descriptions, 'POST', 200));
    } catch (error) {
        const providerMessage = error.response?.data?.error?.message;
        console.error('Erro ao gerar descrições de projeto com IA:', providerMessage || error.message || error);
        const isValidationError = !error.response && !error.request;
        return res.status(isValidationError ? 400 : 502).send(functions.createResponse(
            isValidationError ? error.message : 'Não foi possível gerar as descrições com IA.',
            null,
            'POST',
            isValidationError ? 400 : 502
        ));
    }
});

router.post('/', login, isAdmin, uploadConfig.getUploadMiddleware(['image'], 'projects'), async (req, res) => {
    try {
        const id = await projectsService.createProject(req.body, getImage(req));
        return res.status(201).send(functions.createResponse('Projeto criado com sucesso', { id }, 'POST', 201));
    } catch (error) {
        return res.status(400).send(functions.createResponse('Erro ao criar projeto', error.message || error, 'POST', 400));
    }
});

router.put('/:id', login, isAdmin, uploadConfig.getUploadMiddleware(['image'], 'projects'), async (req, res) => {
    try {
        const id = await projectsService.updateProject(req.params.id, req.body, getImage(req));
        return res.status(200).send(functions.createResponse('Projeto atualizado com sucesso', { id }, 'PUT', 200));
    } catch (error) {
        return res.status(400).send(functions.createResponse('Erro ao atualizar projeto', error.message || error, 'PUT', 400));
    }
});

router.delete('/:id', login, isAdmin, async (req, res) => {
    try {
        await projectsService.deleteProject(req.params.id);
        return res.status(200).send(functions.createResponse('Projeto excluído com sucesso', null, 'DELETE', 200));
    } catch (error) {
        return res.status(400).send(functions.createResponse('Erro ao excluir projeto', error.message || error, 'DELETE', 400));
    }
});

module.exports = router;
