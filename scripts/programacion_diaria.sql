-- =============================================================================
-- SIGPA - Módulo de Programación Diaria de Vehículos (Formato 15-FR-36)
-- Script SQL Server — ejecutar en la base de datos SIGPA
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Listas configurables (conductores, actividades y cualquier lista futura)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'listas_configuracion') AND type = 'U')
BEGIN
    CREATE TABLE listas_configuracion (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        organization_id INT NOT NULL,
        tipo            NVARCHAR(60)  NOT NULL,  -- 'conductor', 'actividad', etc.
        nombre          NVARCHAR(200) NOT NULL,
        activo          BIT NOT NULL DEFAULT 1,
        orden           INT NOT NULL DEFAULT 0,
        fecha_creacion  DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_listas_org FOREIGN KEY (organization_id) REFERENCES organizaciones(id)
    );

    CREATE INDEX IX_listas_org_tipo ON listas_configuracion (organization_id, tipo, activo);
    PRINT 'Tabla listas_configuracion creada.';
END
ELSE
    PRINT 'Tabla listas_configuracion ya existe.';
GO

-- -----------------------------------------------------------------------------
-- 2. Cabecera de cada programación diaria
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'programaciones_vehiculos') AND type = 'U')
BEGIN
    CREATE TABLE programaciones_vehiculos (
        id              INT IDENTITY(1,1) PRIMARY KEY,
        organization_id INT NOT NULL,
        fecha           DATE NOT NULL,
        observaciones   NVARCHAR(500) NULL,
        creado_por      INT NULL,
        fecha_creacion  DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        fecha_actualizacion DATETIME2 NOT NULL DEFAULT SYSDATETIME(),
        CONSTRAINT FK_prog_org  FOREIGN KEY (organization_id) REFERENCES organizaciones(id),
        CONSTRAINT FK_prog_user FOREIGN KEY (creado_por)      REFERENCES usuarios(id)
    );

    CREATE INDEX IX_prog_org_fecha ON programaciones_vehiculos (organization_id, fecha DESC);
    PRINT 'Tabla programaciones_vehiculos creada.';
END
ELSE
    PRINT 'Tabla programaciones_vehiculos ya existe.';
GO

-- -----------------------------------------------------------------------------
-- 3. Filas de cada programación (una por conductor)
-- -----------------------------------------------------------------------------
IF NOT EXISTS (SELECT 1 FROM sys.objects WHERE object_id = OBJECT_ID(N'programacion_items') AND type = 'U')
BEGIN
    CREATE TABLE programacion_items (
        id                  INT IDENTITY(1,1) PRIMARY KEY,
        programacion_id     INT NOT NULL,
        vehiculo_id         INT NULL,                        -- puede ser nulo (disponible en patio)
        conductor           NVARCHAR(150) NOT NULL,
        dependencia         NVARCHAR(200) NOT NULL DEFAULT 'DISPONIBLE PATIO',
        destino             NVARCHAR(200) NOT NULL DEFAULT 'DISPONIBLE PATIO',
        hora_salida_punto   NVARCHAR(150) NOT NULL DEFAULT 'DISPONIBLE PATIO',
        actividad           NVARCHAR(200) NOT NULL DEFAULT 'DISPONIBLE PATIO',
        es_vacaciones       BIT NOT NULL DEFAULT 0,
        orden               INT NOT NULL DEFAULT 0,
        CONSTRAINT FK_item_prog FOREIGN KEY (programacion_id) REFERENCES programaciones_vehiculos(id) ON DELETE CASCADE,
        CONSTRAINT FK_item_veh  FOREIGN KEY (vehiculo_id)     REFERENCES vehiculos(id)
    );

    CREATE INDEX IX_prog_items ON programacion_items (programacion_id, orden);
    PRINT 'Tabla programacion_items creada.';
END
ELSE
    PRINT 'Tabla programacion_items ya existe.';
GO

-- -----------------------------------------------------------------------------
-- 4. Datos iniciales de ejemplo para la organización 1 (Alcaldía de Funza)
--    Ajusta el organization_id si es diferente en tu BD.
-- -----------------------------------------------------------------------------

-- Conductores iniciales
IF NOT EXISTS (SELECT 1 FROM listas_configuracion WHERE organization_id = 1 AND tipo = 'conductor')
BEGIN
    INSERT INTO listas_configuracion (organization_id, tipo, nombre, orden) VALUES
    (1, 'conductor', 'DISPONIBLE PATIO', 0),
    (1, 'conductor', 'DIDIER ZAPATA',    1),
    (1, 'conductor', 'DIEGO PULIDO',     2),
    (1, 'conductor', 'EDWUAR GONZALEZ',  3),
    (1, 'conductor', 'JAIRO MARIN',      4),
    (1, 'conductor', 'JAIME HERNANDEZ',  5),
    (1, 'conductor', 'JOSE DAZA',        6),
    (1, 'conductor', 'JOSE HERRERA',     7),
    (1, 'conductor', 'JOSE IZQUIERDO',   8),
    (1, 'conductor', 'JUAN HAMON',       9),
    (1, 'conductor', 'LUIS PEREZ',       10),
    (1, 'conductor', 'NESTOR DELGADILLO',11),
    (1, 'conductor', 'OCTAVIO PUENTES',  12),
    (1, 'conductor', 'MANUEL PARRA',     13),
    (1, 'conductor', 'WILSON VALBUENA',  14),
    (1, 'conductor', 'DUVAN RODRIGUEZ',  15);
    PRINT 'Conductores iniciales insertados.';
END

-- Actividades iniciales
IF NOT EXISTS (SELECT 1 FROM listas_configuracion WHERE organization_id = 1 AND tipo = 'actividad')
BEGIN
    INSERT INTO listas_configuracion (organization_id, tipo, nombre, orden) VALUES
    (1, 'actividad', 'DISPONIBLE PATIO',      0),
    (1, 'actividad', 'TRASLADO FUNCIONARIOS', 1),
    (1, 'actividad', 'TRASLADO ELEMENTOS',    2),
    (1, 'actividad', 'DILIGENCIAS',           3),
    (1, 'actividad', 'COMISIÓN',              4),
    (1, 'actividad', 'MANTENIMIENTO',         5);
    PRINT 'Actividades iniciales insertadas.';
END
GO

-- -----------------------------------------------------------------------------
-- 5. Verificación
-- -----------------------------------------------------------------------------
SELECT tipo, COUNT(*) AS total FROM listas_configuracion WHERE organization_id = 1 GROUP BY tipo;
GO
