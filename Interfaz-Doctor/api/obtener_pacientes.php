<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../Modelo/Conexion.php'; // Adjusted path

$response = ['success' => false, 'pacientes' => [], 'message' => 'No se pudieron obtener los pacientes.'];
$id_doctor_filtro = $_GET['id_doctor'] ?? null;

if (empty($id_doctor_filtro) || $id_doctor_filtro === "DEFAULT_DOCTOR_ID_OR_NULL") {
    $response['message'] = 'ID de doctor no proporcionado o inválido para filtrar pacientes.';
    echo json_encode($response);
    exit;
}

$conexion_obj = new Conexion();
try {
    $conn = $conexion_obj->conectar();
    // Using the SP that fetches patients by the doctor who registered them or is assigned to them
    $stmt = $conn->prepare("CALL sp_ObtenerUsuariosPorDoctor(?)"); //
    if (!$stmt) {
        throw new Exception("Error en prepare (sp_ObtenerUsuariosPorDoctor): " . $conn->error);
    }
    $stmt->bind_param("s", $id_doctor_filtro);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result) {
        $pacientes = $result->fetch_all(MYSQLI_ASSOC);
        if (!empty($pacientes)) {
            $response['success'] = true;
            $response['pacientes'] = $pacientes;
            $response['message'] = 'Pacientes obtenidos con éxito.';
        } else {
            $response['success'] = true; // Success, but no patients for this doctor
            $response['message'] = 'No se encontraron pacientes asignados a este doctor.';
        }
        $result->free();
    } else {
        throw new Exception("Error al obtener resultados de sp_ObtenerUsuariosPorDoctor: " . $stmt->error);
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
?>