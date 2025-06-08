<?php
require_once 'Conexion.php'; // Asegúrate que la ruta es correcta

header('Content-Type: application/json'); // Indicar el tipo de contenido

if ($_SERVER['REQUEST_METHOD'] === 'POST') {
    $correo = $_POST['correo'] ?? null;
    $contrasena = $_POST['contrasena'] ?? null;

    if (!$correo || !$contrasena) {
        echo json_encode(['success' => false, 'message' => 'Correo y contraseña son obligatorios.']);
        exit;
    }

    try {
        $conexion = new Conexion();
        $db = $conexion->conectar();

        // Modifica tu SP sp_validar_inicio_sesion para que DEVUELVA el ID del doctor y si está verificado,
        // en lugar de solo insertar en Notificaciones.
        // Por ahora, asumiremos que recuperas la contraseña hasheada directamente.
        // Tu SP sp_validar_inicio_sesion debería idealmente manejar la lógica de encontrar al doctor y verificarlo.

        $stmt = $db->prepare("SELECT id_doctor, nombre, apellido_paterno, contrasena, foto_perfil FROM Doctores WHERE correo = ?");
        if (!$stmt) {
            throw new Exception("Error preparando la consulta: " . $db->error);
        }
        $stmt->bind_param("s", $correo);
        $stmt->execute();
        $result = $stmt->get_result();
        
        if ($result->num_rows === 1) {
            $doctor = $result->fetch_assoc();
            $hashed_password = $doctor['contrasena'];

            if (password_verify($contrasena, $hashed_password)) {
                session_start();
                $_SESSION['id_doctor'] = $doctor['id_doctor'];
                $_SESSION['nombre_doctor'] = $doctor['nombre']; 
                $_SESSION['apellido_doctor'] = $doctor['apellido_paterno'];
                $_SESSION['correo_doctor'] = $correo; // O el nombre, lo que necesites
                $_SESSION['tipo_usuario'] = 'doctor';
                $_SESSION['foto_perfil'] = $doctor['foto_perfil'];

                // Enviar URL de redirección en la respuesta JSON
                echo json_encode([
                    'success' => true,
                    'message' => 'Inicio de sesión exitoso.',
                    'redirectUrl' => '../Interfaz-Doctor/index.php' // Ajusta esta ruta si es necesario
                ]);
            } else {
                echo json_encode(['success' => false, 'message' => 'Credenciales incorrectas.']);
            }
        } else {
            echo json_encode(['success' => false, 'message' => 'Usuario no encontrado.']);
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