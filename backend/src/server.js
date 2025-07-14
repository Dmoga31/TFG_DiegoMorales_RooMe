const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const app = require('./app');

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
}); 