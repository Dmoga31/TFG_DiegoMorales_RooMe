-- Users (Students & Admins)
CREATE TABLE IF NOT EXISTS users (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  email VARCHAR(100) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('student', 'admin')),
  apellidos VARCHAR(100),
  carrera VARCHAR(100),
  sexo VARCHAR(10),
  edad INTEGER,
  whatsapp VARCHAR(20),
  instagram VARCHAR(100),
  profile_image TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Roommate Profiles (1 per student)
CREATE TABLE IF NOT EXISTS profiles (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  bio TEXT,
  preferences JSONB,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Room Listings (1 per student)
CREATE TABLE IF NOT EXISTS rooms (
  id SERIAL PRIMARY KEY,
  user_id INTEGER UNIQUE REFERENCES users(id) ON DELETE CASCADE,
  title VARCHAR(255),
  description TEXT,
  location VARCHAR(255),
  price NUMERIC,
  is_active BOOLEAN DEFAULT TRUE,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Admin actions log (optional, for audit)
CREATE TABLE IF NOT EXISTS admin_logs (
  id SERIAL PRIMARY KEY,
  admin_id INTEGER REFERENCES users(id),
  action TEXT,
  target_type VARCHAR(50),
  target_id INTEGER,
  timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
); 