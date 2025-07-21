const express = require('express');
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const pool = require('../../config/db');
const XLSX = require('xlsx');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const router = express.Router();

// Helper: Validate institutional email from Excel
function isInstitutionalEmail(email) {
  const domain = '@alumnos.uneatlantico.es';
  if (!email || typeof email !== 'string') {
    console.log('Email vacío o no es string:', email);
    return false;
  }
  if (!email.endsWith(domain)) {
    console.log('Email no termina con dominio institucional:', email);
    return false;
  }
  console.log('Current working directory:', process.cwd());
  console.log('Looking for file in:', path.join(process.cwd(), 'database', 'seed_students.xlsx'));
  const filePath = path.join(process.cwd(), 'database', 'seed_students.xlsx');
    if (!fs.existsSync(filePath)) {
    console.log('No existe el archivo seed_students.xlsx en:', filePath);
    return false;
  }
  const workbook = XLSX.readFile(filePath);
  const sheet = workbook.Sheets[workbook.SheetNames[0]];
  const emails = XLSX.utils.sheet_to_json(sheet, { header: 1 }).flat();
  console.log('Email recibido:', email);
  console.log('Correos en Excel:', emails);
  return emails.includes(email);
}

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, '../../uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir);
}

const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, uploadsDir);
  },
  filename: function (req, file, cb) {
    // Use user id and timestamp for uniqueness
    const ext = path.extname(file.originalname);
    const uniqueName = `user_${Date.now()}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });


// Register
router.post('/register', upload.single('foto_perfil'), async (req, res) => {
  let { nombre, apellidos, correo_institucional, password, carrera_id, genero, edad, whatsapp, instagram } = req.body;
  // Convert email to lowercase
  correo_institucional = correo_institucional.toLowerCase();
  if (!isInstitutionalEmail(correo_institucional)) {
    return res.status(400).json({ error: 'Email not allowed' });
  }
  const hashed = await bcrypt.hash(password, 10);
  const client = await pool.connect();
  try {
    await client.query('BEGIN');
    // Insertar en estudiante
    const estudianteResult = await client.query(
      `INSERT INTO estudiante (nombre, apellidos, correo_institucional, password) VALUES ($1, $2, $3, $4) RETURNING id` ,
      [nombre, apellidos, correo_institucional, hashed]
    );
    const estudianteId = estudianteResult.rows[0].id;
    // Manejar foto de perfil
    let fotoPerfilPath = null;
    if (req.file) {
      fotoPerfilPath = '/uploads/' + req.file.filename;
    }
    // Insertar en informacion_personal
    await client.query(
      `INSERT INTO informacion_personal (estudiante_id, carrera_id, genero, edad, whatsapp, instagram, foto_perfil) VALUES ($1, $2, $3, $4, $5, $6, $7)` ,
      [estudianteId, carrera_id, genero, edad, whatsapp, instagram, fotoPerfilPath]
    );
    await client.query('COMMIT');
    res.status(201).json({ success: true });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('Error al registrar usuario:', err);
    res.status(400).json({ error: 'User already exists or invalid data' });
  } finally {
    client.release();
  }
});

// Login
router.post('/login', async (req, res) => {
  const { password } = req.body;
  const correo_institucional = req.body.correo_institucional.toLowerCase();
  
  const result = await pool.query('SELECT * FROM estudiante WHERE correo_institucional = $1', [correo_institucional]);
  const user = result.rows[0];
  if (!user) return res.status(401).json({ error: 'Invalid credentials' });
  const valid = await bcrypt.compare(password, user.password);
  if (!valid) return res.status(401).json({ error: 'Invalid credentials' });
  const token = jwt.sign({ id: user.id, rol: user.rol }, process.env.JWT_SECRET, { expiresIn: '24h' });
  res.json({ 
    token, 
    user: { 
      id: user.id, 
      nombre: user.nombre, 
      apellidos: user.apellidos,
      correo_institucional: user.correo_institucional,
      rol: user.rol // <-- agrega el campo rol
    } 
  });
});

// Get current user
router.get('/me', async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });
  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    const result = await pool.query(`
      SELECT e.id, e.nombre, e.apellidos, e.correo_institucional, e.rol,
             ip.genero, ip.edad, ip.whatsapp, ip.instagram, ip.foto_perfil,
             c.id as carrera_id, c.nombre as carrera_nombre
      FROM estudiante e
      LEFT JOIN informacion_personal ip ON ip.estudiante_id = e.id
      LEFT JOIN carreras c ON ip.carrera_id = c.id
      WHERE e.id = $1
    `, [decoded.id]);
    res.json({ user: result.rows[0] });
  } catch {
    res.status(401).json({ error: 'Invalid token' });
  }
});

const updateUpload = upload.single('foto_perfil');
router.put('/me', updateUpload, async (req, res) => {
  const auth = req.headers.authorization;
  if (!auth) return res.status(401).json({ error: 'No token' });

  try {
    const decoded = jwt.verify(auth.split(' ')[1], process.env.JWT_SECRET);
    const userId = decoded.id;
    const client = await pool.connect();
    try {
      await client.query('BEGIN');
      // Actualizar estudiante
      const {
        nombre,
        apellidos,
        correo_institucional,
        password,
        carrera_id,
        genero,
        edad,
        whatsapp,
        instagram
      } = req.body;

      let estudianteFields = [];
      let estudianteValues = [];
      let paramCount = 1;
      if (nombre !== undefined) {
        estudianteFields.push(`nombre = $${paramCount++}`);
        estudianteValues.push(nombre);
      }
      if (apellidos !== undefined) {
        estudianteFields.push(`apellidos = $${paramCount++}`);
        estudianteValues.push(apellidos);
      }
      if (correo_institucional !== undefined) {
        estudianteFields.push(`correo_institucional = $${paramCount++}`);
        estudianteValues.push(correo_institucional);
      }
      if (password !== undefined && password.trim() !== '') {
        const hashedPassword = await bcrypt.hash(password, 10);
        estudianteFields.push(`password = $${paramCount++}`);
        estudianteValues.push(hashedPassword);
      }
      if (estudianteFields.length > 0) {
        estudianteValues.push(userId);
        await client.query(
          `UPDATE estudiante SET ${estudianteFields.join(', ')} WHERE id = $${paramCount}`,
          estudianteValues
        );
      }

      // Actualizar informacion_personal
      let infoFields = [];
      let infoValues = [];
      let infoParam = 1;
      if (carrera_id !== undefined) {
        infoFields.push(`carrera_id = $${infoParam++}`);
        infoValues.push(carrera_id);
      }
      if (genero !== undefined) {
        infoFields.push(`genero = $${infoParam++}`);
        infoValues.push(genero);
      }
      if (edad !== undefined) {
        infoFields.push(`edad = $${infoParam++}`);
        infoValues.push(edad);
      }
      if (whatsapp !== undefined) {
        infoFields.push(`whatsapp = $${infoParam++}`);
        infoValues.push(whatsapp);
      }
      if (instagram !== undefined) {
        infoFields.push(`instagram = $${infoParam++}`);
        infoValues.push(instagram);
      }
      if (req.file) {
        infoFields.push(`foto_perfil = $${infoParam++}`);
        infoValues.push('/uploads/' + req.file.filename);
      }
      if (infoFields.length > 0) {
        infoValues.push(userId);
        await client.query(
          `UPDATE informacion_personal SET ${infoFields.join(', ')} WHERE estudiante_id = $${infoParam}`,
          infoValues
        );
      }
      await client.query('COMMIT');
      // Devolver el usuario actualizado
      const result = await client.query(`
        SELECT e.id, e.nombre, e.apellidos, e.correo_institucional, e.rol,
               ip.genero, ip.edad, ip.whatsapp, ip.instagram, ip.foto_perfil,
               c.id as carrera_id, c.nombre as carrera_nombre
        FROM estudiante e
        LEFT JOIN informacion_personal ip ON ip.estudiante_id = e.id
        LEFT JOIN carreras c ON ip.carrera_id = c.id
        WHERE e.id = $1
      `, [userId]);
      res.json({ user: result.rows[0] });
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(400).json({ error: 'Error updating profile' });
  }
});

module.exports = router; 