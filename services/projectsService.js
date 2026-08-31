const functions = require('../utils/functions');
const uploadConfig = require('../config/upload');

const normalizeTags = (tags) => {
    if (Array.isArray(tags)) return tags.filter(Boolean).map(tag => String(tag).trim()).filter(Boolean);
    if (typeof tags !== 'string') return [];

    try {
        const parsed = JSON.parse(tags);
        if (Array.isArray(parsed)) return parsed.filter(Boolean).map(tag => String(tag).trim()).filter(Boolean);
    } catch (_) {
        // The admin also accepts comma-separated tags.
    }

    return tags.split(',').map(tag => tag.trim()).filter(Boolean);
};

const mapProject = (project) => ({
    ...project,
    published: Boolean(project.published),
    tags: normalizeTags(project.tags)
});

const validateProject = (project) => {
    const requiredFields = ['title', 'category', 'description'];
    const missing = requiredFields.find(field => !String(project[field] || '').trim());
    if (missing) throw new Error('Título, categoria e descrição são obrigatórios.');
};

const getProjectById = async (id) => {
    const rows = await functions.executeSql(
        `SELECT id, titulo AS title, categoria AS category, descricao AS description,
                imagem_url AS image, imagem_key AS imageKey, link, tags,
                publicado AS published, ordem AS displayOrder
         FROM portfolio_projetos WHERE id = ?`,
        [id]
    );
    return rows.length ? mapProject(rows[0]) : null;
};

const saveProject = async (project, imageFile, id = null) => {
    validateProject(project);

    const current = id ? await getProjectById(id) : null;
    if (id && !current) throw new Error('Projeto não encontrado.');
    if (!current && !imageFile) throw new Error('Envie uma imagem para o projeto.');

    const imageUrl = imageFile ? imageFile.location : current.image;
    const imageKey = imageFile ? imageFile.s3Key : current.imageKey;
    const tags = JSON.stringify(normalizeTags(project.tags));
    const link = String(project.link || '').trim() || null;
    const published = project.published === true || project.published === 'true' || project.published === '1' ? 1 : 0;
    const displayOrder = current
        ? current.displayOrder
        : (await functions.executeSql('SELECT COALESCE(MAX(ordem), 0) + 1 AS nextOrder FROM portfolio_projetos'))[0].nextOrder;

    if (id) {
        await functions.executeSql(
            `UPDATE portfolio_projetos
             SET titulo = ?, categoria = ?, descricao = ?, imagem_url = ?, imagem_key = ?,
                 link = ?, tags = ?, publicado = ?, ordem = ?
             WHERE id = ?`,
            [project.title.trim(), project.category.trim(), project.description.trim(), imageUrl, imageKey,
             link, tags, published, displayOrder, id]
        );

        if (imageFile && current.imageKey && current.imageKey !== imageKey) {
            try { await uploadConfig.deleteFromS3(current.imageKey); } catch (error) {
                console.error('Não foi possível remover a imagem anterior do projeto:', error.message || error);
            }
        }
        return Number(id);
    }

    const result = await functions.executeSql(
        `INSERT INTO portfolio_projetos
         (titulo, categoria, descricao, imagem_url, imagem_key, link, tags, publicado, ordem)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [project.title.trim(), project.category.trim(), project.description.trim(), imageUrl, imageKey,
         link, tags, published, displayOrder]
    );
    return result.insertId;
};

module.exports = {
    getPublishedProjects: async () => {
        const rows = await functions.executeSql(
            `SELECT id, titulo AS title, categoria AS category, descricao AS description,
                    imagem_url AS image, link, tags, publicado AS published, ordem AS displayOrder
             FROM portfolio_projetos
             WHERE publicado = 1
             ORDER BY ordem ASC, id DESC`,
            []
        );
        return rows.map(mapProject);
    },
    getAllProjects: async () => {
        const rows = await functions.executeSql(
            `SELECT id, titulo AS title, categoria AS category, descricao AS description,
                    imagem_url AS image, imagem_key AS imageKey, link, tags,
                    publicado AS published, ordem AS displayOrder
             FROM portfolio_projetos ORDER BY ordem ASC, id DESC`
        );
        return rows.map(mapProject);
    },
    getProjectById,
    createProject: (project, imageFile) => saveProject(project, imageFile),
    updateProject: (id, project, imageFile) => saveProject(project, imageFile, id),
    deleteProject: async (id) => {
        const project = await getProjectById(id);
        if (!project) throw new Error('Projeto não encontrado.');
        await functions.executeSql('DELETE FROM portfolio_projetos WHERE id = ?', [id]);
        if (project.imageKey) {
            try { await uploadConfig.deleteFromS3(project.imageKey); } catch (error) {
                console.error('Não foi possível remover a imagem do projeto:', error.message || error);
            }
        }
    },
    reorderProjects: async (ids) => {
        if (!Array.isArray(ids) || !ids.length) throw new Error('Informe a nova ordem dos projetos.');

        const projectIds = ids.map(Number);
        if (projectIds.some((id) => !Number.isInteger(id) || id <= 0) || new Set(projectIds).size !== projectIds.length) {
            throw new Error('A lista de projetos é inválida.');
        }

        const rows = await functions.executeSql('SELECT id FROM portfolio_projetos WHERE id IN (?)', [projectIds]);
        if (rows.length !== projectIds.length) throw new Error('Um ou mais projetos não foram encontrados.');

        await Promise.all(projectIds.map((id, index) =>
            functions.executeSql('UPDATE portfolio_projetos SET ordem = ? WHERE id = ?', [index + 1, id])
        ));
    }
};
