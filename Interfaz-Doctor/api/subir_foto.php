<?php
session_start();
require_once '../../Modelo/Conexion.php';

if (!isset($_SESSION['id_doctor'])) {
    header('Location: ../logout.php');
    exit;
}

$rutaCarpeta = "../img/doctores/";
if (!is_dir($rutaCarpeta)) {
    mkdir($rutaCarpeta, 0777, true);
}

if ($_SERVER['REQUEST_METHOD'] === 'POST' && isset($_FILES['foto_perfil'])) {
    $id_doctor = $_SESSION['id_doctor'];
    $foto = $_FILES['foto_perfil'];
    $nombreArchivo = uniqid('doctor_') . '_' . basename($foto['name']);
    $rutaDestino = "../img/doctores/" . $nombreArchivo;

    // Validar tipo y tamaño (ejemplo: máx 2MB)
    $permitidos = ['image/jpeg', 'image/png', 'image/gif'];
    if (!in_array($foto['type'], $permitidos) || $foto['size'] > 2 * 1024 * 1024) {
        echo "Archivo no permitido o demasiado grande.";
        exit;
    }

    if (move_uploaded_file($foto['tmp_name'], $rutaDestino)) {
        // Guardar nombre de archivo en la BD
        $conexion = new Conexion();
        $db = $conexion->conectar();
        $stmt = $db->prepare("UPDATE Doctores SET foto_perfil = ? WHERE id_doctor = ?");
        $stmt->bind_param("ss", $nombreArchivo, $id_doctor);
        $stmt->execute();
        $_SESSION['foto_perfil'] = $nombreArchivo;
        header("Location: ../index.php");
        exit;
    } else {
        echo "Error al subir la imagen.";
    }
} else {
    echo "Solicitud inválida.";
}
?>