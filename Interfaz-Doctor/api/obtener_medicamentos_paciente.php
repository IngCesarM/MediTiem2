<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../Modelo/Conexion.php';

$response = ['success' => false, 'medicamentos' => [], 'message' => 'Error.'];
$id_usuario = $_GET['id_usuario'] ?? '';

if (empty($id_usuario)) {
    $response['message'] = 'ID de usuario no proporcionado.';
    echo json_encode($response);
    exit;
}

$conexion_obj = new Conexion();
try {
    $conn = $conexion_obj->conectar();
    $stmt = $conn->prepare("CALL sp_ObtenerMedicamentosPorUsuario(?)");
    if (!$stmt) {
        throw new Exception("Error en prepare (sp_ObtenerMedicamentosPorUsuario): " . $conn->error);
    }
    $stmt->bind_param("s", $id_usuario);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result) {
        $medicamentos = $result->fetch_all(MYSQLI_ASSOC);
        if (!empty($medicamentos)) {
            $response['success'] = true;
            $response['medicamentos'] = $medicamentos;
        } else {
            $response['success'] = true;
            $response['message'] = 'No se encontraron medicamentos para este usuario.';
        }
        $result->free();
    } else {
        throw new Exception("Error al obtener resultados de sp_ObtenerMedicamentosPorUsuario: " . $stmt->error);
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
?>