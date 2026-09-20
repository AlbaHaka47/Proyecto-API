const express = require('express');
const db = require('../db');
const verificarToken = require('../middleware/authMiddleware');

const router = express.Router();


//Ruta para crear una nueva tarea
router.post('/', verificarToken, (req, res) => {

    const { titulo, descripcion } = req.body;

    if (typeof titulo !== 'string' || titulo.trim() === '') {
        return res.status(400).json({
            mensaje: 'El título es obligatorio y debe ser un texto'
        });
    }

    if (descripcion !== undefined && typeof descripcion !== 'string') {
        return res.status(400).json({
            mensaje: 'La descripción debe ser un texto'
        });
    }

    const usuarioId = req.usuario.id;

    const sql = `
        INSERT INTO tareas (titulo, descripcion, usuario_id)
        VALUES (?, ?, ?)
    `;

    db.query(
        sql,
        [titulo, descripcion || null, usuarioId],
        (error, resultado) => {

            if (error) {
                console.error(error);

                return res.status(500).json({
                    mensaje: 'Error al crear la tarea'
                });
            }

            res.status(201).json({
                mensaje: 'Tarea creada correctamente',
                tareaId: resultado.insertId
            });
        }
    );
});

//Ruta para obtener todas las tareas del usuario autenticado
router.get('/', verificarToken, (req, res) => {

    const usuarioId = req.usuario.id;

    const sql = `
        SELECT id, titulo, descripcion, completada, created_at
        FROM tareas
        WHERE usuario_id = ?
        ORDER BY created_at DESC
    `;

    db.query(sql, [usuarioId], (error, resultados) => {

        if (error) {
            console.error(error);

            return res.status(500).json({
                mensaje: 'Error al obtener las tareas'
            });
        }

        res.json(resultados);
    });
});


//Ruta para actualizar una tarea existente
router.put(
    '/:id',
    verificarToken,
    (req, res) => {

    const { id } = req.params;
    const { titulo, descripcion, completada } = req.body;
    const usuarioId = req.usuario.id;
    
    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
    return res.status(400).json({
        mensaje: 'El ID de la tarea no es válido'
    });
}

    if (typeof completada !== 'boolean') {
        return res.status(400).json({
            mensaje: 'Completada debe ser true o false'
        });
    }

   if (typeof titulo !== 'string' || titulo.trim() === '') {
        return res.status(400).json({
            mensaje: 'El título es obligatorio y debe ser un texto'
        });
    }

    if (descripcion !== undefined && typeof descripcion !== 'string') {
        return res.status(400).json({
            mensaje: 'La descripción debe ser un texto'
        });
    }

    const sql = `
        UPDATE tareas
        SET titulo = ?, descripcion = ?, completada = ?
        WHERE id = ? AND usuario_id = ?
    `;

    db.query(
        sql,
        [titulo, descripcion || null, completada ? 1 : 0, id, usuarioId],
        (error, resultado) => {

            if (error) {
                console.error(error);

                return res.status(500).json({
                    mensaje: 'Error al actualizar la tarea'
                });
            }

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: 'Tarea no encontrada'
                });
            }

            res.json({
                mensaje: 'Tarea actualizada correctamente'
            });
        }
    );
});

//Ruta para eliminar una tarea existente
router.delete(
    '/:id',
    verificarToken,
    (req, res) => {

    const { id } = req.params;
    const usuarioId = req.usuario.id;

    if (!Number.isInteger(Number(id)) || Number(id) <= 0) {
        return res.status(400).json({
            mensaje: 'El ID de la tarea no es válido'
        });
    }

    const sql = `
        DELETE FROM tareas
        WHERE id = ? AND usuario_id = ?
    `;

    db.query(
        sql,
        [id, usuarioId],
        (error, resultado) => {

            if (error) {
                console.error(error);

                return res.status(500).json({
                    mensaje: 'Error al eliminar la tarea'
                });
            }

            if (resultado.affectedRows === 0) {
                return res.status(404).json({
                    mensaje: 'Tarea no encontrada'
                });
            }

            res.json({
                mensaje: 'Tarea eliminada correctamente'
            });
        }
    );
});

module.exports = router;