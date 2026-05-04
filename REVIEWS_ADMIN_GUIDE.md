# Guía de Administración de Reseñas - Filamorfosis®

## Acceso al Panel de Reseñas

1. Inicia sesión en el panel de administración: `https://filamorfosis.com/admin.html`
2. Completa la autenticación de dos pasos (MFA)
3. Haz clic en la pestaña **"Reseñas"** (icono de estrella ⭐)

**Nota:** Solo los usuarios con roles Master, ProductManagement u OrderManagement pueden acceder a esta sección.

---

## Vista Principal de Reseñas

### Filtros Disponibles

#### Filtro por Estado
Usa el menú desplegable para filtrar reseñas por estado:
- **Todos los estados** - Muestra todas las reseñas
- **Pendiente** - Reseñas esperando aprobación (badge amarillo)
- **Aprobada** - Reseñas visibles en la tienda (badge verde)
- **Rechazada** - Reseñas rechazadas por el admin (badge rojo)

#### Búsqueda
Escribe en el campo de búsqueda para filtrar por:
- Nombre del autor
- Texto de la reseña
- Producto

La búsqueda se actualiza automáticamente después de 350ms.

---

## Tabla de Reseñas

### Columnas
1. **Fecha** - Cuándo se envió la reseña
2. **Producto** - Nombre del producto reseñado
3. **Autor** - Nombre del cliente que escribió la reseña
4. **Calificación** - Estrellas (★★★★★) de 1 a 5
5. **Reseña** - Extracto del texto de la reseña
6. **Estado** - Badge de color indicando el estado actual
7. **Acciones** - Botones de acción rápida

### Botones de Acción

#### 👁️ Ver Detalle
- Abre un modal con la información completa de la reseña
- Muestra todas las imágenes adjuntas
- Permite aprobar/rechazar desde el modal

#### ✓ Aprobar (solo para reseñas pendientes)
- Aprueba la reseña inmediatamente
- La reseña se vuelve visible en la tienda
- No requiere nota del administrador

#### ✗ Rechazar (solo para reseñas pendientes)
- Solicita un motivo de rechazo (obligatorio)
- La reseña no será visible en la tienda
- El motivo se guarda como nota administrativa

#### 🗑️ Eliminar
- Solicita confirmación
- Elimina permanentemente la reseña
- Elimina todas las imágenes asociadas de S3
- **Esta acción no se puede deshacer**

---

## Modal de Detalle de Reseña

### Información Mostrada
- **Calificación visual** - Estrellas grandes con número (ej: ★★★★★ 5/5)
- **Estado actual** - Badge de color
- **Producto** - Nombre del producto reseñado
- **Autor** - Nombre del cliente
- **Fecha** - Cuándo se envió
- **Fecha de revisión** - Cuándo fue aprobada/rechazada (si aplica)
- **Texto completo** - Reseña completa sin truncar
- **Imágenes** - Galería de imágenes con opción de eliminar individualmente
- **Nota del admin** - Motivo de rechazo (si fue rechazada)

### Acciones en el Modal

#### Para Reseñas Pendientes
El modal muestra un formulario de decisión:

1. **Campo de nota** (opcional para aprobar, obligatorio para rechazar)
   - Escribe un comentario administrativo
   - Útil para documentar decisiones
   - Visible solo para administradores

2. **Botón "Aprobar"**
   - Aprueba la reseña con la nota opcional
   - La reseña aparece inmediatamente en la tienda
   - Se registra la fecha de aprobación

3. **Botón "Rechazar"**
   - Requiere una nota explicando el motivo
   - La reseña no será visible públicamente
   - El cliente no recibe notificación (por ahora)

#### Eliminar Imágenes Individuales
- Cada imagen tiene un botón ✗ en la esquina superior derecha
- Clic en ✗ solicita confirmación
- La imagen se elimina de S3 y de la reseña
- Útil para remover imágenes inapropiadas sin rechazar toda la reseña

---

## Flujo de Trabajo Recomendado

### Revisión Diaria de Reseñas Pendientes

1. **Filtrar por "Pendiente"**
   ```
   Estado: Pendiente
   ```

2. **Revisar cada reseña:**
   - Leer el texto completo
   - Verificar las imágenes (si hay)
   - Confirmar que el contenido es apropiado

3. **Tomar decisión:**
   - ✅ **Aprobar** si la reseña es legítima y apropiada
   - ❌ **Rechazar** si contiene:
     - Lenguaje ofensivo o inapropiado
     - Spam o contenido promocional
     - Información falsa o engañosa
     - Imágenes inapropiadas
   - 🗑️ **Eliminar** solo si es spam obvio o contenido ilegal

### Gestión de Imágenes Inapropiadas

Si una reseña tiene contenido válido pero una imagen inapropiada:

1. Abre el modal de detalle
2. Haz clic en ✗ sobre la imagen problemática
3. Confirma la eliminación
4. La reseña permanece con las imágenes restantes
5. Aprueba la reseña si el resto del contenido es apropiado

### Búsqueda de Reseñas Específicas

**Por producto:**
```
Búsqueda: "Llavero personalizado"
```

**Por autor:**
```
Búsqueda: "Juan Pérez"
```

