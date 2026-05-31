// Mock Database Service for Maison VIII
// Allows the system to run beautifully out-of-the-box without requiring active Supabase config.
// Syncs to localStorage in the browser so that state persists on refresh.

import { Category, Product, Customer, Order, OrderItem, DeliveryZone, BlockedDate, BlockedHour, Notification } from '../types';
import { generateUUID } from './uuid';

const defaultCategories: Category[] = [
  {
    id: 'c1',
    name: 'Pasteles Imperiales',
    slug: 'pasteles-imperiales',
    description: 'Creaciones majestuosas elaboradas con técnicas tradicionales francesas y un toque de modernidad.',
    display_order: 1
  },
  {
    id: 'c2',
    name: 'Tartas de Autor',
    slug: 'tartas-de-autor',
    description: 'Bases de pasta sablée crujiente con rellenos aterciopelados y frutas frescas seleccionadas.',
    display_order: 2
  },
  {
    id: 'c3',
    name: 'Macarons de la Boutique',
    slug: 'macarons-de-la-boutique',
    description: 'Delicados merengues de almendra con ganaches infusionados, una joya parisina.',
    display_order: 3
  },
  {
    id: 'c4',
    name: 'Bebidas Finas',
    slug: 'bebidas-finas',
    description: 'Cafés de especialidad e infusiones florales diseñadas para maridar con nuestra repostería.',
    display_order: 4
  }
];

const defaultProducts: Product[] = [
  {
    id: 'p1',
    category_id: 'c1',
    name: 'Pastel Ópera Maison VIII',
    slug: 'pastel-opera-maison',
    description: 'Capas de bizcocho joconde de almendra embebido en almíbar de café espresso de especialidad, ganache de chocolate de origen 70% y crema de mantequilla al café.',
    price: 780.00,
    image_url: '/logos/logo_fodo_verde_500x500.png', // Fallback to our logo or stylish placeholder
    variants: [
      {
        name: 'Tamaño',
        options: [
          { name: 'Mediano (6-8 personas)', price_adjust: 0 },
          { name: 'Grande (12-15 personas)', price_adjust: 380 }
        ]
      }
    ],
    is_available: true,
    is_featured: true,
    prep_time_minutes: 120
  },
  {
    id: 'p2',
    category_id: 'c1',
    name: 'Saint Honoré Vainilla y Caramelo',
    slug: 'saint-honore-vainilla-caramelo',
    description: 'Base de hojaldre crujiente invertido, coronado con profiteroles glaseados en caramelo crujiente y rellenos de crema chiboust, terminado con crema chantilly de vainilla de Papantla.',
    price: 840.00,
    image_url: '/logos/logo_fodo_verde_500x500.png',
    variants: [],
    is_available: true,
    is_featured: true,
    prep_time_minutes: 180
  },
  {
    id: 'p3',
    category_id: 'c2',
    name: 'Tarta de Higo Orgánico y Lavanda',
    slug: 'tarta-higo-lavanda',
    description: 'Pasta sablée de almendra con crema frangipane, compota artesanal de higos negros y lavanda francesa, coronada con higos frescos y un toque de miel pura.',
    price: 620.00,
    image_url: '/logos/logo_fodo_verde_500x500.png',
    variants: [],
    is_available: true,
    is_featured: true,
    prep_time_minutes: 120
  },
  {
    id: 'p4',
    category_id: 'c2',
    name: 'Tarta de Limón y Merengue Quemado',
    slug: 'tarta-limon-merengue',
    description: 'Crema suave e intensa de limón amarillo infusionado, sobre costra crujiente de mantequilla, terminada con picos dorados de merengue suizo sopleteado.',
    price: 580.00,
    image_url: '/logos/logo_fodo_verde_500x500.png',
    variants: [
      {
        name: 'Estilo',
        options: [
          { name: 'Clásico', price_adjust: 0 },
          { name: 'Con Frutos Rojos', price_adjust: 80 }
        ]
      }
    ],
    is_available: true,
    is_featured: false,
    prep_time_minutes: 90
  },
  {
    id: 'p5',
    category_id: 'c3',
    name: 'Colección Especial Macarons (12 pzs)',
    slug: 'coleccion-macarons-12',
    description: 'Caja de lujo con 12 macarons surtidos: Vainilla Bourbon, Pistache Siciliano, Pétalo de Rosa, Chocolate-Naranja, Frambuesa y Caramelo Salado.',
    price: 420.00,
    image_url: '/logos/logo_fodo_verde_500x500.png',
    variants: [],
    is_available: true,
    is_featured: true,
    prep_time_minutes: 60
  },
  {
    id: 'p6',
    category_id: 'c4',
    name: 'Rose & Cardamom Latte',
    slug: 'rose-cardamom-latte',
    description: 'Espresso doble de grano de especialidad, leche texturizada de almendras, infusión artesanal de pétalos de rosa y cardamomo orgánico molido.',
    price: 95.00,
    image_url: '/logos/logo_fodo_verde_500x500.png',
    variants: [
      {
        name: 'Temperatura',
        options: [
          { name: 'Caliente', price_adjust: 0 },
          { name: 'Helado (Iced)', price_adjust: 10 }
        ]
      }
    ],
    is_available: true,
    is_featured: false,
    prep_time_minutes: 15
  }
];

