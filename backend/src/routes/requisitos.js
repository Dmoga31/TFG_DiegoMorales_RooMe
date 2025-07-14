const express = require('express');
const router = express.Router();
const pool = require('../../config/db');

router.get('/', async (req, res) => {
  try {
    const result = await pool.query('SELECT id, nombre FROM requisitos');
    res.json(result.rows);
  } catch (err) {
    res.status(500).json({ error: 'Error al obtener requisitos' });
  }
});

module.exports = router; 