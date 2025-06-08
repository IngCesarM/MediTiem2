-- Crear base de datos
DROP DATABASE IF EXISTS SistemaMedico;
CREATE DATABASE SistemaMedico;
USE SistemaMedico;


-- Tabla de Doctores
CREATE TABLE Doctores (
    id_doctor CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100) NOT NULL,
    cedula VARCHAR(100) NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(15) NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    verificado TINYINT(1) DEFAULT 0,
    especialidad VARCHAR(100) NOT NULL,
    foto_perfil VARCHAR(255) NULL
);

-- Tabla de Usuarios (Pacientes)
CREATE TABLE Usuarios (
    id_usuario CHAR(36) PRIMARY KEY DEFAULT (UUID()),
    nombre VARCHAR(100) NOT NULL,
    apellido_paterno VARCHAR(100) NOT NULL,
    apellido_materno VARCHAR(100) NOT NULL,
    sexo ENUM('femenino', 'masculino') NOT NULL,
    correo VARCHAR(100) NOT NULL UNIQUE,
    telefono VARCHAR(15) NOT NULL,
    fecha_nacimiento DATE NOT NULL,
    edad INT NOT NULL,
    peso DECIMAL(5,2) NOT NULL,
    estatura DECIMAL(5,2) NOT NULL,
    contrasena VARCHAR(255) NOT NULL,
    rol ENUM('paciente') NOT NULL DEFAULT 'paciente',
    id_doctor CHAR(36),
    FOREIGN KEY (id_doctor) REFERENCES Doctores(id_doctor) ON DELETE SET NULL
);

-- Tabla de Citas (con ON DELETE CASCADE para usuarios)
CREATE TABLE Citas (
    id_cita INT AUTO_INCREMENT PRIMARY KEY,
    fecha_hora DATETIME NOT NULL,
    estado ENUM('programada', 'cancelada', 'completada') NOT NULL,
    motivo TEXT,
    para ENUM('hijo(a)', 'familiar', 'esposo(a)')NULL,
    id_usuario CHAR(36),
    id_doctor CHAR(36),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_doctor) REFERENCES Doctores(id_doctor) ON DELETE SET NULL
);

-- Tabla de Medicamentos (con ON DELETE CASCADE para usuarios)
CREATE TABLE Medicamentos (
    id_medicamento INT AUTO_INCREMENT PRIMARY KEY,
    nombre VARCHAR(100) NOT NULL,
    dosis VARCHAR(50) NOT NULL,
    frecuencia VARCHAR(50) NOT NULL,
    duracion VARCHAR(255) NOT NULL,
    fecha_registro_medicamento DATETIME NOT NULL,
    id_doctor CHAR(36),
    id_usuario CHAR(36),
    FOREIGN KEY (id_doctor) REFERENCES Doctores(id_doctor) ON DELETE SET NULL,
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE
);

-- Tabla de Notificaciones (con ON DELETE CASCADE para usuarios)
CREATE TABLE Notificaciones (
    id_notificacion INT AUTO_INCREMENT PRIMARY KEY,
    mensaje TEXT NOT NULL,
    fecha_hora DATETIME NOT NULL,
    id_usuario CHAR(36),
    id_medicamento INT,
    estado ENUM('enviada', 'pendiente', 'leída') DEFAULT 'pendiente',
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_medicamento) REFERENCES Medicamentos(id_medicamento) ON DELETE CASCADE
);

-- Tabla de Historial Médico (con ON DELETE CASCADE para usuarios)
CREATE TABLE HistorialMedico (
    id_historial INT AUTO_INCREMENT PRIMARY KEY,
    fecha DATE NOT NULL,
    descripcion TEXT NOT NULL,
    documento_pdf MEDIUMBLOB,
    id_usuario CHAR(36),
    id_doctor CHAR(36),
    FOREIGN KEY (id_usuario) REFERENCES Usuarios(id_usuario) ON DELETE CASCADE,
    FOREIGN KEY (id_doctor) REFERENCES Doctores(id_doctor) ON DELETE SET NULL
);

-- Tabla de HistorialSesiones (sin relación FK)
CREATE TABLE HistorialSesiones (
    id_sesion INT AUTO_INCREMENT PRIMARY KEY,
    correo VARCHAR(100),
    contrasena VARCHAR(100),
    tipo_usuario VARCHAR(50),
    fecha DATETIME DEFAULT CURRENT_TIMESTAMP
);



DELIMITER //

