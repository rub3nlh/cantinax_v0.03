# Guía de Despliegue en Heroku para LaCantinaXL

## Configuración de Variables de Entorno

Para que la aplicación funcione correctamente en Heroku, debes configurar las siguientes variables de entorno. Puedes hacerlo desde el Dashboard de Heroku o usando la CLI de Heroku.

### Variables de Entorno Requeridas

```
# Supabase
VITE_SUPABASE_URL=https://tu-proyecto-supabase.supabase.co
VITE_SUPABASE_ANON_KEY=tu-clave-anon-supabase

# Variables para TropiPay (si aplica)
TROPIPAY_API_KEY=tu-api-key-de-tropipay
TROPIPAY_SECRET=tu-secret-de-tropipay

# Tracking (opcional)
VITE_GA_MEASUREMENT_ID=tu-id-de-google-analytics
VITE_AMPLITUDE_API_KEY=tu-api-key-de-amplitude

# Otras variables de entorno (agrega según sea necesario)
NODE_ENV=production
```

### Configuración mediante CLI de Heroku

```bash
# Ejemplo de cómo configurar las variables desde la línea de comandos
heroku config:set VITE_SUPABASE_URL=https://tu-proyecto-supabase.supabase.co --app tu-app-heroku
heroku config:set VITE_SUPABASE_ANON_KEY=tu-clave-anon-supabase --app tu-app-heroku
heroku config:set NODE_ENV=production --app tu-app-heroku
```

### Configuración desde el Dashboard de Heroku

1. Ve a https://dashboard.heroku.com/apps/tu-app-heroku/settings
2. Haz clic en "Reveal Config Vars"
3. Agrega cada variable y su valor

## Notas Importantes

1. Asegúrate de que todas las claves y URLs sean correctas para el entorno de producción.
2. Si experimentas problemas con los scripts de analytics, considera deshabilitarlos temporalmente estableciendo `VITE_AMPLITUDE_API_KEY` y `VITE_GA_MEASUREMENT_ID` como valores vacíos.
3. Para depurar problemas, puedes revisar los logs utilizando:
   ```
   heroku logs --tail --app tu-app-heroku
   ```

## Rebuilding y Redeployment

Si necesitas forzar una nueva compilación después de cambiar variables de entorno:

```bash
git commit --allow-empty -m "Trigger Heroku rebuild"
git push heroku main
```

## Problemas Comunes

1. **Error con Analytics**: Si ves errores relacionados con el tracking o analytics, es seguro ignorarlos o deshabilitar esas funciones.
2. **Problemas de Rutas**: Asegúrate de que todas las rutas API en el frontend apunten a la ruta correcta en producción.