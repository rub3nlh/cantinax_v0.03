# LaCantinaXL - Comida Cubana a Domicilio v0.021

LaCantinaXL es una plataforma que permite a personas en el extranjero enviar comidas caseras cubanas a sus familiares en Cuba.

## 🚀 Características

- Selección de paquetes de comidas (3, 5 o 7 días)
- Menú variado de comida cubana tradicional
- Sistema de entregas programadas
- Gestión de direcciones de entrega
- Seguimiento de órdenes en tiempo real
- Autenticación de usuarios
- Interfaz responsive y moderna
- Procesamiento de pagos con TropiPay
- API REST para integraciones

## 📋 Requisitos Previos

- Node.js 18.0.0 o superior
- npm 9.0.0 o superior
- Cuenta de Supabase (para la base de datos)

## 🛠️ Instalación

1. Clona el repositorio:
   ```bash
   git clone https://github.com/tu-usuario/lacantinaxl.git
   cd lacantinaxl
   ```

2. Instala las dependencias:
   ```bash
   npm install
   ```

3. Configura las variables de entorno:
   - Crea un archivo `.env` en la raíz del proyecto
   - Añade las siguientes variables:
     ```
     VITE_SUPABASE_URL=tu_url_de_supabase
     VITE_SUPABASE_ANON_KEY=tu_clave_anonima_de_supabase
     PORT=3000
     NODE_ENV=development
     SERVER_URL=http://localhost:3000
     ```

4. Configura la base de datos:
   - Asegúrate de tener una cuenta en Supabase
   - Ejecuta las migraciones ubicadas en `/supabase/migrations`
   - Las migraciones crearán todas las tablas necesarias y configurarán las políticas de seguridad

5. Inicia los servidores de desarrollo:
   ```bash
   npm run dev
   ```
   Este comando iniciará:
   - El servidor de desarrollo de Vite (frontend)
   - El servidor Express (backend)

## 📦 Estructura del Proyecto

```
lacantinaxl/
├── src/
│   ├── components/     # Componentes reutilizables
│   ├── hooks/         # Custom hooks de React
│   ├── lib/           # Utilidades y configuraciones
│   ├── pages/         # Componentes de página
│   ├── data/          # Datos estáticos
│   └── types/         # Definiciones de TypeScript
├── server/
│   └── index.js       # Servidor Express
├── supabase/
│   └── migrations/    # Migraciones de la base de datos
├── public/            # Archivos estáticos
└── ...
```

## 🔧 Tecnologías Utilizadas

### Frontend
- React 18
- TypeScript
- Vite
- Tailwind CSS
- Framer Motion
- Lucide React
- React Router DOM

### Backend
- Node.js
- Express
- Cors
- Dotenv

### Base de Datos y Autenticación
- Supabase
  - Autenticación de usuarios
  - Base de datos PostgreSQL
  - Row Level Security (RLS)
  - Políticas de seguridad

### Desarrollo
- Concurrently (para ejecutar múltiples servidores)
- ESLint
- TypeScript
- Vite

## 🚀 Despliegue

Para construir la aplicación para producción:

```bash
npm run build
```

Los archivos de distribución se generarán en el directorio `dist/`.

## 📝 API Endpoints

### Servidor Express

- `GET /health`: Endpoint de verificación de salud del servidor
- `POST /api/payments/create-payment-link`: Crea un enlace de pago con TropiPay
- `POST /api/payments/webhook`: Webhook para recibir notificaciones de pagos de TropiPay

## 🔐 Seguridad

- Autenticación de usuarios mediante Supabase
- Row Level Security (RLS) en todas las tablas
- Políticas de seguridad granulares
- CORS configurado para el servidor Express
- Variables de entorno para datos sensibles

## 📄 Licencia

Este proyecto está bajo la Licencia MIT - mira el archivo [LICENSE.md](LICENSE.md) para detalles

## 🤝 Contribuir

1. Haz un Fork del proyecto
2. Crea tu rama de características (`git checkout -b feature/AmazingFeature`)
3. Haz commit de tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Haz Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📞 Soporte

Si tienes alguna pregunta o problema:

- Abre un issue en GitHub
- Envía un correo a support@lacantinaxl.com
- Visita nuestra [página de soporte](https://lacantinaxl.com/support)

## 🔄 Scripts Disponibles

- `npm run dev`: Inicia los servidores de desarrollo (frontend y backend)
- `npm run build`: Construye la aplicación para producción
- `npm run preview`: Vista previa de la build de producción
- `npm run lint`: Ejecuta el linter
- `npm run server`: Inicia solo el servidor Express
- `node server/tests/test_payment_webhook.js`: Ejecuta el test de webhook de pago exitoso
- `node server/tests/test_payment_webhook_failure.js`: Ejecuta el test de webhook de pago fallido
- `node server/tests/run_webhook_tests.js`: Ejecuta ambos tests de webhook secuencialmente

## 💳 Procesamiento de Pagos

### Flujo de Pago con TropiPay

1. El cliente selecciona sus comidas y procede al pago
2. El frontend solicita un enlace de pago a través de `POST /api/payments/create-payment-link`
3. El backend genera un enlace de pago usando la API de TropiPay
4. El cliente es redirigido al enlace de pago para completar la transacción
5. TropiPay notifica el resultado del pago a través del webhook configurado
6. El webhook (`POST /api/payments/webhook`):
   - Verifica la firma del pago para garantizar su autenticidad
   - Busca la orden en la base de datos usando la referencia
   - Actualiza el estado de la orden según el resultado del pago
   - Si el pago es exitoso, envía un email de confirmación al cliente
   - Devuelve una respuesta con el estado actualizado de la orden

### Pruebas de Webhook

Para probar el procesamiento de pagos, se han creado scripts de prueba:

- `test_payment_webhook.js`: Simula una notificación de pago exitoso
- `test_payment_webhook_failure.js`: Simula una notificación de pago fallido
- `run_webhook_tests.js`: Ejecuta ambos tests secuencialmente

Estos scripts envían payloads simulados al endpoint del webhook y verifican que la respuesta sea correcta.


## Test Cards
# PNP
Operative	            Card
3DS payment OK	         4761739000091011
3DS payment KO	         5150796024238164
Non-3DS payment OK	   5590337536718399
Non-3DS payment + SCA	5223798193659108
Non-3DS payment KO	   5485009949201879
MoTo payment OK	      5150796024238164
MoTo payment KO	      5485009949201879

# Trust
