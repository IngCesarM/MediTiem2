<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../Modelo/Conexion.php'; // Adjusted path
session_start(); // Not strictly for id_doctor here if passed via JSON, but good practice

$response = ['success' => false, 'message' => 'Datos no recibidos.', 'inserted_ids' => []];
$input = json_decode(file_get_contents('php://input'), true);

if ($input) {
    $id_usuario = $input['id_usuario'] ?? '';
    $id_doctor = $input['id_doctor'] ?? ''; // This ID comes from LOGGED_IN_DOCTOR_ID in JS payload
    $medicamentos_input = $input['medicamentos'] ?? [];
    $fecha_registro = date('Y-m-d H:i:s'); // Server-side timestamp

    if (empty($id_doctor) || $id_doctor === "DEFAULT_DOCTOR_ID_OR_NULL") {
        $response['message'] = 'Error de sesión: El ID del doctor no es válido. No se pueden recetar medicamentos.';
        echo json_encode($response);
        exit;
    }
    if (empty($id_usuario) || empty($medicamentos_input)) {
        $response['message'] = 'Datos incompletos: se requiere ID de usuario y al menos un medicamento.';
        echo json_encode($response);
        exit;
    }

    $conexion_obj = new Conexion();
    $conn = null;
    try {
        $conn = $conexion_obj->conectar();
        $conn->begin_transaction();
        $all_successful = true;

        foreach ($medicamentos_input as $med) {
            $nombre_med = $med['nombre'] ?? '';
            $dosis_med = $med['dosis'] ?? '';
            $frecuencia_med = $med['frecuencia'] ?? '';
            $duracion_med = $med['duracion'] ?? ''; 

            if (empty($nombre_med) || empty($dosis_med) || empty($frecuencia_med)) {
                $all_successful = false;
                $response['message'] = 'Todos los campos del medicamento son requeridos (nombre, dosis, frecuencia).';
                break; 
            }

            // sp_InsertarMedicamento(p_nombre, p_dosis, p_frecuencia, p_duracion, p_fecha_registro_medicamento, p_id_doctor, p_id_usuario)
            $stmt = $conn->prepare("CALL sp_InsertarMedicamento(?, ?, ? ,?, ?, ?, ?)");
            if (!$stmt) {
                 throw new Exception("Prepare failed (sp_InsertarMedicamento): " . $conn->error);
            }
            $stmt->bind_param("sssssss", $nombre_med, $dosis_med, $frecuencia_med, $duracion_med, $fecha_registro, $id_doctor, $id_usuario);

            if ($stmt->execute()) {
                $result = $stmt->get_result(); // Stored procedure returns id_medicamento
                if ($result) {
                    $data = $result->fetch_assoc();
                    if ($data && isset($data['id_medicamento'])) {
                        $response['inserted_ids'][] = $data['id_medicamento'];
                    }
                    $result->free();
                }
                 // Consume more results if any before closing
                while ($conn->more_results() && $conn->next_result()) {;}
                $stmt->close(); // Close statement inside loop after processing its result
            } else {
                $all_successful = false;
                $response['message'] = 'Error al insertar medicamento ' . htmlspecialchars($nombre_med) . ': ' . $stmt->error;
                $stmt->close(); 
                break;
            }
        }

        if ($all_successful) {
            $conn->commit();
            $response['success'] = true;
            $response['message'] = 'Medicamentos recetados con éxito.';
        } else {
            $conn->rollback();
            // $response['message'] would have been set by the failing part
        }

    } catch (Exception $e) {
        if ($conn && $conn->thread_id && $conn->in_transaction) { // Check if connection exists and transaction is active
             $conn->rollback();
        }
        $response['message'] = "Error del servidor: " . $e->getMessage();
    } finally {
        if (isset($conn)) { // Use isset to check if $conn was initialized
            $conexion_obj->cerrar();
        }
    }
    echo json_encode($response);
} else {
    $response['message'] = "No se recibieron datos JSON válidos.";
    echo json_encode($response);
}
?>