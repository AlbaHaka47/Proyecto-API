const express = require('express');
const verificarToken = require('../middleware/authMiddleware');

const router = express.Router();

router.get('/perfil', verificarToken, (req, res) => {
    res.json({
        mensaje: 'Bienvenido a tu perfil',
        usuario: req.usuario
    });
});

module.exports = router;