const express = require('express');
const pool = require('../../config/db');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware: JWT auth and admin check
function adminAuth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  try {
    const user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    if (user.role !== 'admin' && user.rol !== 'Admin' && user.rol !== 'admin') return res.status(403).json({ error: 'Admin only' });
    req.user = user;
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// List all users (estudiantes)
router.get('/users', adminAuth, async (req, res) => {
  const result = await pool.query(`
    SELECT e.id, e.nombre, e.apellidos, e.correo_institucional, e.rol, ip.genero, ip.edad, ip.whatsapp, ip.instagram, ip.foto_perfil
    FROM estudiante e
    LEFT JOIN informacion_personal ip ON ip.estudiante_id = e.id
    ORDER BY e.id ASC
  `);
  res.json(result.rows);
});

// Obtener un usuario individual (admin)
router.get('/users/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const result = await pool.query(
    `SELECT id, nombre, apellidos, correo_institucional, rol FROM estudiante WHERE id = $1`,
    [id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

// Editar usuario (admin)
router.put('/users/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { nombre, apellidos, correo_institucional, rol } = req.body;
  if (!nombre || !apellidos || !correo_institucional || !rol) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  await pool.query(
    `UPDATE estudiante SET nombre = $1, apellidos = $2, correo_institucional = $3, rol = $4 WHERE id = $5`,
    [nombre, apellidos, correo_institucional, rol, id]
  );
  res.json({ success: true });
});

// Delete user (estudiante)
router.delete('/users/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  await pool.query('DELETE FROM estudiante WHERE id = $1', [id]);
  res.json({ success: true });
});

// List all publications (habitacion y perfil)
router.get('/publications', adminAuth, async (req, res) => {
  // Perfiles
  const profiles = await pool.query(`
    SELECT p.id AS id, 'Perfil' AS type, p.descripcion, p.estudiante_id AS user_id, p.estado AS status, pr.presupuesto
    FROM publicacion p
    JOIN publicacion_perfil_roome pr ON pr.publicacion_id = p.id
    WHERE p.tipo = 'Perfil'
  `);
  // Habitaciones
  const rooms = await pool.query(`
    SELECT p.id AS id, 'Habitacion' AS type, p.descripcion, p.estudiante_id AS user_id, p.estado AS status, h.precio, h.direccion
    FROM publicacion p
    JOIN publicacion_habitacion h ON h.publicacion_id = p.id
    WHERE p.tipo = 'Habitacion'
  `);
  res.json([...profiles.rows, ...rooms.rows]);
});

// Cambiar estado de cualquier publicación (admin)
router.patch('/publications/:id/status', adminAuth, async (req, res) => {
  const { id } = req.params;
  const { estado } = req.body;
  if (estado !== 'Activa' && estado !== 'Desactivada') {
    return res.status(400).json({ error: 'Invalid status' });
  }
  await pool.query('UPDATE publicacion SET estado = $1 WHERE id = $2', [estado, id]);
  res.json({ success: true });
});

// Delete publication (soft delete)
router.delete('/publications/:id', adminAuth, async (req, res) => {
  const { id } = req.params;
  await pool.query('UPDATE publicacion SET estado = $1 WHERE id = $2', ['Desactivada', id]);
  res.json({ success: true });
});

// Eliminar publicación permanentemente (hard delete)
router.delete('/publications/:id/hard', adminAuth, async (req, res) => {
  const { id } = req.params;
  // Eliminar de tablas hijas según tipo
  // Primero, obtener tipo de publicación
  const pubRes = await pool.query('SELECT tipo FROM publicacion WHERE id = $1', [id]);
  if (!pubRes.rows[0]) return res.status(404).json({ error: 'Publication not found' });
  const tipo = pubRes.rows[0].tipo;
  if (tipo === 'Perfil') {
    // Eliminar hobbies, perfil y publicación
    const perfilRes = await pool.query('SELECT id FROM publicacion_perfil_roome WHERE publicacion_id = $1', [id]);
    if (perfilRes.rows[0]) {
      await pool.query('DELETE FROM perfil_hobby WHERE perfil_id = $1', [perfilRes.rows[0].id]);
      await pool.query('DELETE FROM publicacion_perfil_roome WHERE publicacion_id = $1', [id]);
    }
  } else if (tipo === 'Habitacion') {
    // Eliminar fotos, requisitos, habitacion y publicación
    const habRes = await pool.query('SELECT id FROM publicacion_habitacion WHERE publicacion_id = $1', [id]);
    if (habRes.rows[0]) {
      await pool.query('DELETE FROM habitacion_foto WHERE habitacion_id = $1', [habRes.rows[0].id]);
      await pool.query('DELETE FROM habitacion_requisito WHERE habitacion_id = $1', [habRes.rows[0].id]);
      await pool.query('DELETE FROM publicacion_habitacion WHERE publicacion_id = $1', [id]);
    }
  }
  // Finalmente, eliminar la publicación
  await pool.query('DELETE FROM publicacion WHERE id = $1', [id]);
  res.json({ success: true });
});

module.exports = router; 