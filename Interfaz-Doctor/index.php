<?php
session_start();
$doctor_id_js = "DEFAULT_DOCTOR_ID_OR_NULL";
$doctor_nombre_js = "DOCTOR_DESCONOCIDO";
$doctor_apellido_js = "";
if (isset($_SESSION['id_doctor'])) {
    $doctor_id_js = $_SESSION['id_doctor'];
}
if (isset($_SESSION['nombre_doctor'])) {
    $doctor_nombre_js = $_SESSION['nombre_doctor'];
}
if (isset($_SESSION['apellido_doctor'])) {
    $doctor_apellido_js = $_SESSION['apellido_doctor'];
}

?>
<!DOCTYPE html>
<html lang="es">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>Doctor</title>
    <link
      href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css"
      rel="stylesheet"/>
      <link rel="stylesheet" href="style.css" />
      <link rel="import" href="actualizacion.html">
      <link href="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/css/bootstrap.min.css" rel="stylesheet">
<link rel="stylesheet" href="https://cdn.jsdelivr.net/npm/bootstrap-icons@1.11.3/font/bootstrap-icons.css">
  </head>
  <body>
    <div class="container-fluid justify-content-center">
      <div class="row">
        <!-- Perfil del Doctor -->
        <?php include "partials/perfil.html"?>

        <!-- Contenido Principal -->
        <div class="col-8 p-4 row justify-content-center">
          
          <!--Crear Nueva Cita -->
          <?php include "partials/cita.html"?>

          <!-- Sección de Registro de Pacientes -->
          <?php include "partials/registroPaciente.html"?>

          <!-- Sección de Pacientes -->
          <?php include "partials/tablaPaciente.html"?>

             <!-- Sección de Pacientes -->
          <?php include "partials/actualizacion.html"?>

          <!-- Sección de Recetas -->
          <section id="recetas" class="dashboard-section">
            <?php include "partials/receta.html" ?>
            <!--tabla de medicamentos recetados-->
            <?php include "partials/tablaMedicamento.html"?>
          </section>
        </div>
      </div>
    </div>

    <footer>
      <div class="text-center bg-success mt-5 p-5">
        <p>&copy; 2025 - Todos los derechos reservados</p>
      </div>
    </footer>

<script src="https://cdn.jsdelivr.net/npm/bootstrap@5.3.3/dist/js/bootstrap.bundle.min.js"></script>
<script>
const LOGGED_IN_DOCTOR_ID = "<?php echo htmlspecialchars($doctor_id_js, ENT_QUOTES, 'UTF-8'); ?>";
const LOGGED_IN_DOCTOR_NAME = "<?php echo htmlspecialchars($doctor_nombre_js, ENT_QUOTES, 'UTF-8'); ?>";
const LOGGED_IN_DOCTOR_LASTNAME = "<?php echo htmlspecialchars($doctor_apellido_js, ENT_QUOTES, 'UTF-8'); ?>";
</script>
<script src="js/app.js"></script>
  </body>
</html>
