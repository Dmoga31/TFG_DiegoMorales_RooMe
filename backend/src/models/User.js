// User model para la tabla estudiante
class User {
  constructor({ id, nombre, apellidos, correo_institucional, password }) {
    this.id = id;
    this.nombre = nombre;
    this.apellidos = apellidos;
    this.correo_institucional = correo_institucional;
    this.password = password;
  }
}

module.exports = User; 