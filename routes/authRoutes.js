const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { body, validationResult } = require('express-validator');

const router = express.Router();


// REGISTRO
router.post(
    '/register',
    body('email')
        .isEmail()
        .withMessage('El email no es válido'),

    body('password')
        .isLength({ min: 6 })
        .withMessage('La contraseña debe tener al menos 6 caracteres'),

    body('nombre')
        .trim()
        .notEmpty()
        .withMessage('El nombre es obligatorio'),

    async (req, res) => {

    const { nombre, email, password } = req.body;

    const errores = validationResult(req);

    if (!errores.isEmpty()) {
        return res.status(400).json({
            errores: errores.array()
        });
    }

    try {

        const passwordHash = await bcrypt.hash(password, 10);

        const sql = `
            INSERT INTO usuarios (nombre, email, password)
            VALUES (?, ?, ?)
        `;

        db.query(
            sql,
            [nombre, email, passwordHash],
            (error, resultado) => {

                if (error) {

                    if (error.code === 'ER_DUP_ENTRY') {
                        return res.status(409).json({
                            mensaje: 'El email ya está registrado'
                        });
                    }

                    console.error(error);

                    return res.status(500).json({
                        mensaje: 'Error al registrar usuario'
                    });
                }

                res.status(201).json({
                    mensaje: 'Usuario registrado correctamente',
                    usuarioId: resultado.insertId
                });
            }
        );

    } catch (error) {

        console.error(error);

        res.status(500).json({
            mensaje: 'Error del servidor'
        });
    }
});


// LOGIN
router.post(
    '/login',

    body('email')
        .isEmail()
        .withMessage('El email no es válido'),

    body('password')
        .notEmpty()
        .withMessage('La contraseña es obligatoria'),

    async (req, res) => {

        const { email, password } = req.body;

        const errores = validationResult(req);

        if (!errores.isEmpty()) {
            return res.status(400).json({
                errores: errores.array()
            });
        }

        const sql = 'SELECT * FROM usuarios WHERE email = ?';

        db.query(
            sql,
            [email],
            async (error, resultados) => {

                if (error) {
                    console.error(error);

                    return res.status(500).json({
                        mensaje: 'Error del servidor'
                    });
                }

                if (resultados.length === 0) {
                    return res.status(401).json({
                        mensaje: 'Email o contraseña incorrectos'
                    });
                }

                const usuario = resultados[0];

                const passwordCorrecta = await bcrypt.compare(
                    password,
                    usuario.password
                );

                if (!passwordCorrecta) {
                    return res.status(401).json({
                        mensaje: 'Email o contraseña incorrectos'
                    });
                }

                const token = jwt.sign(
                    {
                        id: usuario.id,
                        email: usuario.email
                    },
                    process.env.JWT_SECRET,
                    {
                        expiresIn: '1h'
                    }
                );

                res.cookie('token', token, {
                    httpOnly: true,
                    secure: false,
                    sameSite: 'lax',
                    maxAge: 60 * 60 * 1000
                });

                res.json({
                    mensaje: 'Login correcto',
                    usuario: {
                        id: usuario.id,
                        nombre: usuario.nombre,
                        email: usuario.email
                    }
                });
            }
        );
    }
);

router.post('/logout', (req, res) => {

    res.clearCookie('token');

    res.json({
        mensaje: 'Logout correcto'
    });
});

module.exports = router;