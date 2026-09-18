const jwt = require('jsonwebtoken');

function verificarToken(req, res, next) {

    const authHeader = req.headers.authorization;
    const tokenCookie = req.cookies.token;

    // Comprobar que existe el header
   let token;

    if (tokenCookie) {
        token = tokenCookie;
    } else if (authHeader) {

        const partes = authHeader.split(' ');

        if (partes.length !== 2 || partes[0] !== 'Bearer' || !partes[1]) {
            return res.status(401).json({
                mensaje: 'Formato de autorización inválido'
            });
        }

        token = partes[1];

    } else {
        return res.status(401).json({
            mensaje: 'No se proporcionó un token'
        });
    }
    
    try {

        const usuario = jwt.verify(
            token,
            process.env.JWT_SECRET
        );

        req.usuario = usuario;

        next();

    } catch (error) {

        return res.status(401).json({
            mensaje: 'Token inválido o expirado'
        });
    }
}

module.exports = verificarToken;