CREATE PROCEDURE sp_validar_inicio_sesion (
    IN p_correo VARCHAR(100),
    IN p_contrasena VARCHAR(100),
    IN p_tipo_usuario VARCHAR(50)
)
BEGIN
    IF p_tipo_usuario = 'doctor' THEN
        IF EXISTS (
            SELECT 1 FROM Doctores 
            WHERE correo = p_correo AND contrasena = p_contrasena
        ) THEN
            INSERT INTO Notificaciones(mensaje) VALUES (CONCAT('Doctor autenticado: ', p_correo));
        ELSE
            INSERT INTO Notificaciones(mensaje) VALUES (CONCAT('Error de login para doctor: ', p_correo));
        END IF;
    ELSEIF p_tipo_usuario = 'usuario' THEN
        IF EXISTS (
            SELECT 1 FROM Usuarios 
            WHERE correo = p_correo AND contrasena = p_contrasena
        ) THEN
            INSERT INTO Notificaciones(mensaje) VALUES (CONCAT('Usuario autenticado: ', p_correo));
        ELSE
            INSERT INTO Notificaciones(mensaje) VALUES (CONCAT('Error de login para usuario: ', p_correo));
        END IF;
    END IF;
END;
//

DELIMITER ;


################################################################
-- Procedimiento para insertar un doctor
DELIMITER //
CREATE PROCEDURE sp_InsertarDoctor(
    IN p_nombre VARCHAR(100),
    IN p_apellido_paterno VARCHAR(100),
    IN p_apellido_materno VARCHAR(100),
    IN p_cedula VARCHAR(100),
    IN p_correo VARCHAR(100),
    IN p_telefono VARCHAR(15),
    IN p_contrasena VARCHAR(255),
    IN p_especialidad VARCHAR(100)
)
BEGIN
    INSERT INTO Doctores(nombre, apellido_paterno, apellido_materno, cedula, correo, telefono, contrasena, especialidad)
    VALUES(p_nombre, p_apellido_paterno, p_apellido_materno, p_cedula, p_correo, p_telefono, p_contrasena, p_especialidad);
    SELECT id_doctor FROM Doctores WHERE correo = p_correo;
END //
DELIMITER ;

-- Procedimiento para actualizar un doctor
DELIMITER //
CREATE PROCEDURE sp_ActualizarDoctor(
    IN p_id_doctor CHAR(36),
    IN p_nombre VARCHAR(100),
    IN p_apellido_paterno VARCHAR(100),
    IN p_apellido_materno VARCHAR(100),
    IN p_cedula VARCHAR(100),
    IN p_correo VARCHAR(100),
    IN p_telefono VARCHAR(15),
    IN p_especialidad VARCHAR(100)
)
BEGIN
    UPDATE Doctores
    SET nombre = p_nombre,
        apellido_paterno = p_apellido_paterno,
        apellido_materno = p_apellido_materno,
        cedula = p_cedula,
        correo = p_correo,
        telefono = p_telefono,
        especialidad = p_especialidad
    WHERE id_doctor = p_id_doctor;
END //
DELIMITER ;

-- Procedimiento para eliminar un doctor
DELIMITER //
CREATE PROCEDURE sp_EliminarDoctor(
    IN p_id_doctor CHAR(36)
)
BEGIN
    DELETE FROM Doctores WHERE id_doctor = p_id_doctor;
END //
DELIMITER ;
/*
-- Procedimiento para obtener todos los doctores
DELIMITER //
CREATE PROCEDURE sp_ObtenerDoctores()
BEGIN
    SELECT id_doctor, nombre, apellido_paterno, apellido_materno, cedula, 
           correo, telefono, verificado, especialidad
    FROM Doctores;
END //
DELIMITER ;
/*
-- Procedimiento para obtener un doctor por ID
DELIMITER //
CREATE PROCEDURE sp_ObtenerDoctorPorID(
    IN p_id_doctor CHAR(36)
)
BEGIN
    SELECT id_doctor, nombre, apellido_paterno, apellido_materno, cedula, 
           correo, telefono, verificado, especialidad
    FROM Doctores 
    WHERE id_doctor = p_id_doctor;
END //
DELIMITER ;

*/
##########################################################


