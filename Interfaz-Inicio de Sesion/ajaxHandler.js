document.addEventListener('DOMContentLoaded', function () {
    const formRegistro = document.getElementById('formRegistro');
    const mensajeRegistro = document.getElementById('mensajeRegistro');

    const formLogin = document.getElementById('formLogin');
    const mensajeLogin = document.getElementById('mensajeLogin');

    if (formRegistro) {
        formRegistro.addEventListener('submit', function (event) {
            event.preventDefault(); // Evitar el envío tradicional
            mensajeRegistro.textContent = ''; // Limpiar mensajes previos
            mensajeRegistro.className = 'form-message';


            const formData = new FormData(this);

            fetch('../Modelo/RegistroDoctores.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    mensajeRegistro.textContent = data.message;
                    mensajeRegistro.classList.add('success');
                    formRegistro.reset(); // Limpiar el formulario
                    // Opcionalmente, puedes cambiar al panel de login aquí
                    // container.classList.add("right-panel-active");
                } else {
                    mensajeRegistro.textContent = data.message || 'Error en el registro.';
                    mensajeRegistro.classList.add('error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                mensajeRegistro.textContent = 'Ocurrió un error al procesar la solicitud.';
                mensajeRegistro.classList.add('error');
            });
        });
    }

    if (formLogin) {
        formLogin.addEventListener('submit', function (event) {
            event.preventDefault(); // Evitar el envío tradicional
            mensajeLogin.textContent = ''; // Limpiar mensajes previos
            mensajeLogin.className = 'form-message';

            const formData = new FormData(this);

            fetch('../Modelo/login.php', {
                method: 'POST',
                body: formData
            })
            .then(response => response.json())
            .then(data => {
                if (data.success) {
                    mensajeLogin.textContent = data.message || 'Inicio de sesión exitoso. Redirigiendo...';
                    mensajeLogin.classList.add('success');
                    // Redirigir al usuario
                    window.location.href = data.redirectUrl || '../Interfaz-Doctor/index.php';
                } else {
                    mensajeLogin.textContent = data.message || 'Credenciales incorrectas.';
                    mensajeLogin.classList.add('error');
                }
            })
            .catch(error => {
                console.error('Error:', error);
                mensajeLogin.textContent = 'Ocurrió un error al procesar la solicitud.';
                mensajeLogin.classList.add('error');
            });
        });
    }
});
