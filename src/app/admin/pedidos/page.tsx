'use client';

import React, { useState, useEffect } from 'react';
import { Search, ShoppingBag, Eye, Printer, PhoneCall, RefreshCw, Download, Edit, Trash2 } from 'lucide-react';
import { db } from '../../../lib/supabase';
import { Order, OrderStatus } from '../../../types';

export default function AdminOrders() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter
  const [statusFilter, setStatusFilter] = useState<string>('todos');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [startDate, setStartDate] = useState<string>('');
  const [endDate, setEndDate] = useState<string>('');

  // Editing order states
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editClientName, setEditClientName] = useState('');
  const [editClientPhone, setEditClientPhone] = useState('');
  const [editDeliveryAddress, setEditDeliveryAddress] = useState('');
  const [editDeliveryInstructions, setEditDeliveryInstructions] = useState('');
  const [editDeliveryDate, setEditDeliveryDate] = useState('');
  const [editDeliveryTimeSlot, setEditDeliveryTimeSlot] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editPaymentMethod, setEditPaymentMethod] = useState<'efectivo' | 'transferencia' | 'link_pago'>('efectivo');
  const [editPaymentStatus, setEditPaymentStatus] = useState<'pendiente' | 'pagado'>('pendiente');
  const [editDistanceKm, setEditDistanceKm] = useState<number>(0);
  const [editDeliveryFee, setEditDeliveryFee] = useState<number>(0);
  const [editSubtotal, setEditSubtotal] = useState<number>(0);
  const [editItems, setEditItems] = useState<any[]>([]);

  useEffect(() => {
    async function loadOrders() {
      try {
        const data = await db.getOrders();
        setOrders(data);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadOrders();
  }, []);

  const handleStatusChange = async (orderId: string, newStatus: OrderStatus) => {
    const matchedOrder = orders.find(o => o.id === orderId);
    if (!matchedOrder) return;

    const updatedOrder = { ...matchedOrder, status: newStatus };
    
    // Update locally or in DB
    await db.saveOrder(updatedOrder, matchedOrder.items || []);
    
    setOrders(prev => prev.map(o => o.id === orderId ? updatedOrder : o));
    if (selectedOrder?.id === orderId) {
      setSelectedOrder(updatedOrder);
    }
    
    // Create status change notification
    await db.createNotification('status_update', `Pedido ${matchedOrder.order_number} cambiado a ${newStatus}`);
  };

  const handleOpenEditModal = (order: Order) => {
    setEditingOrder(order);
    setEditClientName(order.client_name);
    setEditClientPhone(order.client_phone);
    setEditDeliveryAddress(order.delivery_address);
    setEditDeliveryInstructions(order.delivery_instructions || '');
    setEditDeliveryDate(order.delivery_date);
    setEditDeliveryTimeSlot(order.delivery_time_slot);
    setEditNotes(order.notes || '');
    setEditPaymentMethod(order.payment_method);
    setEditPaymentStatus(order.payment_status);
    setEditDistanceKm(order.distance_km ?? 0);
    setEditDeliveryFee(order.delivery_fee);
    setEditSubtotal(order.subtotal);
    setEditItems(order.items ? [...order.items] : []);
  };

  const handleSaveOrderEdit = async () => {
    if (!editingOrder) return;
    
    // Recalculate subtotal and total
    const subtotal = editItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0);
    const total = subtotal + editDeliveryFee;

    const updatedOrder: Order = {
      ...editingOrder,
      client_name: editClientName,
      client_phone: editClientPhone,
      delivery_address: editDeliveryAddress,
      delivery_instructions: editDeliveryInstructions,
      delivery_date: editDeliveryDate,
      delivery_time_slot: editDeliveryTimeSlot,
      notes: editNotes,
      payment_method: editPaymentMethod,
      payment_status: editPaymentStatus,
      distance_km: editDistanceKm,
      delivery_fee: editDeliveryFee,
      subtotal,
      total
    };

    setLoading(true);
    try {
      await db.saveOrder(updatedOrder, editItems);
      setOrders(prev => prev.map(o => o.id === editingOrder.id ? { ...updatedOrder, items: editItems } : o));
      setEditingOrder(null);
      alert('Pedido modificado con éxito! ✨');
    } catch (err) {
      console.error(err);
      alert('Error al guardar las modificaciones del pedido.');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!confirm('¿Está seguro de que desea eliminar permanentemente este pedido? Esta acción no se puede deshacer.')) return;
    setLoading(true);
    try {
      await db.deleteOrder(orderId);
      setOrders(prev => prev.filter(o => o.id !== orderId));
      alert('Pedido eliminado con éxito.');
    } catch (e) {
      console.error(e);
      alert('Error al eliminar el pedido.');
    } finally {
      setLoading(false);
    }
  };

  const handlePrint = () => {
    if (typeof window !== 'undefined') {
      window.print();
    }
  };

  // Re-trigger/simulates sending WhatsApp notification
  const handleResendWhatsApp = async (order: Order) => {
    try {
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          order: { ...order, twilio_sent: true },
          items: order.items || [],
          isResend: true
        })
      });
      if (res.ok) {
        alert(`Notificación de WhatsApp para pedido ${order.order_number} enviada con éxito! ✨`);
      } else {
        alert('WhatsApp simulado con éxito (Ver logs en consola).');
      }
    } catch (e) {
      console.error(e);
      alert('Notificación simulada en consola de desarrollo.');
    }
  };

  // Export to CSV helper
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) return;
    const headers = ['Pedido', 'Cliente', 'Telefono', 'Direccion', 'Subtotal', 'Envio', 'Total', 'Estado', 'Fecha Entrega', 'Horario'];
    const rows = filteredOrders.map(o => [
      o.order_number,
      o.client_name,
      `'${o.client_phone}`,
      `"${o.delivery_address.replace(/"/g, '""')}"`,
      o.subtotal,
      o.delivery_fee,
      o.total,
      o.status,
      o.delivery_date,
      o.delivery_time_slot
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `maison_viii_pedidos_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const filteredOrders = orders.filter(o => {
    const matchesStatus = statusFilter === 'todos' || o.status === statusFilter;
    const matchesSearch = 
      o.order_number.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.client_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      o.client_phone.includes(searchQuery);

    // Period / Date Range Filter (against o.delivery_date)
    let matchesPeriod = true;
    if (startDate) {
      matchesPeriod = matchesPeriod && o.delivery_date >= startDate;
    }
    if (endDate) {
      matchesPeriod = matchesPeriod && o.delivery_date <= endDate;
    }

    return matchesStatus && matchesSearch && matchesPeriod;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Filtering and Tools Row */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-[#0A0F0A] border border-gold/10 p-5 rounded-lg shadow-xl">
        {/* Status Horizontal Tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto w-full xl:w-auto">
          {['todos', 'pendiente', 'confirmado', 'preparacion', 'camino', 'entregado', 'cancelado'].map(status => (
            <button
              key={status}
              onClick={() => setStatusFilter(status)}
              className={`px-4 py-2 rounded text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                statusFilter === status
                  ? 'bg-gold text-olive shadow'
                  : 'bg-[#121A12]/40 text-crema/60 border border-gold/5 hover:bg-[#1E2C1E] hover:text-gold'
              }`}
            >
              {status === 'todos' ? 'Todos' : status}
            </button>
          ))}
        </div>

        {/* Search and Export Utilities */}
        <div className="flex flex-col sm:flex-row gap-3 w-full xl:w-auto items-center justify-end">
          <div className="relative w-full sm:w-64">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-crema/30" />
            <input
              type="text"
              placeholder="Buscar por cliente, folio o tel..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-[#121A12]/50 border border-gold/10 rounded pl-9 pr-3 py-2 text-xs text-crema focus:outline-none focus:border-gold transition-colors"
            />
          </div>

          <button
            onClick={handleExportCSV}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-[#121A12] border border-gold/25 hover:bg-gold hover:text-olive px-4 py-2 rounded text-xs font-semibold tracking-wider text-gold transition-all duration-300 uppercase shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Exportar CSV</span>
          </button>
        </div>
      </div>

      {/* Period Selector Row */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-start md:items-center bg-[#0A0F0A] border border-gold/10 p-4 rounded-lg shadow-xl text-xs">
        <div className="space-y-0.5">
          <span className="text-[10px] text-gold uppercase tracking-wider font-semibold block">Selector de Período (Entrega)</span>
          <p className="text-[9px] text-crema/40">Filtra pedidos programados en un rango de fechas</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full md:w-auto justify-end">
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-crema/50 uppercase tracking-widest">Desde:</span>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-[#121A12] border border-gold/15 rounded px-2.5 py-1.5 text-xs text-crema focus:outline-none focus:border-gold"
            />
          </div>
          <div className="flex items-center gap-1.5">
            <span className="text-[9px] text-crema/50 uppercase tracking-widest">Hasta:</span>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-[#121A12] border border-gold/15 rounded px-2.5 py-1.5 text-xs text-crema focus:outline-none focus:border-gold"
            />
          </div>
          {(startDate || endDate) && (
            <button
              onClick={() => {
                setStartDate('');
                setEndDate('');
              }}
              className="px-3.5 py-1.5 rounded bg-olive/30 border border-gold/15 text-gold text-xs hover:bg-olive transition-colors font-bold uppercase shrink-0"
            >
              Limpiar
            </button>
          )}
        </div>
      </div>

      {/* Orders Main Table */}
      <div className="bg-[#0A0F0A] border border-gold/10 rounded-lg shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-20 text-center animate-pulse">
            <span className="editorial-title text-2xl text-gold">Cargando bitácora de pedidos...</span>
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="p-20 text-center">
            <ShoppingBag className="w-12 h-12 text-gold/20 mx-auto mb-3" />
            <p className="editorial-title text-lg text-crema/50">Sin pedidos correspondientes</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#121A12]/60 border-b border-gold/10 text-gold font-semibold uppercase tracking-wider">
                  <th className="p-4">Folio</th>
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Entrega</th>
                  <th className="p-4">Productos</th>
                  <th className="p-4 text-right">Total</th>
                  <th className="p-4">Pago</th>
                  <th className="p-4">Estado</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/5">
                {filteredOrders.map((o) => (
                  <tr key={o.id} className="hover:bg-[#121A12]/20 transition-colors">
                    <td className="p-4 font-mono font-bold text-gold">{o.order_number}</td>
                    <td className="p-4 space-y-0.5">
                      <p className="font-semibold text-crema">{o.client_name}</p>
                      <span className="text-[10px] text-crema/40">{o.client_phone}</span>
                    </td>
                    <td className="p-4 space-y-0.5">
                      <p className="font-medium text-crema">{o.delivery_date}</p>
                      <span className="text-[10px] text-crema/40">{o.delivery_time_slot}</span>
                    </td>
                    <td className="p-4 max-w-xs truncate text-crema/80">
                      {o.items?.map((it, idx) => (
                        <div key={idx} className="truncate">
                          {it.quantity}x {it.product_name}
                        </div>
                      ))}
                    </td>
                    <td className="p-4 font-bold text-crema text-right">${o.total.toFixed(2)}</td>
                    <td className="p-4">
                      <span className={`px-2 py-0.5 rounded text-[9px] font-bold border ${
                        o.payment_status === 'pagado'
                          ? 'bg-green-500/10 border-green-500/20 text-green-400'
                          : 'bg-amber-500/10 border-amber-500/20 text-amber-400'
                      }`}>
                        {o.payment_method === 'efectivo' && 'Efectivo'}
                        {o.payment_method === 'transferencia' && 'Transf'}
                        {o.payment_method === 'link_pago' && 'Link'}
                        {' '}({o.payment_status === 'pagado' ? 'Pagado' : 'Pend'})
                      </span>
                    </td>
                    <td className="p-4">
                      <select
                        value={o.status}
                        onChange={(e) => handleStatusChange(o.id, e.target.value as OrderStatus)}
                        className={`bg-[#121A12] border border-gold/15 rounded p-1.5 text-[10px] font-bold uppercase focus:outline-none focus:border-gold ${
                          o.status === 'pendiente' && 'text-amber-500' ||
                          o.status === 'confirmado' && 'text-blue-400' ||
                          o.status === 'preparacion' && 'text-purple-400' ||
                          o.status === 'camino' && 'text-cyan-400' ||
                          o.status === 'entregado' && 'text-green-400' ||
                          'text-red-400'
                        }`}
                      >
                        <option value="pendiente">Pendiente</option>
                        <option value="confirmado">Confirmado</option>
                        <option value="preparacion">En preparación</option>
                        <option value="camino">En camino</option>
                        <option value="entregado">Entregado</option>
                        <option value="cancelado">Cancelado</option>
                      </select>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center gap-2">
                        {/* Eye details */}
                        <button
                          onClick={() => setSelectedOrder(o)}
                          className="p-1.5 rounded bg-[#121A12] hover:bg-gold hover:text-olive border border-gold/15 text-gold transition-colors"
                          title="Ver Detalles"
                        >
                          <Eye className="w-3.5 h-3.5" />
                        </button>

                        {/* Edit Order */}
                        <button
                          onClick={() => handleOpenEditModal(o)}
                          className="p-1.5 rounded bg-[#121A12] hover:bg-gold hover:text-olive border border-gold/15 text-gold transition-colors"
                          title="Editar Pedido"
                        >
                          <Edit className="w-3.5 h-3.5" />
                        </button>
                        
                        {/* WhatsApp Resend */}
                        <button
                          onClick={() => handleResendWhatsApp(o)}
                          className="p-1.5 rounded bg-[#121A12] hover:bg-green-600 hover:text-white border border-gold/15 text-gold transition-colors"
                          title="Enviar WhatsApp"
                        >
                          <PhoneCall className="w-3.5 h-3.5" />
                        </button>

                        {/* Delete Order */}
                        <button
                          onClick={() => handleDeleteOrder(o.id)}
                          className="p-1.5 rounded bg-[#121A12] hover:bg-red-600 hover:text-white border border-gold/15 text-gold transition-colors"
                          title="Eliminar Pedido"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* DETAILED VIEW DIALOG / MODAL */}
      {selectedOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="absolute inset-0 bg-[#000]/60 backdrop-blur-sm" onClick={() => setSelectedOrder(null)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-xl rounded-lg bg-[#0E150E] border border-gold/25 p-6 shadow-2xl space-y-6">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-gold/15 pb-4">
                <div className="space-y-0.5">
                  <h3 className="editorial-title text-xl text-gold font-light">Detalle de Pedido</h3>
                  <span className="font-mono text-xs text-crema/40">FOLIO: {selectedOrder.order_number}</span>
                </div>
                <button
                  onClick={() => setSelectedOrder(null)}
                  className="text-crema/40 hover:text-crema text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              {/* Client & Address Info */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div className="space-y-1">
                  <span className="text-[10px] text-gold/50 uppercase tracking-wider block">Contacto Cliente</span>
                  <p className="font-semibold text-crema text-sm">{selectedOrder.client_name}</p>
                  <p className="text-crema/70">{selectedOrder.client_phone}</p>
                </div>
                <div className="space-y-1">
                  <span className="text-[10px] text-gold/50 uppercase tracking-wider block">Logística de Entrega</span>
                  <p className="text-crema font-medium">{selectedOrder.delivery_date}</p>
                  <p className="text-crema/70">{selectedOrder.delivery_time_slot}</p>
                </div>
              </div>

              <div className="border-t border-b border-gold/10 py-3 text-xs space-y-2">
                <div>
                  <span className="text-[10px] text-gold/50 uppercase tracking-wider block">Dirección</span>
                  <p className="text-crema leading-relaxed font-light">{selectedOrder.delivery_address}</p>
                </div>
                {selectedOrder.delivery_instructions && (
                  <div>
                    <span className="text-[10px] text-gold/50 uppercase tracking-wider block">Referencias de Entrega</span>
                    <p className="text-crema leading-relaxed font-light italic bg-[#121A12]/30 p-2 rounded border border-gold/5">{selectedOrder.delivery_instructions}</p>
                  </div>
                )}
                <p className="text-[10px] text-gold/80 mt-1 font-light italic">&bull; Distancia: {selectedOrder.distance_km} km</p>
              </div>

              {/* Items List */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] text-gold/50 uppercase tracking-wider block">Productos</span>
                <div className="divide-y divide-gold/5">
                  {selectedOrder.items?.map((item, idx) => (
                    <div key={idx} className="py-2 flex justify-between gap-3 text-xs">
                      <div>
                        <span className="font-semibold text-gold">{item.quantity}x</span>{' '}
                        <span className="text-crema">{item.product_name}</span>
                        {Object.keys(item.variant_choices || {}).length > 0 && (
                          <span className="block text-[10px] text-gold/60 font-light mt-0.5">
                            {Object.entries(item.variant_choices).map(([k,v]) => `${k}: ${v}`).join(', ')}
                          </span>
                        )}
                      </div>
                      <span className="font-semibold text-crema text-right">${(item.price * item.quantity).toFixed(2)}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Total Calculation */}
              <div className="border-t border-gold/15 pt-4 space-y-2 text-xs">
                <div className="flex justify-between items-center text-crema/60">
                  <span>Subtotal</span>
                  <span>${selectedOrder.subtotal.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-crema/60">
                  <span>Envío ({selectedOrder.distance_km} km)</span>
                  <span>${selectedOrder.delivery_fee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-sm border-t border-gold/10 pt-2 font-bold text-gold">
                  <span className="editorial-title text-base font-light">Total Neto</span>
                  <span className="text-lg font-bold">${selectedOrder.total.toFixed(2)}</span>
                </div>
              </div>

              {/* Note */}
              {selectedOrder.notes && (
                <div className="bg-[#121A12]/40 border border-gold/10 p-3 rounded text-xs text-crema/80">
                  <span className="font-semibold text-gold block mb-1">Notas especiales de cocina:</span>
                  <p className="font-light italic">{selectedOrder.notes}</p>
                </div>
              )}

              {/* Status Update Quick Buttons */}
              <div className="space-y-2 border-t border-gold/15 pt-4">
                <span className="text-[10px] text-gold/50 uppercase tracking-wider block">Modificar Estado</span>
                <div className="flex flex-wrap gap-2">
                  {(['confirmado', 'preparacion', 'camino', 'entregado'] as OrderStatus[]).map((st) => (
                    <button
                      key={st}
                      onClick={() => handleStatusChange(selectedOrder.id, st)}
                      className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all duration-200 border ${
                        selectedOrder.status === st
                          ? 'bg-gold text-olive border-gold shadow'
                          : 'bg-[#121A12] border-gold/15 text-gold hover:bg-[#1E2C1E]'
                      }`}
                    >
                      {st === 'confirmado' && 'Confirmar'}
                      {st === 'preparacion' && 'Preparar'}
                      {st === 'camino' && 'Despachar'}
                      {st === 'entregado' && 'Entregar'}
                    </button>
                  ))}
                  
                  {/* Mark Payment Status */}
                  <button
                    onClick={async () => {
                      const updated = {
                        ...selectedOrder,
                        payment_status: (selectedOrder.payment_status === 'pagado' ? 'pendiente' : 'pagado') as any
                      };
                      await db.saveOrder(updated, selectedOrder.items || []);
                      setOrders(prev => prev.map(o => o.id === selectedOrder.id ? updated : o));
                      setSelectedOrder(updated);
                    }}
                    className={`px-3 py-1.5 rounded text-[10px] font-bold uppercase transition-all duration-200 border ${
                      selectedOrder.payment_status === 'pagado'
                        ? 'bg-green-500 text-crema border-green-500 shadow'
                        : 'bg-[#121A12] border-gold/15 text-gold hover:bg-[#1E2C1E]'
                    }`}
                  >
                    {selectedOrder.payment_status === 'pagado' ? 'Marcar Pendiente Pago' : 'Marcar como Pagado'}
                  </button>
                </div>
              </div>

              {/* Printing Utilities */}
              <div className="border-t border-gold/15 pt-4 flex gap-4">
                <button
                  onClick={handlePrint}
                  className="flex-1 inline-flex items-center justify-center gap-2 bg-[#121A12] border border-gold/25 text-gold hover:bg-gold hover:text-olive py-2.5 rounded text-xs font-semibold uppercase tracking-wider transition-all duration-300"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimir Ticket</span>
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* EDIT VIEW DIALOG / MODAL */}
      {editingOrder && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="absolute inset-0 bg-[#000]/60 backdrop-blur-sm" onClick={() => setEditingOrder(null)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-xl rounded-lg bg-[#0E150E] border border-gold/25 p-6 shadow-2xl space-y-5">
              
              {/* Header */}
              <div className="flex justify-between items-center border-b border-gold/15 pb-4">
                <div className="space-y-0.5">
                  <h3 className="editorial-title text-xl text-gold font-light">Modificar Pedido</h3>
                  <span className="font-mono text-xs text-crema/40 font-bold">FOLIO: {editingOrder.order_number}</span>
                </div>
                <button
                  onClick={() => setEditingOrder(null)}
                  className="text-crema/40 hover:text-crema text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              {/* Form fields */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-wider block mb-1.5">Nombre del Cliente</label>
                  <input
                    type="text"
                    value={editClientName}
                    onChange={(e) => setEditClientName(e.target.value)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-2.5 text-xs text-crema focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-wider block mb-1.5">Teléfono (WhatsApp)</label>
                  <input
                    type="text"
                    value={editClientPhone}
                    onChange={(e) => setEditClientPhone(e.target.value)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-2.5 text-xs text-crema focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-wider block mb-1.5">Fecha de Entrega</label>
                  <input
                    type="date"
                    value={editDeliveryDate}
                    onChange={(e) => setEditDeliveryDate(e.target.value)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-2.5 text-xs text-crema focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-wider block mb-1.5">Horario de Entrega</label>
                  <input
                    type="text"
                    value={editDeliveryTimeSlot}
                    onChange={(e) => setEditDeliveryTimeSlot(e.target.value)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-2.5 text-xs text-crema focus:outline-none focus:border-gold"
                    placeholder="Ej: 11:00 - 13:00"
                  />
                </div>
              </div>

              <div className="text-xs">
                <label className="text-[10px] text-gold/60 uppercase tracking-wider block mb-1.5">Dirección de Entrega</label>
                <textarea
                  value={editDeliveryAddress}
                  onChange={(e) => setEditDeliveryAddress(e.target.value)}
                  rows={2}
                  className="w-full bg-[#121A12] border border-gold/15 rounded p-2.5 text-xs text-crema focus:outline-none focus:border-gold font-light leading-relaxed"
                />
              </div>

              <div className="text-xs">
                <label className="text-[10px] text-gold/60 uppercase tracking-wider block mb-1.5">Referencias de Entrega</label>
                <textarea
                  value={editDeliveryInstructions}
                  onChange={(e) => setEditDeliveryInstructions(e.target.value)}
                  rows={2}
                  className="w-full bg-[#121A12] border border-gold/15 rounded p-2.5 text-xs text-crema focus:outline-none focus:border-gold font-light leading-relaxed"
                  placeholder="Instrucciones o referencias de entrega..."
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-wider block mb-1.5">Distancia (km)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={editDistanceKm}
                    onChange={(e) => {
                      const dist = parseFloat(e.target.value) || 0;
                      setEditDistanceKm(dist);
                    }}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-2.5 text-xs text-crema focus:outline-none focus:border-gold text-center"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-wider block mb-1.5">Costo de Envío ($)</label>
                  <input
                    type="number"
                    value={editDeliveryFee}
                    onChange={(e) => setEditDeliveryFee(parseFloat(e.target.value) || 0)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-2.5 text-xs text-crema focus:outline-none focus:border-gold text-right"
                  />
                </div>
                <div>
                  <label className="text-[10px] text-gold/60 uppercase tracking-wider block mb-1.5">Método de Pago</label>
                  <select
                    value={editPaymentMethod}
                    onChange={(e) => setEditPaymentMethod(e.target.value as any)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-2.5 text-xs text-crema focus:outline-none focus:border-gold"
                  >
                    <option value="efectivo">Efectivo</option>
                    <option value="transferencia">Transferencia</option>
                    <option value="link_pago">Tarjeta (Mercado Pago)</option>
                  </select>
                </div>
              </div>

              {/* Items List inside Editing Modal */}
              <div className="space-y-2 text-xs">
                <span className="text-[10px] text-gold/60 uppercase tracking-wider block">Artículos del Pedido</span>
                <div className="divide-y divide-gold/5 max-h-40 overflow-y-auto pr-1">
                  {editItems.map((item, idx) => (
                    <div key={idx} className="py-2.5 flex items-center justify-between gap-3 text-xs">
                      <div className="flex-grow">
                        <span className="font-semibold text-gold">{item.product_name}</span>
                        {Object.keys(item.variant_choices || {}).length > 0 && (
                          <span className="block text-[10px] text-gold/60 font-light mt-0.5">
                            {Object.entries(item.variant_choices).map(([k,v]) => `${k}: ${v}`).join(', ')}
                          </span>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {/* Quantity controls */}
                        <div className="flex items-center border border-gold/15 rounded overflow-hidden">
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...editItems];
                              if (updated[idx].quantity > 1) {
                                updated[idx].quantity -= 1;
                                setEditItems(updated);
                              }
                            }}
                            className="p-1 hover:bg-gold/5 text-gold"
                          >
                            -
                          </button>
                          <span className="px-2 text-[10px] font-bold text-crema">{item.quantity}</span>
                          <button
                            type="button"
                            onClick={() => {
                              const updated = [...editItems];
                              updated[idx].quantity += 1;
                              setEditItems(updated);
                            }}
                            className="p-1 hover:bg-gold/5 text-gold"
                          >
                            +
                          </button>
                        </div>
                        {/* Price Input */}
                        <input
                          type="number"
                          value={item.price}
                          onChange={(e) => {
                            const updated = [...editItems];
                            updated[idx].price = parseFloat(e.target.value) || 0;
                            setEditItems(updated);
                          }}
                          className="w-16 bg-[#121A12] border border-gold/15 rounded p-1 text-center font-semibold text-crema text-[11px] focus:outline-none focus:border-gold"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="text-xs">
                <label className="text-[10px] text-gold/60 uppercase tracking-wider block mb-1">Notas Especiales / Comentarios</label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={2}
                  className="w-full bg-[#121A12] border border-gold/15 rounded p-2.5 text-xs text-crema focus:outline-none focus:border-gold font-light"
                />
              </div>

              {/* Total Calculation Display */}
              <div className="bg-[#121A12]/40 border border-gold/10 p-3.5 rounded text-xs space-y-1">
                <div className="flex justify-between items-center text-crema/60">
                  <span>Subtotal Artículos:</span>
                  <span>${editItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center text-crema/60">
                  <span>Envío:</span>
                  <span>${editDeliveryFee.toFixed(2)}</span>
                </div>
                <div className="flex justify-between items-center font-bold text-gold border-t border-gold/5 pt-2 text-sm">
                  <span>Total Estimado:</span>
                  <span>${(editItems.reduce((acc, curr) => acc + (curr.price * curr.quantity), 0) + editDeliveryFee).toFixed(2)}</span>
                </div>
              </div>

              {/* Actions */}
              <div className="border-t border-gold/15 pt-4 flex gap-3 justify-end text-xs">
                <button
                  onClick={() => setEditingOrder(null)}
                  className="px-5 py-2.5 rounded bg-olive/10 border border-olive/20 text-crema/60 hover:bg-olive/20 transition-all font-semibold uppercase tracking-wider"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveOrderEdit}
                  className="px-6 py-2.5 rounded bg-gold text-olive hover:bg-gold-bright transition-all font-bold uppercase tracking-wider shadow-lg"
                >
                  Guardar Cambios
                </button>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* Hidden Print Container specifically targeted by @media print in globals.css */}
      {selectedOrder && (
        <div id="print-ticket" className="hidden p-6 text-black font-mono">
          <div className="text-center border-b pb-4 mb-4">
            <h2 className="text-xl font-bold">M A I S O N   V I I I</h2>
            <p className="text-[10px]">TICKET DE ORDEN</p>
            <p className="text-[11px] font-bold">FOLIO: {selectedOrder.order_number}</p>
          </div>
          <div className="text-[11px] space-y-1 mb-4">
            <p><strong>Cliente:</strong> {selectedOrder.client_name}</p>
            <p><strong>Teléfono:</strong> {selectedOrder.client_phone}</p>
            <p><strong>Fecha Entrega:</strong> {selectedOrder.delivery_date} ({selectedOrder.delivery_time_slot})</p>
            <p><strong>Dirección:</strong> {selectedOrder.delivery_address}</p>
            {selectedOrder.delivery_instructions && <p><strong>Referencias:</strong> {selectedOrder.delivery_instructions}</p>}
            <p><strong>Método de Pago:</strong> {selectedOrder.payment_method.toUpperCase()}</p>
          </div>
          <div className="border-t border-b py-2 mb-4 text-[11px]">
            <p className="font-bold border-b pb-1 mb-1">Items:</p>
            {selectedOrder.items?.map((it, idx) => (
              <div key={idx} className="flex justify-between">
                <span>{it.quantity}x {it.product_name}</span>
                <span>${(it.price * it.quantity).toFixed(2)}</span>
              </div>
            ))}
          </div>
          <div className="text-right text-[11px] space-y-1">
            <p>Subtotal: ${selectedOrder.subtotal.toFixed(2)}</p>
            <p>Envío: ${selectedOrder.delivery_fee.toFixed(2)}</p>
            <p className="font-bold">Total: ${selectedOrder.total.toFixed(2)}</p>
          </div>
          {selectedOrder.notes && (
            <div className="border-t mt-4 pt-2 text-[10px] italic">
              <p>Notas: {selectedOrder.notes}</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
