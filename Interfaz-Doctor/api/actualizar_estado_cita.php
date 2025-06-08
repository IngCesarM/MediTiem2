<?php
header('Content-Type: application/json');
require_once __DIR__ . '/../../Modelo/Conexion.php';
$response = ['success' => false, 'message' => 'Error desconocido.'];

if ($_SERVER['REQUEST_METHOD'] == 'POST') {
    $id_cita_str = $_POST['id_cita'] ?? ''; // id_cita is INT in DB, but comes as string
    $nuevo_estado = $_POST['estado'] ?? '';

    if (empty($id_cita_str) || !filter_var($id_cita_str, FILTER_VALIDATE_INT) || empty($nuevo_estado)) {
        $response['message'] = 'ID de cita inválido o nuevo estado no proporcionados.';
        echo json_encode($response);
        exit;
    }
    $id_cita = (int)$id_cita_str;

    $conexion_obj = new Conexion();
    try {
        $conn = $conexion_obj->conectar();

        // Fetch current cita details to pass to sp_ActualizarCita
        $stmt_fetch = $conn->prepare("SELECT fecha_hora, motivo FROM Citas WHERE id_cita = ?");
        if (!$stmt_fetch) throw new Exception("Prepare failed (fetch Cita): " . $conn->error);
        $stmt_fetch->bind_param("i", $id_cita);
        $stmt_fetch->execute();
        $result_fetch = $stmt_fetch->get_result();
        $current_cita = $result_fetch->fetch_assoc();
        $stmt_fetch->close();

        if (!$current_cita) {
             $response['message'] = 'Cita no encontrada.';
             echo json_encode($response);
             if (isset($conn)) $conexion_obj->cerrar();
             exit;
        }

        $stmt = $conn->prepare("CALL sp_ActualizarCita(?, ?, ?, ?)");
        if (!$stmt) {
            throw new Exception("Error en prepare (sp_ActualizarCita): " . $conn->error);
        }
        // p_id_cita INT, p_fecha_hora DATETIME, p_estado ENUM, p_motivo TEXT
        $stmt->bind_param("isss", $id_cita, $current_cita['fecha_hora'], $nuevo_estado, $current_cita['motivo']);

        if ($stmt->execute()) {
            if ($stmt->affected_rows > 0) {
                $response['success'] = true;
                $response['message'] = 'Estado de la cita actualizado.';
            } else {
                $response['message'] = 'No se realizaron cambios en el estado de la cita (posiblemente ya tenía ese estado o ID no existe).';
                // $response['success'] = true; // If no change isn't an error
            }
        } else {
            throw new Exception("Error al ejecutar sp_ActualizarCita: " . $stmt->error);
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