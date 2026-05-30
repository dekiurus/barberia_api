import { Router } from 'express';
import Cita from '../models/Cita.js'; 

const router = Router();

// 1. GET: Obtener horas disponibles
// URL: http://localhost:3000/api/citas/disponibilidad?barbero_id=X&fecha=YYYY-MM-DD
router.get('/disponibilidad', async (req, res) => {
    try {
        const { barbero_id, fecha } = req.query;

        if (!barbero_id || !fecha) {
            return res.status(400).json({ error: 'Faltan parámetros requeridos: barbero_id y fecha' });
        }

        // Horarios base de apertura de la barbería
        const horariosJornada = [
            "08:00", "09:00", "10:00", "11:00", 
            "12:00", "14:00", "15:00", "16:00", "17:00"
        ];

        // Buscamos documentos en Mongo que coincidan con el barbero, el día y que NO estén cancelados
        const citasOcupadas = await Cita.find({
            barbero_id: barbero_id,
            fecha: fecha,
            estado: { $ne: 'cancelada' }
        }).select('hora'); 

        // Extraemos las horas en un array limpio: ["09:00", "14:00"]
        const horasOcupadas = citasOcupadas.map(cita => cita.hora);

        // Filtramos la jornada dejando solo las que no se cruzan
        const horasDisponibles = horariosJornada.filter(hora => !horasOcupadas.includes(hora));

        return res.json(horasDisponibles);

    } catch (error) {
        console.error('Error al calcular disponibilidad en Mongo:', error);
        return res.status(500).json({ error: 'Error interno del servidor' });
    }
});

// 2. POST: Registrar la cita en MongoDB
// URL: http://localhost:3000/api/citas
router.post('/', async (req, res) => {
    try {
        const { barbero_id, servicio_id, fecha, hora, cliente_id, notas } = req.body;

        if (!barbero_id || !servicio_id || !fecha || !hora) {
            return res.status(400).json({ error: 'Faltan campos obligatorios' });
        }

        // Creamos el nuevo documento en MongoDB
        const nuevaCita = new Cita({
            cliente_id: cliente_id || "1", // ID provisional para desarrollo
            barbero_id,
            servicio_id,
            fecha,
            hora,
            notas
        });

        await nuevaCita.save();

        return res.status(201).json({
            message: '¡Cita agendada con éxito en MongoDB!',
            cita: nuevaCita
        });

    } catch (error) {
        console.error('Error al guardar en Mongo:', error);
        return res.status(500).json({ error: 'No se pudo registrar la cita' });
    }
});

export default router;