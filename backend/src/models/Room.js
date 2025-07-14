// Room model para la tabla publicacion_habitacion
class Room {
  constructor({ id, publicacion_id, direccion, precio, tipo_contrato, requisitos = [] }) {
    this.id = id;
    this.publicacion_id = publicacion_id;
    this.direccion = direccion;
    this.precio = precio;
    this.tipo_contrato = tipo_contrato;
    this.requisitos = requisitos; // array de ids o nombres, para uso en la app
  }
}

module.exports = Room; 