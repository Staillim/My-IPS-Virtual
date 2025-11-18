# 📋 ESTADOS DE LAS CITAS - SISTEMA IPS VIRTUAL

## 🔄 Ciclo de Vida de una Cita

```
┌─────────────┐
│  PENDIENTE  │ ← Cita recién creada por el paciente
└──────┬──────┘
       │
       ├──→ [Médico acepta] ──→ ┌──────────────┐
       │                         │ CONFIRMADA   │ ← Cita aceptada, lista para realizar
       │                         └──────┬───────┘
       │                                │
       │                                ├──→ [Médico completa consulta] ──→ ┌──────────────┐
       │                                │                                    │ COMPLETADA   │ ← Cita ya realizada
       │                                │                                    └──────────────┘
       │                                │
       │                                └──→ [Se cancela] ──→ ┌──────────────┐
       │                                                       │  CANCELADA   │
       └──────────────────────────────────────────────────────┴──────────────┘
```

---

## 📊 ESTADOS DISPONIBLES

### 1️⃣ **PENDIENTE** 
- **Color:** Amarillo/Outline
- **Descripción:** Cita solicitada por el paciente, esperando confirmación del médico
- **Acciones disponibles:**
  - ✅ Confirmar (Médico/Admin)
  - ❌ Cancelar (Paciente/Médico/Admin)
  - 📝 Ver detalles

---

### 2️⃣ **CONFIRMADA**
- **Color:** Azul/Default
- **Descripción:** Cita aceptada por el médico, agendada y lista para realizarse
- **Acciones disponibles:**
  - ✅ Completar consulta (Médico)
  - 🔄 Reprogramar (Médico/Admin)
  - ❌ Cancelar (Paciente/Médico/Admin)
  - 📝 Ver detalles

---

### 3️⃣ **COMPLETADA**
- **Color:** Gris/Outline
- **Descripción:** La cita ya se realizó, el paciente fue atendido
- **Acciones disponibles:**
  - 📝 Ver detalles (incluye diagnóstico y fórmula)
  - 📄 Descargar PDF
  - ⚠️ **NO se puede cancelar** (ya sucedió)

---

### 4️⃣ **CANCELADA**
- **Color:** Rojo/Destructive
- **Descripción:** Cita cancelada por cualquier motivo
- **Acciones disponibles:**
  - 📝 Ver detalles (incluye motivo de cancelación)
  - ⚠️ **NO se puede cancelar** (ya está cancelada)

---

### 5️⃣ **EN CURSO** (Opcional)
- **Color:** Verde/Secondary
- **Descripción:** La consulta está ocurriendo en este momento
- **Acciones disponibles:**
  - ✅ Completar consulta
  - 📝 Ver detalles

---

## 🚫 REGLAS DE NEGOCIO

### ❌ **NO se puede cancelar si:**
1. **Estado = COMPLETADA** → La cita ya se realizó, no tiene sentido cancelarla
2. **Estado = CANCELADA** → Ya está cancelada, no se puede cancelar dos veces

### ✅ **SÍ se puede cancelar si:**
1. **Estado = PENDIENTE** → Aún no ha sido confirmada
2. **Estado = CONFIRMADA** → Ya confirmada pero aún no realizada
3. **Estado = EN CURSO** → En casos excepcionales (emergencia)

---

## 🔔 NOTIFICACIONES POR ACCIÓN

### Cuando se **CONFIRMA** una cita:
- 📧 Paciente recibe: "Tu cita ha sido confirmada"
- 📧 Médico recibe: Recordatorio de nueva cita agendada

### Cuando se **COMPLETA** una cita:
- 📧 Paciente recibe: "Tu consulta ha sido registrada. Diagnóstico disponible"
- 📧 Admin recibe: Actualización de estadísticas

### Cuando se **CANCELA** una cita:
- 📧 Paciente recibe: "Tu cita ha sido cancelada" + motivo
- 📧 Médico recibe: "Cita cancelada con [nombre paciente]" + motivo
- 💾 Se registra: quién canceló, cuándo y por qué

### Cuando se **REPROGRAMA** una cita:
- 📧 Paciente recibe: "Nueva fecha propuesta: [fecha]"
- 📧 Médico recibe: "Solicitud de reprogramación aceptada/rechazada"

---

## 🎨 VISUALIZACIÓN EN LA UI

### Badges por Estado:
```typescript
'pendiente'   → Badge amarillo    → "Pendiente"
'confirmada'  → Badge azul        → "Confirmada"
'completada'  → Badge gris        → "Completada"
'cancelada'   → Badge rojo        → "Cancelada"
'en curso'    → Badge verde       → "En Curso"
```

### Botones Condicionales:
```typescript
// Dropdown Menu de Acciones
- Ver Detalles        → SIEMPRE visible
- Cancelar Cita       → Solo si status !== 'completada' && status !== 'cancelada'
- Reprogramar         → Solo si status === 'confirmada'
- Completar Consulta  → Solo si status === 'confirmada' (solo médicos)
```

---

## 📝 CAMPOS ADICIONALES EN FIRESTORE

### Cuando está **COMPLETADA**:
```typescript
{
  status: 'completada',
  diagnosis: {
    code: 'CIE-10',
    description: 'Diagnóstico del médico',
    treatment: 'Tratamiento recomendado',
    date: timestamp
  },
  completedAt: timestamp,
  completedBy: 'doctorId'
}
```

### Cuando está **CANCELADA**:
```typescript
{
  status: 'cancelada',
  cancellationReason: 'Motivo de la cancelación',
  cancelledBy: 'admin' | 'patient' | 'doctor',
  cancelledAt: timestamp
}
```

### Cuando está **CONFIRMADA**:
```typescript
{
  status: 'confirmada',
  confirmedAt: timestamp,
  confirmedBy: 'doctorId'
}
```

---

## 🔍 CASOS DE USO

### ✅ **FLUJO NORMAL:**
1. Paciente agenda cita → `PENDIENTE`
2. Médico acepta → `CONFIRMADA`
3. Médico atiende paciente → `COMPLETADA`

### ❌ **FLUJO CON CANCELACIÓN:**
1. Paciente agenda cita → `PENDIENTE`
2. Médico acepta → `CONFIRMADA`
3. Paciente cancela → `CANCELADA` (se notifica a médico)

### 🔄 **FLUJO CON REPROGRAMACIÓN:**
1. Paciente agenda cita → `PENDIENTE`
2. Médico acepta → `CONFIRMADA`
3. Médico propone nueva fecha → `CONFIRMADA` (actualizada)
4. Paciente acepta o rechaza la nueva fecha

---

## 💡 RECOMENDACIONES

### Para Administradores:
- ✅ Revisar citas `PENDIENTES` regularmente
- ✅ Confirmar que citas `COMPLETADAS` tengan diagnóstico
- ✅ Investigar patrones en citas `CANCELADAS`

### Para Médicos:
- ✅ Confirmar citas `PENDIENTES` pronto
- ✅ Completar diagnóstico al finalizar consulta
- ✅ Proporcionar motivo al cancelar/reprogramar

### Para Pacientes:
- ✅ Cancelar con anticipación si no pueden asistir
- ✅ Revisar diagnóstico después de cita `COMPLETADA`
- ✅ Responder a solicitudes de reprogramación

---

**Última actualización:** 8 de Noviembre, 2025  
**Sistema:** My-IPS-Virtual  
**Versión:** 1.0
