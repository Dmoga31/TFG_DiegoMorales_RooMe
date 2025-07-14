-- Script para configurar la base de datos para las nuevas funcionalidades

-- 1. Crear tabla para almacenar las rutas de las fotos de las habitaciones
CREATE TABLE IF NOT EXISTS habitacion_foto (
  id SERIAL PRIMARY KEY,
  habitacion_id INTEGER NOT NULL REFERENCES publicacion_habitacion(id) ON DELETE CASCADE,
  ruta TEXT NOT NULL,
  fecha_creacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Crear índice para mejorar el rendimiento de las consultas
CREATE INDEX IF NOT EXISTS idx_habitacion_foto_habitacion_id ON habitacion_foto(habitacion_id);

-- 3. Insertar requisitos de ejemplo si no existen
INSERT INTO requisitos (nombre) VALUES 
  ('No fumar') 
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO requisitos (nombre) VALUES 
  ('No fiestas') 
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO requisitos (nombre) VALUES 
  ('No ruido') 
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO requisitos (nombre) VALUES 
  ('Limpieza') 
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO requisitos (nombre) VALUES 
  ('Estudiantes únicamente') 
ON CONFLICT (nombre) DO NOTHING;

INSERT INTO requisitos (nombre) VALUES 
  ('Sin mascotas') 
ON CONFLICT (nombre) DO NOTHING;

-- 4. Verificar que todo esté correcto
SELECT 'Tabla habitacion_foto creada correctamente' as mensaje;
SELECT COUNT(*) as total_requisitos FROM requisitos; 