const defaultDeliveryZones: DeliveryZone[] = [
  { id: 'z1', min_km: 0, max_km: 2, price: 30, is_blocked: false },
  { id: 'z2', min_km: 2, max_km: 3, price: 40, is_blocked: false },
  { id: 'z3', min_km: 3, max_km: 5, price: 60, is_blocked: false },
  { id: 'z4', min_km: 5, max_km: 6, price: 80, is_blocked: false },
  { id: 'z5', min_km: 6, max_km: 8, price: 100, is_blocked: false },
  { id: 'z6', min_km: 8, max_km: 99, price: 150, is_blocked: false }
];

const defaultBlockedDates: BlockedDate[] = [
  { id: 'bd1', date: '2026-12-24', reason: 'Nochebuena - Cocina cerrada' },
  { id: 'bd2', date: '2026-12-31', reason: 'Fin de año - Cocina cerrada' }
];

const defaultBlockedHours: BlockedHour[] = [
  { id: 'bh1', day_of_week: 0, max_orders_per_hour: 0, reason: 'Domingos cerrado' } // Sunday blocked
];

const defaultSettings = {
  whatsapp_number_admin: '+525512345678',
  google_maps_origin_link: 'https://maps.app.goo.gl/dYh3H51t915W7yEw8',
  delivery_kitchen_coords: { lat: 19.432608, lng: -99.133209 },
  whatsapp_template_client: 'Hola {nombre},\nTu pedido en *Maison VIII* ha sido confirmado. ✨\n\n*Pedido:* {productos}\n*Total:* ${total}\n*Entrega:* {fecha} en el horario de {hora}\n\n¡Gracias por elegir la distinción de Maison VIII! 🥐',
  whatsapp_template_admin: '🚨 *Nuevo pedido Maison VIII*\n\n*Cliente:* {nombre}\n*Teléfono:* {telefono}\n*Dirección:* {direccion}\n*Pedido:* {productos}\n*Total:* ${total}\n*Entrega:* {fecha} {hora}',
  show_prep_time: true,
  rest_days: [0], // 0 = Sunday (default rest day)
  time_slots: [
    '09:00 - 11:00',
    '11:00 - 13:00',
    '13:00 - 15:00',
    '15:00 - 17:00',
    '17:00 - 19:00'
  ]
};

const defaultCustomers: Customer[] = [
  {
    id: 'c_cust1',
    name: 'Alejandra Guzmán',
    phone: '+525544332211',
    address_default: 'Av. Paseo de la Reforma 222, Juárez, CDMX',
    total_spent: 1560.00,
    orders_count: 2,
    notes: 'Prefiere entregas por la mañana. Le encantan los macarons.',
    tags: ['VIP', 'Frecuente'],
    created_at: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000).toISOString()
  },
  {
    id: 'c_cust2',
    name: 'Mauricio Ochoa',
    phone: '+525599887766',
    address_default: 'Colima 150, Roma Norte, CDMX',
    total_spent: 840.00,
    orders_count: 1,
    notes: 'Detallista con los empaques.',
    tags: ['Nuevo'],
    created_at: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString()
  }
];

