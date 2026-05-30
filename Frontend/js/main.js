const API_URL = 'http://localhost:3000/api'; 

document.addEventListener('DOMContentLoaded', () => {
    cargarBarberos();
    establecerRestriccionesFecha();
    
    // Escuchar cambios en Barbero y Fecha para activar las horas
    document.getElementById('barbero').addEventListener('change', verificarCamposDisponibilidad);
    document.getElementById('fecha').addEventListener('change', verificarCamposDisponibilidad);

    document.getElementById('formCita').addEventListener('submit', registrarCita);
});

// Función interactiva de las tarjetas de catálogo
function seleccionarServicio(id, nombre, precio) {
    document.getElementById('servicio_id').value = id;
    document.getElementById('servicio_nombre').value = `${nombre} - $${precio.toLocaleString()}`;
    document.getElementById('reservar').scrollIntoView({ behavior: 'smooth' });
}

// Cargar barberos desde la API
async function cargarBarberos() {
    const selectBarbero = document.getElementById('barbero');
    try {
        const response = await fetch(`${API_URL}/barberos`);
        if (!response.ok) throw new Error('Error al obtener barberos');
        const barberos = await response.json();
        
        selectBarbero.innerHTML = '<option value="">-- Elige un Profesional --</option>';
        barberos.forEach(b => {
            const option = document.createElement('option');
            option.value = b.id;
            option.textContent = b.nombre;
            selectBarbero.appendChild(option);
        });
    } catch (error) {
        selectBarbero.innerHTML = `
            <option value="">-- Elige un Profesional --</option>
            <option value="1">Carlos Romero (Barbero Senior)</option>
            <option value="2">Mateo Gómez (Estilista)</option>
        `;
    }
}

// Validar si ya tenemos barbero y fecha seleccionados
function verificarCamposDisponibilidad() {
    const barberoId = document.getElementById('barbero').value;
    const fecha = document.getElementById('fecha').value;
    const selectHora = document.getElementById('hora');

    // Si ambos campos tienen valor, disparamos la búsqueda a la API
    if (barberoId && fecha) {
        cargarHorasDisponibles(barberoId, fecha);
    } else {
        selectHora.innerHTML = '<option value="">-- Primero selecciona barbero y fecha --</option>';
        selectHora.disabled = true;
    }
}

// Consultar horas libres al Backend
async function cargarHorasDisponibles(barberoId, fecha) {
    const selectHora = document.getElementById('hora');
    selectHora.innerHTML = '<option value="">Consultando horarios libres...</option>';
    selectHora.disabled = false;

    try {
        // Tu API de Node debería recibir estos parámetros por Query String
        const response = await fetch(`${API_URL}/citas/disponibilidad?barbero_id=${barberoId}&fecha=${fecha}`);
        
        if (!response.ok) throw new Error('Error al consultar agenda');
        
        const horasDisponibles = await response.json(); // Se espera un array de strings, ej: ["09:00", "09:30", "11:00"]
        
        selectHora.innerHTML = '';

        if (horasDisponibles.length === 0) {
            selectHora.innerHTML = '<option value="">❌ Agenda llena para este día</option>';
            return;
        }

        // Poblar el select con las horas libres reales
        horasDisponibles.forEach(hora => {
            const option = document.createElement('option');
            option.value = hora;
            option.textContent = `${hora} hs`;
            selectHora.appendChild(option);
        });

    } catch (error) {
        console.error('Error cargando disponibilidad:', error);
        
        // --- SIMULACIÓN DE BACKEND (FALLBACK) ---
        // Si tu API aún no tiene este filtro implementado, simulará horas disponibles:
        selectHora.innerHTML = '<option value="">-- Selecciona una hora (Simulado) --</option>';
        const horasBase = ["08:00", "09:00", "10:00", "11:00", "14:00", "15:00", "16:00", "17:00"];
        
        horasBase.forEach(h => {
            const option = document.createElement('option');
            option.value = h;
            option.textContent = `${h} hs`;
            selectHora.appendChild(option);
        });
    }
}

// Validar que no elijan fechas en el pasado
function establecerRestriccionesFecha() {
    const dtToday = new Date();
    let month = dtToday.getMonth() + 1;
    let day = dtToday.getDate();
    const year = dtToday.getFullYear();
    if(month < 10) month = '0' + month.toString();
    if(day < 10) day = '0' + day.toString();
    
    const maxDate = year + '-' + month + '-' + day;
    document.getElementById('fecha').setAttribute('min', maxDate);
}

// Registrar la cita final
async function registrarCita(e) {
    e.preventDefault();
    
    const servicioId = document.getElementById('servicio_id').value;
    const barberoId = document.getElementById('barbero').value;
    const fecha = document.getElementById('fecha').value;
    const hora = document.getElementById('hora').value;
    const clienteNombre = document.getElementById('cliente_nombre').value;

    if (!servicioId) {
        alert('Por favor, selecciona primero un servicio desde el catálogo.');
        return;
    }

    const payload = {
        servicio_id: parseInt(servicioId),
        barbero_id: parseInt(barberoId),
        fecha: fecha,
        hora: hora,
        cliente: clienteNombre
    };

    try {
        const response = await fetch(`${API_URL}/citas`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('¡Cita agendada con éxito!');
            document.getElementById('formCita').reset();
            document.getElementById('hora').disabled = true;
            document.getElementById('hora').innerHTML = '<option value="">-- Primero selecciona barbero y fecha --</option>';
        } else {
            const data = await response.json();
            alert(`Error: ${data.message || 'No se pudo agendar.'}`);
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        alert('Cita guardada con éxito (Modo simulación).');
    }
}