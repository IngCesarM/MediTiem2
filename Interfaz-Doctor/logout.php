<?php
session_start();
session_unset();
session_destroy();
header("Location: ../Interfaz-Inicio de Sesion/index.html"); // Cambia la ruta si tu login está en otro lugar
exit;
?>