const defaultOrders: Order[] = [
  {
    id: 'o1',
    order_number: 'MO-0042',
    customer_id: 'c_cust1',
    client_name: 'Alejandra Guzmán',
    client_phone: '+525544332211',
    delivery_address: 'Av. Paseo de la Reforma 222, Juárez, CDMX',
    distance_km: 3.4,
    delivery_fee: 60,
    subtotal: 780.00,
    total: 840.00,
    status: 'confirmado',
    delivery_date: new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    delivery_time_slot: '10:00 - 12:00',
    payment_method: 'transferencia',
    payment_status: 'pagado',
    notes: 'Poner vela de cumpleaños por favor.',
    created_at: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        product_id: 'p1',
        product_name: 'Pastel Ópera Maison VIII',
        quantity: 1,
        price: 780.00,
        variant_choices: { 'Tamaño': 'Mediano (6-8 personas)' }
      }
    ]
  },
  {
    id: 'o2',
    order_number: 'MO-0041',
    customer_id: 'c_cust2',
    client_name: 'Mauricio Ochoa',
    client_phone: '+525599887766',
    delivery_address: 'Colima 150, Roma Norte, CDMX',
    distance_km: 2.1,
    delivery_fee: 40,
    subtotal: 840.00,
    total: 880.00,
    status: 'pendiente',
    delivery_date: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    delivery_time_slot: '14:00 - 16:00',
    payment_method: 'link_pago',
    payment_status: 'pendiente',
    notes: '',
    created_at: new Date(Date.now() - 12 * 60 * 60 * 1000).toISOString(),
    items: [
      {
        product_id: 'p2',
        product_name: 'Saint Honoré Vainilla y Caramelo',
        quantity: 1,
        price: 840.00,
        variant_choices: {}
      }
    ]
  }
];

class DBService {
  private isBrowser = typeof window !== 'undefined';

  private get<T>(key: string, defaultValue: T): T {
    if (!this.isBrowser) return defaultValue;
    const data = localStorage.getItem(`maison_viii_${key}`);
    return data ? JSON.parse(data) : defaultValue;
  }

  private set<T>(key: string, value: T): void {
    if (!this.isBrowser) return;
    localStorage.setItem(`maison_viii_${key}`, JSON.stringify(value));
  }

  // Categories
  getCategories(): Category[] {
    return this.get('categories', defaultCategories);
  }

  saveCategory(cat: Category): Category {
    const list = this.getCategories();
    const existingIdx = list.findIndex(c => c.id === cat.id);
    if (existingIdx > -1) {
      list[existingIdx] = cat;
    } else {
      cat.id = cat.id || generateUUID();
      list.push(cat);
    }
    this.set('categories', list);
    return cat;
  }

  deleteCategory(id: string): void {
    const list = this.getCategories().filter(c => c.id !== id);
    this.set('categories', list);
  }

  // Products
  getProducts(): Product[] {
    return this.get('products', defaultProducts);
  }

  saveProduct(prod: Product): Product {
    const list = this.getProducts();
    const existingIdx = list.findIndex(p => p.id === prod.id);
    if (existingIdx > -1) {
      list[existingIdx] = prod;
    } else {
      prod.id = prod.id || generateUUID();
      list.push(prod);
    }
    this.set('products', list);
    return prod;
  }

  deleteProduct(id: string): void {
    const list = this.getProducts().filter(p => p.id !== id);
    this.set('products', list);
  }

  // Customers
  getCustomers(): Customer[] {
    return this.get('customers', defaultCustomers);
  }

  saveCustomer(cust: Customer): Customer {
    const list = this.getCustomers();
    const existingIdx = list.findIndex(c => c.phone === cust.phone);
    if (existingIdx > -1) {
      list[existingIdx] = { ...list[existingIdx], ...cust };
      cust = list[existingIdx];
    } else {
      cust.id = cust.id || generateUUID();
      cust.created_at = cust.created_at || new Date().toISOString();
      list.push(cust);
    }
    this.set('customers', list);
    return cust;
  }

  // Orders
  getOrders(): Order[] {
    return this.get('orders', defaultOrders);
  }

