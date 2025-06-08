<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../Modelo/Conexion.php';

$response = ['success' => false, 'message' => 'Error desconocido.'];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $id_medicamento = $_POST['id_medicamento'] ?? '';
    if (empty($id_medicamento)) {
        $response['message'] = 'ID de medicamento no proporcionado.';
        echo json_encode($response);
        exit;
    }
    $conexion_obj = new Conexion();
    try {
        $conn = $conexion_obj->conectar();
        $stmt = $conn->prepare("DELETE FROM Medicamentos WHERE id_medicamento = ?");
        $stmt->bind_param("i", $id_medicamento);
        if ($stmt->execute()) {
            $response['success'] = true;
            $response['message'] = 'Medicamento eliminado con éxito.';
        } else {
            $response['message'] = 'No se pudo eliminar el medicamento.';
        }
        $stmt->close();
    } catch (Exception $e) {
        $response['message'] = $e->getMessage();
    } finally {
        if (isset($conn)) $conexion_obj->cerrar();
    }
    echo json_encode($response);
}
?>