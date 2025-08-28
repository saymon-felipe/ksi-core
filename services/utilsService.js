const functions = require("../utils/functions");
const sendEmails = require("../config/sendEmail");
const emailTemplates = require("../templates/emailTemplates");
const uploadConfig = require("../config/upload");

let utilsService = {
    sendContact: function (name, email, tel, obs, requestType, ip) {
        return new Promise(async (resolve, reject) => {
            let contatoId = await functions.executeSql(
                `
                    INSERT INTO
                        contatos_site
                        (
                            nome,
                            email,
                            tel,
                            obs,
                            tipo
                        )
                    VALUES
                        (?, ?, ?, ?, ?)
                `, [name, email, tel, obs, requestType]
            )

            if (contatoId) {
                let htmlReturnEmail = emailTemplates.contactReturn();
                let htmlAdminEmail = emailTemplates.contact(name, email, tel, obs, requestType, ip);

                sendEmails.sendEmail(htmlReturnEmail, "A Equipe KSI agradeçe o seu contato.", "ksikineticsolutions@gmail.com", email);
                sendEmails.sendEmail(htmlAdminEmail, "Contato de " + name + " pelo site da KSI.", "ksikineticsolutions@gmail.com", process.env.USER_EMAIL);
                sendEmails.sendEmail(htmlAdminEmail, "Contato de " + name + " pelo site da KSI.", "ksikineticsolutions@gmail.com", "linnubr@gmail.com");

                resolve();
            } else {
                reject("Ocorreu um erro ao enviar o contato");
            }
        })
    },
    uploadVideo: function (userId, title, description, thumbnailUrl, videoUrl) {
        return new Promise((resolve, reject) => {
            let videoId = videoUrl.split("-")[6].replace(".mp4", "");

            functions.executeSql(
                `
                    INSERT INTO
                        videos
                        (
                            titulo,
                            descricao,
                            usuario,
                            video_url,
                            thumbnail_url,
                            codigo
                        )
                    VALUES
                        (?, ?, ?, ?, ?, ?)
                `, [title, description, userId, videoUrl, thumbnailUrl, videoId]
            ).then((results) => {
                if (results.affectedRows > 0) {
                    this.returnVideos(true);
                    resolve();
                } else {
                    reject("Ocorreu um erro ao enviar o video");
                }
            }).catch((error) => {
                reject(error);
            })
        })
    },
    editVideo: function (videoId, title, description, thumbnailUrl) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    SELECT
                        thumbnail_url
                    FROM
                        videos
                    WHERE
                        id = ?;

                    UPDATE
                        videos
                    SET
                        titulo = ?, descricao = ?, thumbnail_url = ?
                    WHERE
                        id = ?;
                `, [videoId, title, description, thumbnailUrl, videoId]
            ).then(async (results) => {
                if (results[1].affectedRows > 0) {
                    this.returnVideos(true);

                    let thumbnail_url = results[0][0].thumbnail_url.split("/")[3];
                    
                    await uploadConfig.deleteFromS3(thumbnail_url);

                    resolve();
                } else {
                    reject("Ocorreu um erro ao salvar o video");
                }
            }).catch((error) => {
                reject(error);
            })
        })
    },
    returnVideos: function (clearCache = false) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    WITH contagem_interacoes AS (
                        SELECT
                            video,
                            COUNT(CASE WHEN tipo = 'like' THEN 1 END) AS likes,
                            COUNT(CASE WHEN tipo = 'dislike' THEN 1 END) AS dislikes
                        FROM
                            interacoes_videos
                        GROUP BY
                            video
                    ),
                    contagem_comentarios AS (
                        SELECT
                            video,
                            COUNT(id) AS comments
                        FROM
                            comentarios_videos
                        GROUP BY
                            video
                    )
                    SELECT
                        v.id,
                        v.thumbnail_url AS thumbnail,
                        v.video_url AS video,
                        v.descricao AS description,
                        v.titulo AS title,
                        v.data_upload AS date,
                        v.usuario,
                        v.visualizacoes,
                        COALESCE(ci.likes, 0) AS likes,
                        COALESCE(ci.dislikes, 0) AS dislikes,
                        COALESCE(cc.comments, 0) AS comments
                    FROM
                        videos v
                    LEFT JOIN
                        contagem_interacoes ci ON v.id = ci.video
                    LEFT JOIN
                        contagem_comentarios cc ON v.id = cc.video
                    ORDER BY v.id DESC;
                `, [], !clearCache
            ).then(async (results) => {
                let videos = [];

                for (let i = 0; i < results.length; i++) {
                    let currentVideo = results[i];

                    currentVideo = {
                        ...currentVideo,
                        statistics: {
                            views: results[i].visualizacoes,
                            likes: results[i].likes,
                            dislikes: results[i].dislikes,
                            comments: results[i].comments
                        },
                        user: {
                            image: await functions.getValueByColumn("usuarios", "imagem", currentVideo.usuario, "id"),
                            name: await functions.getValueByColumn("usuarios", "nome", currentVideo.usuario, "id")
                        }
                    }

                    videos.push(currentVideo);
                }

                resolve(videos);
            })
        }).catch((error) => {
            reject(error);
        })
    },
    viewVideo: function (video_id) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    UPDATE
                        videos
                    SET
                        visualizacoes = visualizacoes + 1
                    WHERE
                        id = ?
                `, [video_id]
            ).then(() => {
                resolve();
            }).catch((error) => {
                reject(error);
            })
        })
    },
    getVideoInteractionStatus: async function (userId, videoId) {
        if (!userId || !videoId) {
            return { liked: false, disliked: false };
        }

        try {
            const interaction = await functions.executeSql(
                `SELECT tipo FROM interacoes_videos WHERE usuario = ? AND video = ? LIMIT 1`,
                [userId, videoId]
            );

            if (interaction.length > 0) {
                const type = interaction[0].tipo;
                return {
                    liked: type === 'like',
                    disliked: type === 'deslike'
                };
            } else {
                return { liked: false, disliked: false };
            }
        } catch (error) {
            return { liked: false, disliked: false };
        }
    },
    returnVideoComments: function (video_id, clearCache = false) {
        return new Promise(async (resolve, reject) => {
            try {
                const results = await functions.executeSql(
                    `
                        SELECT
                            u.nome as userName,
                            c.comentario,
                            c.data,
                            c.cor_background,
                            c.id as commentId,
                            u.id as userId,
                            u.imagem AS userImage
                        FROM
                            comentarios_videos c
                        JOIN
                            usuarios u ON c.usuario = u.id
                        WHERE
                            c.video = ?
                        ORDER BY
                            c.data ASC
                    `, [video_id], !clearCache
                );

                let videoComments = {
                    length: 0,
                    comments: []
                };

                if (results.length === 0) {
                    resolve(videoComments);
                    return;
                }

                let currentGroup = null;
                let groupId = 0;

                for (const comment of results) {
                    if (currentGroup && currentGroup.userId === comment.userId) {
                        currentGroup.comments.push({
                            date: comment.data,
                            comment: comment.comentario,
                            background: comment.cor_background
                        });
                    } else {
                        currentGroup = {
                            id: groupId,
                            userName: comment.userName,
                            userImage: comment.userImage,
                            userId: comment.userId,
                            comments: [
                                {
                                    date: comment.data,
                                    comment: comment.comentario,
                                    background: comment.cor_background
                                }
                            ]
                        };
                        videoComments.comments.push(currentGroup);
                        groupId++;
                    }
                }
                
                videoComments.length = results.length;
                
                resolve(videoComments);

            } catch (error) {
                reject(error);
            }
        });
    },
    postComment: function (video_id, user_id, comment) {
        return new Promise(async (resolve, reject) => {
            let cores_disponiveis = [
                "rgba(255, 161, 249, 0.3)", // Rosa claro
                "rgba(184, 193, 255, 0.3)", // Azul claro
                "rgba(161, 255, 161, 0.3)", // Verde claro
                "rgba(255, 255, 161, 0.3)", // Amarelo claro
                "rgba(255, 182, 193, 0.3)", // Rosa salmão
                "rgba(204, 153, 255, 0.3)", // Lilás
                "rgba(152, 251, 152, 0.3)", // Verde menta
                "rgba(173, 216, 230, 0.3)", // Azul celeste
                "rgba(240, 230, 140, 0.3)", // Caqui
                "rgba(255, 192, 203, 0.3)"  // Rosa bebê
            ];

            try {
                let existingComment = await functions.executeSql(
                    `SELECT cor_background FROM comentarios_videos WHERE usuario = ? AND video = ? LIMIT 1`,
                    [user_id, video_id]
                );
                
                let cor_para_inserir;

                if (existingComment.length > 0) {
                    cor_para_inserir = existingComment[0].cor_background;
                } else {
                    const randomIndex = Math.floor(Math.random() * cores_disponiveis.length);
                    cor_para_inserir = cores_disponiveis[randomIndex];
                }

                const insertResult = await functions.executeSql(
                    `
                        INSERT INTO
                            comentarios_videos
                            (
                                usuario,
                                comentario,
                                video,
                                cor_background
                            )
                        VALUES
                            (?, ?, ?, ?)
                    `, [user_id, comment, video_id, cor_para_inserir]
                );

                if (insertResult.affectedRows > 0) {
                    this.returnVideoComments(video_id, true);
                    resolve();
                } else {
                    reject("Ocorreu um erro ao enviar o comentário");
                }
            } catch (error) {
                reject(error);
            }
        })
    },
    toggleLikeDeslike: function (userId, videoId, interactionType) {
        return new Promise(async (resolve, reject) => {
            try {
                const existingInteraction = await functions.executeSql(
                    `SELECT tipo FROM interacoes_videos WHERE usuario = ? AND video = ?`,
                    [userId, videoId]
                );

                if (existingInteraction.length > 0) {
                    const existingType = existingInteraction[0].tipo;

                    if (existingType === interactionType) {
                        await functions.executeSql(
                            `DELETE FROM interacoes_videos WHERE usuario = ? AND video = ? AND tipo = ?`,
                            [userId, videoId, interactionType]
                        );
                    } 
                    else {
                        await functions.executeSql(
                            `DELETE FROM interacoes_videos WHERE usuario = ? AND video = ? AND tipo = ?`,
                            [userId, videoId, existingType]
                        );
                        await functions.executeSql(
                            `INSERT INTO interacoes_videos (usuario, tipo, video) VALUES (?, ?, ?)`,
                            [userId, interactionType, videoId]
                        );
                    }
                } else {
                    await functions.executeSql(
                        `INSERT INTO interacoes_videos (usuario, tipo, video) VALUES (?, ?, ?)`,
                        [userId, interactionType, videoId]
                    );
                }

                resolve();
            } catch (error) {
                reject(error);
            }
        })
    },
    excludeVideo: function (videoId) {
        return new Promise((resolve, reject) => {
            functions.executeSql(
                `
                    SELECT
                        video_url,
                        thumbnail_url
                    FROM
                        videos
                    WHERE
                        id = ?;

                    DELETE FROM
                        videos
                    WHERE
                        id = ?;

                    DELETE FROM
                        interacoes_videos
                    WHERE
                        video = ?;

                    DELETE FROM
                        comentarios_videos
                    WHERE
                        video = ?
                `, [videoId, videoId, videoId, videoId]
            ).then(async (results) => {
                if (results[1].affectedRows == 0) {
                    reject("Ocorreu um erro ao excluir o video");
                } else {
                    let video_url = results[0][0].video_url.split("/")[3];
                    let thumbnail_url = results[0][0].thumbnail_url.split("/")[3];
                    
                    await uploadConfig.deleteFromS3(video_url);
                    await uploadConfig.deleteFromS3(thumbnail_url);

                    this.returnVideos(true);
                    
                    resolve();
                }
            }).catch((error) => {
                reject(error);
            })
        })
    }
}

module.exports = utilsService;