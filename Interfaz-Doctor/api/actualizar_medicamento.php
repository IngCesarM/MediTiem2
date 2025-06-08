<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../Modelo/Conexion.php';

$response = ['success' => false, 'message' => 'Error desconocido.'];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $id_medicamento = $_POST['id_medicamento'] ?? '';
    $nombre = $_POST['nombre'] ?? '';
    $dosis = $_POST['dosis'] ?? '';
    $frecuencia = $_POST['frecuencia'] ?? '';
    $duracion = $_POST['duracion'] ?? '';

    if (empty($id_medicamento) || empty($nombre) || empty($dosis) || empty($frecuencia) || empty($duracion)) {
        $response['message'] = 'Todos los campos son obligatorios.';
        echo json_encode($response);
        exit;
    }
    $conexion_obj = new Conexion();
    try {
        $conn = $conexion_obj->conectar();
        $stmt = $conn->prepare("CALL sp_ActualizarMedicamento(?, ?, ?, ?, ?)");
        $stmt->bind_param("issss", $id_medicamento, $nombre, $dosis, $frecuencia, $duracion);
        if ($stmt->execute()) {
            $response['success'] = true;
            $response['message'] = 'Medicamento actualizado con éxito.';
        } else {
            $response['message'] = 'No se pudo actualizar el medicamento.';
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