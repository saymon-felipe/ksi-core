const functions = require("../utils/functions");
const axios = require("axios");

let blogService = {
  generateAIText: async function (prompt) {
    const response = await axios.post(
      "https://api.openai.com/v1/chat/completions",
      {
        model: "gpt-5-nano",
        messages: [
          {
            role: "system",
            content: `
                Você é um Tech Lead e Copywriter sênior da Kinetic Solutions (KSI).
                Sua missão é escrever um artigo de blog técnico, inovador, engajador mas ao mesmo tempo acessível e de linguagem simplificada para o público baseado no tema fornecido.

                Diretrizes de Estética e Tom de Voz:
                1. Tom: Autoritário, vanguardista, acessível e focado no futuro (soluções, eficiência, inovação).
                2. Estrutura: Use parágrafos curtos, subtítulos em <h2> ou <h3>, e listas (bullet points) para escaneabilidade.
                3. Imagens Estratégicas: Você não gera imagens, mas DEVE indicar exatamente onde o autor deve inseri-las para quebrar o texto e ilustrar conceitos. Use o formato exato: [INSERIR IMAGEM: Descrição detalhada do que a imagem/gráfico deve mostrar].
                4. Retorno: Você DEVE retornar EXCLUSIVAMENTE um objeto JSON válido no seguinte formato, sem formatação markdown em volta:
                {
                "titulo": "Título Altamente Clicável e Otimizado (SEO)",
                "descricao": "Uma breve descrição de até 150 caracteres otimizada para SEO e resumo do post.",
                "conteudo": "Todo o conteúdo do post formatado em HTML limpo (h2, p, ul, li, strong)."
                }
                `,
          },
          { role: "user", content: prompt },
        ],
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
      },
    );

    return response.data.choices[0].message.content;
  },

  createPost: function (postData, autorId) {
    return new Promise(async (resolve, reject) => {
      try {
        const query = `
          INSERT INTO blog_posts 
          (categoria_id, autor_id, titulo, slug, descricao, conteudo, imagem_capa, data_publicacao, data_pausa, status) 
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
        `;

        const values = [
          postData.categoria_id,
          autorId,
          postData.titulo,
          postData.slug,
          postData.descricao || "",
          postData.conteudo,
          postData.imagem_capa || null,
          postData.data_publicacao,
          postData.data_pausa || null,
          postData.status || "rascunho",
        ];

        let result = await functions.executeSql(query, values);
        resolve(result.insertId);
      } catch (error) {
        reject(error);
      }
    });
  },

  updatePost: function (id, postData) {
    return new Promise(async (resolve, reject) => {
      try {
        const query = `
          UPDATE blog_posts SET 
          categoria_id = ?, titulo = ?, slug = ?, descricao = ?, 
          conteudo = ?, imagem_capa = ?, data_publicacao = ?, 
          data_pausa = ?, status = ? 
          WHERE id = ?
        `;

        const values = [
          postData.categoria_id,
          postData.titulo,
          postData.slug,
          postData.descricao,
          postData.conteudo,
          postData.imagem_capa || null,
          postData.data_publicacao,
          postData.data_pausa || null,
          postData.status,
          id,
        ];

        await functions.executeSql(query, values);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  },

  deletePost: function (id) {
    return new Promise(async (resolve, reject) => {
      try {
        await functions.executeSql("DELETE FROM blog_posts WHERE id = ?", [id]);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  },

  getPublishedPosts: function () {
    return new Promise(async (resolve, reject) => {
      try {
        const query = `
          SELECT p.*, c.nome as categoria_nome, u.nome as autor_nome 
          FROM blog_posts p 
          INNER JOIN blog_categorias c ON p.categoria_id = c.id 
          INNER JOIN usuarios u ON p.autor_id = u.id 
          WHERE p.status = 'publicado' 
          AND p.data_publicacao <= NOW() 
          AND (p.data_pausa IS NULL OR p.data_pausa > NOW()) 
          ORDER BY p.data_publicacao DESC
        `;

        let results = await functions.executeSql(query, []);

        // Lógica: Extrai a primeira imagem do HTML ou usa a padrão
        results = results.map((post) => {
          if (!post.imagem_capa && post.conteudo) {
            const match = post.conteudo.match(/<img[^>]+src="([^">]+)"/i);
            // Se achar a imagem, pega a URL (match[1]). Se não, usa uma imagem padrão sua
            post.imagem_capa = match ? match[1] : "/img/ksi-bg-padrao.jpg"; // <-- Altere para o nome da sua imagem padrão
          }
          return post;
        });

        resolve(results);
      } catch (error) {
        reject(error);
      }
    });
  },

  getAllPosts: function () {
    return new Promise(async (resolve, reject) => {
      try {
        const query = `
          SELECT 
            p.*, 
            c.nome as categoria_nome, 
            u.nome as autor_nome,
            (SELECT COUNT(*) FROM blog_comentarios WHERE post_id = p.id) as comentarios_count,
            (SELECT COUNT(*) FROM blog_interacoes WHERE post_id = p.id AND tipo = 'like') as likes_count
          FROM blog_posts p 
          INNER JOIN blog_categorias c ON p.categoria_id = c.id 
          INNER JOIN usuarios u ON p.autor_id = u.id 
          ORDER BY p.data_publicacao DESC, p.id DESC
        `;

        let results = await functions.executeSql(query, []);

        results = results.map((post) => {
          if (!post.imagem_capa && post.conteudo) {
            const match = post.conteudo.match(/<img[^>]+src="([^">]+)"/i);
            post.imagem_capa = match ? match[1] : "/img/ksi-bg-padrao.jpg";
          }
          return post;
        });

        resolve(results);
      } catch (error) {
        reject(error);
      }
    });
  },

  getPostById: function (id) {
    return new Promise(async (resolve, reject) => {
      try {
        let result = await functions.executeSql(
          "SELECT * FROM blog_posts WHERE id = ?",
          [id],
        );
        resolve(result[0] || null);
      } catch (error) {
        reject(error);
      }
    });
  },

  getPostBySlug: function (slug, clientIp) {
    return new Promise(async (resolve, reject) => {
      try {
        const query = `
          SELECT p.*, c.nome as categoria_nome, u.nome as autor_nome 
          FROM blog_posts p 
          INNER JOIN blog_categorias c ON p.categoria_id = c.id 
          INNER JOIN usuarios u ON p.autor_id = u.id 
          WHERE p.slug = ?
        `;

        let result = await functions.executeSql(query, [slug]);

        if (result.length === 0) {
          return resolve(null);
        }

        const post = result[0];

        if (clientIp) {
          const checkViewQuery = `
                SELECT id FROM blog_views 
                WHERE post_id = ? AND ip_address = ? 
                AND viewed_at >= NOW() - INTERVAL 1 HOUR
            `;
          const recentViews = await functions.executeSql(checkViewQuery, [
            post.id,
            clientIp,
          ]);

          if (recentViews.length === 0) {
            await functions.executeSql(
              "INSERT INTO blog_views (post_id, ip_address) VALUES (?, ?)",
              [post.id, clientIp],
            );

            await functions.executeSql(
              "UPDATE blog_posts SET visualizacoes = visualizacoes + 1 WHERE id = ?",
              [post.id],
            );

            post.visualizacoes += 1;
          }
        }

        resolve(post);
      } catch (error) {
        reject(error);
      }
    });
  },

  getCategorias: function () {
    return new Promise(async (resolve, reject) => {
      try {
        let results = await functions.executeSql(
          "SELECT * FROM blog_categorias ORDER BY nome ASC",
          [],
        );
        resolve(results);
      } catch (error) {
        reject(error);
      }
    });
  },

  createCategoria: function (data) {
    return new Promise(async (resolve, reject) => {
      try {
        let result = await functions.executeSql(
          "INSERT INTO blog_categorias (nome, slug) VALUES (?, ?)",
          [data.nome, data.slug],
        );
        resolve(result.insertId);
      } catch (error) {
        reject(error);
      }
    });
  },

  deleteCategoria: function (id) {
    return new Promise(async (resolve, reject) => {
      try {
        await functions.executeSql("DELETE FROM blog_categorias WHERE id = ?", [
          id,
        ]);
        resolve(true);
      } catch (error) {
        reject(error);
      }
    });
  },

  getComentarios: function (postId) {
    return new Promise(async (resolve, reject) => {
      try {
        const query = `
          SELECT c.*, u.nome, u.imagem 
          FROM blog_comentarios c 
          INNER JOIN usuarios u ON c.usuario_id = u.id 
          WHERE c.post_id = ? 
          ORDER BY c.data DESC
        `;
        resolve(await functions.executeSql(query, [postId]));
      } catch (error) { reject(error); }
    });
  },

  addComentario: function (postId, usuarioId, comentario) {
    return new Promise(async (resolve, reject) => {
      try {
        const result = await functions.executeSql(
          "INSERT INTO blog_comentarios (post_id, usuario_id, comentario) VALUES (?, ?, ?)",
          [postId, usuarioId, comentario]
        );
        resolve(result.insertId);
      } catch (error) { reject(error); }
    });
  },

  getAllComentariosAdmin: function () {
    return new Promise(async (resolve, reject) => {
      try {
        const query = `
          SELECT c.*, p.titulo as post_titulo, u.nome, u.email 
          FROM blog_comentarios c 
          INNER JOIN blog_posts p ON c.post_id = p.id
          INNER JOIN usuarios u ON c.usuario_id = u.id 
          ORDER BY c.data DESC
        `;
        resolve(await functions.executeSql(query, []));
      } catch (error) { reject(error); }
    });
  },

  deleteComentario: function (id) {
    return new Promise(async (resolve, reject) => {
      try {
        await functions.executeSql("DELETE FROM blog_comentarios WHERE id = ?", [id]);
        resolve(true);
      } catch (error) { reject(error); }
    });
  },

  toggleLike: function (postId, usuarioId) {
    return new Promise(async (resolve, reject) => {
      try {
        const existe = await functions.executeSql("SELECT id FROM blog_interacoes WHERE post_id = ? AND usuario_id = ? AND tipo = 'like'", [postId, usuarioId]);
        
        if (existe.length > 0) {
          await functions.executeSql("DELETE FROM blog_interacoes WHERE id = ?", [existe[0].id]);
          resolve({ status: 'removido' });
        } else {
          await functions.executeSql("INSERT INTO blog_interacoes (post_id, usuario_id, tipo) VALUES (?, ?, 'like')", [postId, usuarioId]);
          resolve({ status: 'adicionado' });
        }
      } catch (error) { reject(error); }
    });
  },

  getInteracoesResumo: function (postId, usuarioId = null) {
    return new Promise(async (resolve, reject) => {
      try {
        const likes = await functions.executeSql("SELECT COUNT(*) as total FROM blog_interacoes WHERE post_id = ? AND tipo = 'like'", [postId]);
        const postInfo = await functions.executeSql("SELECT compartilhamentos FROM blog_posts WHERE id = ?", [postId]);
        
        let userLiked = false;
        if (usuarioId) {
          const uLike = await functions.executeSql("SELECT id FROM blog_interacoes WHERE post_id = ? AND usuario_id = ? AND tipo = 'like'", [postId, usuarioId]);
          userLiked = uLike.length > 0;
        }

        resolve({
          likes: likes[0].total || 0,
          compartilhamentos: postInfo[0]?.compartilhamentos || 0,
          userLiked: userLiked
        });
      } catch (error) { reject(error); }
    });
  },

  addCompartilhamento: function (postId) {
    return new Promise(async (resolve, reject) => {
      try {
        await functions.executeSql("UPDATE blog_posts SET compartilhamentos = compartilhamentos + 1 WHERE id = ?", [postId]);
        resolve(true);
      } catch (error) { reject(error); }
    });
  }
};

module.exports = blogService;
