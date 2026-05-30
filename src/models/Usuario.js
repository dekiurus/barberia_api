import mongoose from 'mongoose';

const usuarioSchema = new mongoose.Schema({
  nombre:   { type: String, required: true, trim: true },
  email:    { type: String, required: true, unique: true, lowercase: true, trim: true },
  password: { type: String, required: true },
  rol:      { type: String, enum: ['cliente','barbero','admin'], default: 'cliente' },
  telefono: { type: String, default: null },
}, { timestamps: true });

export default mongoose.model('Usuario', usuarioSchema);
