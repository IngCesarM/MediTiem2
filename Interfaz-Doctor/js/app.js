document.addEventListener('DOMContentLoaded', function () {
    // --- Global Variables & Modals ---
    const addPacienteModalElement = document.getElementById('addPacienteModal');
    const addPacienteModal = addPacienteModalElement ? new bootstrap.Modal(addPacienteModalElement) : null;

    const editarPacienteModalElement = document.getElementById('editarPacienteModal');
    const editarPacienteModal = editarPacienteModalElement ? new bootstrap.Modal(editarPacienteModalElement) : null;

    const addCitaModalElement = document.getElementById('addCitaModal');
    const addCitaModal = addCitaModalElement ? new bootstrap.Modal(addCitaModalElement) : null;

    // --- Patient Registration (registroPaciente.html) ---
    const formRegistrarPaciente = document.getElementById('formRegistrarPaciente');
    const btnGuardarPaciente = document.getElementById('btnGuardarPaciente');
    const toggleRegPasswordBtn = document.getElementById("toggleRegPassword");
    const regPasswordInput = document.getElementById("regContraseña");

    if (toggleRegPasswordBtn && regPasswordInput) {
        toggleRegPasswordBtn.addEventListener("click", function () {
            const icon = this.querySelector("i");
            if (regPasswordInput.type === "password") {
                regPasswordInput.type = "text";
                icon.classList.remove("bi-eye");
                icon.classList.add("bi-eye-slash");
            } else {
                regPasswordInput.type = "password";
                icon.classList.remove("bi-eye-slash");
                icon.classList.add("bi-eye");
            }
        });
    }

    if (btnGuardarPaciente && formRegistrarPaciente && addPacienteModal) {
        btnGuardarPaciente.addEventListener('click', function () {
            // Client-side check for LOGGED_IN_DOCTOR_ID, as registrar_paciente.php uses session
            if (typeof LOGGED_IN_DOCTOR_ID === 'undefined' || LOGGED_IN_DOCTOR_ID === "DEFAULT_DOCTOR_ID_OR_NULL" || !LOGGED_IN_DOCTOR_ID) {
                alert("Error: Su sesión de doctor no es válida. No se puede registrar un nuevo paciente en este momento.");
                return;
            }

            if (!formRegistrarPaciente.checkValidity()) {
                formRegistrarPaciente.reportValidity();
                return;
            }
            const formData = new FormData(formRegistrarPaciente);
            // registrar_paciente.php will use $_SESSION['id_doctor'] for the p_id_doctor parameter in sp_InsertarUsuario

            fetch('api/registrar_paciente.php', {
                method: 'POST',
                body: formData
            })
                .then(response => response.json())
                .then(data => {
                    if (data.success) {
                        alert('Paciente registrado con éxito!');
                        formRegistrarPaciente.reset();
                        addPacienteModal.hide();
                        if (typeof cargarPacientes === "function") cargarPacientes();
                        if (typeof popularPacientesDropdownRecetas === "function") popularPacientesDropdownRecetas();
                    } else {
                        alert('Error: ' + (data.message || 'No se pudo registrar el paciente.'));
                    }
                })
                .catch(error => {
                    console.error('Error en registro:', error);
                    alert('Ocurrió un error de conexión al registrar.');
                });
        });
    }

    // --- Patient Table (tablaPaciente.html) & Update/Delete ---
    const tablaPacientesBody = document.getElementById('tablaPacientesBody');
    const formEditarPaciente = document.getElementById('formEditarPaciente');
    const btnActualizarPaciente = document.getElementById('btnActualizarPaciente');

    const PACIENTES_POR_PAGINA = 3;
    let pacientesData = [];
    let paginaActual = 1;

    async function cargarPacientes() {
        if (!tablaPacientesBody) return;

        if (typeof LOGGED_IN_DOCTOR_ID === 'undefined' || LOGGED_IN_DOCTOR_ID === "DEFAULT_DOCTOR_ID_OR_NULL" || !LOGGED_IN_DOCTOR_ID) {
            tablaPacientesBody.innerHTML = `<tr><td colspan="7">Sesión de doctor no válida. No se pueden cargar pacientes.</td></tr>`;
            return;
        }

        try {
            const response = await fetch(`api/obtener_pacientes.php?id_doctor=${encodeURIComponent(LOGGED_IN_DOCTOR_ID)}`);
            const data = await response.json();
            pacientesData = (data.success && data.pacientes) ? data.pacientes : [];
            paginaActual = 1;
            renderPacientesPaginados();
        } catch (error) {
            console.error('Error al cargar pacientes:', error);
            tablaPacientesBody.innerHTML = `<tr><td colspan="7">Error al cargar datos de pacientes.</td></tr>`;
        }
    }

    function renderPacientesPaginados() {
        tablaPacientesBody.innerHTML = '';
        const inicio = (paginaActual - 1) * PACIENTES_POR_PAGINA;
        const fin = inicio + PACIENTES_POR_PAGINA;
        const pacientesPagina = pacientesData.slice(inicio, fin);

        if (pacientesPagina.length === 0) {
            tablaPacientesBody.innerHTML = `<tr><td colspan="7">No se encontraron pacientes.</td></tr>`;
            document.getElementById('paginacionPacientes').innerHTML = '';
            return;
        }

        pacientesPagina.forEach(paciente => {
            const row = tablaPacientesBody.insertRow();
            row.insertCell().textContent = paciente.nombre || 'N/A';
            row.insertCell().textContent = paciente.apellido_paterno || 'N/A';
            row.insertCell().textContent = paciente.apellido_materno || 'N/A';
            row.insertCell().textContent = paciente.edad || 'N/A';
            row.insertCell().textContent = paciente.sexo || 'N/A';
            row.insertCell().textContent = paciente.correo || 'N/A';

            const accionesCell = row.insertCell();
            const btnEditar = document.createElement('button');
            btnEditar.classList.add('btn', 'btn-sm', 'btn-success', 'me-1');
            btnEditar.textContent = 'Editar';
            btnEditar.onclick = () => popularFormularioEdicion(paciente);
            accionesCell.appendChild(btnEditar);

            const btnEliminar = document.createElement('button');
            btnEliminar.classList.add('btn', 'btn-sm', 'btn-danger');
            btnEliminar.textContent = 'Eliminar';
            btnEliminar.onclick = () => eliminarPaciente(paciente.id_usuario);
            accionesCell.appendChild(btnEliminar);
        });

        renderControlesPaginacion();
    }

    function renderControlesPaginacion() {
        const totalPaginas = Math.ceil(pacientesData.length / PACIENTES_POR_PAGINA);
        const paginacionDiv = document.getElementById('paginacionPacientes');
        if (totalPaginas <= 1) {
            paginacionDiv.innerHTML = '';
            return;
        }
        let html = `<nav><ul class="pagination pagination-sm mb-0">`;
        html += `<li class="page-item${paginaActual === 1 ? ' disabled' : ''}">
                    <button class="page-link" onclick="cambiarPaginaPacientes(${paginaActual - 1})">&laquo;</button>
                </li>`;
        for (let i = 1; i <= totalPaginas; i++) {
            html += `<li class="page-item${paginaActual === i ? ' active' : ''}">
                        <button class="page-link" onclick="cambiarPaginaPacientes(${i})">${i}</button>
                    </li>`;
        }
        html += `<li class="page-item${paginaActual === totalPaginas ? ' disabled' : ''}">
                    <button class="page-link" onclick="cambiarPaginaPacientes(${paginaActual + 1})">&raquo;</button>
                </li>`;
        html += `</ul></nav>`;
        paginacionDiv.innerHTML = html;
    }

    // Para que los botones funcionen desde el HTML generado
    window.cambiarPaginaPacientes = function (nuevaPagina) {
        const totalPaginas = Math.ceil(pacientesData.length / PACIENTES_POR_PAGINA);
        if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
        paginaActual = nuevaPagina;
        renderPacientesPaginados();
    };

    function popularFormularioEdicion(paciente) {
        console.log(paciente);
        if (!formEditarPaciente || !editarPacienteModal) return;
        document.getElementById('editIdUsuario').value = paciente.id_usuario;
        // Assuming you added <input type="hidden" id="editIdDoctorAsignado" name="idDoctorAsignado"> to actualizacion.html
        const editIdDoctorAsignadoInput = document.getElementById('editIdDoctorAsignado');
        if (editIdDoctorAsignadoInput) {
            if (paciente.id_doctor) {
                editIdDoctorAsignadoInput.value = paciente.id_doctor;
            } else {
                // No lo toques o ponle un valor fijo para evitar que se borre
                editIdDoctorAsignadoInput.value = LOGGED_IN_DOCTOR_ID || '';
            }
        }
        document.getElementById('editNombre').value = paciente.nombre || '';
        document.getElementById('editApellidoPaterno').value = paciente.apellido_paterno || '';
        document.getElementById('editApellidoMaterno').value = paciente.apellido_materno || '';
        document.getElementById('editSexo').value = paciente.sexo || '';
        document.getElementById('editEdad').value = paciente.edad || '';
        let fecha = paciente.fecha_nacimiento || '';

        if (/^\d{2}-\d{2}-\d{4}$/.test(fecha)) {
            const [dia, mes, anio] = fecha.split('-');
            fecha = `${anio}-${mes}-${dia}`;
        } else if (/^\d{4}$/.test(fecha)) {
            // Si es solo el año → asumir 1 de enero de ese año
            fecha = `${fecha}-01-01`;
        } else if (!/^\d{4}-\d{2}-\d{2}$/.test(fecha)) {
            // Si no cumple ninguno → limpiar para forzar corrección manual
            fecha = '';
        }

        document.getElementById('editFechaNacimiento').value = fecha;


        console.log(document.getElementById('editFechaNacimiento').value);

        document.getElementById('editPeso').value = paciente.peso || '';
        document.getElementById('editEstatura').value = paciente.estatura || '';
        document.getElementById('editCorreoElectronico').value = paciente.correo || '';
        document.getElementById('editTelefono').value = paciente.telefono || '';
        document.getElementById('editRol').value = paciente.rol || 'paciente';
        editarPacienteModal.show();
    }
    window.popularFormularioEdicion = popularFormularioEdicion;

    if (btnActualizarPaciente && formEditarPaciente && editarPacienteModal) {
        btnActualizarPaciente.addEventListener('click', async function () {
            // Client-side check for LOGGED_IN_DOCTOR_ID for authorizing the action,
            // though the actual id_doctor for the patient record comes from the form.
            if (typeof LOGGED_IN_DOCTOR_ID === 'undefined' || LOGGED_IN_DOCTOR_ID === "DEFAULT_DOCTOR_ID_OR_NULL" || !LOGGED_IN_DOCTOR_ID) {
                alert("Error: Su sesión de doctor no es válida. No se puede actualizar paciente.");
                return;
            }

            if (!formEditarPaciente.checkValidity()) {
                formEditarPaciente.reportValidity();
                return;
            }
            const formData = new FormData(formEditarPaciente);
            // The 'idDoctorAsignado' field in formData will be used by actualizar_paciente.php for the SP.

            // Ejemplo de validación antes de enviar el formulario
            const fechaNacimiento = document.getElementById('editFechaNacimiento').value;
            if (!/^\d{4}-\d{2}-\d{2}$/.test(fechaNacimiento)) {
                alert('La fecha de nacimiento debe tener el formato YYYY-MM-DD');
                return;
            }

            try {
                const response = await fetch('api/actualizar_paciente.php', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (data.success) {
                    alert('Paciente actualizado con éxito!');
                    editarPacienteModal.hide();
                    cargarPacientes();
                } else {
                    alert('Error: ' + (data.message || 'No se pudo actualizar el paciente.'));
                }
            } catch (error) {
                console.error('Error al actualizar:', error);
                alert('Ocurrió un error de conexión al actualizar.');
            }
        });
    }

    async function eliminarPaciente(idUsuario) {
        const confirmMsg = "¿Estás seguro de eliminar este paciente?\n\nSe eliminarán también todas sus citas, medicamentos, historial médico y notificaciones asociadas. Esta acción no se puede deshacer.";
        if (!confirm(confirmMsg)) return;

        try {
            const response = await fetch('api/eliminar_paciente.php', {
                method: 'POST',
                body: new URLSearchParams({ id_usuario: idUsuario })
            });
            const data = await response.json();
            alert(data.message);
            if (data.success) {
                cargarPacientes();
            }
        } catch (error) {
            alert('Ocurrió un error al eliminar el paciente.');
            console.error(error);
        }
    }
    window.eliminarPaciente = eliminarPaciente;

    // --- Create Appointment (cita.html) ---
    const formCrearCita = document.getElementById('formCrearCita');
    const btnGuardarCita = document.getElementById('btnGuardarCita');
    const selectCitaPaciente = document.getElementById('citaPaciente');
    const citaIdDoctorInput = document.getElementById('citaIdDoctor'); // For new appointments (hidden input)

    async function popularPacientesDropdownCitas() {
        if (!selectCitaPaciente) return;
        // Fetch all patients for selection, or patients of the current doctor if SP is modified for that
        if (typeof LOGGED_IN_DOCTOR_ID === 'undefined' || LOGGED_IN_DOCTOR_ID === "DEFAULT_DOCTOR_ID_OR_NULL" || !LOGGED_IN_DOCTOR_ID) {
            selectCitaPaciente.innerHTML = '<option selected disabled value="">Error: Sesión de doctor no válida.</option>';
            return;
        }
        try {
            // Using obtener_pacientes.php which now filters by doctor. This means a doctor can only create appointments for their own patients.
            // If a doctor should be able to create appointments for ANY patient, you'd need a different endpoint or logic here.
            const response = await fetch(`api/obtener_pacientes.php?id_doctor=${encodeURIComponent(LOGGED_IN_DOCTOR_ID)}`);
            const data = await response.json();
            selectCitaPaciente.innerHTML = '<option selected disabled value="">Seleccione un paciente 🏥</option>';
            if (data.success && data.pacientes) {
                data.pacientes.forEach(paciente => {
                    const option = document.createElement('option');
                    option.value = paciente.id_usuario;
                    option.textContent = `${paciente.nombre} ${paciente.apellido_paterno || ''}`;
                    selectCitaPaciente.appendChild(option);
                });
            } else {
                selectCitaPaciente.innerHTML = `<option selected disabled value="">${data.message || 'No hay pacientes disponibles.'}</option>`;
            }
        } catch (error) {
            console.error('Error al cargar pacientes para citas:', error);
            selectCitaPaciente.innerHTML = '<option selected disabled value="">Error al cargar pacientes.</option>';
        }
    }

    if (addCitaModalElement) {
        addCitaModalElement.addEventListener('show.bs.modal', function () {
            popularPacientesDropdownCitas(); // Load patients for dropdown
            if (citaIdDoctorInput && btnGuardarCita) {
                if (typeof LOGGED_IN_DOCTOR_ID !== 'undefined' && LOGGED_IN_DOCTOR_ID !== "DEFAULT_DOCTOR_ID_OR_NULL") {
                    citaIdDoctorInput.value = LOGGED_IN_DOCTOR_ID;
                    btnGuardarCita.disabled = false;
                } else {
                    citaIdDoctorInput.value = ""; // Or "DEFAULT_DOCTOR_ID_OR_NULL"
                    alert("Error: Su sesión de doctor no es válida. No puede crear citas.");
                    btnGuardarCita.disabled = true;
                    // addCitaModal.hide(); // Optionally hide modal immediately
                }
            }
        });
    }

    if (btnGuardarCita && formCrearCita && addCitaModal) {
        btnGuardarCita.addEventListener('click', async function () {
            if (typeof LOGGED_IN_DOCTOR_ID === 'undefined' || LOGGED_IN_DOCTOR_ID === "DEFAULT_DOCTOR_ID_OR_NULL" || !LOGGED_IN_DOCTOR_ID) {
                alert("Error: Su sesión de doctor no es válida. No se puede crear la cita.");
                return;
            }

            if (!formCrearCita.checkValidity()) {
                formCrearCita.reportValidity();
                return;
            }
            const formData = new FormData(formCrearCita);
            const doctorIdFromForm = formData.get('id_doctor'); // Value from hidden input

            if (!doctorIdFromForm || doctorIdFromForm === "DEFAULT_DOCTOR_ID_OR_NULL" || doctorIdFromForm === "") {
                alert('Error (JS): El ID del doctor no está configurado correctamente en el formulario. No se puede crear la cita.');
                return;
            }
            // Ensure id_doctor is correctly set. If citaIdDoctorInput.value was set by show.bs.modal, formData will have it.

            try {
                const response = await fetch('api/crear_cita.php', {
                    method: 'POST',
                    body: formData
                });
                const data = await response.json();
                if (data.success) {
                    alert('Cita creada con éxito!');
                    formCrearCita.reset(); // Resets all fields, including patient dropdown and hidden doctor ID
                    addCitaModal.hide();
                    // Reload pending appointments if the function and ID are available
                    if (typeof cargarCitasPendientes === "function" && LOGGED_IN_DOCTOR_ID && LOGGED_IN_DOCTOR_ID !== "DEFAULT_DOCTOR_ID_OR_NULL") {
                        cargarCitasPendientes(LOGGED_IN_DOCTOR_ID);
                    }
                } else {
                    alert('Error: ' + (data.message || 'No se pudo crear la cita.'));
                }
            } catch (error) {
                console.error('Error al crear cita:', error);
                alert('Ocurrió un error de conexión al crear cita.');
            }
        });
    }

    // --- Doctor Profile & Pending Appointments (perfil.html) ---
    const tablaCitasPendientesBody = document.getElementById('tablaCitasPendientesBody');
    // const doctorNameProfile = document.getElementById('doctorNameProfile');
    // const doctorSpecialtyProfile = document.getElementById('doctorSpecialtyProfile');

    // Agregar las variables globales junto a las de pacientes
    let citasData = [];
    let paginaActualCitas = 1;

    async function cargarCitasPendientes(idDoctor) {
        if (!tablaCitasPendientesBody) return;
        if (!idDoctor || idDoctor === "DEFAULT_DOCTOR_ID_OR_NULL") {
            tablaCitasPendientesBody.innerHTML = `<tr><td colspan="6">ID de doctor no disponible para cargar citas.</td></tr>`;
            return;
        }
        try {
            // Fetching citas for the given doctor that are 'programada'
            const response = await fetch(`api/obtener_citas_doctor.php?id_doctor=${encodeURIComponent(idDoctor)}&estado=programada`);
            const data = await response.json();
            citasData = (data.success && data.citas) ? data.citas : [];
            paginaActualCitas = 1;
            renderCitasPaginadas();
        } catch (error) {
            console.error('Error al cargar citas pendientes:', error);
            tablaCitasPendientesBody.innerHTML = `<tr><td colspan="6">Error al cargar citas pendientes.</td></tr>`;
        }
    }
    window.cargarCitasPendientes = cargarCitasPendientes;

    function renderCitasPaginadas() {
        const inicio = (paginaActualCitas - 1) * PACIENTES_POR_PAGINA; // Reutilizamos PACIENTES_POR_PAGINA
        const fin = inicio + PACIENTES_POR_PAGINA;
        const citasPagina = citasData.slice(inicio, fin);

        tablaCitasPendientesBody.innerHTML = '';
        let count = inicio + 1;

        if (citasPagina.length === 0) {
            tablaCitasPendientesBody.innerHTML = `<tr><td colspan="6">No hay citas pendientes.</td></tr>`;
            document.getElementById('paginacionCitas').innerHTML = '';
            return;
        }

        citasPagina.forEach(cita => {
            const row = tablaCitasPendientesBody.insertRow();
            row.insertCell().textContent = count++;
            row.insertCell().textContent = `${cita.nombre_usuario || ''} ${cita.apellido_paterno_usuario || ''}`;
            row.insertCell().textContent = cita.motivo || '';
            row.insertCell().textContent = cita.para || '';
            const fechaHora = new Date(cita.fecha_hora);
            row.insertCell().textContent = fechaHora.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + ' ' + fechaHora.toLocaleDateString();

            const accionesCell = row.insertCell();
            const btnCancelar = document.createElement('button');
            btnCancelar.classList.add('btn', 'btn-sm', 'btn-warning', 'me-1');
            btnCancelar.textContent = 'Cancelar Cita';
            btnCancelar.onclick = () => cambiarEstadoCita(cita.id_cita, 'cancelada', LOGGED_IN_DOCTOR_ID);
            accionesCell.appendChild(btnCancelar);

            const btnCompletar = document.createElement('button');
            btnCompletar.classList.add('btn', 'btn-sm', 'btn-success');
            btnCompletar.textContent = 'Cita completada';
            btnCompletar.onclick = () => cambiarEstadoCita(cita.id_cita, 'completada', LOGGED_IN_DOCTOR_ID);
            accionesCell.appendChild(btnCompletar);
        });

        // Reutilizamos la misma lógica de paginación
        const totalPaginas = Math.ceil(citasData.length / PACIENTES_POR_PAGINA);
        const paginacionDiv = document.getElementById('paginacionCitas');

        if (totalPaginas <= 1) {
            paginacionDiv.innerHTML = '';
            return;
        }

        let html = `<nav><ul class="pagination pagination-sm mb-0">`;
        html += `<li class="page-item${paginaActualCitas === 1 ? ' disabled' : ''}">
                    <button class="page-link" onclick="cambiarPaginaCitas(${paginaActualCitas - 1})">&laquo;</button>
                </li>`;

        for (let i = 1; i <= totalPaginas; i++) {
            html += `<li class="page-item${paginaActualCitas === i ? ' active' : ''}">
                        <button class="page-link" onclick="cambiarPaginaCitas(${i})">${i}</button>
                    </li>`;
        }

        html += `<li class="page-item${paginaActualCitas === totalPaginas ? ' disabled' : ''}">
                    <button class="page-link" onclick="cambiarPaginaCitas(${paginaActualCitas + 1})">&raquo;</button>
                </li>`;
        html += `</ul></nav>`;
        paginacionDiv.innerHTML = html;
    }

    // Función para cambiar página de citas
    window.cambiarPaginaCitas = function (nuevaPagina) {
        const totalPaginas = Math.ceil(citasData.length / PACIENTES_POR_PAGINA);
        if (nuevaPagina < 1 || nuevaPagina > totalPaginas) return;
        paginaActualCitas = nuevaPagina;
        renderCitasPaginadas();
    };

    async function cambiarEstadoCita(idCita, nuevoEstado, idDoctorParaRecargar) {
        if (typeof LOGGED_IN_DOCTOR_ID === 'undefined' || LOGGED_IN_DOCTOR_ID === "DEFAULT_DOCTOR_ID_OR_NULL" || !LOGGED_IN_DOCTOR_ID) {
            alert("Error: Su sesión de doctor no es válida. No se puede cambiar el estado de la cita.");
            return;
        }
        if (!confirm(`¿Está seguro de que desea cambiar el estado de esta cita a "${nuevoEstado}"?`)) return;
        try {
            const response = await fetch('api/actualizar_estado_cita.php', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `id_cita=${encodeURIComponent(idCita)}&estado=${encodeURIComponent(nuevoEstado)}`
            });
            const data = await response.json();
            if (data.success) {
                alert(`Cita actualizada a "${nuevoEstado}" con éxito!`);
                if (typeof cargarCitasPendientes === "function" && idDoctorParaRecargar && idDoctorParaRecargar !== "DEFAULT_DOCTOR_ID_OR_NULL") {
                    cargarCitasPendientes(idDoctorParaRecargar); // Recargar la lista
                }
            } else {
                alert('Error: ' + (data.message || `No se pudo actualizar la cita.`));
            }
        } catch (error) {
            console.error('Error al cambiar estado cita:', error);
            alert('Ocurrió un error de conexión al cambiar estado de cita.');
        }
    }
    window.cambiarEstadoCita = cambiarEstadoCita;

    // --- Prescribe Medications (receta.html & tablaMedicamento.html) ---
    const formReceta = document.getElementById('formReceta');
    const selectPacienteReceta = document.getElementById('pacienteReceta');
    const medicamentosParaAgregarBody = document.getElementById('medicamentosParaAgregarBody');
    const btnRecetarFinal = document.getElementById('btnRecetarFinal');
    const tablaMedicamentosRecetadosBody = document.getElementById('tablaMedicamentosRecetadosBody');
    const prescribedMedicationsSection = document.getElementById('prescribedMedications');

    async function popularPacientesDropdownRecetas() {
        if (!selectPacienteReceta) return;
        if (typeof LOGGED_IN_DOCTOR_ID === 'undefined' || LOGGED_IN_DOCTOR_ID === "DEFAULT_DOCTOR_ID_OR_NULL" || !LOGGED_IN_DOCTOR_ID) {
            selectPacienteReceta.innerHTML = '<option selected disabled value="">Error: Sesión de doctor no válida.</option>';
            return;
        }
        try {
            // Fetching doctor's own patients for prescribing
            const response = await fetch(`api/obtener_pacientes.php?id_doctor=${encodeURIComponent(LOGGED_IN_DOCTOR_ID)}`);
            const data = await response.json();
            selectPacienteReceta.innerHTML = '<option selected disabled value="">Seleccione un paciente...</option>';
            if (data.success && data.pacientes) {
                data.pacientes.forEach(paciente => {
                    const option = document.createElement('option');
                    option.value = paciente.id_usuario;
                    option.textContent = `${paciente.nombre} ${paciente.apellido_paterno || ''}`;
                    selectPacienteReceta.appendChild(option);
                });
            } else {
                selectPacienteReceta.innerHTML = `<option selected disabled value="">${data.message || 'No hay pacientes disponibles.'}</option>`;
            }
        } catch (error) {
            console.error('Error al cargar pacientes para recetas:', error);
            selectPacienteReceta.innerHTML = '<option selected disabled value="">Error al cargar pacientes.</option>';
        }
    }

    if (selectPacienteReceta) {
        popularPacientesDropdownRecetas(); // Initial load on page/component load
        selectPacienteReceta.addEventListener('change', async function () {
            const idUsuario = this.value;
            if (!idUsuario || !tablaMedicamentosRecetadosBody || !prescribedMedicationsSection) return;

            prescribedMedicationsSection.style.display = 'block';
            tablaMedicamentosRecetadosBody.innerHTML = '<tr><td colspan="4">Cargando...</td></tr>';

            try {
                const response = await fetch(`api/obtener_medicamentos_paciente.php?id_usuario=${encodeURIComponent(idUsuario)}`);
                const data = await response.json();
                tablaMedicamentosRecetadosBody.innerHTML = '';
                if (data.success && data.medicamentos && data.medicamentos.length > 0) {
                    data.medicamentos.forEach(med => {
                        const row = tablaMedicamentosRecetadosBody.insertRow();
                        row.insertCell().textContent = med.nombre;
                        row.insertCell().textContent = med.dosis;
                        row.insertCell().textContent = med.frecuencia;
                        row.insertCell().textContent = med.duracion; // Optional field, can be empty
                        row.insertCell().textContent = new Date(med.fecha_registro_medicamento).toLocaleDateString();
                    });
                } else {
                    tablaMedicamentosRecetadosBody.innerHTML = `<tr><td colspan="4">${data.message || "No hay medicamentos recetados previamente."}</td></tr>`;
                }
            } catch (error) {
                console.error('Error al cargar medicamentos recetados:', error);
                tablaMedicamentosRecetadosBody.innerHTML = `<tr><td colspan="4">Error al cargar medicamentos.</td></tr>`;
            }
        });
    }

    window.agregarFilaMedicamento = function (button) {
        if (!medicamentosParaAgregarBody) return;
        const templateRow = medicamentosParaAgregarBody.querySelector('tr');
        if (!templateRow) { // Should not happen if HTML is correct, but good fallback.
            console.error("Template row for medications not found.");
            return;
        }

        const newRow = templateRow.cloneNode(true);
        newRow.querySelectorAll('input').forEach(input => input.value = '');

        const newButtonCell = newRow.cells[newRow.cells.length - 1];
        newButtonCell.innerHTML = '<button type="button" class="btn btn-sm btn-danger" onclick="this.closest(\'tr\').remove()">-</button>';

        medicamentosParaAgregarBody.appendChild(newRow);
    }
    // Ensure the first row's button (if it exists) is for adding
    if (medicamentosParaAgregarBody && medicamentosParaAgregarBody.rows.length > 0) {
        const firstRow = medicamentosParaAgregarBody.rows[0];
        if (firstRow.cells.length > 0) {
            const firstRowButtonCell = firstRow.cells[firstRow.cells.length - 1];
            if (firstRowButtonCell && !firstRowButtonCell.querySelector('.btn-danger') && !firstRowButtonCell.querySelector('.btn-info')) {
                firstRowButtonCell.innerHTML = '<button type="button" class="btn btn-sm btn-info" onclick="agregarFilaMedicamento(this)">+</button>';
            } else if (firstRowButtonCell && !firstRowButtonCell.querySelector('.btn-info') && firstRow.parentNode.rows.length === 1) {
                // If it became a remove button and it's the only one, reset to add.
                // This case might be complex if rows are added/removed frequently.
                // Simpler: ensure HTML always starts with one add button.
            }
        }
    }


    if (btnRecetarFinal && formReceta) {
        btnRecetarFinal.addEventListener('click', async function () {
            if (typeof LOGGED_IN_DOCTOR_ID === 'undefined' || LOGGED_IN_DOCTOR_ID === "DEFAULT_DOCTOR_ID_OR_NULL" || !LOGGED_IN_DOCTOR_ID) {
                alert("Error: Su sesión de doctor no es válida. No se puede recetar.");
                return;
            }

            if (!formReceta.checkValidity()) { // Checks native HTML5 validation (e.g., for selectPacienteReceta if 'required')
                formReceta.reportValidity();
                return;
            }
            const idUsuarioSeleccionado = selectPacienteReceta.value;
            if (!idUsuarioSeleccionado) { // Double check, though 'required' on select should handle this.
                alert("Por favor, seleccione un paciente.");
                return;
            }

            const medicamentos = [];
            const rows = medicamentosParaAgregarBody.querySelectorAll('tr');
            let validMedInputs = true;
            rows.forEach(row => {
                const nombreInput = row.querySelector('input[name="medicamento_nombre[]"]');
                const dosisInput = row.querySelector('input[name="medicamento_dosis[]"]');
                const frecuenciaInput = row.querySelector('input[name="medicamento_frecuencia[]"]');
                const duracionInput = row.querySelector('input[name="medicamento_duracion[]"]'); // Optional, not used in validation

                const nombre = nombreInput ? nombreInput.value.trim() : '';
                const dosis = dosisInput ? dosisInput.value.trim() : '';
                const frecuencia = frecuenciaInput ? frecuenciaInput.value.trim() : '';
                const duracion = duracionInput ? duracionInput.value.trim() : ''; // Optional, not used in validation

                if (nombre && dosis && frecuencia && duracion) { // All three must be present
                    medicamentos.push({ nombre, dosis, frecuencia, duracion });
                } else if (nombre || dosis || frecuencia || duracion) { // If any one is filled, but not all
                    validMedInputs = false; // Mark as invalid if partially filled
                }
                // If all are empty, it's just an empty row, skip it.
            });

            if (!validMedInputs) {
                alert("Por favor, complete todos los campos (Nombre, Dosis, Frecuencia, Duracion) para cada medicamento que desee agregar, o deje la fila completamente vacía si no desea agregarla.");
                return;
            }
            if (medicamentos.length === 0) {
                alert("Por favor, agregue al menos un medicamento con todos sus detalles.");
                return;
            }

            const payload = {
                id_usuario: idUsuarioSeleccionado,
                id_doctor: LOGGED_IN_DOCTOR_ID, // Global variable
                medicamentos: medicamentos
            };

            try {
                const response = await fetch('api/recetar_medicamentos.php', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(payload)
                });
                const data = await response.json();
                if (data.success) {
                    alert('Medicamentos recetados con éxito!');
                    selectPacienteReceta.value = ""; // Reset patient selection
                    // Reset medication rows to one empty row with an "add" button
                    medicamentosParaAgregarBody.innerHTML = `
                        <tr>
                          <td><input type="text" class="form-control form-control-sm" name="medicamento_nombre[]" placeholder="Ej: Paracetamol 500mg" /></td>
                          <td><input type="text" class="form-control form-control-sm" name="medicamento_dosis[]" placeholder="Ej: 1 tableta" /></td>
                          <td><input type="text" class="form-control form-control-sm" name="medicamento_frecuencia[]" placeholder="Ej: cada 8 horas" /></td>
                          <td><input type="text" class="form-control form-control-sm" name="medicamento_duracion[]" placeholder="EJ: 5 dias" /></td>
                          <td><button type="button" class="btn btn-sm btn-info" onclick="agregarFilaMedicamento(this)">+</button></td>
                        </tr>`;
                    if (prescribedMedicationsSection) prescribedMedicationsSection.style.display = 'none';
                    if (tablaMedicamentosRecetadosBody) tablaMedicamentosRecetadosBody.innerHTML = '';
                } else {
                    alert('Error: ' + (data.message || 'No se pudieron recetar los medicamentos.'));
                }
            } catch (error) {
                console.error('Error al recetar:', error);
                alert('Ocurrió un error de conexión al recetar.');
            }
        });
    }

    // --- Initial Loads on page ready ---
    if (typeof cargarPacientes === "function") {
        cargarPacientes(); // Will check LOGGED_IN_DOCTOR_ID inside
    }
    if (typeof LOGGED_IN_DOCTOR_ID !== 'undefined' && LOGGED_IN_DOCTOR_ID !== "DEFAULT_DOCTOR_ID_OR_NULL") {
        if (typeof cargarCitasPendientes === "function") {
            cargarCitasPendientes(LOGGED_IN_DOCTOR_ID);
        }
    } else {
        console.warn("LOGGED_IN_DOCTOR_ID no está definido o es inválido. Algunas funcionalidades pueden no cargarse correctamente.");
        if (tablaCitasPendientesBody) {
            tablaCitasPendientesBody.innerHTML = `<tr><td colspan="4">Inicie sesión como doctor para ver citas.</td></tr>`;
        }
    }

    // Mostrar nombre e ID del doctor en el perfil
    const nameElem = document.getElementById('doctorNameProfile');
    if (nameElem && typeof LOGGED_IN_DOCTOR_NAME !== 'undefined' && typeof LOGGED_IN_DOCTOR_LASTNAME !== 'undefined') {
        nameElem.textContent = LOGGED_IN_DOCTOR_NAME + " " + LOGGED_IN_DOCTOR_LASTNAME;
    }
    const idElem = document.getElementById('doctorIdProfile');
    if (idElem && typeof LOGGED_IN_DOCTOR_ID !== 'undefined') {
        idElem.textContent = "ID: " + LOGGED_IN_DOCTOR_ID;
    }


    // Mostrar/ocultar contraseña en el modal de edición
    const toggleBtn = document.getElementById('toggleEditPassword');
    const passInput = document.getElementById('editContrasena');
    if (toggleBtn && passInput) {
        toggleBtn.addEventListener('click', function () {
            if (passInput.type === 'password') {
                passInput.type = 'text';
                toggleBtn.innerHTML = '<i class="bi bi-eye-slash"></i>';
            } else {
                passInput.type = 'password';
                toggleBtn.innerHTML = '<i class="bi bi-eye"></i>';
            }
        });
    }

    // Renderizar medicamentos con botones de editar y eliminar

    function renderMedicamentosRecetados(medicamentos) {
        const tablaMedicamentosRecetadosBody = document.getElementById('tablaMedicamentosRecetadosBody');
        tablaMedicamentosRecetadosBody.innerHTML = '';
        medicamentos.forEach(med => {
            const row = tablaMedicamentosRecetadosBody.insertRow();
            row.insertCell().textContent = med.nombre;
            row.insertCell().textContent = med.dosis;
            row.insertCell().textContent = med.frecuencia;
            row.insertCell().textContent = med.duracion;
            row.insertCell().textContent = new Date(med.fecha_registro_medicamento).toLocaleDateString();
            // Acciones
            const accionesCell = row.insertCell();
            accionesCell.innerHTML = `
            <button class="btn btn-sm btn-primary me-1 btn-editar-medicamento" data-id="${med.id_medicamento}">Editar</button>
            <button class="btn btn-sm btn-danger btn-eliminar-medicamento" data-id="${med.id_medicamento}">Eliminar</button>
        `;
        });
    }

    // Escucha para los botones de editar y eliminar
    document.addEventListener('click', function (e) {
        // Eliminar medicamento
        if (e.target.classList.contains('btn-eliminar-medicamento')) {
            const id = e.target.getAttribute('data-id');
            if (confirm('¿Seguro que deseas eliminar este medicamento?')) {
                fetch('api/eliminar_medicamento.php', {
                    method: 'POST',
                    body: new URLSearchParams({ id_medicamento: id })
                })
                    .then(res => res.json())
                    .then(data => {
                        alert(data.message);
                        // Recargar medicamentos del paciente seleccionado
                        if (typeof selectPacienteReceta !== 'undefined' && selectPacienteReceta.value) {
                            cargarMedicamentosPaciente(selectPacienteReceta.value);
                        }
                    });
            }
        }

        // Editar medicamento (abrir modal)
        if (e.target.classList.contains('btn-editar-medicamento')) {
            const id = e.target.getAttribute('data-id');
            const row = e.target.closest('tr');
            document.getElementById('editIdMedicamento').value = id;
            document.getElementById('editNombreMedicamento').value = row.cells[0].textContent;
            document.getElementById('editDosisMedicamento').value = row.cells[1].textContent;
            document.getElementById('editFrecuenciaMedicamento').value = row.cells[2].textContent;
            document.getElementById('editDuracionMedicamento').value = row.cells[3].textContent;
            // Mostrar modal
            const modal = new bootstrap.Modal(document.getElementById('modalEditarMedicamento'));
            modal.show();
        }
    });

    // Guardar cambios de edición
    document.getElementById('formEditarMedicamento').addEventListener('submit', function (e) {
        e.preventDefault();
        const formData = new FormData(this);
        fetch('api/actualizar_medicamento.php', {
            method: 'POST',
            body: formData
        })
            .then(res => res.json())
            .then(data => {
                alert(data.message);
                if (data.success) {
                    // Cierra el modal
                    bootstrap.Modal.getInstance(document.getElementById('modalEditarMedicamento')).hide();
                    // Recarga la tabla de medicamentos
                    if (typeof selectPacienteReceta !== 'undefined' && selectPacienteReceta.value) {
                        cargarMedicamentosPaciente(selectPacienteReceta.value);
                    }
                }
            });
    });

    // Función para cargar medicamentos del paciente seleccionado y renderizarlos
    async function cargarMedicamentosPaciente(idUsuario) {
        const tablaMedicamentosRecetadosBody = document.getElementById('tablaMedicamentosRecetadosBody');
        if (!idUsuario || !tablaMedicamentosRecetadosBody) return;
        tablaMedicamentosRecetadosBody.innerHTML = '<tr><td colspan="6">Cargando...</td></tr>';
        try {
            const response = await fetch(`api/obtener_medicamentos_paciente.php?id_usuario=${encodeURIComponent(idUsuario)}`);
            const data = await response.json();
            if (data.success && data.medicamentos && data.medicamentos.length > 0) {
                renderMedicamentosRecetados(data.medicamentos);
            } else {
                tablaMedicamentosRecetadosBody.innerHTML = `<tr><td colspan="6">${data.message || "No hay medicamentos recetados previamente."}</td></tr>`;
            }
        } catch (error) {
            tablaMedicamentosRecetadosBody.innerHTML = `<tr><td colspan="6">Error al cargar medicamentos.</td></tr>`;
        }
    }

    // Reemplaza el forEach de medicamentos en el selectPacienteReceta.addEventListener('change', ...) por esto:
    if (selectPacienteReceta) {
        selectPacienteReceta.addEventListener('change', function () {
            const idUsuario = this.value;
            if (!idUsuario) return;
            prescribedMedicationsSection.style.display = 'block';
            cargarMedicamentosPaciente(idUsuario);
        });
    }
});
