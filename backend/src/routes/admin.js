const express = require('express');
const pool = require('../../config/db');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const router = express.Router();

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

// Multer storage configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `user_${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

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

// Admin: Crear un nuevo usuario
router.post('/users', adminAuth, upload.single('foto_perfil'), async (req, res) => {
  let { nombre, apellidos, correo_institucional, password, carrera_id, genero, edad, whatsapp, instagram, rol = 'Estudiante' } = req.body;
  // Convert email to lowercase
  correo_institucional = correo_institucional.toLowerCase();
  if (!nombre || !apellidos || !correo_institucional || !password || !carrera_id) {
    return res.status(400).json({ error: 'Faltan campos obligatorios.' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Comprobar si el correo ya existe
    const existingUser = await client.query('SELECT id FROM estudiante WHERE correo_institucional = $1', [correo_institucional]);
    if (existingUser.rows.length > 0) {
      return res.status(400).json({ error: 'El correo electrónico ya está registrado.' });
    }

    const hashed = await bcrypt.hash(password, 10);

    // Insertar en estudiante
    const estudianteResult = await client.query(
      `INSERT INTO estudiante (nombre, apellidos, correo_institucional, password, rol) VALUES ($1, $2, $3, $4, $5) RETURNING id`,
      [nombre, apellidos, correo_institucional, hashed, rol]
    );
    const estudianteId = estudianteResult.rows[0].id;

    // Manejar foto de perfil
    let fotoPerfilPath = null;
    if (req.file) {
      fotoPerfilPath = '/uploads/' + req.file.filename;
    }

    // Insertar en informacion_personal
    await client.query(
      `INSERT INTO informacion_personal (estudiante_id, carrera_id, genero, edad, whatsapp, instagram, foto_perfil) VALUES ($1, $2, $3, $4, $5, $6, $7)`,
      [estudianteId, carrera_id, genero, edad, whatsapp, instagram, fotoPerfilPath]
    );

    await client.query('COMMIT');
    res.status(201).json({ success: true, userId: estudianteId });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al crear usuario (admin):', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
});

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
    `SELECT e.id, e.nombre, e.apellidos, e.correo_institucional, e.rol,
            ip.carrera_id, ip.genero, ip.edad, ip.whatsapp, ip.instagram, ip.foto_perfil
     FROM estudiante e
     LEFT JOIN informacion_personal ip ON ip.estudiante_id = e.id
     WHERE e.id = $1`,
    [id]
  );
  if (!result.rows[0]) return res.status(404).json({ error: 'User not found' });
  res.json(result.rows[0]);
});

// Editar usuario (admin)
router.put('/users/:id', adminAuth, upload.single('foto_perfil'), async (req, res) => {
  const { id } = req.params;
  let {
    nombre, apellidos, correo_institucional, rol,
    carrera_id, genero, edad, whatsapp, instagram
  } = req.body;

  if (!nombre || !apellidos || !correo_institucional || !rol) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }

  const client = await pool.connect();
  try {
    await client.query('BEGIN');

    // Update estudiante
    await client.query(
      `UPDATE estudiante SET nombre = $1, apellidos = $2, correo_institucional = $3, rol = $4 WHERE id = $5`,
      [nombre, apellidos, correo_institucional, rol, id]
    );

    // Prepare photo path if uploaded
    let fotoPerfilPath = null;
    if (req.file) {
      fotoPerfilPath = '/uploads/' + req.file.filename;
    }

    // Update informacion_personal
    // Check if row exists
    const infoRes = await client.query('SELECT estudiante_id FROM informacion_personal WHERE estudiante_id = $1', [id]);
    if (infoRes.rows.length > 0) {
      // Update existing row
      await client.query(
        `UPDATE informacion_personal SET
          carrera_id = $1, genero = $2, edad = $3, whatsapp = $4, instagram = $5
          ${fotoPerfilPath ? ', foto_perfil = $6' : ''}
         WHERE estudiante_id = $${fotoPerfilPath ? 7 : 6}`,
        fotoPerfilPath
          ? [carrera_id, genero, edad, whatsapp, instagram, fotoPerfilPath, id]
          : [carrera_id, genero, edad, whatsapp, instagram, id]
      );
    } else {
      // Insert new row if not exists
      await client.query(
        `INSERT INTO informacion_personal (estudiante_id, carrera_id, genero, edad, whatsapp, instagram, foto_perfil)
         VALUES ($1, $2, $3, $4, $5, $6, $7)` ,
        [id, carrera_id, genero, edad, whatsapp, instagram, fotoPerfilPath]
      );
    }

    await client.query('COMMIT');
    res.json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error updating user (admin):', err);
    res.status(500).json({ error: 'Error interno del servidor.' });
  } finally {
    client.release();
  }
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
    ORDER BY p.id ASC
  `);
  // Habitaciones
  const rooms = await pool.query(`
    SELECT p.id AS id, 'Habitacion' AS type, p.descripcion, p.estudiante_id AS user_id, p.estado AS status, h.precio, h.direccion
    FROM publicacion p
    JOIN publicacion_habitacion h ON h.publicacion_id = p.id
    WHERE p.tipo = 'Habitacion'
    ORDER BY p.id ASC
  `);
  
  // Combine and sort the final results
  const allPublications = [...profiles.rows, ...rooms.rows];
  allPublications.sort((a, b) => a.id - b.id);
  
  res.json(allPublications);
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