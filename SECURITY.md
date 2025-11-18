# 🔒 Sistema de Seguridad - IPS Virtual

## Protección de Rutas Implementada

Se ha implementado un sistema completo de protección de rutas para evitar acceso no autorizado a las diferentes secciones de la aplicación.

### 📁 Componente Principal: `ProtectedRoute`

**Ubicación:** `src/components/auth/ProtectedRoute.tsx`

Este componente envuelve las rutas protegidas y:
- ✅ Verifica que el usuario esté autenticado
- ✅ Valida el rol del usuario contra los roles permitidos
- ✅ Redirige automáticamente a `/login` si no hay sesión
- ✅ Redirige al dashboard correcto según el rol si intenta acceder a una ruta no autorizada
- ✅ Muestra un loading mientras verifica la autenticación
- ✅ No renderiza contenido hasta confirmar la autorización

### 🛡️ Niveles de Protección

#### 1. **Dashboard Principal** (`/dashboard`)
**Protección:** Requiere autenticación
- Cualquier usuario autenticado puede acceder
- Automáticamente redirige a la sección correcta según el rol

#### 2. **Sección Admin** (`/dashboard/admin/*`)
**Protección:** Solo usuarios con rol `ADMIN`
- Layout protegido en: `src/app/dashboard/admin/layout.tsx`
- Todas las sub-rutas heredan la protección:
  - `/dashboard/admin` - Dashboard de administración
  - `/dashboard/admin/medicos` - Gestión de médicos
  - `/dashboard/admin/pacientes` - Gestión de pacientes
  - `/dashboard/admin/servicios` - Gestión de servicios
  - `/dashboard/admin/formulas` - Gestión de fórmulas
  - `/dashboard/admin/citas` - Gestión de citas
  - `/dashboard/admin/estadisticas` - Estadísticas
  - `/dashboard/admin/turnos` - Turnos

#### 3. **Sección Personal Médico** (`/dashboard/personal/*`)
**Protección:** Usuarios con rol `PERSONAL` o `ADMIN`
- Layout protegido en: `src/app/dashboard/personal/layout.tsx`
- Todas las sub-rutas heredan la protección:
  - `/dashboard/personal` - Dashboard del personal médico
  - `/dashboard/personal/citas` - Gestión de citas
  - `/dashboard/personal/pacientes` - Gestión de pacientes
  - `/dashboard/personal/formulas` - Gestión de fórmulas

#### 4. **Secciones de Paciente** (`/dashboard/*`)
**Protección:** Usuarios con rol `PACIENTE`
- Rutas protegidas por el layout principal:
  - `/dashboard` - Dashboard del paciente
  - `/dashboard/citas` - Ver y agendar citas
  - `/dashboard/formulas` - Ver fórmulas médicas
  - `/dashboard/historial` - Historial clínico
  - `/dashboard/medicos` - Buscar médicos
  - `/dashboard/servicios` - Ver servicios
  - `/dashboard/notificaciones` - Notificaciones
  - `/dashboard/perfil` - Perfil del usuario
  - `/dashboard/ayuda` - Ayuda

### 🚫 Comportamiento de Seguridad

#### Si un usuario NO autenticado intenta acceder:
```
/dashboard/* → Redirige a /login
```

#### Si un PACIENTE intenta acceder a rutas de admin:
```
/dashboard/admin/* → Redirige a /dashboard
```

#### Si un PACIENTE intenta acceder a rutas de personal:
```
/dashboard/personal/* → Redirige a /dashboard
```

#### Si PERSONAL intenta acceder a rutas de admin:
```
/dashboard/admin/* → Redirige a /dashboard/personal
```

#### Si ADMIN accede a cualquier ruta:
```
✅ Tiene acceso completo a todas las secciones
```

### 🔐 Seguridad en Firestore

Además de la protección en el frontend, las reglas de Firestore proporcionan seguridad en el backend:

**Archivo:** `firestore.rules`

- ✅ Usuarios solo pueden leer/escribir sus propios datos
- ✅ Personal médico puede ver pacientes asignados
- ✅ Administradores tienen permisos completos
- ✅ Validación de roles en el servidor
- ✅ Notificaciones privadas por usuario
- ✅ Notas de evolución inmutables

### 📊 Matriz de Permisos

| Ruta | PACIENTE | PERSONAL | ADMIN |
|------|----------|----------|-------|
| `/` (Landing) | ✅ | ✅ | ✅ |
| `/login` | ✅ | ✅ | ✅ |
| `/signup` | ✅ | ✅ | ✅ |
| `/dashboard` | ✅ | ➡️ Personal | ➡️ Admin |
| `/dashboard/citas` | ✅ | ❌ | ❌ |
| `/dashboard/formulas` | ✅ | ❌ | ❌ |
| `/dashboard/historial` | ✅ | ❌ | ❌ |
| `/dashboard/personal/*` | ❌ | ✅ | ✅ |
| `/dashboard/admin/*` | ❌ | ❌ | ✅ |

**Leyenda:**
- ✅ Acceso permitido
- ❌ Acceso denegado (redirige)
- ➡️ Redirige automáticamente

### 🧪 Cómo Probar la Seguridad

1. **Sin autenticación:**
   ```
   Visita: http://localhost:3000/dashboard/admin
   Resultado: Redirige a /login
   ```

2. **Como PACIENTE:**
   ```
   Visita: http://localhost:3000/dashboard/personal
   Resultado: Redirige a /dashboard
   ```

3. **Como PERSONAL:**
   ```
   Visita: http://localhost:3000/dashboard/admin
   Resultado: Redirige a /dashboard/personal
   ```

### 🛠️ Implementación Técnica

#### Uso del componente ProtectedRoute:

```tsx
// En un layout
'use client';

import { ProtectedRoute } from '@/components/auth/ProtectedRoute';

export default function AdminLayout({ children }: { children: React.ReactNode }) {
  return (
    <ProtectedRoute allowedRoles={['ADMIN']}>
      {children}
    </ProtectedRoute>
  );
}
```

#### Props disponibles:

- `requireAuth` (boolean): Si requiere autenticación (default: true)
- `allowedRoles` (array): Array de roles permitidos (opcional)
- Si no se especifica `allowedRoles`, solo verifica autenticación

### ⚠️ Consideraciones Importantes

1. **Protección en Cascada:** Los layouts protegen todas las sub-rutas automáticamente
2. **Loading State:** El usuario ve un loading mientras se verifica la autenticación
3. **No Flash de Contenido:** El contenido protegido NUNCA se renderiza antes de validar
4. **Doble Capa:** Frontend + Firestore Rules = Seguridad completa
5. **Session Persistence:** Firebase Auth mantiene la sesión entre recargas

### 🚀 Próximos Pasos Recomendados

- [ ] Implementar rate limiting en autenticación
- [ ] Agregar logs de intentos de acceso no autorizado
- [ ] Implementar 2FA (autenticación de dos factores)
- [ ] Agregar timeouts de sesión configurables
- [ ] Implementar auditoría de accesos

---

**Fecha de implementación:** 13 de octubre, 2025  
**Versión de seguridad:** 1.0.0
