# 🥐 Maison VIII — Sistema de Ventas + CRM Boutique

Maison VIII es una plataforma web moderna, editorial y sofisticada diseñada para una repostería fina de alta gama. Este sistema integra una experiencia de cliente fluida y móvil (Mobile-First) con un robusto panel administrativo/CRM en tiempo real.

---

## ✨ Características Principales

### 1. Panel de Clientes (Boutique Virtual)
- **Home / Landing Page**: Diseño editorial premium inspirado en Apple y Cartier.
- **Menú Interactivo**: Filtros por categoría, barra de búsqueda en tiempo real, cajón de compras lateral (Zustand) y modal de personalización de variantes con recalculación instantánea de precios.
- **Checkout en Pasos**:
  - Datos de contacto y validación de teléfono.
  - Dirección con cotizador logístico automático por kilómetro.
  - Calendario para agendar entrega con validación de días hábiles y fechas saturadas.
  - Métodos de pago (Efectivo, Transferencia o Link de Pago).
- **Recibo Digital**: Visualización e impresión física de comandas térmicas.

### 2. Panel Admin / CRM
- **Dashboard Analítico**: Estadísticas de ventas del día, ingresos, pedidos pendientes y entregados. Gráficos semanales de rendimiento y mapeo de saturación horaria.
- **Gestión Avanzada de Pedidos**: Tabla avanzada de control de comandas, actualización de estados de cocina, reenvío de WhatsApp a clientes e impresión comanda física.
- **CRUD de Catálogo**: Creación y edición de productos, modificador de stock/disponibilidad y constructor avanzado de variantes con sobreprecio de origen.
- **Tarjetero CRM de Clientes**: Historial completo de pedidos por cliente, total gastado y gestor de etiquetas VIP.
- **Configurador General**: Tarifas de envío editables por kilómetros, bloqueo de días festivos de cocina y plantillas de WhatsApp personalizadas.

---

## 🛠️ Stack Tecnológico

- **Frontend**: Next.js 16 (App Router) con TypeScript
- **Estilos**: Tailwind CSS v4 con variables corporativas y Framer Motion para micro-animaciones.
- **Estado**: Zustand con persistencia en LocalStorage.
- **Validaciones**: React Hook Form + Zod.
- **Base de Datos**: PostgreSQL en Supabase.
- **Mensajería**: Twilio WhatsApp API.
- **Geolocalización**: Google Maps / Places Autocomplete / Distance Matrix.

---

## 🚀 Cómo Iniciar Localmente

### 1. Clonar e Instalar Dependencias
```bash
npm install
```

### 2. Correr en Desarrollo
```bash
npm run dev
```
Abra [http://localhost:3000](http://localhost:3000) para la Boutique virtual o [http://localhost:3000/admin](http://localhost:3000/admin) para el CRM de administración.

### 3. Compilar para Producción
```bash
npm run build
```

---

## ☁️ Instrucciones de Despliegue

### A. Base de Datos (Supabase)
1. Cree un proyecto nuevo en [Supabase](https://supabase.com).
2. Abra el **SQL Editor** y ejecute el código de `supabase/schema.sql` para crear las tablas y sembrar los productos de prueba.

### B. Servidor (Vercel)
Despliegue su proyecto de Next.js en Vercel y configure las siguientes variables de entorno:
```env
NEXT_PUBLIC_SUPABASE_URL=https://your-supabase-project.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-supabase-anon-key
NEXT_PUBLIC_GOOGLE_MAPS_API_KEY=AIzaSyYourGoogleMapsApiKeyHere
TWILIO_ACCOUNT_SID=ACyourtwiliosidhere
TWILIO_AUTH_TOKEN=yourtwiliotokenhere
TWILIO_WHATSAPP_NUMBER=whatsapp:+14155238886
ADMIN_WHATSAPP_NUMBER=+525512345678
```

---

## 💎 Backend Híbrido Resiliente

Para garantizar el correcto funcionamiento desde el primer segundo, el sistema cuenta con un **conmutador híbrido de base de datos** (`src/lib/supabase.ts`).
- Si las variables de entorno de Supabase **no** están definidas en su archivo local, el sistema iniciará en **Modo Sandbox / LocalStorage**. Todas las compras, creación de productos, notas de clientes y configuraciones de envío se guardarán de forma segura en su navegador, permitiendo probar y demostrar el sistema completo al 100% de forma independiente.
- Al ingresar variables válidas de Supabase, la plataforma comenzará a sincronizar datos en tiempo real con su base de datos PostgreSQL en la nube de forma transparente.
