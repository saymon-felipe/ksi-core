const axios = require('axios');

const OPENAI_URL = 'https://api.openai.com/v1/chat/completions';
const MODEL = 'gpt-5-nano';
const MAX_DESCRIPTION_LENGTH = 500;

const cleanDescription = (value, field) => {
    if (typeof value !== 'string' || !value.trim()) {
        throw new Error(`A IA não retornou a descrição em ${field}.`);
    }

    const description = value.trim().replace(/\s+/g, ' ');
    if (description.length > MAX_DESCRIPTION_LENGTH) {
        throw new Error(`A descrição em ${field} excede o limite de ${MAX_DESCRIPTION_LENGTH} caracteres.`);
    }

    return description;
};

const parseResponse = (content) => {
    try {
        const parsed = JSON.parse(content);
        return {
            description: cleanDescription(parsed.description, 'português'),
            descriptionEn: cleanDescription(parsed.descriptionEn, 'inglês'),
            descriptionEs: cleanDescription(parsed.descriptionEs, 'espanhol')
        };
    } catch (error) {
        if (error.message.startsWith('A IA')) throw error;
        throw new Error('A IA retornou um formato de descrições inválido.');
    }
};

const normalizeTags = (tags) => {
    if (Array.isArray(tags)) return tags.map(String).map(tag => tag.trim()).filter(Boolean);
    if (typeof tags !== 'string') return [];
    return tags.split(',').map(tag => tag.trim()).filter(Boolean);
};

const createPrompt = ({ title, category, tags, description }) => JSON.stringify({
    title: String(title || '').trim(),
    category: String(category || '').trim(),
    tags: normalizeTags(tags),
    existingPortugueseDescription: String(description || '').trim() || null
});

const instructions = `Você é o copywriter técnico sênior da Kinetic Solutions (KSI). Crie descrições curtas e padronizadas para cards de projetos de portfólio.

Escreva uma descrição em português do Brasil, uma tradução natural para inglês e uma tradução natural para espanhol. Mantenha o mesmo significado factual nas três versões.

Padrão obrigatório:
- Uma ou duas frases objetivas, entre 180 e 360 caracteres por idioma.
- Tom profissional, claro, tecnológico e orientado a solução.
- Explique o tipo de projeto, o problema ou contexto e a solução/impacto apenas quando sustentados pelos dados recebidos.
- Preserve nomes próprios, marcas, siglas e tecnologias informadas.
- Não use Markdown, título, listas, aspas, emojis, chamadas comerciais, links ou hashtags.
- Não invente números, resultados, clientes, integrações, tecnologias, certificações ou funcionalidades.
- A descrição portuguesa existente é apenas contexto factual: reescreva-a no padrão quando ela existir.

Retorne exclusivamente um objeto JSON compatível com o schema solicitado.`;

module.exports = {
    generateDescriptions: async (project) => {
        const title = String(project.title || '').trim();
        const category = String(project.category || '').trim();
        if (!title || !category) {
            throw new Error('Informe o título e a categoria antes de gerar as descrições.');
        }
        if (!process.env.OPENAI_API_KEY) {
            throw new Error('A geração por IA não está configurada no servidor.');
        }

        const response = await axios.post(OPENAI_URL, {
            model: MODEL,
            messages: [
                { role: 'developer', content: instructions },
                { role: 'user', content: createPrompt(project) }
            ],
            response_format: {
                type: 'json_schema',
                json_schema: {
                    name: 'project_descriptions',
                    strict: true,
                    schema: {
                        type: 'object',
                        additionalProperties: false,
                        properties: {
                            description: { type: 'string' },
                            descriptionEn: { type: 'string' },
                            descriptionEs: { type: 'string' }
                        },
                        required: ['description', 'descriptionEn', 'descriptionEs']
                    }
                }
            }
        }, {
            headers: {
                Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
                'Content-Type': 'application/json'
            },
            timeout: 60000
        });

        const content = response.data?.choices?.[0]?.message?.content;
        if (!content) throw new Error('A IA não retornou conteúdo para as descrições.');
        return parseResponse(content);
    }
};
