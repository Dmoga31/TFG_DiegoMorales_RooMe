const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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
    const uniqueName = `upload_${Date.now()}_${Math.round(Math.random()*1E9)}${ext}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

router.post('/', upload.single('photo'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No se subió ninguna imagen' });
  }
  res.json({ path: `/uploads/${req.file.filename}` });
});

module.exports = router; 