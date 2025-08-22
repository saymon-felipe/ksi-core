const functions = require("../utils/functions");

module.exports = async (req, res, next) => {
    let userIsAdmin = await functions.getValueByColumn("usuarios", "admin", req.usuario.id, "id");
    
    if (userIsAdmin == "1") {
        next();
    } else {
        return res.status(401).send({ mensagem: "Você não tem permissão de administrador" });
    }
}