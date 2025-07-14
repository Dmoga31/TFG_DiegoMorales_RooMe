-- Add missing user profile fields to existing database
-- Run this script to add the new columns to the users table

ALTER TABLE users ADD COLUMN IF NOT EXISTS apellidos VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS carrera VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS sexo VARCHAR(10);
ALTER TABLE users ADD COLUMN IF NOT EXISTS edad INTEGER;
ALTER TABLE users ADD COLUMN IF NOT EXISTS whatsapp VARCHAR(20);
ALTER TABLE users ADD COLUMN IF NOT EXISTS instagram VARCHAR(100);
ALTER TABLE users ADD COLUMN IF NOT EXISTS profile_image TEXT;

-- Update existing users to have default values
UPDATE users SET 
  apellidos = COALESCE(apellidos, ''),
  carrera = COALESCE(carrera, ''),
  sexo = COALESCE(sexo, ''),
  edad = COALESCE(edad, 0),
  whatsapp = COALESCE(whatsapp, ''),
  instagram = COALESCE(instagram, ''),
  profile_image = COALESCE(profile_image, '')
WHERE apellidos IS NULL OR carrera IS NULL OR sexo IS NULL OR edad IS NULL OR whatsapp IS NULL OR instagram IS NULL OR profile_image IS NULL; 