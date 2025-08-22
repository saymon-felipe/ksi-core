const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

const imageWidth = 1280;

// Configuração da AWS com a nova sintaxe da v3
const s3Client = new S3Client({
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
    }
});

const fileFilter = (req, file, cb) => {
    // A lógica de filtro para imagens e vídeos
    if (file.mimetype === "image/jpeg" || file.mimetype === 'image/jpg' || file.mimetype === 'image/png' || file.mimetype === 'video/mp4') {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const memoryStorage = multer.memoryStorage();

const upload = multer({
    storage: memoryStorage,
    fileFilter: fileFilter
});

// Middleware personalizado para fazer o upload com transformação
const customUploader = async (req, res, next) => {
    try {
        const uploadPromises = Object.keys(req.files).map(async (fieldName) => {
            const file = req.files[fieldName][0];
            const extension = path.extname(file.originalname);
            const fileName = new Date().toISOString() + '-' + Math.random().toString(36).substring(7) + extension;

            let fileStream;

            // Redimensiona apenas se for a thumbnail
            if (fieldName === 'thumbnail') {
                fileStream = sharp(file.buffer).resize(imageWidth);
            } else {
                fileStream = file.buffer;
            }

            const uploadToS3 = new Upload({
                client: s3Client,
                params: {
                    Bucket: process.env.BUCKET,
                    Key: fileName.replace(":", "_").replace(":", "_").replace(" ", "_"),
                    Body: fileStream,
                    ContentType: file.mimetype,
                    ACL: 'public-read'
                }
            });

            const data = await uploadToS3.done();
            
            // Adiciona a URL do S3 ao objeto do arquivo na requisição
            file.location = data.Location;

            return data;
        });
        
        await Promise.all(uploadPromises);
        next();
    } catch (error) {
        console.error('Erro no upload para o S3:', error);
        res.status(500).send('Erro no upload.');
    }
};

// Nova função que cria e retorna o middleware de upload
const getUploadMiddleware = (fieldNames) => {
    // Mapeia os nomes dos campos para o formato que o Multer espera
    const fields = fieldNames.map(name => ({ name: name, maxCount: 1 }));
    
    // Retorna um array de middlewares para serem encadeados na rota
    return [
        upload.fields(fields),
        customUploader
    ];
};

const deleteFromS3 = async function (key) {
    const command = new DeleteObjectCommand({
        Bucket: process.env.BUCKET,
        Key: key
    });
    return s3Client.send(command);
};

const uploadConfig = {
    getUploadMiddleware,
    deleteFromS3,
};

module.exports = uploadConfig;