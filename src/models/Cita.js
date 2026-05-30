import mongoose from 'mongoose';

const citaSchema = new mongoose.Schema({
  // Guardamos el ID del cliente (puede ser referencia a tu modelo de usuarios o un String)
  cliente_id: { type: String, default: "1" }, 
  barbero_id: { type: String, required: true },
  servicio_id: { type: String, required: true },
  
  // Formato: "2026-05-30" (Súper fácil de buscar y filtrar)
  fecha: { type: String, required: true }, 
  
  // Formato: "14:00"
  hora: { type: String, required: true }, 
  
  estado: { 
    type: String, 
    enum: ['pendiente', 'confirmada', 'cancelada', 'completada'], 
    default: 'pendiente' 
  },
  notas: { type: String, default: '' }
}, { timestamps: true });

// Evita que se duplique el modelo si se recarga con el --watch
const Cita = mongoose.models.Cita || mongoose.model('Cita', citaSchema);
export default Cita;