**Por contenido:**
```
Búsqueda: "excelente calidad"
```

---

## Criterios de Aprobación

### ✅ Aprobar Cuando:
- La reseña es genuina y describe una experiencia real
- El lenguaje es apropiado y respetuoso
- Las imágenes muestran el producto recibido
- La calificación parece justa y justificada
- No hay conflicto de interés evidente

### ❌ Rechazar Cuando:
- Contiene lenguaje ofensivo, vulgar o discriminatorio
- Es spam o publicidad de otros negocios
- Contiene información personal sensible (teléfonos, direcciones)
- Las imágenes son inapropiadas o no relacionadas
- Es claramente falsa o de un competidor
- Viola términos de servicio o políticas de la tienda

### 🗑️ Eliminar Cuando:
- Es spam masivo o automatizado
- Contiene contenido ilegal
- Es una reseña duplicada
- Fue enviada por error y el cliente lo solicita

---

## Notas Administrativas

### Cuándo Usar Notas
- **Siempre** al rechazar una reseña (obligatorio)
- Opcionalmente al aprobar, para documentar decisiones especiales
- Para comunicación interna entre administradores

### Ejemplos de Notas de Rechazo
```
"Lenguaje inapropiado en el texto de la reseña"
"Imagen no relacionada con el producto"
"Contenido promocional de otro negocio"
"Información personal sensible incluida"
"Reseña duplicada - ya existe una del mismo cliente"
```

### Ejemplos de Notas de Aprobación
```
"Aprobada - cliente verificado con orden #12345"
"Revisada por supervisor - contenido apropiado"
"Imagen de baja calidad pero reseña válida"
```

---

## Estadísticas y Métricas

### Calificación Promedio
- Se calcula automáticamente solo con reseñas **aprobadas**
- Se muestra en la página del producto
- Se actualiza en tiempo real al aprobar/rechazar reseñas

### Conteo de Reseñas
- Solo las reseñas aprobadas cuentan para el total público
- Las pendientes y rechazadas no afectan las estadísticas públicas

---

## Preguntas Frecuentes

### ¿Puedo editar el texto de una reseña?
No, actualmente no es posible editar reseñas. Solo puedes aprobar, rechazar o eliminar.

### ¿El cliente recibe notificación al rechazar su reseña?
No, actualmente no hay notificaciones automáticas. Esta función está planificada para futuras versiones.

### ¿Puedo cambiar el estado de una reseña después de aprobarla?
No directamente. Deberías eliminarla y pedirle al cliente que la reenvíe si es necesario.

### ¿Qué pasa si elimino una reseña por error?
La eliminación es permanente y no se puede deshacer. El cliente tendría que enviar una nueva reseña.

### ¿Las reseñas anónimas son permitidas?
Sí, los clientes pueden enviar reseñas sin iniciar sesión. El campo "Autor" es obligatorio pero no requiere cuenta.

### ¿Cuántas imágenes puede tener una reseña?
No hay límite en el número de imágenes, pero cada imagen debe ser menor a 10MB y en formato PNG o JPG.

### ¿Dónde se almacenan las imágenes?
En producción: AWS S3 con CloudFront CDN
En desarrollo: Almacenamiento local en disco

### ¿Puedo responder a las reseñas?
Esta función no está implementada actualmente, pero está planificada para futuras versiones.

---

## Solución de Problemas

### No puedo ver la pestaña de Reseñas
**Causa:** Tu cuenta no tiene los permisos necesarios
**Solución:** Contacta a un administrador Master para que te asigne uno de estos roles:
- Master
- ProductManagement
- OrderManagement

### Las imágenes no se cargan en el modal
**Causa:** Problema de conectividad con S3/CDN
**Solución:** 
1. Verifica tu conexión a internet
2. Intenta recargar la página
3. Si persiste, contacta al equipo técnico

### El filtro de búsqueda no funciona
**Causa:** JavaScript deshabilitado o error de carga
**Solución:**
1. Recarga la página (Ctrl+F5)
2. Verifica que JavaScript esté habilitado
3. Limpia la caché del navegador

### Error al aprobar/rechazar reseña
**Causa:** Sesión expirada o problema de red
**Solución:**
1. Verifica que sigues autenticado
2. Recarga la página e intenta nuevamente
3. Si persiste, cierra sesión y vuelve a iniciar

---

## Mejores Prácticas

### ✅ Hacer
- Revisar reseñas pendientes diariamente
- Documentar decisiones con notas administrativas
- Ser consistente en los criterios de aprobación
- Responder rápidamente (idealmente dentro de 24 horas)
- Mantener un registro de patrones de spam

### ❌ Evitar
- Rechazar reseñas negativas legítimas
- Aprobar reseñas sin revisar las imágenes
- Eliminar reseñas sin motivo documentado
- Ser inconsistente en los criterios
- Ignorar reseñas pendientes por días

---

## Contacto y Soporte

Para problemas técnicos o preguntas sobre el sistema de reseñas:
- **Email:** soporte@filamorfosis.com
- **Documentación técnica:** Ver `REVIEWS_IMPLEMENTATION_SUMMARY.md`

---

**Última actualización:** Mayo 2026
**Versión del sistema:** 1.0
