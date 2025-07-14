const express = require('express');
const pool = require('../../config/db');
const jwt = require('jsonwebtoken');

const router = express.Router();

// Middleware: JWT auth (simple version)
function auth(req, res, next) {
  const authHeader = req.headers.authorization;
  if (!authHeader) return res.status(401).json({ error: 'No token' });
  try {
    req.user = jwt.verify(authHeader.split(' ')[1], process.env.JWT_SECRET);
    next();
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
}

// List all active profiles with hobbies
router.get('/', async (req, res) => {
  const result = await pool.query(`
    SELECT p.id AS publicacion_id, p.estudiante_id, p.descripcion, p.fecha_creacion, p.estado,
           pr.id AS perfil_id, pr.descripcion_personal, pr.presupuesto,
           COALESCE(array_agg(h.id) FILTER (WHERE h.id IS NOT NULL), '{}') AS hobbies
    FROM publicacion p
    JOIN publicacion_perfil_roome pr ON pr.publicacion_id = p.id
    LEFT JOIN perfil_hobby ph ON ph.perfil_id = pr.id
    LEFT JOIN hobbies h ON h.id = ph.hobby_id
    WHERE p.tipo = 'Perfil' AND p.estado = 'Activa'
    GROUP BY p.id, pr.id
    ORDER BY p.fecha_creacion DESC
  `);
  res.json(result.rows);
});

// List all profiles (active and inactive) for the authenticated user
router.get('/all', auth, async (req, res) => {
  const estudianteId = req.user.id;
  const result = await pool.query(`
    SELECT p.id AS publicacion_id, p.estudiante_id, p.descripcion, p.fecha_creacion, p.estado,
           pr.id AS perfil_id, pr.descripcion_personal, pr.presupuesto,
           COALESCE(array_agg(h.id) FILTER (WHERE h.id IS NOT NULL), '{}') AS hobbies
    FROM publicacion p
    JOIN publicacion_perfil_roome pr ON pr.publicacion_id = p.id
    LEFT JOIN perfil_hobby ph ON ph.perfil_id = pr.id
    LEFT JOIN hobbies h ON h.id = ph.hobby_id
    WHERE p.tipo = 'Perfil' AND p.estudiante_id = $1
    GROUP BY p.id, pr.id
    ORDER BY p.fecha_creacion DESC
  `, [estudianteId]);
  res.json(result.rows);
});

// Create profile (only if user has none active)
router.post('/', auth, async (req, res) => {
  const { descripcion_personal, presupuesto, hobbies = [] } = req.body;
  const estudianteId = req.user.id;
  // Verificar que no tenga perfil activo
  const existing = await pool.query(
    `SELECT p.id FROM publicacion p WHERE p.tipo = 'Perfil' AND p.estudiante_id = $1 AND p.estado = 'Activa'`,
    [estudianteId]
  );
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'Only one active profile allowed' });
  }
  // Crear publicación
  const pubResult = await pool.query(
    `INSERT INTO publicacion (estudiante_id, tipo, descripcion, estado) VALUES ($1, 'Perfil', $2, 'Activa') RETURNING *`,
    [estudianteId, descripcion_personal]
  );
  const publicacionId = pubResult.rows[0].id;
  // Crear perfil
  const perfilResult = await pool.query(
    `INSERT INTO publicacion_perfil_roome (publicacion_id, descripcion_personal, presupuesto) VALUES ($1, $2, $3) RETURNING *`,
    [publicacionId, descripcion_personal, presupuesto]
  );
  const perfilId = perfilResult.rows[0].id;
  // Insertar hobbies
  const validHobbies = (hobbies || [])
    .map(h => Number(h))
    .filter(h => Number.isInteger(h) && h > 0);
  for (const hobbyId of validHobbies) {
    await pool.query(
      `INSERT INTO perfil_hobby (perfil_id, hobby_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
      [perfilId, hobbyId]
    );
  }
  // Traer perfil completo
  const result = await pool.query(`
    SELECT p.id AS publicacion_id, p.estudiante_id, p.descripcion, p.fecha_creacion, p.estado,
           pr.id AS perfil_id, pr.descripcion_personal, pr.presupuesto,
           COALESCE(array_agg(h.id) FILTER (WHERE h.id IS NOT NULL), '{}') AS hobbies
    FROM publicacion p
    JOIN publicacion_perfil_roome pr ON pr.publicacion_id = p.id
    LEFT JOIN perfil_hobby ph ON ph.perfil_id = pr.id
    LEFT JOIN hobbies h ON h.id = ph.hobby_id
    WHERE p.id = $1
    GROUP BY p.id, pr.id
  `, [publicacionId]);
  res.status(201).json(result.rows[0]);
});

// Update profile (only owner)
router.put('/:id', auth, async (req, res) => {
  const { id } = req.params; // id de publicacion
  const { descripcion_personal, presupuesto, hobbies = [] } = req.body;
  const estudianteId = req.user.id;

  // Validar presupuesto
  let presupuestoNum = null;
  if (presupuesto !== undefined && presupuesto !== null && presupuesto !== '') {
    presupuestoNum = Number(presupuesto);
    if (isNaN(presupuestoNum) || presupuestoNum <= 0) {
      return res.status(400).json({ error: 'Presupuesto debe ser un número mayor a 0' });
    }
  } else {
    return res.status(400).json({ error: 'Presupuesto es requerido' });
  }

  // Validar hobbies
  let validHobbiesUpdate = [];
  if (hobbies && Array.isArray(hobbies)) {
    validHobbiesUpdate = hobbies
      .map(h => Number(h))
      .filter(h => Number.isInteger(h) && h > 0);
    if (new Set(validHobbiesUpdate).size !== validHobbiesUpdate.length) {
      return res.status(400).json({ error: 'No puedes seleccionar el mismo hobby más de una vez' });
    }
    if (validHobbiesUpdate.length === 0) {
      return res.status(400).json({ error: 'Debes seleccionar al menos un hobby' });
    }
  } else {
    return res.status(400).json({ error: 'Hobbies debe ser un array de IDs válidos' });
  }

  // Verificar que la publicación pertenece al usuario
  const pub = await pool.query('SELECT * FROM publicacion WHERE id = $1', [id]);
  const isAdmin = req.user && (req.user.rol === 'Admin' || req.user.rol === 'admin' || req.user.role === 'admin');
  if (!pub.rows[0] || (pub.rows[0].estudiante_id !== estudianteId && !isAdmin) || pub.rows[0].tipo !== 'Perfil') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // Actualizar publicación y perfil
  await pool.query('UPDATE publicacion SET descripcion = $1 WHERE id = $2', [descripcion_personal, id]);
  const perfil = await pool.query('SELECT * FROM publicacion_perfil_roome WHERE publicacion_id = $1', [id]);
  if (!perfil.rows[0]) return res.status(404).json({ error: 'Profile not found' });
  await pool.query('UPDATE publicacion_perfil_roome SET descripcion_personal = $1, presupuesto = $2 WHERE publicacion_id = $3', [descripcion_personal, presupuestoNum, id]);
  // Actualizar hobbies: eliminar y volver a insertar
  await pool.query('DELETE FROM perfil_hobby WHERE perfil_id = $1', [perfil.rows[0].id]);
  for (const hobbyId of validHobbiesUpdate) {
    await pool.query('INSERT INTO perfil_hobby (perfil_id, hobby_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [perfil.rows[0].id, hobbyId]);
  }
  // Traer perfil actualizado
  const result = await pool.query(`
    SELECT p.id AS publicacion_id, p.estudiante_id, p.descripcion, p.fecha_creacion, p.estado,
           pr.id AS perfil_id, pr.descripcion_personal, pr.presupuesto,
           COALESCE(array_agg(h.id) FILTER (WHERE h.id IS NOT NULL), '{}') AS hobbies
    FROM publicacion p
    JOIN publicacion_perfil_roome pr ON pr.publicacion_id = p.id
    LEFT JOIN perfil_hobby ph ON ph.perfil_id = pr.id
    LEFT JOIN hobbies h ON h.id = ph.hobby_id
    WHERE p.id = $1
    GROUP BY p.id, pr.id
  `, [id]);
  res.json(result.rows[0]);
});

// Update profile status (activate/deactivate)
router.patch('/:id/status', auth, async (req, res) => {
  const { id } = req.params; // id de publicacion
  const { estado } = req.body;
  const estudianteId = req.user.id;
  
  // Verificar que la publicación pertenece al usuario
  const pub = await pool.query('SELECT * FROM publicacion WHERE id = $1', [id]);
  if (!pub.rows[0] || pub.rows[0].estudiante_id !== estudianteId || pub.rows[0].tipo !== 'Perfil') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Validar el estado
  if (estado !== 'Activa' && estado !== 'Desactivada') {
    return res.status(400).json({ error: 'Invalid status' });
  }
  
  // Actualizar el estado
  await pool.query('UPDATE publicacion SET estado = $1 WHERE id = $2', [estado, id]);
  res.json({ success: true });
});

// Deactivate profile (soft delete)
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params; // id de publicacion
  const estudianteId = req.user.id;
  const pub = await pool.query('SELECT * FROM publicacion WHERE id = $1', [id]);
  if (!pub.rows[0] || pub.rows[0].estudiante_id !== estudianteId || pub.rows[0].tipo !== 'Perfil') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await pool.query('UPDATE publicacion SET estado = $1 WHERE id = $2', ['Desactivada', id]);
  res.json({ success: true });
});

// Hard delete profile (permanent)
router.delete('/:id/hard', auth, async (req, res) => {
  const { id } = req.params; // id de publicacion
  const estudianteId = req.user.id;
  const pub = await pool.query('SELECT * FROM publicacion WHERE id = $1', [id]);
  if (!pub.rows[0] || pub.rows[0].estudiante_id !== estudianteId || pub.rows[0].tipo !== 'Perfil') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // Eliminar perfil, hobbies y publicación
  const perfil = await pool.query('SELECT * FROM publicacion_perfil_roome WHERE publicacion_id = $1', [id]);
  if (perfil.rows[0]) {
    await pool.query('DELETE FROM perfil_hobby WHERE perfil_id = $1', [perfil.rows[0].id]);
    await pool.query('DELETE FROM publicacion_perfil_roome WHERE publicacion_id = $1', [id]);
  }
  await pool.query('DELETE FROM publicacion WHERE id = $1', [id]);
  res.json({ success: true });
});

// Get profile by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params; // id de publicacion
  const result = await pool.query(`
    SELECT p.id AS publicacion_id, p.estudiante_id, p.descripcion, p.fecha_creacion, p.estado,
           pr.id AS perfil_id, pr.descripcion_personal, pr.presupuesto,
           COALESCE(array_agg(h.id) FILTER (WHERE h.id IS NOT NULL), '{}') AS hobbies
    FROM publicacion p
    JOIN publicacion_perfil_roome pr ON pr.publicacion_id = p.id
    LEFT JOIN perfil_hobby ph ON ph.perfil_id = pr.id
    LEFT JOIN hobbies h ON h.id = ph.hobby_id
    WHERE p.id = $1
    GROUP BY p.id, pr.id
  `, [id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Profile not found' });
  res.json(result.rows[0]);
});

module.exports = router; 