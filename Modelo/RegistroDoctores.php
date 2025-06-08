<?php
require_once 'Conexion.php'; // Asegúrate que la ruta es correcta

header('Content-Type: application/json'); // Es buena práctica indicar el tipo de contenido

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $nombre = $_POST['nombre'] ?? null;
    $apellido_paterno = $_POST['apellido_paterno'] ?? null;
    $apellido_materno = $_POST['apellido_materno'] ?? null;
    $cedula = $_POST['cedula'] ?? null;
    $correo = $_POST['correo'] ?? null;
    $telefono = $_POST['telefono'] ?? null;
    $contrasenaInput = $_POST['contrasena'] ?? null;
    $especialidad = $_POST['especialidad'] ?? null;

    // Validación básica de campos (puedes expandirla)
    if (!$nombre || !$apellido_paterno || !$correo || !$contrasenaInput || !$especialidad || !$cedula || !$telefono) {
        echo json_encode(['success' => false, 'message' => 'Todos los campos son obligatorios.']);
        exit;
    }

    $contrasena = password_hash($contrasenaInput, PASSWORD_BCRYPT);

    try {
        $conexion = new Conexion();
        $db = $conexion->conectar();

        $stmt = $db->prepare("CALL sp_InsertarDoctor(?, ?, ?, ?, ?, ?, ?, ?)");
        $stmt->bind_param("ssssssss", $nombre, $apellido_paterno, $apellido_materno, $cedula, $correo, $telefono, $contrasena, $especialidad);
        
        if ($stmt->execute()) {
            echo json_encode(['success' => true, 'message' => 'Doctor registrado exitosamente.']);
        } else {
            // Podrías verificar errores específicos de MySQL aquí, como correo duplicado
             if ($db->errno === 1062) { // Código de error para entrada duplicada
                echo json_encode(['success' => false, 'message' => 'El correo electrónico ya está registrado.']);
            } else {
                echo json_encode(['success' => false, 'message' => 'Error al registrar el doctor: ' . $stmt->error]);
            }
        }

        $stmt->close();
        $conexion->cerrar();

    } catch (Exception $e) {
        // Si es un error de conexión a BD de tu clase Conexion
        if (strpos($e->getMessage(), "Error de conexión a BD") !== false) {
             echo json_encode(['success' => false, 'message' => 'No se pudo conectar a la base de datos.']);
        } else {
             echo json_encode(['success' => false, 'message' => 'Error del servidor: ' . $e->getMessage()]);
        }
    }
} else {
    echo json_encode(['success' => false, 'message' => 'Método no permitido.']);
}
?>