-- Procedimiento para insertar un usuario
DELIMITER //
CREATE PROCEDURE sp_InsertarUsuario(
    IN p_nombre VARCHAR(100),
    IN p_apellido_paterno VARCHAR(100),
    IN p_apellido_materno VARCHAR(100),
    IN p_sexo ENUM('femenino', 'masculino'),
    IN p_correo VARCHAR(100),
    IN p_telefono VARCHAR(15),
    IN p_fecha_nacimiento DATE,
    IN p_edad INT,
    IN p_peso DECIMAL(5,2),
    IN p_estatura DECIMAL(5,2),
    IN p_contrasena VARCHAR(255),
    IN p_id_doctor CHAR(36)
)
BEGIN
    INSERT INTO Usuarios(nombre, apellido_paterno, apellido_materno, sexo, correo, telefono, fecha_nacimiento, edad, peso, estatura, contrasena, id_doctor)
    VALUES(p_nombre, p_apellido_paterno, p_apellido_materno, p_sexo, p_correo, p_telefono, p_fecha_nacimiento, p_edad, p_peso, p_estatura, p_contrasena, p_id_doctor);
    SELECT id_usuario FROM Usuarios WHERE correo = p_correo;
END //
DELIMITER ;

-- Procedimiento para actualizar un usuario
DELIMITER //
CREATE PROCEDURE sp_ActualizarUsuario(
    IN p_id_usuario CHAR(36),
    IN p_nombre VARCHAR(100),
    IN p_apellido_paterno VARCHAR(100),
    IN p_apellido_materno VARCHAR(100),
    IN p_sexo ENUM('femenino', 'masculino'),
    IN p_correo VARCHAR(100),
    IN p_telefono VARCHAR(15),
    IN p_fecha_nacimiento DATE,
    IN p_edad INT,
    IN p_peso DECIMAL(5,2),
    IN p_estatura DECIMAL(5,2),
    IN p_id_doctor CHAR(36)
)
BEGIN
    UPDATE Usuarios
    SET nombre = p_nombre,
        apellido_paterno = p_apellido_paterno,
        apellido_materno = p_apellido_materno,
        sexo = p_sexo,
        correo = p_correo,
        telefono = p_telefono,
        fecha_nacimiento = p_fecha_nacimiento,
        edad = p_edad,
        peso = p_peso,
        estatura = p_estatura,
        id_doctor = p_id_doctor
    WHERE id_usuario = p_id_usuario;
END //
DELIMITER ;

-- Procedimiento para eliminar un usuario
DELIMITER //
CREATE PROCEDURE sp_EliminarUsuario(
    IN p_id_usuario CHAR(36)
)
BEGIN
    DELETE FROM Usuarios WHERE id_usuario = p_id_usuario;
END //
DELIMITER ;

-- Procedimiento para obtener todos los usuarios
DELIMITER //
CREATE PROCEDURE sp_ObtenerUsuarios()
BEGIN
    SELECT id_usuario, nombre, apellido_paterno, apellido_materno, sexo,
           correo, telefono, fecha_nacimiento, edad, peso, estatura, rol, id_doctor
    FROM Usuarios;
END //
DELIMITER ;

-- Procedimiento para obtener un usuario por ID
DELIMITER //
CREATE PROCEDURE sp_ObtenerUsuarioPorID(
    IN p_id_usuario CHAR(36)
)
BEGIN
    SELECT id_usuario, nombre, apellido_paterno, apellido_materno, sexo,
           correo, telefono, fecha_nacimiento, edad, peso, estatura, rol, id_doctor
    FROM Usuarios 
    WHERE id_usuario = p_id_usuario;
END //
DELIMITER ;

-- Procedimiento para obtener usuarios por doctor
DELIMITER //
CREATE PROCEDURE sp_ObtenerUsuariosPorDoctor(
    IN p_id_doctor CHAR(36)
)
BEGIN
    SELECT id_usuario, nombre, apellido_paterno, apellido_materno, sexo,
           correo, telefono, fecha_nacimiento, edad, peso, estatura, rol
    FROM Usuarios 
    WHERE id_doctor = p_id_doctor;
END //
DELIMITER ;


##########################################################
-- Procedimiento para insertar una cita
DELIMITER //
CREATE PROCEDURE sp_InsertarCita(
    IN p_fecha_hora DATETIME,
    IN p_estado ENUM('programada', 'cancelada', 'completada'),
    IN p_motivo TEXT,
    IN p_para ENUM('hijo(a)', 'familiar', 'esposo(a)'),
    IN p_id_usuario CHAR(36),
    IN p_id_doctor CHAR(36)
)
BEGIN
    INSERT INTO Citas(fecha_hora, estado, motivo, para, id_usuario, id_doctor)
    VALUES(p_fecha_hora, p_estado, p_motivo, p_para, p_id_usuario, p_id_doctor);
