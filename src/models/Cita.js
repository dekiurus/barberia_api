import mongoose from 'mongoose';

const citaSchema = new mongoose.Schema({
  cliente:  { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  barbero:  { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', default: null },
  servicio: { type: mongoose.Schema.Types.ObjectId, ref: 'Servicio', required: true },
  fecha:    { type: Date, required: true },
  estado:   { type: String, enum: ['pendiente','confirmada','cancelada','completada'], default: 'pendiente' },
  notas:    { type: String, default: null },
}, { timestamps: true });

citaSchema.index({ cliente: 1 });
citaSchema.index({ barbero: 1 });
citaSchema.index({ fecha: 1 });

export default mongoose.model('Cita', citaSchema);
