# Modo de Mantenimiento - LaCantinaXL

## Descripción

Esta funcionalidad permite activar un modo de mantenimiento para el sitio web de LaCantinaXL. Cuando está activado, todos los usuarios verán una página de mantenimiento en lugar de la aplicación normal.

## Cómo usar

### Activar el modo de mantenimiento

1. Edita el archivo `.env` en la raíz del proyecto
2. Cambia la variable `VITE_MAINTENANCE_MODE` a `true`:
   ```
   VITE_MAINTENANCE_MODE=true
   ```
3. Reinicia el servidor de desarrollo o la aplicación en producción

### Desactivar el modo de mantenimiento

1. Edita el archivo `.env` en la raíz del proyecto
2. Cambia la variable `VITE_MAINTENANCE_MODE` a `false`:
   ```
   VITE_MAINTENANCE_MODE=false
   ```
3. Reinicia el servidor de desarrollo o la aplicación en producción

## Archivos modificados

### Archivos principales:
- `.env.example` - Agregada la variable `VITE_MAINTENANCE_MODE=false`
- `src/main.tsx` - Lógica para verificar el modo de mantenimiento
- `public/maintenance.html` - Página estática de mantenimiento

### Archivos adicionales (opcionales):
- `src/pages/MaintenancePage.tsx` - Componente React de mantenimiento (no se usa actualmente)
- `src/App.tsx` - Preparado para modo de mantenimiento (no se usa actualmente)

## Funcionamiento técnico

1. **Verificación**: Al cargar la aplicación, `src/main.tsx` verifica la variable de entorno `VITE_MAINTENANCE_MODE`
2. **Redirección**: Si está en `true`, redirige automáticamente a `/maintenance.html`
3. **Página estática**: `public/maintenance.html` es un archivo HTML completamente independiente que no depende de React ni de ninguna configuración externa
4. **Aplicación normal**: Si está en `false`, carga la aplicación React normalmente

## Contenido de la página de mantenimiento

La página de mantenimiento incluye:
- Logo de LaCantinaXL
- Icono de mantenimiento (🔧)
- Mensaje principal: "Estamos en mantenimiento"
- Texto explicativo: "Estamos trabajando para mejorar el sitio. En breve estaremos de vuelta."
- Información de contacto: soporte@lacantinaxl.com
- Diseño responsive para móvil y desktop
- Colores consistentes con la marca (#FDF6F0 de fondo, #ef4444 para elementos rojos)

## Ventajas de esta implementación

1. **Simplicidad**: Solo requiere cambiar una variable de entorno
2. **Rapidez**: No necesita redeploy, solo reiniciar el servidor
3. **Independencia**: La página de mantenimiento no depende de configuraciones externas
4. **Profesional**: Mantiene la identidad visual de la marca
5. **Seguridad**: Bloquea completamente el acceso a la aplicación principal

## Uso en producción

Para usar en producción (Heroku, Vercel, etc.):

1. Configura la variable de entorno `VITE_MAINTENANCE_MODE=true` en tu plataforma de hosting
2. Reinicia la aplicación
3. Para desactivar, cambia a `VITE_MAINTENANCE_MODE=false` y reinicia

## Notas importantes

- La página de mantenimiento es completamente estática y no requiere JavaScript
- El email de contacto está configurado como `soporte@lacantinaxl.com`
- La página es responsive y funciona en todos los dispositivos
- No hay dependencias externas que puedan fallar