SELECT LAST_INSERT_ID() AS id_cita;
END //
DELIMITER ;

-- Procedimiento para actualizar una cita
DELIMITER //
CREATE PROCEDURE sp_ActualizarCita(
    IN p_id_cita INT,
    IN p_fecha_hora DATETIME,
    IN p_estado ENUM('programada', 'cancelada', 'completada'),
    IN p_motivo TEXT
)
BEGIN
    UPDATE Citas
    SET fecha_hora = p_fecha_hora,
        estado = p_estado,
        motivo = p_motivo
    WHERE id_cita = p_id_cita;
END //
DELIMITER ;

-- Procedimiento para eliminar una cita
DELIMITER //
CREATE PROCEDURE sp_EliminarCita(
    IN p_id_cita INT
)
BEGIN
    DELETE FROM Citas WHERE id_cita = p_id_cita;
END //
DELIMITER ;

-- Procedimiento para obtener todas las citas
DELIMITER //
CREATE PROCEDURE sp_ObtenerCitas()
BEGIN
    SELECT c.*, 
           d.nombre AS nombre_doctor, d.apellido_paterno AS apellido_paterno_doctor,
           u.nombre AS nombre_usuario, u.apellido_paterno AS apellido_paterno_usuario
    FROM Citas c
    JOIN Doctores d ON c.id_doctor = d.id_doctor
    JOIN Usuarios u ON c.id_usuario = u.id_usuario;
END //
DELIMITER ;

-- Procedimiento para obtener citas por ID de usuario
DELIMITER //
CREATE PROCEDURE sp_ObtenerCitasPorUsuario(
    IN p_id_usuario CHAR(36)
)
BEGIN
    SELECT c.*, 
           d.nombre AS nombre_doctor, d.apellido_paterno AS apellido_paterno_doctor
    FROM Citas c
    JOIN Doctores d ON c.id_doctor = d.id_doctor
    WHERE c.id_usuario = p_id_usuario;
END //
DELIMITER ;

-- Procedimiento para obtener citas por ID de doctor
DELIMITER //
CREATE PROCEDURE sp_ObtenerCitasPorDoctor(
    IN p_id_doctor CHAR(36)
)
BEGIN
    SELECT c.*, 
           u.nombre AS nombre_usuario, u.apellido_paterno AS apellido_paterno_usuario
    FROM Citas c
    JOIN Usuarios u ON c.id_usuario = u.id_usuario
    WHERE c.id_doctor = p_id_doctor;
END //
DELIMITER ;

-- Procedimiento para obtener citas por fecha y doctor
DELIMITER //
CREATE PROCEDURE sp_ObtenerCitasPorFechaYDoctor(
    IN p_fecha DATE,
    IN p_id_doctor CHAR(36)
)
BEGIN
    SELECT c.*, 
           u.nombre AS nombre_usuario, u.apellido_paterno AS apellido_paterno_usuario
    FROM Citas c
    JOIN Usuarios u ON c.id_usuario = u.id_usuario
    WHERE c.id_doctor = p_id_doctor AND DATE(c.fecha_hora) = p_fecha;
END //
DELIMITER ;
##################################################

-- Procedimiento para insertar un medicamento
DELIMITER //
CREATE PROCEDURE sp_InsertarMedicamento(
    IN p_nombre VARCHAR(100),
    IN p_dosis VARCHAR(50),
    IN p_frecuencia VARCHAR(50),
    IN p_duracion VARCHAR(255),
    IN p_fecha_registro_medicamento DATETIME,
    IN p_id_doctor CHAR(36),
    IN p_id_usuario CHAR(36)
)
BEGIN
    INSERT INTO Medicamentos(nombre, dosis, frecuencia, duracion, fecha_registro_medicamento, id_doctor, id_usuario)
    VALUES(p_nombre, p_dosis, p_frecuencia, p_duracion , p_fecha_registro_medicamento, p_id_doctor, p_id_usuario);
    SELECT LAST_INSERT_ID() AS id_medicamento;
END //
DELIMITER ;

-- Procedimiento para actualizar un medicamento
DELIMITER //
CREATE PROCEDURE sp_ActualizarMedicamento(
    IN p_id_medicamento INT,
    IN p_nombre VARCHAR(100),
    IN p_dosis VARCHAR(50),
    IN p_frecuencia VARCHAR(50),
    IN p_duracion VARCHAR(255)
)
BEGIN
    UPDATE Medicamentos
    SET nombre = p_nombre,
        dosis = p_dosis,
        frecuencia = p_frecuencia,
        duracion=p_duracioncitas
    WHERE id_medicamento = p_id_medicamento;
