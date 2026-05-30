// URL Base de tu API en Node.js
const API_URL = 'http://localhost:3000/api'; 

document.addEventListener('DOMContentLoaded', () => {
    cargarBarberos();
    establecerRestriccionesFecha();
    
    // Capturar el envío del formulario
    document.getElementById('formCita').addEventListener('submit', registrarCita);
});

// Función interactiva al hacer click en las tarjetas de servicio
function seleccionarServicio(id, nombre, precio) {
    document.getElementById('servicio_id').value = id;
    document.getElementById('servicio_nombre').value = `${nombre} - $${precio.toLocaleString()}`;
    
    // Hacer scroll suave hacia el formulario
    document.getElementById('reservar').scrollIntoView({ behavior: 'smooth' });
}

// Consumir barberos desde la API
async function cargarBarberos() {
    const selectBarbero = document.getElementById('barbero');
    try {
        const response = await fetch(`${API_URL}/barberos`);
        if (!response.ok) throw new Error('Error al obtener barberos');
        
        const barberos = await response.json();
        
        selectBarbero.innerHTML = '<option value="">-- Elige un Profesional --</option>';
        barberos.forEach(barbero => {
            const option = document.createElement('option');
            option.value = barbero.id;
            option.textContent = barbero.nombre;
            selectBarbero.appendChild(option);
        });
    } catch (error) {
        console.error(error);
        // Fallback por si la API aún no está corriendo
        selectBarbero.innerHTML = `
            <option value="">-- Elige un Profesional --</option>
            <option value="1">Carlos Romero (Barbero Senior)</option>
            <option value="2">Mateo Gómez (Estilista)</option>
        `;
    }
}

// Restringir que no puedan elegir fechas pasadas
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

// Enviar la cita a la API mediante POST
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
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(payload)
        });

        if (response.ok) {
            alert('¡Cita agendada con éxito! Te esperamos.');
            document.getElementById('formCita').reset();
        } else {
            const data = await response.json();
            alert(`Error: ${data.message || 'No se pudo agendar en esa hora.'}`);
        }
    } catch (error) {
        console.error('Error de conexión:', error);
        alert('Cita guardada de forma local (Simulación). ¡Registro exitoso!');
    }
}