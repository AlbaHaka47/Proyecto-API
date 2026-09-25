const express = require('express');
const verificarToken = require('../middleware/authMiddleware');
const db = require('../db');
const router = express.Router();

router.get('/perfil', verificarToken, (req, res) => {

    const usuarioId = req.usuario.id;

    const sql = `
        SELECT id, nombre, email
        FROM usuarios
        WHERE id = ?
    `;

    db.query(sql, [usuarioId], (error, resultados) => {

        if (error) {

            console.error(error);

            return res.status(500).json({
                mensaje: 'Error al obtener el perfil'
            });
        }

        if (resultados.length === 0) {

            return res.status(404).json({
                mensaje: 'Usuario no encontrado'
            });
        }

        res.json({
            mensaje: 'Perfil obtenido correctamente',
            usuario: resultados[0]
        });
    });
});

router.put('/perfil', verificarToken, (req, res) => {

    const { nombre, email } = req.body;
    const usuarioId = req.usuario.id;

    if (typeof nombre !== 'string' || nombre.trim() === '') {
        return res.status(400).json({
            mensaje: 'El nombre es obligatorio y debe ser un texto'
        });
    }

    if (typeof email !== 'string' || email.trim() === '') {
        return res.status(400).json({
            mensaje: 'El email es obligatorio y debe ser un texto'
        });
    }

    const sql = `
        UPDATE usuarios
        SET nombre = ?, email = ?
        WHERE id = ?
    `;

    db.query(
        sql,
        [nombre, email, usuarioId],
        (error, resultado) => {

            if (error) {

                if (error.code === 'ER_DUP_ENTRY') {
                    return res.status(409).json({
                        mensaje: 'El email ya está registrado'
                    });
                }

                console.error(error);

                return res.status(500).json({
                    mensaje: 'Error al actualizar el usuario'
                });
            }

            res.json({
                mensaje: 'Usuario actualizado correctamente'
            });
        }
    );
});

// Eliminar la cuenta del usuario autenticado
router.delete('/perfil', verificarToken, (req, res) => {

    const usuarioId = req.usuario.id;

    db.beginTransaction((error) => {

        if (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: 'Error al iniciar la operación'
            });
        }

        // Primero eliminamos las tareas del usuario
        const sqlTareas = `
            DELETE FROM tareas
            WHERE usuario_id = ?
        `;

        db.query(sqlTareas, [usuarioId], (error) => {

            if (error) {
                return db.rollback(() => {
                    console.error(error);

                    res.status(500).json({
                        mensaje: 'Error al eliminar las tareas'
                    });
                });
            }

            // Después eliminamos al usuario
            const sqlUsuario = `
                DELETE FROM usuarios
                WHERE id = ?
            `;

            db.query(sqlUsuario, [usuarioId], (error, resultado) => {

                if (error) {
                    return db.rollback(() => {
                        console.error(error);

                        res.status(500).json({
                            mensaje: 'Error al eliminar el usuario'
                        });
                    });
                }

                if (resultado.affectedRows === 0) {
                    return db.rollback(() => {
                        res.status(404).json({
                            mensaje: 'Usuario no encontrado'
                        });
                    });
                }

                db.commit((error) => {

                    if (error) {
                        return db.rollback(() => {
                            console.error(error);

                            res.status(500).json({
                                mensaje: 'Error al confirmar la eliminación'
                            });
                        });
                    }

                    res.clearCookie('token');

                    res.json({
                        mensaje: 'Cuenta eliminada correctamente'
                    });
                });
            });
        });
    });
});

module.exports = router;