END //
DELIMITER ;

-- Procedimiento para eliminar un medicamento
DELIMITER //
CREATE PROCEDURE sp_EliminarMedicamento(
    IN p_id_medicamento INT
)
BEGIN
    DELETE FROM Medicamentos WHERE id_medicamento = p_id_medicamento;
END //
DELIMITER ;

-- Procedimiento para obtener todos los medicamentos
DELIMITER //
CREATE PROCEDURE sp_ObtenerMedicamentos()
BEGIN
    SELECT m.*, 
           d.nombre AS nombre_doctor, d.apellido_paterno AS apellido_paterno_doctor,
           u.nombre AS nombre_usuario, u.apellido_paterno AS apellido_paterno_usuario
    FROM Medicamentos m
    JOIN Doctores d ON m.id_doctor = d.id_doctor
    JOIN Usuarios u ON m.id_usuario = u.id_usuario;
END //
DELIMITER ;

-- Procedimiento para obtener medicamentos por ID de usuario
DELIMITER //
CREATE PROCEDURE sp_ObtenerMedicamentosPorUsuario(
    IN p_id_usuario CHAR(36)
)
BEGIN
    SELECT m.*,
           d.nombre AS nombre_doctor, d.apellido_paterno AS apellido_paterno_doctor
    FROM Medicamentos m
    JOIN Doctores d ON m.id_doctor = d.id_doctor
    WHERE m.id_usuario = p_id_usuario;
END //
DELIMITER ;

-- Procedimiento para obtener medicamentos por ID de doctor
DELIMITER //
CREATE PROCEDURE sp_ObtenerMedicamentosPorDoctor(
    IN p_id_doctor CHAR(36)
)
BEGIN
    SELECT m.*,
           u.nombre AS nombre_usuario, u.apellido_paterno AS apellido_paterno_usuario
    FROM Medicamentos m
    JOIN Usuarios u ON m.id_usuario = u.id_usuario
    WHERE m.id_doctor = p_id_doctor;
END //
DELIMITER ;
###########################################################

-- Procedimiento para insertar una notificación
DELIMITER //
CREATE PROCEDURE sp_InsertarNotificacion(
    IN p_mensaje TEXT,
    IN p_fecha_hora DATETIME,
    IN p_id_usuario CHAR(36),
    IN p_id_medicamento INT,
    IN p_estado ENUM('enviada', 'pendiente', 'leída')
)
BEGIN
    INSERT INTO Notificaciones(mensaje, fecha_hora, id_usuario, id_medicamento, estado)
    VALUES(p_mensaje, p_fecha_hora, p_id_usuario, p_id_medicamento, p_estado);
    SELECT LAST_INSERT_ID() AS id_notificacion;
END //
DELIMITER ;

-- Procedimiento para actualizar una notificación
DELIMITER //
CREATE PROCEDURE sp_ActualizarNotificacion(
    IN p_id_notificacion INT,
    IN p_mensaje TEXT,
    IN p_fecha_hora DATETIME,
    IN p_estado ENUM('enviada', 'pendiente', 'leída')
)
BEGIN
    UPDATE Notificaciones
    SET mensaje = p_mensaje,
        fecha_hora = p_fecha_hora,
        estado = p_estado
    WHERE id_notificacion = p_id_notificacion;
END //
DELIMITER ;

-- Procedimiento para actualizar el estado de una notificación
DELIMITER //
CREATE PROCEDURE sp_ActualizarEstadoNotificacion(
    IN p_id_notificacion INT,
    IN p_estado ENUM('enviada', 'pendiente', 'leída')
)
BEGIN
    UPDATE Notificaciones
    SET estado = p_estado
    WHERE id_notificacion = p_id_notificacion;
END //
DELIMITER ;

-- Procedimiento para eliminar una notificación
DELIMITER //
CREATE PROCEDURE sp_EliminarNotificacion(
    IN p_id_notificacion INT
)
BEGIN
    DELETE FROM Notificaciones WHERE id_notificacion = p_id_notificacion;
END //
DELIMITER ;

-- Procedimiento para obtener todas las notificaciones
DELIMITER //
CREATE PROCEDURE sp_ObtenerNotificaciones()
BEGIN
    SELECT n.*, 
           u.nombre AS nombre_usuario, u.apellido_paterno AS apellido_paterno_usuario,
           m.nombre AS nombre_medicamento
    FROM Notificaciones n
    JOIN Usuarios u ON n.id_usuario = u.id_usuario
    LEFT JOIN Medicamentos m ON n.id_medicamento = m.id_medicamento;
