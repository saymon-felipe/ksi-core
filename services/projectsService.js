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
    descriptionEn: project.descriptionEn || null,
    descriptionEs: project.descriptionEs || null,
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
                descricao_en AS descriptionEn, descricao_es AS descriptionEs,
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

    // Busca ou vincula categoria_id automaticamente
    let categoriaId = null;
    try {
        const catRows = await functions.executeSql(
            `SELECT id FROM portfolio_categorias WHERE nome = ? LIMIT 1`,
            [project.category.trim()]
        );
        if (catRows.length > 0) {
            categoriaId = catRows[0].id;
        }
    } catch (_) {}

    if (id) {
        await functions.executeSql(
            `UPDATE portfolio_projetos
             SET titulo = ?, categoria = ?, categoria_id = ?, descricao = ?, descricao_en = ?, descricao_es = ?, imagem_url = ?, imagem_key = ?,
                 link = ?, tags = ?, publicado = ?, ordem = ?
             WHERE id = ?`,
            [project.title.trim(), project.category.trim(), categoriaId, project.description.trim(),
             String(project.descriptionEn || '').trim() || null, String(project.descriptionEs || '').trim() || null, imageUrl, imageKey,
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
         (titulo, categoria, categoria_id, descricao, descricao_en, descricao_es, imagem_url, imagem_key, link, tags, publicado, ordem)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
        [project.title.trim(), project.category.trim(), categoriaId, project.description.trim(),
         String(project.descriptionEn || '').trim() || null, String(project.descriptionEs || '').trim() || null, imageUrl, imageKey,
         link, tags, published, displayOrder]
    );
    return result.insertId;
};

module.exports = {
    getPublishedProjects: async () => {
        const rows = await functions.executeSql(
            `SELECT id, titulo AS title, categoria AS category, descricao AS description,
                    descricao_en AS descriptionEn, descricao_es AS descriptionEs,
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
                    descricao_en AS descriptionEn, descricao_es AS descriptionEs,
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
    },

    // CATEGORIAS
    getCategories: async () => {
        const rows = await functions.executeSql(
            `SELECT id, nome AS name, slug, descricao AS description 
             FROM portfolio_categorias 
             ORDER BY nome ASC`
        );
        return rows;
    },
    createCategory: async (data) => {
        const name = String(data.name || '').trim();
        const slug = String(data.slug || '').trim();
        const description = String(data.description || '').trim() || null;
        if (!name) throw new Error('Nome da categoria é obrigatório.');

        const result = await functions.executeSql(
            `INSERT INTO portfolio_categorias (nome, slug, descricao) VALUES (?, ?, ?)`,
            [name, slug, description]
        );
        return { id: result.insertId, name, slug, description };
    },
    updateCategory: async (id, data) => {
        const name = String(data.name || '').trim();
        const slug = String(data.slug || '').trim();
        const description = String(data.description || '').trim() || null;
        if (!name) throw new Error('Nome da categoria é obrigatório.');

        await functions.executeSql(
            `UPDATE portfolio_categorias SET nome = ?, slug = ?, descricao = ? WHERE id = ?`,
            [name, slug, description, id]
        );

        // Sincroniza categoria_id e categoria em portfolio_projetos
        await functions.executeSql(
            `UPDATE portfolio_projetos SET categoria = ? WHERE categoria_id = ?`,
            [name, id]
        );
        return { id: Number(id), name, slug, description };
    },
    deleteCategory: async (id) => {
        await functions.executeSql(`DELETE FROM portfolio_categorias WHERE id = ?`, [id]);
    },

    // TAGS
    getTags: async () => {
        const rows = await functions.executeSql(
            `SELECT id, nome AS name, slug, cor AS color 
             FROM portfolio_tags 
             ORDER BY nome ASC`
        );
        return rows;
    },
    createTag: async (data) => {
        const name = String(data.name || '').trim();
        const slug = String(data.slug || '').trim();
        const color = String(data.color || '#38bdf8').trim();
        if (!name) throw new Error('Nome da tag é obrigatório.');

        const result = await functions.executeSql(
            `INSERT INTO portfolio_tags (nome, slug, cor) VALUES (?, ?, ?)`,
            [name, slug, color]
        );
        return { id: result.insertId, name, slug, color };
    },
    updateTag: async (id, data) => {
        const name = String(data.name || '').trim();
        const slug = String(data.slug || '').trim();
        const color = String(data.color || '#38bdf8').trim();
        if (!name) throw new Error('Nome da tag é obrigatório.');

        await functions.executeSql(
            `UPDATE portfolio_tags SET nome = ?, slug = ?, cor = ? WHERE id = ?`,
            [name, slug, color, id]
        );
        return { id: Number(id), name, slug, color };
    },
    deleteTag: async (id) => {
        await functions.executeSql(`DELETE FROM portfolio_tags WHERE id = ?`, [id]);
    }
};
