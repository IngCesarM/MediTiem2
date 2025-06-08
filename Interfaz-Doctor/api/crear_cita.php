<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../Modelo/Conexion.php'; // Adjusted path
session_start(); // Not strictly for id_doctor here if passed via POST, but good practice if other session data is needed

$response = ['success' => false, 'message' => 'Error desconocido.'];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $id_usuario = $_POST['id_usuario'] ?? '';
    $fecha_hora = $_POST['fecha_hora'] ?? '';
    $motivo = $_POST['motivo'] ?? '';
    $para = $_POST['Para'] ?? ''; 
    $estado = $_POST['estado'] ?? ''; // Should default to 'programada' from JS/HTML
    $id_doctor = $_POST['id_doctor'] ?? ''; // This ID comes from the hidden input in the form

    if (empty($id_doctor) || $id_doctor === "DEFAULT_DOCTOR_ID_OR_NULL") {
        $response['message'] = 'Error de sesión: El ID del doctor no es válido. No se puede crear la cita.';
        echo json_encode($response);
        exit;
    }
    if (empty($id_usuario) || empty($fecha_hora) || empty($motivo) || empty($estado)) {
        $response['message'] = 'Por favor, complete todos los campos requeridos (paciente, fecha/hora, motivo, estado).';
        echo json_encode($response);
        exit;
    }

    $para = !empty($_POST['Para']) ? $_POST['Para'] : NULL;

    $conexion_obj = new Conexion();
    try {
        $conn = $conexion_obj->conectar();
        // sp_InsertarCita parameters: p_fecha_hora, p_estado, p_motivo, p_id_usuario, p_id_doctor
        $stmt = $conn->prepare("CALL sp_InsertarCita(?, ?, ?, ?, ?, ?)");
        if (!$stmt) {
            throw new Exception("Error en prepare (sp_InsertarCita): " . $conn->error);
        }
        // Bind parameters (all as strings initially, MySQL will cast)
        $stmt->bind_param("ssssss", $fecha_hora, $estado, $motivo, $para, $id_usuario, $id_doctor);

        if ($stmt->execute()) {
            // Check if the SP returns id_cita (as per medi.sql)
            $result = $stmt->get_result();
            if ($result) {
                $data = $result->fetch_assoc();
                 if ($data && isset($data['id_cita'])) {
                    $response['success'] = true;
                    $response['message'] = 'Cita creada con éxito.';
                    $response['id_cita'] = $data['id_cita'];
                } else {
                    // This case might happen if LAST_INSERT_ID() was 0 or SP structure changed
                    $response['success'] = true; // Or false, depending on if you consider this an error
                    $response['message'] = 'Cita creada, pero no se pudo obtener el ID de la nueva cita.';
                }
                $result->free();
            } else if ($stmt->affected_rows > 0 || $stmt->insert_id > 0) { // Fallback if get_result() is not applicable but rows affected
                 $response['success'] = true;
                 $response['message'] = 'Cita creada con éxito (ID no retornado directamente por SP).';
                 // $response['id_cita'] = $stmt->insert_id; // If applicable
            }
             else {
                 $response['message'] = 'Cita procesada, pero no se confirmó la inserción o no se retornó ID.';
            }
        } else {
            throw new Exception("Error al ejecutar sp_InsertarCita: " . $stmt->error);
        }
        // Loop to consume any other potential results if SP has multiple SELECTs or output
        while ($conn->more_results() && $conn->next_result()) {;}
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