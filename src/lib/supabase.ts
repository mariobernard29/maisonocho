// Supabase Integration & Hybrid Client
// Integrates with Supabase if environment variables are configured,
// otherwise falls back to dbMock (LocalStorage) for full standalone operation.

import { createClient } from '@supabase/supabase-js';
import { dbMock } from './db-mock';
import { Category, Product, Customer, Order, DeliveryZone, BlockedDate, BlockedHour, Notification } from '../types';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || '';

// Detect if we are using the default mock URL/key or if they are missing
const isSupabaseConfigured = 
  supabaseUrl && 
  supabaseAnonKey && 
  !supabaseUrl.includes('your-supabase-project') &&
  supabaseUrl.startsWith('https://');

export const supabase = isSupabaseConfigured 
  ? createClient(supabaseUrl, supabaseAnonKey) 
  : null;

// Expose unified database operations so components/actions do not care about the backend
export const db = {
  isMock: !isSupabaseConfigured,

  async getCategories(): Promise<Category[]> {
    if (!isSupabaseConfigured) return dbMock.getCategories();
    try {
      const { data, error } = await supabase!
        .from('categories')
        .select('*')
        .order('display_order', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase getCategories failed, falling back to Mock:', e);
      return dbMock.getCategories();
    }
  },

  async saveCategory(cat: Category): Promise<Category> {
    if (!isSupabaseConfigured) return dbMock.saveCategory(cat);
    try {
      const { data, error } = await supabase!
        .from('categories')
        .upsert(cat)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase saveCategory failed, falling back to Mock:', e);
      return dbMock.saveCategory(cat);
    }
  },

  async deleteCategory(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      dbMock.deleteCategory(id);
      return;
    }
    try {
      const { error } = await supabase!
        .from('categories')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Supabase deleteCategory failed, falling back to Mock:', e);
      dbMock.deleteCategory(id);
    }
  },

  async getProducts(): Promise<Product[]> {
    if (!isSupabaseConfigured) return dbMock.getProducts();
    try {
      const { data, error } = await supabase!
        .from('products')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase getProducts failed, falling back to Mock:', e);
      return dbMock.getProducts();
    }
  },

  async saveProduct(prod: Product): Promise<Product> {
    if (!isSupabaseConfigured) return dbMock.saveProduct(prod);
    try {
      const { data, error } = await supabase!
        .from('products')
        .upsert(prod)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase saveProduct failed, falling back to Mock:', e);
      return dbMock.saveProduct(prod);
    }
  },

  async deleteProduct(id: string): Promise<void> {
    if (!isSupabaseConfigured) return dbMock.deleteProduct(id);
    try {
      const { error } = await supabase!
        .from('products')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Supabase deleteProduct failed, falling back to Mock:', e);
      dbMock.deleteProduct(id);
    }
  },

  async getCustomers(): Promise<Customer[]> {
    if (!isSupabaseConfigured) return dbMock.getCustomers();
    try {
      const { data, error } = await supabase!
        .from('customers')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase getCustomers failed, falling back to Mock:', e);
      return dbMock.getCustomers();
    }
  },

  async saveCustomer(cust: Customer): Promise<Customer> {
    if (!isSupabaseConfigured) return dbMock.saveCustomer(cust);
    try {
      const { data, error } = await supabase!
        .from('customers')
        .upsert(cust, { onConflict: 'phone' })
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase saveCustomer failed, falling back to Mock:', e);
      return dbMock.saveCustomer(cust);
    }
  },

  async getOrders(): Promise<Order[]> {
    if (!isSupabaseConfigured) return dbMock.getOrders();
    try {
      // Include order items
      const { data, error } = await supabase!
        .from('orders')
        .select('*, items:order_items(*)')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase getOrders failed, falling back to Mock:', e);
      return dbMock.getOrders();
    }
  },

  async saveOrder(order: Order, items: any[]): Promise<Order> {
    if (!isSupabaseConfigured) return dbMock.saveOrder({ ...order, items });
    try {
      // Strip items from the order object to prevent PostgreSQL column errors on upsert
      const { items: _, ...orderWithoutItems } = order as any;

      // Insert order
      const { data: orderData, error: orderError } = await supabase!
        .from('orders')
        .upsert(orderWithoutItems)
        .select()
        .single();
      if (orderError) throw orderError;

      // Clean old items if editing, then insert new items
      await supabase!.from('order_items').delete().eq('order_id', orderData.id);

      const itemsWithOrderId = items.map(item => ({
        ...item,
        order_id: orderData.id
      }));

      const { error: itemsError } = await supabase!
        .from('order_items')
        .insert(itemsWithOrderId);

      if (itemsError) throw itemsError;

      // Update customer total spend
      const { data: customer } = await supabase!
        .from('customers')
        .select('*')
        .eq('phone', order.client_phone)
        .single();

      if (customer) {
        await supabase!
          .from('customers')
          .update({
            orders_count: (customer.orders_count || 0) + 1,
            total_spent: (customer.total_spent || 0) + order.total
          })
          .eq('phone', order.client_phone);
      } else {
        await supabase!
          .from('customers')
          .insert({
            name: order.client_name,
            phone: order.client_phone,
            address_default: order.delivery_address,
            orders_count: 1,
            total_spent: order.total,
            tags: ['Nuevo']
          });
      }

      // Add to notifications
      await supabase!
        .from('notifications')
        .insert({
          type: 'new_order',
          message: `Nuevo pedido ${orderData.order_number} recibido por un total de $${orderData.total}`
        });

      return { ...orderData, items: itemsWithOrderId };
    } catch (e) {
      console.warn('Supabase saveOrder failed, falling back to Mock:', e);
      return dbMock.saveOrder({ ...order, items });
    }
  },

  async deleteOrder(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      dbMock.deleteOrder(id);
      return;
    }
    try {
      await supabase!.from('order_items').delete().eq('order_id', id);
      const { error } = await supabase!
        .from('orders')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Supabase deleteOrder failed, falling back to Mock:', e);
      dbMock.deleteOrder(id);
    }
  },

  async getDeliveryZones(): Promise<DeliveryZone[]> {
    if (!isSupabaseConfigured) return dbMock.getDeliveryZones();
    try {
      const { data, error } = await supabase!
        .from('delivery_zones')
        .select('*')
        .order('min_km', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase getDeliveryZones failed, falling back to Mock:', e);
      return dbMock.getDeliveryZones();
    }
  },

  async saveDeliveryZone(zone: DeliveryZone): Promise<DeliveryZone> {
    if (!isSupabaseConfigured) return dbMock.saveDeliveryZone(zone);
    try {
      const { data, error } = await supabase!
        .from('delivery_zones')
        .upsert(zone)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase saveDeliveryZone failed, falling back to Mock:', e);
      return dbMock.saveDeliveryZone(zone);
    }
  },

  async deleteDeliveryZone(id: string): Promise<void> {
    if (!isSupabaseConfigured) {
      dbMock.deleteDeliveryZone(id);
      return;
    }
    try {
      const { error } = await supabase!
        .from('delivery_zones')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Supabase deleteDeliveryZone failed, falling back to Mock:', e);
      dbMock.deleteDeliveryZone(id);
    }
  },

  async getBlockedDates(): Promise<BlockedDate[]> {
    if (!isSupabaseConfigured) return dbMock.getBlockedDates();
    try {
      const { data, error } = await supabase!
        .from('blocked_dates')
        .select('*')
        .order('date', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase getBlockedDates failed, falling back to Mock:', e);
      return dbMock.getBlockedDates();
    }
  },

  async saveBlockedDate(date: BlockedDate): Promise<BlockedDate> {
    if (!isSupabaseConfigured) return dbMock.saveBlockedDate(date);
    try {
      const { data, error } = await supabase!
        .from('blocked_dates')
        .upsert(date)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase saveBlockedDate failed, falling back to Mock:', e);
      return dbMock.saveBlockedDate(date);
    }
  },

  async deleteBlockedDate(id: string): Promise<void> {
    if (!isSupabaseConfigured) return dbMock.deleteBlockedDate(id);
    try {
      const { error } = await supabase!
        .from('blocked_dates')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Supabase deleteBlockedDate failed, falling back to Mock:', e);
      dbMock.deleteBlockedDate(id);
    }
  },

  async getBlockedHours(): Promise<BlockedHour[]> {
    if (!isSupabaseConfigured) return dbMock.getBlockedHours();
    try {
      const { data, error } = await supabase!
        .from('blocked_hours')
        .select('*')
        .order('day_of_week', { ascending: true });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase getBlockedHours failed, falling back to Mock:', e);
      return dbMock.getBlockedHours();
    }
  },

  async saveBlockedHour(hour: BlockedHour): Promise<BlockedHour> {
    if (!isSupabaseConfigured) return dbMock.saveBlockedHour(hour);
    try {
      const { data, error } = await supabase!
        .from('blocked_hours')
        .upsert(hour)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase saveBlockedHour failed, falling back to Mock:', e);
      return dbMock.saveBlockedHour(hour);
    }
  },

  async deleteBlockedHour(id: string): Promise<void> {
    if (!isSupabaseConfigured) return dbMock.deleteBlockedHour(id);
    try {
      const { error } = await supabase!
        .from('blocked_hours')
        .delete()
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Supabase deleteBlockedHour failed, falling back to Mock:', e);
      dbMock.deleteBlockedHour(id);
    }
  },

  async getSettings() {
    if (!isSupabaseConfigured) return dbMock.getSettings();
    try {
      const { data, error } = await supabase!
        .from('settings')
        .select('*');
      if (error) throw error;
      
      const settingsMap = (data || []).reduce((acc: any, curr: any) => {
        acc[curr.key] = curr.value;
        return acc;
      }, {});

      return {
        ...dbMock.getSettings(), // default fallbacks
        ...settingsMap
      };
    } catch (e) {
      console.warn('Supabase getSettings failed, falling back to Mock:', e);
      return dbMock.getSettings();
    }
  },

  async saveSettings(settings: any): Promise<any> {
    if (!isSupabaseConfigured) return dbMock.saveSettings(settings);
    try {
      const promises = Object.keys(settings).map(key => {
        return supabase!
          .from('settings')
          .upsert({ key, value: settings[key] }, { onConflict: 'key' });
      });
      await Promise.all(promises);
      return settings;
    } catch (e) {
      console.warn('Supabase saveSettings failed, falling back to Mock:', e);
      return dbMock.saveSettings(settings);
    }
  },

  async getNotifications(): Promise<Notification[]> {
    if (!isSupabaseConfigured) return dbMock.getNotifications();
    try {
      const { data, error } = await supabase!
        .from('notifications')
        .select('*')
        .order('created_at', { ascending: false });
      if (error) throw error;
      return data || [];
    } catch (e) {
      console.warn('Supabase getNotifications failed, falling back to Mock:', e);
      return dbMock.getNotifications();
    }
  },

  async createNotification(type: string, message: string): Promise<Notification> {
    if (!isSupabaseConfigured) return dbMock.createNotification(type, message);
    try {
      const notif = {
        type,
        message,
        read: false,
      };
      const { data, error } = await supabase!
        .from('notifications')
        .insert(notif)
        .select()
        .single();
      if (error) throw error;
      return data;
    } catch (e) {
      console.warn('Supabase createNotification failed, falling back to Mock:', e);
      return dbMock.createNotification(type, message);
    }
  },

  async markNotificationAsRead(id: string): Promise<void> {
    if (!isSupabaseConfigured) return dbMock.markNotificationAsRead(id);
    try {
      const { error } = await supabase!
        .from('notifications')
        .update({ read: true })
        .eq('id', id);
      if (error) throw error;
    } catch (e) {
      console.warn('Supabase markNotificationAsRead failed, falling back to Mock:', e);
      dbMock.markNotificationAsRead(id);
    }
  },

  async markAllNotificationsAsRead(): Promise<void> {
    if (!isSupabaseConfigured) return dbMock.markAllNotificationsAsRead();
    try {
      const { error } = await supabase!
        .from('notifications')
        .update({ read: true })
        .eq('read', false);
      if (error) throw error;
    } catch (e) {
      console.warn('Supabase markAllNotificationsAsRead failed, falling back to Mock:', e);
      dbMock.markAllNotificationsAsRead();
    }
  }
};
