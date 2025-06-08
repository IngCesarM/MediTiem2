<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../Modelo/Conexion.php'; // Adjusted path

session_start(); // Not strictly used here for id_doctor, but good practice
// $current_doctor_id_session = $_SESSION['id_doctor'] ?? null; // Could be used for auth

$response = ['success' => false, 'citas' => [], 'message' => 'Error desconocido.'];
$id_doctor_param = $_GET['id_doctor'] ?? ''; // ID of the doctor whose appointments are being requested
$estado_filtro = $_GET['estado'] ?? null;

if (empty($id_doctor_param) || $id_doctor_param === "DEFAULT_DOCTOR_ID_OR_NULL") { // Enhanced check
    $response['message'] = 'ID de doctor no proporcionado o inválido.';
    echo json_encode($response);
    exit;
}

$conexion_obj = new Conexion();
try {
    $conn = $conexion_obj->conectar();
    // sp_ObtenerCitasPorDoctor(IN p_id_doctor CHAR(36))
    $stmt = $conn->prepare("CALL sp_ObtenerCitasPorDoctor(?)");
    if (!$stmt) {
        throw new Exception("Error en prepare (sp_ObtenerCitasPorDoctor): " . $conn->error);
    }
    $stmt->bind_param("s", $id_doctor_param);
    $stmt->execute();
    $result = $stmt->get_result();

    if ($result) {
        $citas = $result->fetch_all(MYSQLI_ASSOC);
        $response['success'] = true; // Set success true even if no citas found, the request itself was successful

        if (!empty($citas)) {
            if ($estado_filtro) {
                $citas_filtradas = array_filter($citas, function($cita_item) use ($estado_filtro) {
                    return $cita_item['estado'] == $estado_filtro;
                });
                $response['citas'] = array_values($citas_filtradas); // Re-index array
                if (empty($response['citas'])) {
                    $response['message'] = 'No se encontraron citas con el estado especificado para este doctor.';
                } else {
                    $response['message'] = 'Citas obtenidas con éxito.';
                }
            } else {
                $response['citas'] = $citas;
                $response['message'] = 'Citas obtenidas con éxito.';
            }
        } else {
            $response['message'] = 'No se encontraron citas para este doctor' . ($estado_filtro ? ' con el estado ' . htmlspecialchars($estado_filtro) : '') . '.';
        }
        $result->free();
    } else {
        // This else might not be reached if prepare/execute fails, as they'd throw exceptions.
        // But if get_result returns false for other reasons:
        throw new Exception("Error al obtener resultados de sp_ObtenerCitasPorDoctor: " . $conn->error); // Changed from $stmt->error
    }
    $stmt->close();
} catch (Exception $e) {
    $response['message'] = "Error del servidor: " . $e->getMessage();
    // $response['success'] remains false (default)
} finally {
    if (isset($conn)) {
        $conexion_obj->cerrar();
    }
}
echo json_encode($response);
?>