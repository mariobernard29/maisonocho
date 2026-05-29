'use client';

import React, { useState, useEffect } from 'react';
import { ShoppingBag, TrendingUp, Users, CheckCircle, Clock, Calendar, AlertCircle } from 'lucide-react';
import { db } from '../../lib/supabase';
import { Order, Product, Customer } from '../../types';

export default function AdminDashboard() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  const timeSlots = [
    '09:00 - 11:00',
    '11:00 - 13:00',
    '13:00 - 15:00',
    '15:00 - 17:00',
    '17:00 - 19:00'
  ];

  useEffect(() => {
    async function loadData() {
      try {
        const [ordList, prodList, custList] = await Promise.all([
          db.getOrders(),
          db.getProducts(),
          db.getCustomers()
        ]);
        setOrders(ordList);
        setProducts(prodList);
        setCustomers(custList);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-center">
          <span className="editorial-title text-3xl text-gold">MAISON VIII</span>
          <p className="text-xs text-crema/40 mt-1 uppercase tracking-widest">Generando Métricas...</p>
        </div>
      </div>
    );
  }

  // Calculations
  const todayStr = new Date().toISOString().split('T')[0];
  const todayOrders = orders.filter(o => o.created_at?.split('T')[0] === todayStr || o.delivery_date === todayStr);
  const totalSales = orders.filter(o => o.status !== 'cancelado').reduce((acc, curr) => acc + curr.total, 0);
  const todaySales = todayOrders.filter(o => o.status !== 'cancelado').reduce((acc, curr) => acc + curr.total, 0);
  
  const pendingOrders = orders.filter(o => o.status === 'pendiente' || o.status === 'confirmado');
  const deliveredOrders = orders.filter(o => o.status === 'entregado');

  // Products Sold Tally
  const productTally: Record<string, { count: number; sales: number }> = {};
  orders.forEach(o => {
    if (o.status === 'cancelado') return;
    o.items?.forEach(item => {
      if (!productTally[item.product_name]) {
        productTally[item.product_name] = { count: 0, sales: 0 };
      }
      productTally[item.product_name].count += item.quantity;
      productTally[item.product_name].sales += item.price * item.quantity;
    });
  });

  const topProducts = Object.entries(productTally)
    .map(([name, stats]) => ({ name, ...stats }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 4);

  // Time Slots saturated analysis
  const slotCount: Record<string, number> = {};
  orders.forEach(o => {
    if (o.status === 'cancelado') return;
    slotCount[o.delivery_time_slot] = (slotCount[o.delivery_time_slot] || 0) + 1;
  });

  const stats = [
    { name: 'Ventas del Día', value: `$${todaySales.toFixed(2)}`, desc: `${todayOrders.length} pedidos hoy`, icon: TrendingUp, color: 'text-green-500' },
    { name: 'Ingresos Totales', value: `$${totalSales.toFixed(2)}`, desc: 'Ventas acumuladas', icon: TrendingUp, color: 'text-gold' },
    { name: 'Pedidos Pendientes', value: pendingOrders.length, desc: 'Por preparar o despachar', icon: Clock, color: 'text-amber-500' },
    { name: 'Pedidos Entregados', value: deliveredOrders.length, desc: 'Servicios completados', icon: CheckCircle, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* 4 Core Stat Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, idx) => {
          const Icon = stat.icon;
          return (
            <div key={idx} className="bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg flex items-center justify-between shadow-xl">
              <div className="space-y-1">
                <span className="text-[10px] tracking-wider uppercase text-crema/40 font-semibold">{stat.name}</span>
                <p className="text-2xl font-bold text-crema tracking-tight">{stat.value}</p>
                <span className="text-[10px] text-crema/50 block">{stat.desc}</span>
              </div>
              <div className={`p-3 bg-[#121A12] border border-gold/5 rounded-full ${stat.color}`}>
                <Icon className="w-5 h-5 stroke-[1.5]" />
              </div>
            </div>
          );
        })}
      </div>

      {/* Grid for Graphs and Logs */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Sales Chart Simulation & Saturated Slots (Left) */}
        <div className="lg:col-span-8 space-y-8">
          <div className="bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-gold/15 pb-4">
              <h3 className="editorial-title text-lg text-gold font-light tracking-wide">Distribución Semanal de Ventas</h3>
              <span className="text-[10px] text-crema/40 font-semibold uppercase tracking-wider">Simulación en Tiempo Real</span>
            </div>
            
            {/* Elegant Custom CSS Chart Bars */}
            <div className="grid grid-cols-7 gap-4 items-end h-48 pt-6">
              {[
                { day: 'Lun', height: '40%', val: '$2,450' },
                { day: 'Mar', height: '65%', val: '$4,120' },
                { day: 'Mie', height: '50%', val: '$3,200' },
                { day: 'Jue', height: '80%', val: '$5,400' },
                { day: 'Vie', height: '95%', val: '$6,800' },
                { day: 'Sab', height: '70%', val: '$4,900' },
                { day: 'Dom', height: '0%', val: 'Cerrado' }
              ].map((bar, i) => (
                <div key={i} className="flex flex-col items-center gap-2 group h-full justify-end">
                  <span className="text-[9px] text-gold opacity-0 group-hover:opacity-100 transition-opacity font-semibold">{bar.val}</span>
                  <div
                    style={{ height: bar.height }}
                    className="w-full bg-gold/25 hover:bg-gold rounded-t transition-all duration-500 border-t border-gold/50 cursor-pointer"
                  />
                  <span className="text-[10px] text-crema/40 font-medium">{bar.day}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Saturated Slots Tracker */}
          <div className="bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-6">
            <h3 className="editorial-title text-lg text-gold font-light border-b border-gold/15 pb-4 tracking-wide">
              Horarios Más Demandados (Saturación)
            </h3>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {timeSlots.map((slot, i) => {
                const count = slotCount[slot] || 0;
                const saturationPct = Math.min(100, (count / 5) * 100); // 5 max order limit
                return (
                  <div key={i} className="bg-[#121A12]/40 border border-gold/5 p-4 rounded space-y-2">
                    <div className="flex justify-between items-center text-xs">
                      <span className="font-semibold text-crema">{slot}</span>
                      <span className={`font-semibold ${saturationPct >= 80 ? 'text-red-400' : 'text-gold'}`}>
                        {count} / 5 pedidos
                      </span>
                    </div>
                    {/* Progress Bar */}
                    <div className="w-full bg-[#1A261A] h-2 rounded overflow-hidden">
                      <div
                        style={{ width: `${saturationPct}%` }}
                        className={`h-full rounded transition-all duration-500 ${
                          saturationPct >= 80 ? 'bg-red-500' : 'bg-gold'
                        }`}
                      />
                    </div>
                    <span className="text-[9px] text-crema/40 block">
                      {saturationPct >= 80 ? '⚠️ Horario crítico - Saturación automática' : 'Disponible para entregas'}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Top Sellers and VIP Customers (Right) */}
        <div className="lg:col-span-4 space-y-8">
          {/* Top Products */}
          <div className="bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-6">
            <h3 className="editorial-title text-lg text-gold font-light border-b border-gold/15 pb-4 tracking-wide">
              Productos Más Vendidos
            </h3>
            
            <div className="space-y-4">
              {topProducts.length === 0 ? (
                <p className="text-crema/30 text-xs text-center py-4">Aún no hay ventas registradas.</p>
              ) : (
                topProducts.map((p, i) => (
                  <div key={i} className="flex justify-between items-center text-xs border-b border-gold/5 pb-2.5">
                    <div className="space-y-0.5">
                      <p className="font-semibold text-crema">{p.name}</p>
                      <span className="text-[10px] text-crema/40">{p.count} unidades vendidas</span>
                    </div>
                    <span className="font-bold text-gold">${p.sales.toFixed(2)}</span>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* VIP Customers list */}
          <div className="bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-6">
            <h3 className="editorial-title text-lg text-gold font-light border-b border-gold/15 pb-4 tracking-wide">
              Clientes VIP / Frecuentes
            </h3>

            <div className="space-y-4">
              {customers.slice(0, 3).map((cust, i) => (
                <div key={i} className="flex justify-between items-center text-xs border-b border-gold/5 pb-2.5">
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <p className="font-semibold text-crema">{cust.name}</p>
                      {cust.tags.includes('VIP') && (
                        <span className="bg-gold/10 border border-gold/30 text-gold text-[8px] font-bold px-1.5 py-0.2 rounded uppercase">
                          VIP
                        </span>
                      )}
                    </div>
                    <span className="text-[10px] text-crema/40">{cust.phone} &bull; {cust.orders_count} pedidos</span>
                  </div>
                  <span className="font-bold text-gold">${cust.total_spent.toFixed(2)}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
