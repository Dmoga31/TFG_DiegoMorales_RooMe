// Profile model para la tabla publicacion_perfil_roome
class Profile {
  constructor({ id, publicacion_id, descripcion_personal, presupuesto, hobbies = [] }) {
    this.id = id;
    this.publicacion_id = publicacion_id;
    this.descripcion_personal = descripcion_personal;
    this.presupuesto = presupuesto;
    this.hobbies = hobbies; // array de ids o nombres, para uso en la app
  }
}

module.exports = Profile; 