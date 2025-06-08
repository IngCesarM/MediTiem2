<?php
class Conexion {
  /*
    private $servidor = "69.49.241.61";
    private $usuario = "equipo66_IngCesarM";
    private $password = "Dinamita.1*";
    private $base_datos = "equipo66_SistemaMedico";
    private $conexion;

*/
    private $servidor = "localhost";
    private $usuario = "root";
    private $password = "12345678";
    private $base_datos = "SistemaMedico";
    private $conexion;
   
    public function conectar() {
        
        mysqli_report(MYSQLI_REPORT_OFF);

        // Intentar la conexión este @ es para suprimir warnings si falla
        $this->conexion = @new mysqli($this->servidor, $this->usuario, $this->password, $this->base_datos); 

        // en esta parte estoy verificando si hubo un error de conexion y se lanza una excepcion en caso 
        // de que no se pueda conectar a la base de datos
        if ($this->conexion->connect_error) {
            
            throw new Exception("Error de conexión a BD: " . $this->conexion->connect_error);
        }

        // se establece charset despues de una conexion exitosa
        if (!$this->conexion->set_charset("utf8mb4")) {
        
             // printf("Error cargando el conjunto de caracteres utf8mb4: %s\n", $this->conexion->error);
        }

        
        // mysqli_report(MYSQLI_REPORT_ERROR | MYSQLI_REPORT_STRICT);

        return $this->conexion;
    }

    // Método para cerrar la conexión a la base de datos
    public function cerrar() {
        if ($this->conexion) {
            $this->conexion->close();
        }
    }
}
?>