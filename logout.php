<?php

session_start(); // Iniciar la sesión
session_destroy(); // Destruir la sesión actual
header("Location: Interfaz-Inicio de Sesion/index.html"); // Redirigir al inicio de sesión
exit();
?>