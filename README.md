# Scheduler

Una aplicación web moderna y responsiva construida con **Next.js** para la gestión de citas y agendamiento, utilizando **Google Calendar** como base de datos única.

## Características Principales

* **Autenticación con Google (OAuth 2.0)**: Asegura que solo el personal autorizado pueda acceder a la aplicación y modificar el calendario.
* **Integración bidireccional con Google Calendar**: La aplicación no solo lee eventos de Google, sino que permite crear, editar y eliminar citas directamente desde la interfaz. Toda la información del cliente y de la cita se guarda de manera segura dentro de la metadata del evento en Google Calendar.
* **Calendario Interactivo**: Construido con `react-big-calendar`, cuenta con vista de Mes, Semana, Día y Agenda.
* **Arrastrar y Soltar (Drag & Drop)**: Permite reprogramar rápidamente citas arrastrándolas entre días/horas, sincronizándose en tiempo real con Google.
* **Diseño Premium**: Interfaz moderna (Glassmorphism), fuentes personalizadas y optimización para usarse tanto en navegador web como en teléfonos móviles (Android/iOS).

## Requisitos Previos

Antes de ejecutar la aplicación, necesitas configurar un proyecto en Google Cloud y obtener credenciales de OAuth 2.0.

1. Ve a [Google Cloud Console](https://console.cloud.google.com/).
2. Crea un proyecto nuevo o selecciona uno existente.
3. En **APIs y Servicios > Biblioteca**, busca y habilita la **Google Calendar API**.
4. Configura la **Pantalla de consentimiento de OAuth** (Agrega el correo de tu equipo a los usuarios de prueba si la app está en modo Testing).
5. En **Credenciales**, crea un nuevo **ID de cliente de OAuth** (Tipo: Aplicación Web).
   * En "URI de redireccionamiento autorizados", agrega: `http://localhost:3000/api/auth/callback/google` (para entorno de desarrollo).

## Variables de Entorno

Crea un archivo `.env.local` en la raíz del proyecto basándote en `.env.example` (o usando la siguiente plantilla):

```env
NEXTAUTH_URL=http://localhost:3000
NEXTAUTH_SECRET=genera_un_secreto_aleatorio_seguro

GOOGLE_CLIENT_ID=tu_client_id_de_google
GOOGLE_CLIENT_SECRET=tu_client_secret_de_google
```

*(Nota: Puedes generar un `NEXTAUTH_SECRET` seguro ejecutando `openssl rand -base64 32` en tu terminal).*

## Instalación y Ejecución

Instala las dependencias del proyecto:

```bash
npm install
```

Inicia el servidor de desarrollo:

```bash
npm run dev
```

Abre [http://localhost:3000](http://localhost:3000) en tu navegador para ver la aplicación.

## Estructura del Proyecto

* `/src/app/page.js`: Página principal que renderiza el calendario.
* `/src/components/Scheduler.js`: Componente principal del calendario (maneja la interfaz, Drag&Drop y el formulario modal).
* `/src/app/api/auth/[...nextauth]/route.js`: Configuración de NextAuth para el inicio de sesión con Google.
* `/src/app/api/calendar/...`: Rutas de la API (Backend) para comunicarse con Google Calendar usando los tokens de acceso del usuario.
* `/src/lib/calendar.js`: Utilidades y métodos de servidor para simplificar las llamadas a la Google Calendar API (CRUD de eventos).

## Tecnologías Utilizadas

* Next.js (App Router)
* NextAuth.js
* Google APIs (`googleapis`)
* React Big Calendar (`react-big-calendar`)
* Date-fns (Localización y parseo de fechas)
* Lucide React (Íconos)
