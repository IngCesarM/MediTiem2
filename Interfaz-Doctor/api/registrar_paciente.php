<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../Modelo/Conexion.php'; // Adjusted path
session_start(); // Needed to access $_SESSION['id_doctor']

$response = ['success' => false, 'message' => 'Error desconocido.'];
$current_doctor_id = $_SESSION['id_doctor'] ?? null;

// Validate the doctor's session ID that will be used to associate the patient
if (empty($current_doctor_id) || $current_doctor_id === "DEFAULT_DOCTOR_ID_OR_NULL") {
    // Note: "DEFAULT_DOCTOR_ID_OR_NULL" shouldn't appear in session if login.php works correctly.
    // login.php should store the actual UUID or not set 'id_doctor' at all if login fails.
    $response['message'] = 'Error de sesión de Doctor: No se puede registrar el paciente sin un doctor válido asignado.';
    echo json_encode($response);
    exit;
}

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $nombre = $_POST['nombre'] ?? '';
    $apellido_paterno = $_POST['apellidoPaterno'] ?? '';
    $apellido_materno = $_POST['apellidoMaterno'] ?? '';
    $sexo = $_POST['sexo'] ?? '';
    $correo = $_POST['correoElectronico'] ?? '';
    $telefono = $_POST['telefono'] ?? '';
    $fecha_nacimiento = $_POST['fechaNacimiento'] ?? null; // Get date as string
    $edad = filter_input(INPUT_POST, 'edad', FILTER_VALIDATE_INT);
    $peso = filter_input(INPUT_POST, 'peso', FILTER_VALIDATE_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    $estatura = filter_input(INPUT_POST, 'estatura', FILTER_VALIDATE_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
    $contrasena = $_POST['contraseña'] ?? null;

    if (empty($nombre) || empty($apellido_paterno) || empty($correo) || empty($contrasena) || $edad === false || $peso === false || $estatura === false /* more checks */) {
        $response['message'] = 'Por favor, complete todos los campos requeridos correctamente para registrar al paciente.';
        echo json_encode($response);
        exit;
    }

    $hashed_password = password_hash($contrasena, PASSWORD_BCRYPT);

    $conexion_obj = new Conexion();
    try {
        $conn = $conexion_obj->conectar();

        // sp_InsertarUsuario(p_nombre, ..., p_contrasena, p_id_doctor)
        $stmt = $conn->prepare("CALL sp_InsertarUsuario(?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)");
        if (!$stmt) {
            throw new Exception("Error en prepare (sp_InsertarUsuario): " . $conn->error);
        }
        $stmt->bind_param("sssssssidsss", // <-- Cambia aquí: los últimos tres deben ser s, s, s
            $nombre, $apellido_paterno, $apellido_materno, $sexo, $correo, $telefono,
            $fecha_nacimiento, $edad, $peso, $estatura, $hashed_password, 
            $current_doctor_id
        );

        if ($stmt->execute()) {
            $result = $stmt->get_result(); // SP returns id_usuario
            if ($result) {
                $data = $result->fetch_assoc();
                if ($data && isset($data['id_usuario'])) {
                    $response['success'] = true;
                    $response['message'] = 'Paciente registrado con éxito.';
                    $response['id_usuario'] = $data['id_usuario'];
                } else {
                    $response['success'] = true; // Or false
                    $response['message'] = 'Paciente registrado, pero no se pudo obtener el ID del nuevo usuario.';
                }
                $result->free();
            } else if ($stmt->affected_rows > 0 || $stmt->insert_id > 0) { // Fallback
                 $response['success'] = true;
                 $response['message'] = 'Paciente registrado con éxito (ID no retornado directamente).';
            }
             else {
                $response['message'] = 'Paciente procesado, pero no se confirmó la inserción o no se retornó ID.';
            }
            while ($conn->more_results() && $conn->next_result()) {;}
        } else {
             if ($conn->errno === 1062) { // MySQL error code for duplicate entry
                $response['message'] = 'Error al registrar: El correo electrónico ya está en uso.';
            } else {
                throw new Exception("Error al ejecutar sp_InsertarUsuario: " . $stmt->error);
            }
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