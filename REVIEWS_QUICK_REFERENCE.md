# Reseñas - Referencia Rápida

## 🎯 Acceso Rápido
**URL:** `https://filamorfosis.com/admin.html` → Pestaña "Reseñas" ⭐

**Roles requeridos:** Master, ProductManagement, OrderManagement

---

## 📊 Estados de Reseñas

| Estado | Badge | Significado | Visible en Tienda |
|--------|-------|-------------|-------------------|
| **Pendiente** | 🟡 Amarillo | Esperando revisión | ❌ No |
| **Aprobada** | 🟢 Verde | Aprobada por admin | ✅ Sí |
| **Rechazada** | 🔴 Rojo | Rechazada por admin | ❌ No |

---

## ⚡ Acciones Rápidas

### Desde la Tabla
| Botón | Acción | Requiere Confirmación |
|-------|--------|----------------------|
| 👁️ | Ver detalle completo | No |
| ✓ | Aprobar (solo pendientes) | No |
| ✗ | Rechazar (solo pendientes) | Sí (requiere motivo) |
| 🗑️ | Eliminar permanentemente | Sí |

### Desde el Modal
- **Aprobar:** Nota opcional
- **Rechazar:** Nota obligatoria
- **Eliminar imagen:** Botón ✗ en cada imagen

---

## 🔍 Filtros

### Por Estado
```
Dropdown: Todos | Pendiente | Aprobada | Rechazada
```

### Por Búsqueda
```
Campo de texto: Busca en autor, texto, producto
Actualización: Automática (350ms)
```

---

## ✅ Criterios de Aprobación

### Aprobar Si:
- ✅ Reseña genuina y apropiada
- ✅ Lenguaje respetuoso
- ✅ Imágenes relacionadas al producto
- ✅ Calificación justificada

### Rechazar Si:
- ❌ Lenguaje ofensivo
- ❌ Spam o publicidad
- ❌ Información personal sensible
- ❌ Imágenes inapropiadas
- ❌ Contenido falso

### Eliminar Si:
- 🗑️ Spam masivo
- 🗑️ Contenido ilegal
- 🗑️ Duplicado
- 🗑️ Solicitud del cliente

---

## 📝 Ejemplos de Notas

### Rechazo (obligatorio)
```
"Lenguaje inapropiado"
"Imagen no relacionada con el producto"
"Contenido promocional"
"Información personal incluida"
"Reseña duplicada"
```

### Aprobación (opcional)
```
"Cliente verificado - orden #12345"
"Revisada por supervisor"
"Imagen de baja calidad pero reseña válida"
```

---

## 🚨 Límites y Restricciones

| Elemento | Límite |
|----------|--------|
| Tamaño de imagen | 10 MB máx |
| Formatos de imagen | PNG, JPG |
| Número de imágenes | Sin límite |
| Longitud de nota admin | Sin límite |
| Calificación | 1-5 estrellas |

---

## 🔄 Flujo de Trabajo Diario

1. **Filtrar:** Estado → Pendiente
2. **Revisar:** Leer texto + ver imágenes
3. **Decidir:** Aprobar / Rechazar / Eliminar
4. **Documentar:** Agregar nota (si rechazas)
5. **Repetir:** Hasta procesar todas las pendientes

**Meta:** Responder en < 24 horas

---

## 🆘 Solución Rápida de Problemas

| Problema | Solución |
|----------|----------|
| No veo la pestaña | Verifica tus roles con admin Master |
| Imágenes no cargan | Recarga página (Ctrl+F5) |
| Error al aprobar | Verifica sesión, recarga página |
| Búsqueda no funciona | Limpia caché, recarga |

---

## 📞 Contacto
**Soporte:** soporte@filamorfosis.com

---

## 🎓 Recursos Adicionales
- **Guía completa:** `REVIEWS_ADMIN_GUIDE.md`
- **Documentación técnica:** `REVIEWS_IMPLEMENTATION_SUMMARY.md`
