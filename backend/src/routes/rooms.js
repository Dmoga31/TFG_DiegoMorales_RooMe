const express = require('express');
const pool = require('../../config/db');
const jwt = require('jsonwebtoken');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Configuración de multer para guardar imágenes
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    const uniqueName = `room_${Date.now()}_${Math.round(Math.random()*1E9)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

// List all active rooms with requisitos
router.get('/', async (req, res) => {
  const result = await pool.query(`
    SELECT p.id AS publicacion_id, p.estudiante_id, p.descripcion, p.fecha_creacion, p.estado,
           h.id AS habitacion_id, h.direccion, h.precio, h.tipo_contrato,
           COALESCE(array_agg(r.id) FILTER (WHERE r.id IS NOT NULL), '{}') AS requisitos
    FROM publicacion p
    JOIN publicacion_habitacion h ON h.publicacion_id = p.id
    LEFT JOIN habitacion_requisito hr ON hr.habitacion_id = h.id
    LEFT JOIN requisitos r ON r.id = hr.requisito_id
    WHERE p.tipo = 'Habitacion' AND p.estado = 'Activa'
    GROUP BY p.id, h.id
    ORDER BY p.fecha_creacion DESC
  `);
  res.json(result.rows);
});

// List all rooms (active and inactive) for the authenticated user
router.get('/all', auth, async (req, res) => {
  const estudianteId = req.user.id;
  const result = await pool.query(`
    SELECT p.id AS publicacion_id, p.estudiante_id, p.descripcion, p.fecha_creacion, p.estado,
           h.id AS habitacion_id, h.direccion, h.precio, h.tipo_contrato,
           COALESCE(array_agg(r.id) FILTER (WHERE r.id IS NOT NULL), '{}') AS requisitos
    FROM publicacion p
    JOIN publicacion_habitacion h ON h.publicacion_id = p.id
    LEFT JOIN habitacion_requisito hr ON hr.habitacion_id = h.id
    LEFT JOIN requisitos r ON r.id = hr.requisito_id
    WHERE p.tipo = 'Habitacion' AND p.estudiante_id = $1
    GROUP BY p.id, h.id
    ORDER BY p.fecha_creacion DESC
  `, [estudianteId]);
  res.json(result.rows);
});

// Crear habitación (solo si el usuario no tiene ninguna activa)
router.post('/', auth, async (req, res) => {
  const { direccion, precio, tipo_contrato, descripcion, requisitos = [], fotos = [] } = req.body;
  const estudianteId = req.user.id;
  
  // Verificar campos obligatorios
  if (!direccion || !precio || !tipo_contrato || !descripcion) {
    return res.status(400).json({ error: 'Faltan campos obligatorios' });
  }
  
  // Validar tipo de contrato
  if (tipo_contrato !== 'Fijo' && tipo_contrato !== 'Escolar') {
    return res.status(400).json({ error: 'Tipo de contrato debe ser "Fijo" o "Escolar"' });
  }
  
  // Verificar que no tenga ninguna publicación de habitación (activa o desactivada)
  const existing = await pool.query(
    `SELECT p.id FROM publicacion p WHERE p.tipo = 'Habitacion' AND p.estudiante_id = $1`,
    [estudianteId]
  );
  if (existing.rows.length > 0) {
    return res.status(400).json({ error: 'Ya tienes una publicación de habitación. Debes eliminar la existente antes de crear una nueva.' });
  }
  
  try {
    console.log('Creando publicación...');
    // Crear publicación
    const pubResult = await pool.query(
      `INSERT INTO publicacion (estudiante_id, tipo, descripcion, estado) VALUES ($1, 'Habitacion', $2, 'Activa') RETURNING *`,
      [estudianteId, descripcion]
    );
    const publicacionId = pubResult.rows[0].id;
    console.log('Publicación creada con ID:', publicacionId);
    
    console.log('Creando habitación...');
    // Crear habitacion
    const habResult = await pool.query(
      `INSERT INTO publicacion_habitacion (publicacion_id, direccion, precio, tipo_contrato) VALUES ($1, $2, $3, $4) RETURNING *`,
      [publicacionId, direccion, precio, tipo_contrato]
    );
    const habitacionId = habResult.rows[0].id;
    console.log('Habitación creada con ID:', habitacionId);
    
    console.log('Insertando requisitos...');
    // Insertar requisitos
    if (Array.isArray(requisitos)) {
      for (const requisitoId of requisitos) {
        // Verificar que el requisitoId es un número válido
        if (typeof requisitoId === 'number' && requisitoId > 0) {
          await pool.query(
            `INSERT INTO habitacion_requisito (habitacion_id, requisito_id) VALUES ($1, $2) ON CONFLICT DO NOTHING`,
            [habitacionId, requisitoId]
          );
        } else {
          console.warn('Requisito ID inválido:', requisitoId);
        }
      }
    }
    console.log('Requisitos insertados');
    
    console.log('Guardando fotos...');
    // Guardar rutas de fotos
    if (Array.isArray(fotos)) {
      for (const ruta of fotos) {
        await pool.query(
          `INSERT INTO habitacion_foto (habitacion_id, ruta) VALUES ($1, $2)`,
          [habitacionId, ruta]
        );
      }
    }
    console.log('Fotos guardadas');
    
    console.log('Obteniendo habitación completa...');
    // Traer habitación completa
    const result = await pool.query(`
      SELECT p.id AS publicacion_id, p.estudiante_id, p.descripcion, p.fecha_creacion, p.estado,
             h.id AS habitacion_id, h.direccion, h.precio, h.tipo_contrato,
             COALESCE(array_agg(r.id) FILTER (WHERE r.id IS NOT NULL), '{}') AS requisitos
      FROM publicacion p
      JOIN publicacion_habitacion h ON h.publicacion_id = p.id
      LEFT JOIN habitacion_requisito hr ON hr.habitacion_id = h.id
      LEFT JOIN requisitos r ON r.id = hr.requisito_id
      WHERE p.id = $1
      GROUP BY p.id, h.id
    `, [publicacionId]);
    
    console.log('Respuesta final:', result.rows[0]);
    res.status(201).json(result.rows[0]);
  } catch (error) {
    console.error('Error creating room:', error);
    console.error('Error details:', {
      message: error.message,
      code: error.code,
      detail: error.detail,
      hint: error.hint
    });
    res.status(500).json({ error: 'Error interno del servidor: ' + error.message });
  }
});

// Actualizar habitación (solo propietario)
router.put('/:id', auth, upload.array('photos', 3), async (req, res) => {
  const { id } = req.params; // id de publicacion
  const { direccion, precio, tipo_contrato, descripcion, requisitos = [], photosToDelete = [] } = req.body;
  const estudianteId = req.user.id;
  
  // Validar tipo de contrato
  if (tipo_contrato && tipo_contrato !== 'Fijo' && tipo_contrato !== 'Escolar') {
    return res.status(400).json({ error: 'Tipo de contrato debe ser "Fijo" o "Escolar"' });
  }
  
  // Parse requisitos if it's a JSON string
  let parsedRequisitos = requisitos;
  if (typeof requisitos === 'string') {
    try {
      parsedRequisitos = JSON.parse(requisitos);
    } catch (err) {
      console.error('Error parsing requisitos:', err);
      parsedRequisitos = [];
    }
  }
  
  // Parse photosToDelete if it's a JSON string
  let parsedPhotosToDelete = photosToDelete;
  if (typeof photosToDelete === 'string') {
    try {
      parsedPhotosToDelete = JSON.parse(photosToDelete);
    } catch (err) {
      console.error('Error parsing photosToDelete:', err);
      parsedPhotosToDelete = [];
    }
  }
  
  // Verificar que la publicación pertenece al usuario
  const pub = await pool.query('SELECT * FROM publicacion WHERE id = $1', [id]);
  const isAdmin = req.user && (req.user.rol === 'Admin' || req.user.rol === 'admin' || req.user.role === 'admin');
  if (!pub.rows[0] || (pub.rows[0].estudiante_id !== estudianteId && !isAdmin) || pub.rows[0].tipo !== 'Habitacion') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  
  // Actualizar publicación y habitacion
  await pool.query('UPDATE publicacion SET descripcion = $1 WHERE id = $2', [descripcion, id]);
  const hab = await pool.query('SELECT * FROM publicacion_habitacion WHERE publicacion_id = $1', [id]);
  if (!hab.rows[0]) return res.status(404).json({ error: 'Room not found' });
  await pool.query('UPDATE publicacion_habitacion SET direccion = $1, precio = $2, tipo_contrato = $3 WHERE publicacion_id = $4', [direccion, precio, tipo_contrato, id]);
  
  // Actualizar requisitos: eliminar y volver a insertar
  await pool.query('DELETE FROM habitacion_requisito WHERE habitacion_id = $1', [hab.rows[0].id]);
  for (const requisitoId of parsedRequisitos) {
    await pool.query('INSERT INTO habitacion_requisito (habitacion_id, requisito_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [hab.rows[0].id, requisitoId]);
  }
  
  // Eliminar fotos marcadas para eliminar
  if (Array.isArray(parsedPhotosToDelete) && parsedPhotosToDelete.length > 0) {
    for (const photoPath of parsedPhotosToDelete) {
      await pool.query('DELETE FROM habitacion_foto WHERE habitacion_id = $1 AND ruta = $2', [hab.rows[0].id, photoPath]);
      
      // También eliminar el archivo físico si existe
      try {
        const photoPathFull = path.join(__dirname, '../../uploads', path.basename(photoPath));
        if (fs.existsSync(photoPathFull)) {
          fs.unlinkSync(photoPathFull);
        }
      } catch (err) {
        console.error('Error deleting photo file:', err);
      }
    }
  }
  
  // Agregar nuevas fotos si se subieron
  if (req.files && req.files.length > 0) {
    for (const file of req.files) {
      const photoPath = `/uploads/${file.filename}`;
      await pool.query('INSERT INTO habitacion_foto (habitacion_id, ruta) VALUES ($1, $2)', [hab.rows[0].id, photoPath]);
    }
  }
  
  // Traer habitación actualizada
  const result = await pool.query(`
    SELECT p.id AS publicacion_id, p.estudiante_id, p.descripcion, p.fecha_creacion, p.estado,
           h.id AS habitacion_id, h.direccion, h.precio, h.tipo_contrato,
           COALESCE(array_agg(r.id) FILTER (WHERE r.id IS NOT NULL), '{}') AS requisitos
    FROM publicacion p
    JOIN publicacion_habitacion h ON h.publicacion_id = p.id
    LEFT JOIN habitacion_requisito hr ON hr.habitacion_id = h.id
    LEFT JOIN requisitos r ON r.id = hr.requisito_id
    WHERE p.id = $1
    GROUP BY p.id, h.id
  `, [id]);
  res.json(result.rows[0]);
});

// Update room status (activate/deactivate)
router.patch('/:id/status', auth, async (req, res) => {
  const { id } = req.params; // id de publicacion
  const { estado } = req.body;
  const estudianteId = req.user.id;
  
  // Verificar que la publicación pertenece al usuario
  const pub = await pool.query('SELECT * FROM publicacion WHERE id = $1', [id]);
  if (!pub.rows[0] || pub.rows[0].estudiante_id !== estudianteId || pub.rows[0].tipo !== 'Habitacion') {
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

// Deactivate room (soft delete)
router.delete('/:id', auth, async (req, res) => {
  const { id } = req.params; // id de publicacion
  const estudianteId = req.user.id;
  const pub = await pool.query('SELECT * FROM publicacion WHERE id = $1', [id]);
  if (!pub.rows[0] || pub.rows[0].estudiante_id !== estudianteId || pub.rows[0].tipo !== 'Habitacion') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  await pool.query('UPDATE publicacion SET estado = $1 WHERE id = $2', ['Desactivada', id]);
  res.json({ success: true });
});

// Hard delete room (permanent)
router.delete('/:id/hard', auth, async (req, res) => {
  const { id } = req.params; // id de publicacion
  const estudianteId = req.user.id;
  const pub = await pool.query('SELECT * FROM publicacion WHERE id = $1', [id]);
  if (!pub.rows[0] || pub.rows[0].estudiante_id !== estudianteId || pub.rows[0].tipo !== 'Habitacion') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  // Eliminar habitacion, fotos, requisitos y publicación
  const hab = await pool.query('SELECT * FROM publicacion_habitacion WHERE publicacion_id = $1', [id]);
  if (hab.rows[0]) {
    // Eliminar fotos y archivos físicos
    const fotos = await pool.query('SELECT ruta FROM habitacion_foto WHERE habitacion_id = $1', [hab.rows[0].id]);
    for (const foto of fotos.rows) {
      try {
        const photoPathFull = path.join(__dirname, '../../uploads', path.basename(foto.ruta));
        if (fs.existsSync(photoPathFull)) {
          fs.unlinkSync(photoPathFull);
        }
      } catch (err) {
        console.error('Error deleting photo file:', err);
      }
    }
    await pool.query('DELETE FROM habitacion_foto WHERE habitacion_id = $1', [hab.rows[0].id]);
    await pool.query('DELETE FROM habitacion_requisito WHERE habitacion_id = $1', [hab.rows[0].id]);
    await pool.query('DELETE FROM publicacion_habitacion WHERE publicacion_id = $1', [id]);
  }
  await pool.query('DELETE FROM publicacion WHERE id = $1', [id]);
  res.json({ success: true });
});

// Get room by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params; // id de publicacion
  const result = await pool.query(`
    SELECT p.id AS publicacion_id, p.estudiante_id, p.descripcion, p.fecha_creacion, p.estado,
           h.id AS habitacion_id, h.direccion, h.precio, h.tipo_contrato,
           COALESCE(array_agg(r.id) FILTER (WHERE r.id IS NOT NULL), '{}') AS requisitos
    FROM publicacion p
    JOIN publicacion_habitacion h ON h.publicacion_id = p.id
    LEFT JOIN habitacion_requisito hr ON hr.habitacion_id = h.id
    LEFT JOIN requisitos r ON r.id = hr.requisito_id
    WHERE p.id = $1
    GROUP BY p.id, h.id
  `, [id]);
  if (!result.rows[0]) return res.status(404).json({ error: 'Room not found' });
  res.json(result.rows[0]);
});

// Get room photos
router.get('/:id/photos', async (req, res) => {
  const { id } = req.params; // id de publicacion
  try {
    const result = await pool.query(`
      SELECT hf.ruta
      FROM publicacion p
      JOIN publicacion_habitacion h ON h.publicacion_id = p.id
      JOIN habitacion_foto hf ON hf.habitacion_id = h.id
      WHERE p.id = $1
      ORDER BY hf.fecha_creacion ASC
    `, [id]);
    res.json(result.rows.map(row => row.ruta));
  } catch (err) {
    console.error('Error getting room photos:', err);
    res.status(500).json({ error: 'Error al obtener las fotos' });
  }
});

module.exports = router; 