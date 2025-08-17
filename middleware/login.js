const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
    try {
        const token = req.cookies.jwtToken;

        if (!token) {
            return res.status(401).json({ message: 'Acesso não autorizado' });
        }
        
        jwt.verify(token, process.env.JWT_KEY, (err, usuario) => {
            if (err) {
                return res.status(403).json({ message: 'Token inválido ou expirado' });
            }
            
            req.usuario = usuario;
            next();
        });
    } catch (error) {
        return res.status(401).send({ mensagem: "Falha na verificação da autenticação" });
    }
}