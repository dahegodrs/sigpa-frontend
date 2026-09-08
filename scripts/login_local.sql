-- =============================================================================
-- SIGPA - Login Local con Usuario y Contraseña
-- Script SQL Server para habilitar autenticación por credenciales propias
-- Ejecutar en la base de datos: SIGPA
-- =============================================================================

-- -----------------------------------------------------------------------------
-- 1. Agregar columna password_hash a la tabla usuarios
--    NULL = usuario solo puede ingresar con Google (comportamiento anterior)
--    NOT NULL = usuario puede ingresar con usuario/contraseña
-- -----------------------------------------------------------------------------
IF NOT EXISTS (
    SELECT 1 FROM sys.columns
    WHERE object_id = OBJECT_ID('usuarios') AND name = 'password_hash'
)
BEGIN
    ALTER TABLE usuarios
    ADD password_hash NVARCHAR(255) NULL;

    PRINT 'Columna password_hash agregada a la tabla usuarios.';
END
ELSE
BEGIN
    PRINT 'La columna password_hash ya existe en la tabla usuarios.';
END
GO

-- -----------------------------------------------------------------------------
-- 2. Verificar resultado
-- -----------------------------------------------------------------------------
SELECT
    u.id,
    u.nombre,
    u.email,
    u.rol_id,
    u.activo,
    CASE WHEN u.password_hash IS NULL THEN 'Solo Google' ELSE 'Tiene contraseña local' END AS tipo_acceso
FROM usuarios u
ORDER BY u.id;
GO

-- =============================================================================
-- INSTRUCCIONES PARA ASIGNAR CONTRASEÑAS
-- =============================================================================
--
-- El hash de contraseña es generado por el backend con bcrypt (cost=12).
-- NO se puede generar directamente en SQL. Para asignar contraseñas:
--
-- OPCIÓN A — Via endpoint del backend (recomendado):
--   POST /api/v1/auth/local/set-password
--   Body: { "email": "usuario@alcaldia.gov.co", "password": "NuevaContraseña123!" }
--   Requiere token JWT de Administrador.
--
-- OPCIÓN B — Via herramienta bcrypt online (solo para pruebas iniciales):
--   1. Ir a https://bcrypt-generator.com/ con rounds=12
--   2. Ingresar la contraseña
--   3. Copiar el hash generado (empieza con $2a$12$...)
--   4. Ejecutar el UPDATE de abajo reemplazando el hash y email
--
-- Ejemplo de UPDATE (reemplaza los valores):
-- UPDATE usuarios
-- SET password_hash = '$2a$12$HASH_GENERADO_AQUI'
-- WHERE email = 'admin@alcaldia.gov.co';
--
-- CONTRASEÑA INICIAL RECOMENDADA para pruebas: Sigpa2024!
-- Hash bcrypt (cost=12) de "Sigpa2024!":
-- $2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGTkBIQ.nBnEI5FFLQ5O.bNOuqK
--
-- Para asignar esta contraseña al primer administrador (reemplaza el email):
-- UPDATE usuarios
-- SET password_hash = '$2a$12$LQv3c1yqBWVHxkd0LHAkCOYz6TiGTkBIQ.nBnEI5FFLQ5O.bNOuqK'
-- WHERE email = 'tu_email_admin@alcaldia.gov.co';
-- GO
-- =============================================================================
