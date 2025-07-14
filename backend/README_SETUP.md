# Configuración de la Base de Datos para Nuevas Funcionalidades

## Pasos para configurar:

### 1. Ejecutar el script SQL
```bash
# Conectarse a tu base de datos PostgreSQL y ejecutar:
psql -d tu_base_de_datos -f setup_database.sql
```

O ejecutar manualmente el contenido de `setup_database.sql` en tu cliente SQL.

### 2. Verificar que la carpeta uploads existe
```bash
# En el directorio backend/
mkdir -p uploads
```

### 3. Reiniciar el servidor backend
```bash
# En el directorio backend/
npm start
```

## Endpoints nuevos disponibles:

- `GET /api/requisitos` - Obtiene todos los requisitos disponibles
- `POST /api/upload` - Sube una imagen y devuelve la ruta
- `POST /api/rooms` - Crea una nueva habitación (modificado para aceptar JSON)

## Estructura de datos esperada:

### POST /api/rooms
```json
{
  "direccion": "Calle Ejemplo 123",
  "precio": 500.00,
  "tipo_contrato": "Fijo",
  "descripcion": "Habitación amplia y luminosa",
  "requisitos": [1, 2, 3], // IDs de requisitos
  "fotos": ["/uploads/imagen1.jpg", "/uploads/imagen2.jpg"] // Rutas de fotos
}
```

### Respuesta de /api/requisitos
```json
[
  {"id": 1, "nombre": "No fumar"},
  {"id": 2, "nombre": "No fiestas"},
  {"id": 3, "nombre": "No ruido"},
  {"id": 4, "nombre": "Limpieza"},
  {"id": 5, "nombre": "Estudiantes únicamente"},
  {"id": 6, "nombre": "Sin mascotas"}
]
```

## Solución de problemas:

1. **Error 400**: Verificar que todos los campos obligatorios estén presentes
2. **Error de tabla**: Ejecutar el script SQL para crear `habitacion_foto`
3. **Error de uploads**: Verificar que la carpeta `uploads` existe y tiene permisos
4. **Error de requisitos**: Verificar que la tabla `requisitos` tenga datos

## Pruebas:

1. Abrir la consola del navegador
2. Ir a la página de nueva publicación
3. Verificar que se cargan los requisitos (debe aparecer en consola)
4. Completar el formulario y enviar
5. Verificar los logs en consola para identificar errores 