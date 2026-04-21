const { S3Client, DeleteObjectCommand } = require('@aws-sdk/client-s3');
const { Upload } = require('@aws-sdk/lib-storage');
const multer = require('multer');
const sharp = require('sharp');
const path = require('path');

const s3Client = new S3Client({
    region: process.env.REGION,
    credentials: {
        accessKeyId: process.env.ACCESS_KEY_ID,
        secretAccessKey: process.env.SECRET_ACCESS_KEY
    }
});

const fileFilter = (req, file, cb) => {
    if (file.mimetype.startsWith('image/') || file.mimetype === 'video/mp4') {
        cb(null, true);
    } else {
        cb(new Error('Formato de arquivo não suportado'), false);
    }
};

const memoryStorage = multer.memoryStorage();

const upload = multer({
    storage: memoryStorage,
    fileFilter: fileFilter
});

// Middleware personalizado para fazer o upload com transformação e organização
const customUploader = async (req, res, next) => {
    try {
        if (!req.files) return next();

        const uploadPromises = Object.keys(req.files).map(async (fieldName) => {
            const file = req.files[fieldName][0];
            const extension = path.extname(file.originalname);
            
            const baseFileName = new Date().toISOString() + '-' + Math.random().toString(36).substring(7) + extension;
            const fileName = baseFileName.replace(/:/g, "_").replace(/ /g, "_");

            let fileStream = file.buffer;

            // 1. REDIMENSIONAMENTO E COMPRESSÃO 
            if (file.mimetype.startsWith('image/')) {
                fileStream = sharp(file.buffer)
                    .resize({ width: 1200, withoutEnlargement: true }) // withoutEnlargement impede que imagens pequenas percam qualidade ao serem esticadas
                    .jpeg({ quality: 80, force: false }) 
                    .png({ quality: 80, force: false })
                    .webp({ quality: 80, force: false });
            }

            // 2. ORGANIZAÇÃO DE PASTAS S3 (posts/<ano>/<slug>/)
            const year = new Date().getFullYear();
            let folderPath = '';
            
            // Se vier o slug no body (como as imagens do editor do blog), organiza na pasta. 
            // Caso contrário, salva na raiz ou outra pasta geral do S3.
            if (req.body.slug) {
                folderPath = `posts/${year}/${req.body.slug}/`;
            }

            const s3Key = `${folderPath}${fileName}`;

            const uploadToS3 = new Upload({
                client: s3Client,
                params: {
                    Bucket: process.env.BUCKET,
                    Key: s3Key,
                    Body: fileStream,
                    ContentType: file.mimetype,
                    ACL: 'public-read'
                }
            });

            const data = await uploadToS3.done();
            
            file.location = data.Location;
            file.s3Key = s3Key; 

            return data;
        });
        
        await Promise.all(uploadPromises);
        next();
    } catch (error) {
        console.error('Erro no upload para o S3:', error);
        res.status(500).send('Erro no upload.');
    }
};

const getUploadMiddleware = (fieldNames) => {
    const fields = fieldNames.map(name => ({ name: name, maxCount: 1 }));
    
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