END //
DELIMITER ;

-- Procedimiento para obtener notificaciones por ID de usuario
DELIMITER //
CREATE PROCEDURE sp_ObtenerNotificacionesPorUsuario(
    IN p_id_usuario CHAR(36)
)
BEGIN
    SELECT n.*, m.nombre AS nombre_medicamento
    FROM Notificaciones n
    LEFT JOIN Medicamentos m ON n.id_medicamento = m.id_medicamento
    WHERE n.id_usuario = p_id_usuario
    ORDER BY n.fecha_hora DESC;
END //
DELIMITER ;
##############################################################

-- Procedimiento para insertar un registro en el historial médico
DELIMITER //
CREATE PROCEDURE sp_InsertarHistorialMedico(
    IN p_fecha DATE,
    IN p_descripcion TEXT,
    IN p_documento_pdf MEDIUMBLOB,
    IN p_id_usuario CHAR(36),
    IN p_id_doctor CHAR(36)
)
BEGIN
    INSERT INTO HistorialMedico(fecha, descripcion, documento_pdf, id_usuario, id_doctor)
    VALUES(p_fecha, p_descripcion, p_documento_pdf, p_id_usuario, p_id_doctor);
    SELECT LAST_INSERT_ID() AS id_historial;
END //
DELIMITER ;

-- Procedimiento para actualizar un registro en el historial médico
DELIMITER //
CREATE PROCEDURE sp_ActualizarHistorialMedico(
    IN p_id_historial INT,
    IN p_fecha DATE,
    IN p_descripcion TEXT,
    IN p_documento_pdf MEDIUMBLOB
)
BEGIN
    UPDATE HistorialMedico
    SET fecha = p_fecha,
        descripcion = p_descripcion,
        documento_pdf = p_documento_pdf
    WHERE id_historial = p_id_historial;
END //
DELIMITER ;

-- Procedimiento para eliminar un registro del historial médico
DELIMITER //
CREATE PROCEDURE sp_EliminarHistorialMedico(
    IN p_id_historial INT
)
BEGIN
    DELETE FROM HistorialMedico WHERE id_historial = p_id_historial;
END //
DELIMITER ;

-- Procedimiento para obtener todo el historial médico
DELIMITER //
CREATE PROCEDURE sp_ObtenerHistorialMedico()
BEGIN
    SELECT h.id_historial, h.fecha, h.descripcion, 
           d.nombre AS nombre_doctor, d.apellido_paterno AS apellido_paterno_doctor,
           u.nombre AS nombre_usuario, u.apellido_paterno AS apellido_paterno_usuario
    FROM HistorialMedico h
    JOIN Doctores d ON h.id_doctor = d.id_doctor
    JOIN Usuarios u ON h.id_usuario = u.id_usuario;
END //
DELIMITER ;

-- Procedimiento para obtener historial médico por ID de usuario
DELIMITER //
CREATE PROCEDURE sp_ObtenerHistorialMedicoPorUsuario(
    IN p_id_usuario CHAR(36)
)
BEGIN
    SELECT h.id_historial, h.fecha, h.descripcion, 
           d.nombre AS nombre_doctor, d.apellido_paterno AS apellido_paterno_doctor
    FROM HistorialMedico h
    JOIN Doctores d ON h.id_doctor = d.id_doctor
    WHERE h.id_usuario = p_id_usuario
    ORDER BY h.fecha DESC;
END //
DELIMITER ;

-- Procedimiento para obtener historial médico por ID de doctor
DELIMITER //
CREATE PROCEDURE sp_ObtenerHistorialMedicoPorDoctor(
    IN p_id_doctor CHAR(36)
)
BEGIN
    SELECT h.id_historial, h.fecha, h.descripcion, 
           u.nombre AS nombre_usuario, u.apellido_paterno AS apellido_paterno_usuario
    FROM HistorialMedico h
    JOIN Usuarios u ON h.id_usuario = u.id_usuario
    WHERE h.id_doctor = p_id_doctor
    ORDER BY h.fecha DESC;
END //
DELIMITER ;

-- Procedimiento para obtener documento PDF del historial médico
DELIMITER //
CREATE PROCEDURE sp_ObtenerDocumentoPDF(
    IN p_id_historial INT
)
BEGIN
    SELECT documento_pdf 
    FROM HistorialMedico 
    WHERE id_historial = p_id_historial;
END //
DELIMITER ;

