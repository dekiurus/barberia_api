import mongoose from 'mongoose';

const pagoSchema = new mongoose.Schema({
  cita:        { type: mongoose.Schema.Types.ObjectId, ref: 'Cita', required: true },
  usuario:     { type: mongoose.Schema.Types.ObjectId, ref: 'Usuario', required: true },
  monto:       { type: Number, required: true },
  moneda:      { type: String, default: 'ARS' },
  proveedor:   { type: String, enum: ['stripe','mercadopago'], required: true },
  proveedor_id:{ type: String, default: null },
  estado:      { type: String, enum: ['pendiente','completado','fallido','reembolsado'], default: 'pendiente' },
  metadata:    { type: mongoose.Schema.Types.Mixed, default: null },
}, { timestamps: true });

pagoSchema.index({ cita: 1 });

export default mongoose.model('Pago', pagoSchema);
