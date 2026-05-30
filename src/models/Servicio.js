import mongoose from 'mongoose';

const servicioSchema = new mongoose.Schema({
  nombre:      { type: String, required: true, trim: true },
  descripcion: { type: String, default: null },
  duracion:    { type: Number, required: true },   // minutos
  precio:      { type: Number, required: true },
  activo:      { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model('Servicio', servicioSchema);
