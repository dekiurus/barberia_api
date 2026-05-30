import "dotenv/config";
import express from "express";
import conectar from "./src/config/database.js";
import mongoose from "mongoose";
import authRoutes from "./src/routes/auth.js";
import citasRoutes from "./src/routes/citas.js";
import serviciosRoutes from "./src/routes/servicios.js";
import pagosRoutes from "./src/routes/pagos.js";
import busquedaRoutes from "./src/routes/busqueda.js";
import cors from "cors";

// Definición interna del Modelo de Cita para MongoDB (Evita errores de importación masiva)
const citaSchema = new mongoose.Schema(
  {
    cliente_id: { type: String, default: "1" },
    barbero_id: { type: String, required: true },
    servicio_id: { type: String, required: true },
    fecha: { type: String, required: true }, // Formato: "YYYY-MM-DD"
    hora: { type: String, required: true }, // Formato: "HH:MM"
    estado: {
      type: String,
      enum: ["pendiente", "confirmada", "cancelada", "completada"],
      default: "pendiente",
    },
    notas: { type: String, default: "" },
  },
  { timestamps: true },
);

const Cita = mongoose.models.Cita || mongoose.model("Cita", citaSchema);

await conectar();

const app = express();
const PORT = process.env.PORT || 3000;

// Reemplazamos las cabeceras manuales por la configuración limpia de CORS
app.use(cors());

app.use("/api/pagos/stripe/webhook", express.raw({ type: "application/json" }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// ==========================================
// RUTA DE DISPONIBILIDAD (INYECTADA DIRECTAMENTE)
// ==========================================
app.get("/api/citas/disponibilidad", async (req, res) => {
  try {
    const { barbero_id, fecha } = req.query;

    if (!barbero_id || !fecha) {
      return res
        .status(400)
        .json({ error: "Faltan parámetros requeridos: barbero_id y fecha" });
    }

    // Horarios de apertura de la barbería
    const horariosJornada = [
      "08:00",
      "09:00",
      "10:00",
      "11:00",
      "12:00",
      "14:00",
      "15:00",
      "16:00",
      "17:00",
    ];

    // Buscar en Mongo qué horas ya están tomadas ese día con ese barbero
    const citasOcupadas = await Cita.find({
      barbero_id: barbero_id,
      fecha: fecha,
      estado: { $ne: "cancelada" },
    }).select("hora");

    const horasOcupadas = citasOcupadas.map((cita) => cita.hora);

    // Dejar solo las horas que no se repiten
    const horasDisponibles = horariosJornada.filter(
      (hora) => !horasOcupadas.includes(hora),
    );

    return res.json(horasDisponibles);
  } catch (error) {
    console.error("Error al calcular disponibilidad:", error);
    return res
      .status(500)
      .json({ error: "Error interno al consultar la agenda" });
  }
});
// ==========================================
// RUTA PARA CANCELAR CITA (PATCH /api/citas/:id)
// ==========================================
app.patch("/api/citas/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const { estado } = req.body; // El frontend enviará { estado: 'cancelada' }

    if (!mongoose.Types.ObjectId.isValid(id)) {
      return res
        .status(400)
        .json({ error: "El formato del código de la cita no es válido" });
    }

    // Buscamos la cita por su ID de Mongo y actualizamos el campo estado
    const citaActualizada = await Cita.findByIdAndUpdate(
      id,
      { estado: estado || "cancelada" },
      { new: true }, // Para que devuelva el documento ya modificado
    );

    if (!citaActualizada) {
      return res
        .status(404)
        .json({ error: "No se encontró ninguna cita con ese código" });
    }

    return res.json({
      message: "Cita actualizada correctamente",
      cita: citaActualizada,
    });
  } catch (error) {
    console.error("Error al cancelar la cita en Mongo:", error);
    return res
      .status(500)
      .json({ error: "Error interno al procesar la cancelación" });
  }
});

// ==========================================
// RUTA PARA CREAR CITA (INYECTADA DIRECTAMENTE)
// ==========================================
app.post("/api/citas", async (req, res) => {
  try {
    const { barbero_id, servicio_id, fecha, hora, cliente_id, notes } =
      req.body;

    if (!barbero_id || !servicio_id || !fecha || !hora) {
      return res
        .status(400)
        .json({ error: "Faltan campos obligatorios para agendar" });
    }

    const nuevaCita = new Cita({
      cliente_id: cliente_id || "1",
      barbero_id,
      servicio_id,
      fecha,
      hora,
      notas: notes || "",
    });

    await nuevaCita.save();

    return res.status(201).json({
      message: "¡Cita agendada con éxito en MongoDB!",
      cita: nuevaCita,
    });
  } catch (error) {
    console.error("Error al registrar la cita:", error);
    return res.status(500).json({ error: "No se pudo guardar la cita" });
  }
});

// Rutas base originales del proyecto
app.use("/api/auth", authRoutes);
app.use("/api/citas", citasRoutes);
app.use("/api/servicios", serviciosRoutes);
app.use("/api/pagos", pagosRoutes);
app.use("/api/buscar", busquedaRoutes);

app.get("/api/health", (_req, res) =>
  res.json({ status: "ok", timestamp: new Date().toISOString() }),
);

app.use((_req, res) => res.status(404).json({ error: "Ruta no encontrada" }));
app.use((err, _req, res, _next) => {
  console.error(err);
  res
    .status(500)
    .json({ error: "Error interno del servidor", detalle: err.message });
});

app.listen(PORT, () =>
  console.log(
    `\n🪒  Barbería de la Esquina API\n📡  http://localhost:${PORT}\n`,
  ),
);
