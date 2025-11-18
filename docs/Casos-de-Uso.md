# Casos de Uso - IPS Virtual

## Información del Sistema
- **Nombre**: IPS Virtual – Salud en Casa
- **Versión**: 1.0.0
- **Fecha**: Octubre 25, 2025
- **Propósito**: Sistema de gestión médica que permite agendar citas, gestionar fórmulas médicas y administrar servicios de salud de forma virtual.

## Actores del Sistema

### 👤 **Paciente**
Usuario final que busca servicios médicos, agenda citas y recibe atención médica.

### 👨‍⚕️ **Personal Médico**
Profesionales de la salud (médicos, enfermeras, especialistas) que atienden pacientes y gestionan tratamientos.

### 👑 **Administrador**
Usuario con permisos avanzados para gestionar servicios, usuarios y configuración del sistema.

---

## Casos de Uso por Actor

### 👤 **Casos de Uso - Paciente**

#### CU-01: Registrarse en el Sistema
**Como** paciente, **puedo** crear una cuenta en el sistema **para** acceder a los servicios médicos virtuales.

#### CU-02: Iniciar Sesión
**Como** paciente, **puedo** iniciar sesión en el sistema **para** acceder a mis datos médicos y servicios.

#### CU-03: Ver Servicios Médicos Disponibles
**Como** paciente, **puedo** ver la lista de servicios médicos activos **para** elegir el tipo de atención que necesito.

#### CU-04: Agendar Nueva Cita Médica
**Como** paciente, **puedo** agendar una cita médica **para** recibir atención virtual o presencial.

#### CU-05: Ver Mis Citas Programadas
**Como** paciente, **puedo** ver todas mis citas médicas programadas **para** estar al tanto de mis compromisos.

#### CU-06: Ver Historial de Citas
**Como** paciente, **puedo** revisar mi historial de citas médicas **para** consultar consultas anteriores.

#### CU-07: Ver Fórmulas Médicas Asignadas
**Como** paciente, **puedo** ver todas las fórmulas médicas que me han sido prescritas **para** conocer mis tratamientos actuales.

#### CU-08: Ver Dashboard Personal
**Como** paciente, **puedo** ver un resumen de mi actividad médica **para** tener una visión general de mi estado de salud.

#### CU-09: Gestionar Perfil Personal
**Como** paciente, **puedo** actualizar mi información personal **para** mantener mis datos actualizados.

---

### 👨‍⚕️ **Casos de Uso - Personal Médico**

#### CU-10: Gestionar Citas Asignadas
**Como** personal médico, **puedo** ver y gestionar todas las citas que tengo asignadas **para** organizar mi agenda de trabajo.

#### CU-11: Confirmar Citas Pendientes
**Como** personal médico, **puedo** confirmar citas pendientes **para** aceptar solicitudes de pacientes.

#### CU-12: Completar Consulta Médica
**Como** personal médico, **puedo** registrar el resultado de una consulta **para** documentar el diagnóstico y tratamiento.

#### CU-13: Crear Fórmulas Médicas
**Como** personal médico, **puedo** crear fórmulas médicas para pacientes **para** prescribir tratamientos farmacológicos.

#### CU-14: Gestionar Fórmulas Existentes
**Como** personal médico, **puedo** gestionar fórmulas médicas creadas **para** modificar tratamientos cuando sea necesario.

#### CU-15: Ver Historial de Pacientes
**Como** personal médico, **puedo** acceder al historial médico de mis pacientes **para** proporcionar atención informada.

---

### 👑 **Casos de Uso - Administrador**

#### CU-16: Gestionar Servicios Médicos
**Como** administrador, **puedo** crear y gestionar servicios médicos **para** mantener actualizada la oferta de servicios.

#### CU-17: Gestionar Usuarios del Sistema
**Como** administrador, **puedo** gestionar todos los usuarios del sistema **para** mantener la integridad de la plataforma.

#### CU-18: Ver Estadísticas del Sistema
**Como** administrador, **puedo** ver estadísticas generales del sistema **para** monitorear el uso y rendimiento.

#### CU-19: Gestionar Configuración del Sistema
**Como** administrador, **puedo** modificar configuraciones del sistema **para** adaptar la plataforma a nuevas necesidades.

---

## Consideraciones de Implementación

### Tecnologías Utilizadas
- **Frontend**: Next.js 15, React 18, TypeScript
- **Backend**: Firebase (Firestore, Authentication)
- **UI/UX**: TailwindCSS, Radix UI

### Estados de Implementación
- ✅ **Implementado**: Funcionalidades core operativas
- ⚠️ **Pendiente**: Notificaciones al personal médico
- ❌ **Crítico**: Reglas de seguridad de Firestore
- 🔄 **Mejora**: Protección de rutas por roles

---

**Documento creado**: Octubre 25, 2025
**Versión**: 1.0
**Autor**: Sistema de Análisis Automatizado</content>
<parameter name="filePath">c:\Users\stail\Desktop\IPS-Virtual-main\IPS-Virtual-main\docs\Casos-de-Uso.md