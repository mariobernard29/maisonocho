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

  // Dashboard date filter state
  const [selectedDashboardDate, setSelectedDashboardDate] = useState<string>('');

  // Calculations
  const filteredOrders = selectedDashboardDate
    ? orders.filter(o => o.delivery_date === selectedDashboardDate)
    : orders;

  const totalSalesVal = filteredOrders.filter(o => o.status !== 'cancelado').reduce((acc, curr) => acc + curr.total, 0);
  const totalSubtotalVal = filteredOrders.filter(o => o.status !== 'cancelado').reduce((acc, curr) => acc + curr.subtotal, 0);
  const totalFeeVal = filteredOrders.filter(o => o.status !== 'cancelado').reduce((acc, curr) => acc + curr.delivery_fee, 0);
  const ordersCount = filteredOrders.length;

  const pendingCount = filteredOrders.filter(o => o.status === 'pendiente' || o.status === 'confirmado').length;
  const deliveredCount = filteredOrders.filter(o => o.status === 'entregado').length;

  // Products Sold Tally
  const productTally: Record<string, { count: number; sales: number }> = {};
  filteredOrders.forEach(o => {
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
  filteredOrders.forEach(o => {
    if (o.status === 'cancelado') return;
    slotCount[o.delivery_time_slot] = (slotCount[o.delivery_time_slot] || 0) + 1;
  });

  // Historical Daily Sales Table calculation
  const salesByDate: Record<string, { subtotalSum: number; feeSum: number; totalSum: number; count: number }> = {};
  orders.forEach(o => {
    if (o.status === 'cancelado') return;
    const date = o.delivery_date;
    if (selectedDashboardDate && date !== selectedDashboardDate) return;
    
    if (!salesByDate[date]) {
      salesByDate[date] = { subtotalSum: 0, feeSum: 0, totalSum: 0, count: 0 };
    }
    salesByDate[date].subtotalSum += o.subtotal;
    salesByDate[date].feeSum += o.delivery_fee;
    salesByDate[date].totalSum += o.total;
    salesByDate[date].count += 1;
  });

  const salesTableData = Object.entries(salesByDate)
    .map(([date, stats]) => ({ date, ...stats }))
    .sort((a, b) => b.date.localeCompare(a.date));

  const stats = [
    { name: 'Vendido sin Envío (Postres)', value: `$${totalSubtotalVal.toFixed(2)}`, desc: 'Dinero neto de artículos', icon: TrendingUp, color: 'text-gold' },
    { name: 'Gastos de Envío Recaudados', value: `$${totalFeeVal.toFixed(2)}`, desc: 'Total cobrado en fletes', icon: TrendingUp, color: 'text-amber-500' },
    { name: 'Ventas Totales (Con Envío)', value: `$${totalSalesVal.toFixed(2)}`, desc: 'Ingresos brutos acumulados', icon: TrendingUp, color: 'text-green-500' },
    { name: 'Pedidos Registrados', value: ordersCount, desc: 'Cantidad de comitivas', icon: ShoppingBag, color: 'text-green-400' },
  ];

  return (
    <div className="space-y-8 animate-fade-in-up">
      {/* Top Selector Bar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-[#0A0F0A] border border-gold/10 p-5 rounded-lg shadow-xl">
        <div className="space-y-0.5">
          <h2 className="editorial-title text-2xl text-gold font-light tracking-wide">Maison VIII Dashboard</h2>
          <p className="text-[10px] text-crema/40 uppercase tracking-widest">
            {selectedDashboardDate ? `Filtro Activo: Entrega el ${selectedDashboardDate}` : 'Acumulado Histórico Completo'}
          </p>
        </div>
        <div className="flex items-center gap-3 w-full sm:w-auto justify-end text-xs">
          <label className="text-[10px] text-gold uppercase tracking-wider font-semibold shrink-0">Filtrar por Día:</label>
          <input
            type="date"
            value={selectedDashboardDate}
            onChange={(e) => setSelectedDashboardDate(e.target.value)}
            className="bg-[#121A12] border border-gold/15 rounded px-3 py-1.5 text-xs text-crema focus:outline-none focus:border-gold"
          />
          {selectedDashboardDate && (
            <button
              onClick={() => setSelectedDashboardDate('')}
              className="px-3.5 py-1.5 rounded bg-olive/30 border border-gold/15 text-gold text-xs hover:bg-olive transition-colors uppercase font-bold shrink-0"
            >
              Ver Todo
            </button>
          )}
        </div>
      </div>

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
        {/* Sales Daily Table & Saturated Slots (Left) */}
        <div className="lg:col-span-8 space-y-8">
          
          {/* Historical Daily Sales Table */}
          <div className="bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-6">
            <div className="flex justify-between items-center border-b border-gold/15 pb-4">
              <div className="space-y-0.5">
                <h3 className="editorial-title text-lg text-gold font-light tracking-wide">Registro Diario de Ventas</h3>
                <p className="text-[10px] text-crema/40">Resumen contable agrupado por fecha de entrega</p>
              </div>
              <span className="text-[10px] text-gold border border-gold/30 bg-gold/5 px-2 py-0.5 rounded font-bold uppercase tracking-wider">
                Libro Contable
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#121A12]/40 border-b border-gold/10 text-gold font-semibold uppercase tracking-wider">
                    <th className="p-3">Fecha de Entrega</th>
                    <th className="p-3 text-center">Pedidos</th>
                    <th className="p-3 text-right">Vendido sin Envío</th>
                    <th className="p-3 text-right">Gastos de Envío</th>
                    <th className="p-3 text-right">Total Neto</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/5">
                  {salesTableData.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="p-8 text-center text-crema/30 italic">No hay registros de ventas para esta fecha.</td>
                    </tr>
                  ) : (
                    salesTableData.map((row) => (
                      <tr key={row.date} className={`hover:bg-[#121A12]/20 transition-colors ${selectedDashboardDate === row.date ? 'bg-gold/5 border-l-2 border-l-gold' : ''}`}>
                        <td className="p-3 font-semibold text-crema">{row.date}</td>
                        <td className="p-3 text-center text-crema/70 font-mono">{row.count}</td>
                        <td className="p-3 text-right text-crema/80 font-mono">${row.subtotalSum.toFixed(2)}</td>
                        <td className="p-3 text-right text-amber-500/80 font-mono">${row.feeSum.toFixed(2)}</td>
                        <td className="p-3 text-right text-gold font-bold font-mono">${row.totalSum.toFixed(2)}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
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
