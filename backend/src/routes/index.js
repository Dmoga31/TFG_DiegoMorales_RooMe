const express = require('express');
const authRoutes = require('./auth');
const profileRoutes = require('./profiles');
const roomRoutes = require('./rooms');
const adminRoutes = require('./admin');
const requisitosRoutes = require('./requisitos');
const uploadRoutes = require('./upload');
const hobbiesRoutes = require('./hobbies');
const pool = require('../../config/db');

const router = express.Router();

router.use('/auth', authRoutes);
router.use('/profiles', profileRoutes);
router.use('/rooms', roomRoutes);
router.use('/admin', adminRoutes);
router.use('/requisitos', requisitosRoutes);
router.use('/upload', uploadRoutes);
router.use('/hobbies', hobbiesRoutes);

// Endpoint para obtener carreras
router.get('/carreras', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre FROM carreras ORDER BY nombre ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Error al obtener carreras:', err);
    res.status(500).json({ error: 'Error al obtener carreras' });
  }
});

router.get('/users/:id', async (req, res) => {
  const { id } = req.params;
  
  // Validar que el ID existe y es un número válido
  if (!id || isNaN(parseInt(id))) {
    return res.status(400).json({ error: 'ID de usuario inválido' });
  }
  
  try {
    const result = await pool.query(`
      SELECT e.id, e.nombre, e.apellidos, e.correo_institucional,
             ip.genero, ip.edad, ip.whatsapp, ip.instagram, ip.foto_perfil,
             c.id as carrera_id, c.nombre as carrera_nombre
      FROM estudiante e
      LEFT JOIN informacion_personal ip ON ip.estudiante_id = e.id
      LEFT JOIN carreras c ON ip.carrera_id = c.id
      WHERE e.id = $1
    `, [id]);
    
    if (!result.rows[0]) {
      return res.status(404).json({ error: 'User not found' });
    }
    
    // Obtener hobbies del usuario
    const hobbiesRes = await pool.query(`
      SELECT h.id, h.nombre
      FROM publicacion p
      JOIN publicacion_perfil_roome pr ON pr.publicacion_id = p.id
      JOIN perfil_hobby ph ON ph.perfil_id = pr.id
      JOIN hobbies h ON h.id = ph.hobby_id
      WHERE p.estudiante_id = $1
    `, [id]);
    const user = result.rows[0];
    user.hobbies = hobbiesRes.rows.map(h => h.nombre);
    res.json(user);
  } catch (err) {
    console.error('Error al obtener usuario:', err);
    res.status(500).json({ error: 'Error interno del servidor' });
  }
});

module.exports = router; 