  saveOrder(order: Order): Order {
    const list = this.getOrders();
    const existingIdx = list.findIndex(o => o.id === order.id);
    if (existingIdx > -1) {
      list[existingIdx] = order;
    } else {
      order.id = order.id || generateUUID();
      order.order_number = order.order_number || `MO-${Math.floor(1000 + Math.random() * 9000)}`;
      order.created_at = order.created_at || new Date().toISOString();
      list.push(order);

      // Create or update customer stats
      const customers = this.getCustomers();
      const clientCust = customers.find(c => c.phone === order.client_phone);
      if (clientCust) {
        clientCust.orders_count += 1;
        clientCust.total_spent += order.total;
        this.saveCustomer(clientCust);
      } else {
        this.saveCustomer({
          id: generateUUID(),
          name: order.client_name,
          phone: order.client_phone,
          address_default: order.delivery_address,
          total_spent: order.total,
          orders_count: 1,
          tags: ['Nuevo'],
          created_at: new Date().toISOString()
        });
      }

      // Trigger notification
      this.createNotification('new_order', `Nuevo pedido ${order.order_number} recibido por un total de $${order.total}`);
    }
    this.set('orders', list);
    return order;
  }

  deleteOrder(id: string): void {
    const list = this.getOrders();
    const filtered = list.filter(o => o.id !== id);
    this.set('orders', filtered);
  }

  // Delivery Zones
  getDeliveryZones(): DeliveryZone[] {
    return this.get('delivery_zones', defaultDeliveryZones);
  }

  saveDeliveryZone(zone: DeliveryZone): DeliveryZone {
    const list = this.getDeliveryZones();
    const existingIdx = list.findIndex(z => z.id === zone.id);
    if (existingIdx > -1) {
      list[existingIdx] = zone;
    } else {
      zone.id = zone.id || generateUUID();
      list.push(zone);
    }
    this.set('delivery_zones', list);
    return zone;
  }

  deleteDeliveryZone(id: string): void {
    const list = this.getDeliveryZones();
    const filtered = list.filter(z => z.id !== id);
    this.set('delivery_zones', filtered);
  }

  // Blocked Dates
  getBlockedDates(): BlockedDate[] {
    return this.get('blocked_dates', defaultBlockedDates);
  }

  saveBlockedDate(date: BlockedDate): BlockedDate {
    const list = this.getBlockedDates();
    const existingIdx = list.findIndex(d => d.id === date.id);
    if (existingIdx > -1) {
      list[existingIdx] = date;
    } else {
      date.id = date.id || generateUUID();
      list.push(date);
    }
    this.set('blocked_dates', list);
    return date;
  }

  deleteBlockedDate(id: string): void {
    const list = this.getBlockedDates().filter(d => d.id !== id);
    this.set('blocked_dates', list);
  }

  // Blocked Hours
  getBlockedHours(): BlockedHour[] {
    return this.get('blocked_hours', defaultBlockedHours);
  }

  saveBlockedHour(hour: BlockedHour): BlockedHour {
    const list = this.getBlockedHours();
    const existingIdx = list.findIndex(h => h.id === hour.id);
    if (existingIdx > -1) {
      list[existingIdx] = hour;
    } else {
      hour.id = hour.id || generateUUID();
      list.push(hour);
    }
    this.set('blocked_hours', list);
    return hour;
  }

  deleteBlockedHour(id: string): void {
    const list = this.getBlockedHours().filter(h => h.id !== id);
    this.set('blocked_hours', list);
  }

  // Settings
  getSettings() {
    return this.get('settings', defaultSettings);
  }

  saveSettings(settings: typeof defaultSettings) {
    this.set('settings', settings);
    return settings;
  }

  // Notifications
  getNotifications(): Notification[] {
    return this.get('notifications', []);
  }

  createNotification(type: string, message: string): Notification {
    const list = this.getNotifications();
    const notif: Notification = {
      id: generateUUID(),
      type,
      message,
      read: false,
      created_at: new Date().toISOString()
    };
    list.unshift(notif); // Add to beginning
    this.set('notifications', list);
    return notif;
  }

  markNotificationAsRead(id: string): void {
    const list = this.getNotifications();
    const found = list.find(n => n.id === id);
    if (found) {
      found.read = true;
      this.set('notifications', list);
    }
  }

  markAllNotificationsAsRead(): void {
    const list = this.getNotifications().map(n => ({ ...n, read: true }));
    this.set('notifications', list);
  }
}

export const dbMock = new DBService();
