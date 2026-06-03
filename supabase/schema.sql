-- Schema for Maison VIII (Maison Ocho) Fine Pastry Sales System & CRM

-- Enable UUID extension
create extension if not exists "uuid-ossp";

-- 1. CATEGORIES
create table if not exists categories (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  slug text unique not null,
  description text,
  image_url text,
  display_order integer default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 2. PRODUCTS
create table if not exists products (
  id uuid primary key default uuid_generate_v4(),
  category_id uuid references categories(id) on delete cascade,
  name text not null,
  slug text unique not null,
  description text,
  price numeric not null,
  image_url text,
  variants jsonb default '[]'::jsonb, -- e.g., [{"name": "Tamaño", "options": [{"name": "Personal", "price_adjust": 0}, {"name": "Familiar (8-10 p)", "price_adjust": 250}]}]
  is_available boolean default true,
  is_featured boolean default false,
  prep_time_minutes integer default 120,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. CUSTOMERS
create table if not exists customers (
  id uuid primary key default uuid_generate_v4(),
  name text not null,
  phone text unique not null,
  address_default text,
  total_spent numeric default 0,
  orders_count integer default 0,
  notes text,
  tags text[] default '{}'::text[],
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 4. ORDERS
create table if not exists orders (
  id uuid primary key default uuid_generate_v4(),
  order_number text unique not null, -- format: MO-XXXX
  customer_id uuid references customers(id) on delete set null,
  client_name text not null,
  client_phone text not null,
  delivery_address text not null,
  delivery_lat numeric,
  delivery_lng numeric,
  distance_km numeric,
  delivery_fee numeric default 0,
  subtotal numeric not null,
  total numeric not null,
  status text default 'pendiente'::text not null check (status in ('pendiente', 'confirmado', 'preparacion', 'camino', 'entregado', 'cancelado')),
  delivery_date date not null,
  delivery_time_slot text not null,
  payment_method text not null check (payment_method in ('efectivo', 'transferencia', 'link_pago')),
  payment_status text default 'pendiente'::text not null check (payment_status in ('pendiente', 'pagado')),
  notes text,
  twilio_sent boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 5. ORDER ITEMS
create table if not exists order_items (
  id uuid primary key default uuid_generate_v4(),
  order_id uuid references orders(id) on delete cascade not null,
  product_id uuid references products(id) on delete set null,
  product_name text not null,
  quantity integer not null check (quantity > 0),
  price numeric not null,
  variant_choices jsonb default '{}'::jsonb, -- chosen variant selections, e.g. {"Tamaño": "Familiar"}
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. DELIVERY ZONES
create table if not exists delivery_zones (
  id uuid primary key default uuid_generate_v4(),
  min_km numeric not null,
  max_km numeric not null,
  price numeric not null,
  is_blocked boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 7. BLOCKED DATES
create table if not exists blocked_dates (
  id uuid primary key default uuid_generate_v4(),
  date date unique not null,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 8. BLOCKED HOURS
create table if not exists blocked_hours (
  id uuid primary key default uuid_generate_v4(),
  day_of_week integer not null check (day_of_week between 0 and 6), -- 0 = Sunday, 1 = Monday, etc.
  start_time time, -- null means block the entire day
  end_time time,
  max_orders_per_hour integer default 5,
  reason text,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 9. SETTINGS
create table if not exists settings (
  id uuid primary key default uuid_generate_v4(),
  key text unique not null,
  value jsonb not null,
  updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 10. NOTIFICATIONS
create table if not exists notifications (
  id uuid primary key default uuid_generate_v4(),
  type text not null,
  message text not null,
  read boolean default false,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);


-- SEED DATA
-- Categories
insert into categories (name, slug, description, display_order) values
('Pasteles Imperiales', 'pasteles-imperiales', 'Creaciones majestuosas elaboradas con técnicas tradicionales francesas y un toque de modernidad.', 1),
('Tartas de Autor', 'tartas-de-autor', 'Bases de pasta sablée crujiente con rellenos aterciopelados y frutas frescas seleccionadas.', 2),
('Macarons de la Boutique', 'macarons-de-la-boutique', 'Delicados merengues de almendra con ganaches infusionados, una joya parisina.', 3),
('Bebidas Finas', 'bebidas-finas', 'Cafés de especialidad e infusiones florales diseñadas para maridar con nuestra repostería.', 4)
on conflict (slug) do nothing;

-- Products
insert into products (category_id, name, slug, description, price, is_featured, prep_time_minutes, variants) values
(
  (select id from categories where slug = 'pasteles-imperiales'),
  'Pastel Ópera Maison VIII',
  'pastel-opera-maison',
  'Capas de bizcocho joconde de almendra embebido en almíbar de café espresso de especialidad, ganache de chocolate de origen 70% y crema de mantequilla al café.',
  780.00,
  true,
  120,
  '[
    {"name": "Tamaño", "options": [{"name": "Mediano (6-8 personas)", "price_adjust": 0}, {"name": "Grande (12-15 personas)", "price_adjust": 380}]}
  ]'::jsonb
),
(
  (select id from categories where slug = 'pasteles-imperiales'),
  'Saint Honoré Vainilla y Caramelo',
  'saint-honore-vainilla-caramelo',
  'Base de hojaldre crujiente invertido, coronado con profiteroles glaseados en caramelo crujiente y rellenos de crema chiboust, terminado con crema chantilly de vainilla de Papantla.',
  840.00,
  true,
  180,
  '[]'::jsonb
),
(
  (select id from categories where slug = 'tartas-de-autor'),
  'Tarta de Higo Orgánico y Lavanda',
  'tarta-higo-lavanda',
  'Pasta sablée de almendra con crema frangipane, compota artesanal de higos negros y lavanda francesa, coronada con higos frescos y un toque de miel pura.',
  620.00,
  true,
  120,
  '[]'::jsonb
),
(
  (select id from categories where slug = 'tartas-de-autor'),
  'Tarta de Limón y Merengue Quemado',
  'tarta-limon-merengue',
  'Crema suave e intensa de limón amarillo infusionado, sobre costra crujiente de mantequilla, terminada con picos dorados de merengue suizo sopleteado.',
  580.00,
  false,
  90,
  '[
    {"name": "Estilo", "options": [{"name": "Clásico", "price_adjust": 0}, {"name": "Con Frutos Rojos", "price_adjust": 80}]}
  ]'::jsonb
),
(
  (select id from categories where slug = 'macarons-de-la-boutique'),
  'Colección Especial Macarons (12 pzs)',
  'coleccion-macarons-12',
  'Caja de lujo con 12 macarons surtidos: Vainilla Bourbon, Pistache Siciliano, Pétalo de Rosa, Chocolate-Naranja, Frambuesa y Caramelo Salado.',
  420.00,
  true,
  60,
  '[]'::jsonb
),
(
  (select id from categories where slug = 'bebidas-finas'),
  'Rose & Cardamom Latte',
  'rose-cardamom-latte',
  'Espresso doble de grano de especialidad, leche texturizada de almendras, infusión artesanal de pétalos de rosa y cardamomo orgánico molido.',
  95.00,
  false,
  15,
  '[
    {"name": "Temperatura", "options": [{"name": "Caliente", "price_adjust": 0}, {"name": "Helado (Iced)", "price_adjust": 10}]}
  ]'::jsonb
)
on conflict (slug) do nothing;

-- Delivery Zones Setup
insert into delivery_zones (min_km, max_km, price, is_blocked) values
(0, 2, 30.00, false),
(2, 3, 40.00, false),
(3, 5, 60.00, false),
(5, 6, 80.00, false),
(6, 8, 100.00, false),
(8, 99, 150.00, false)
on conflict do nothing;

-- Default Settings Setup
insert into settings (key, value) values
('whatsapp_number_admin', '"+525512345678"'::jsonb),
('google_maps_origin_link', '"https://maps.app.goo.gl/dYh3H51t915W7yEw8"'::jsonb),
('delivery_kitchen_coords', '{"lat": 19.432608, "lng": -99.133209}'::jsonb),
('whatsapp_template_client', '"¡Hola {nombre}! Tu pedido #{folio} ha sido confirmado para entrega el {fecha} en el horario de {hora}. ✨\n\n*Contenido del pedido:*\n{productos}\n\n*Dirección de entrega:* {direccion}\n*Instrucciones de entrega:* {instrucciones}\n\n*Desglose:*\n- Subtotal: ${subtotal}\n- Envío: ${envio}\n- Total: ${total}\n\n¡Muchas gracias por elegir la distinción de Maison VIII! 🥐"'::jsonb),
('whatsapp_template_admin', '"🚨 *Nuevo pedido Maison VIII* 🚨\n\n*Folio:* {folio}\n*Cliente:* {nombre}\n*Teléfono:* {telefono}\n*Fecha de Entrega:* {fecha}\n*Hora de Entrega:* {hora}\n*Lugar de Entrega:* {direccion}\n*Instrucciones:* {instrucciones}\n*Comentarios:* {comentarios}\n\n*Artículos:* \n{productos}\n\n*Desglose:*\n- Subtotal: ${subtotal}\n- Envío: ${envio}\n- Total: ${total}\n*Forma de Pago:* {forma_pago}\n\n👉 *Confirmar pedido (Click para abrir WhatsApp):*\n{waLink}"'::jsonb)
on conflict (key) do update set value = excluded.value;
