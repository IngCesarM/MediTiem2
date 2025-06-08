<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../Modelo/Conexion.php';

$response = ['success' => false, 'message' => 'Error desconocido.'];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $id_usuario = $_POST['id_usuario'] ?? '';

    if (empty($id_usuario)) {
        $response['message'] = 'ID de usuario no proporcionado.';
        echo json_encode($response);
        exit;
    }

    $conexion_obj = new Conexion();
    try {
        $conn = $conexion_obj->conectar();
        $stmt = $conn->prepare("CALL sp_EliminarUsuario(?)");
        if (!$stmt) {
            throw new Exception("Error en prepare (sp_EliminarUsuario): " . $conn->error);
        }
        $stmt->bind_param("s", $id_usuario);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                $response['success'] = true;
                $response['message'] = 'Paciente eliminado con éxito.';
            } else {
                $response['message'] = 'No se encontró el paciente o ya fue eliminado.';
            }
        } else {
            throw new Exception("Error al ejecutar sp_EliminarUsuario: " . $stmt->error);
        }
        $stmt->close();
    } catch (Exception $e) {
        $response['message'] = $e->getMessage();
    } finally {
        if (isset($conn)) {
            $conexion_obj->cerrar();
        }
    }
    echo json_encode($response);
}
?>