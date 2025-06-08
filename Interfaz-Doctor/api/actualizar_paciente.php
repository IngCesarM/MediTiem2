<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../Modelo/Conexion.php'; // Ajustar según estructura
$response = ['success' => false, 'message' => 'Error desconocido.'];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $id_usuario = $_POST['idUsuario'] ?? '';
    $nombre = $_POST['nombre'] ?? '';
    $apellido_paterno = $_POST['apellidoPaterno'] ?? '';
    $apellido_materno = $_POST['apellidoMaterno'] ?? '';
    $sexo = $_POST['sexo'] ?? '';
    $correo = $_POST['correoElectronico'] ?? '';
    $telefono = $_POST['telefono'] ?? '';
    $fecha_nacimiento_str = $_POST['fechaNacimiento'] ?? null;
    $edad = filter_input(INPUT_POST, 'edad', FILTER_VALIDATE_INT);
    $peso = filter_input(INPUT_POST, 'peso', FILTER_VALIDATE_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    $estatura = filter_input(INPUT_POST, 'estatura', FILTER_VALIDATE_FLOAT, FILTER_FLAG_ALLOW_FRACTION);

    // Conexión inicializada ANTES de usarla
    $conexion_obj = new Conexion();
    $conn = $conexion_obj->conectar();

    // Obtener o conservar el id_doctor
    $id_doctor_asignado_al_paciente = $_POST['idDoctorAsignado'] ?? null;
    if ($id_doctor_asignado_al_paciente === null || $id_doctor_asignado_al_paciente === '') {
        $query = "SELECT id_doctor FROM Usuarios WHERE id_usuario = ?";
        $stmt_select = $conn->prepare($query);
        $stmt_select->bind_param("s", $id_usuario);
        $stmt_select->execute();
        $stmt_select->bind_result($id_actual);
        if ($stmt_select->fetch()) {
            $id_doctor_asignado_al_paciente = $id_actual;
        }
        $stmt_select->close();
    }

    // Validación de fecha
    if (empty($fecha_nacimiento_str)) {
        $response['message'] = 'La fecha de nacimiento es requerida.';
        echo json_encode($response);
        exit;
    }

    $fecha_nacimiento_para_db = null;
    $date_obj = DateTime::createFromFormat('Y-m-d', $fecha_nacimiento_str);
    if ($date_obj && $date_obj->format('Y-m-d') === $fecha_nacimiento_str) {
        $fecha_nacimiento_para_db = $fecha_nacimiento_str;
    } else {
        $date_obj_alt = DateTime::createFromFormat('d-m-Y', $fecha_nacimiento_str);
        if ($date_obj_alt && $date_obj_alt->format('d-m-Y') === $fecha_nacimiento_str) {
            $fecha_nacimiento_para_db = $date_obj_alt->format('Y-m-d');
        } else {
            $response['message'] = 'La fecha de nacimiento (' . htmlspecialchars($fecha_nacimiento_str) . ') tiene un formato inválido. Se esperaba YYYY-MM-DD.';
            echo json_encode($response);
            exit;
        }
    }

    // Validación de otros campos
    if (empty($id_usuario) || empty($nombre) || empty($apellido_paterno) || empty($correo) || $edad === false || $peso === false || $estatura === false) {
        $response['message'] = 'Datos incompletos o inválidos para actualizar paciente.';
        if ($edad === false) $response['message'] .= ' Edad inválida.';
        if ($peso === false) $response['message'] .= ' Peso inválido.';
        if ($estatura === false) $response['message'] .= ' Estatura inválida.';
        echo json_encode($response);
        exit;
    }

    // Logging para depuración
    error_log("Fecha que se enviará al SP: " . $fecha_nacimiento_para_db);
    error_log("Valores: " . implode(', ', [
        $id_usuario, $nombre, $apellido_paterno, $apellido_materno, $sexo, $correo,
        $telefono, $fecha_nacimiento_para_db, $edad, $peso, $estatura, $id_doctor_asignado_al_paciente
    ]));

    try {
        $stmt = $conn->prepare("CALL sp_ActualizarUsuario(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        if (!$stmt) {
            throw new Exception("Error en prepare (sp_ActualizarUsuario): " . $conn->error);
        }

        // TIPOS CORRECTOS: 8 strings, 1 int, 2 doubles, 1 string
        $stmt->bind_param("ssssssssidds",
            $id_usuario, $nombre, $apellido_paterno, $apellido_materno, $sexo, $correo,
            $telefono, $fecha_nacimiento_para_db,
            $edad, $peso, $estatura,
            $id_doctor_asignado_al_paciente
        );

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                $response['success'] = true;
                $response['message'] = 'Paciente actualizado con éxito.';
            } else {
                $response['message'] = 'No se realizaron cambios (los datos podrían ser los mismos o el paciente no fue encontrado).';
            }
        } else {
            throw new Exception("Error al ejecutar sp_ActualizarUsuario: " . $stmt->error);
        }

        $stmt->close();
    } catch (Exception $e) {
        $response['message'] = "Error del servidor: " . $e->getMessage();
    } finally {
        if (isset($conn)) {
            $conexion_obj->cerrar();
        }
    }

    echo json_encode($response);
} else {
    $response['message'] = "Método no permitido.";
    echo json_encode($response);
}
?>
