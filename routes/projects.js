const express = require('express');
const router = express.Router();
const login = require('../middleware/login');
const isAdmin = require('../middleware/isAdmin');
const uploadConfig = require('../config/upload');
const projectsService = require('../services/projectsService');
const functions = require('../utils/functions');

const getImage = (req) => req.files && req.files.image ? req.files.image[0] : null;

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
