const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors());
app.use(express.json());

// Serve uploads directory for profile images
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Import and use routes here
// const authRoutes = require('./routes/auth');
// app.use('/api/auth', authRoutes);

const routes = require('./routes');
app.use('/api', routes);

module.exports = app; 