const API_AUTH = 'http://localhost:3000/api/auth';

document.addEventListener('DOMContentLoaded', () => {
    const formAuth = document.getElementById('formAuth');
    if (formAuth) {
        formAuth.addEventListener('submit', async (e) => {
            e.preventDefault();
            
            const errorDiv = document.getElementById('mensaje-error');
            const exitoDiv = document.getElementById('mensaje-exito');
            
            // Ocultar alertas previas al procesar la solicitud
            if (errorDiv) errorDiv.style.display = 'none';
            if (exitoDiv) exitoDiv.style.display = 'none';

            const email = document.getElementById('email').value.trim();
            const password = document.getElementById('password').value;
            const nombreInput = document.getElementById('nombre');

            // Detectamos en qué modo estamos según la visibilidad del bloque del campo nombre
            const grupoNombre = document.getElementById('grupo-nombre');
            const modoRegistro = grupoNombre && grupoNombre.style.display === 'block';
            
            const url = modoRegistro ? `${API_AUTH}/registro` : `${API_AUTH}/login`;
            const payload = modoRegistro 
                ? { nombre: nombreInput ? nombreInput.value.trim() : '', email, password } 
                : { email, password };

            try {
                const response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });

                const data = await response.json();

                if (response.ok) {
                    if (modoRegistro) {
                        if (exitoDiv) {
                            exitoDiv.textContent = '¡Usuario registrado correctamente! Iniciando transición...';
                            exitoDiv.style.display = 'block';
                        }
                        setTimeout(() => {
                            // Cambia visualmente al formulario de login invocando la función global
                            if (typeof window.alternarModo === 'function') {
                                window.alternarModo(); 
                            }
                            formAuth.reset();
                        }, 2000);
                    } else {
                        // Flujo de Login exitoso: Guardamos credenciales de forma segura en LocalStorage
                        localStorage.setItem('token', data.token);
                        localStorage.setItem('usuario', JSON.stringify(data.usuario));
                        
                        // --- FLUJO DE REDIRECCIÓN ESTRICTO POR ROL ---
                        if (data.usuario.rol === 'admin' || data.usuario.rol === 'barbero') {
                            // Administradores y barberos van directo a la gestión interna
                            window.location.href = 'dashboard.html';
                        } else {
                            // Clientes van directo a la página de reservas identificados
                            window.location.href = 'index.html';
                        }
                    }
                } else {
                    if (errorDiv) {
                        errorDiv.textContent = data.error || 'Ocurrió un error inesperado.';
                        errorDiv.style.display = 'block';
                    }
                }
            } catch (error) {
                console.error(error);
                if (errorDiv) {
                    errorDiv.textContent = 'No hay comunicación con el servidor.';
                    errorDiv.style.display = 'block';
                }
            }
        });
    }
});