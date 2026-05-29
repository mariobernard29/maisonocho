'use client';

import React, { useState, useEffect } from 'react';
import { Search, Users, Award, Tag, Edit, Plus, Notebook } from 'lucide-react';
import { db } from '../../../lib/supabase';
import { Customer, Order } from '../../../types';

export default function AdminCustomers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [loading, setLoading] = useState(true);

  // Search & Filter
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTag, setActiveTag] = useState('all');

  // Customer Notes/Tag Editor States
  const [notesText, setNotesText] = useState('');
  const [newTagText, setNewTagText] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [cData, oData] = await Promise.all([
          db.getCustomers(),
          db.getOrders()
        ]);
        setCustomers(cData);
        setOrders(oData);
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleOpenDetails = (cust: Customer) => {
    setSelectedCustomer(cust);
    setNotesText(cust.notes || '');
  };

  const handleSaveNotes = async () => {
    if (!selectedCustomer) return;
    const updated = { ...selectedCustomer, notes: notesText };
    
    await db.saveCustomer(updated);
    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updated : c));
    setSelectedCustomer(updated);
    alert('Notas internas guardadas con éxito! 📝');
  };

  const handleAddTag = async () => {
    if (!selectedCustomer || !newTagText.trim()) return;
    const trimmed = newTagText.trim();
    if (selectedCustomer.tags.includes(trimmed)) return;

    const updated = { ...selectedCustomer, tags: [...selectedCustomer.tags, trimmed] };
    await db.saveCustomer(updated);
    
    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updated : c));
    setSelectedCustomer(updated);
    setNewTagText('');
  };

  const handleRemoveTag = async (tagToRemove: string) => {
    if (!selectedCustomer) return;
    const updated = {
      ...selectedCustomer,
      tags: selectedCustomer.tags.filter(t => t !== tagToRemove)
    };
    await db.saveCustomer(updated);
    
    setCustomers(prev => prev.map(c => c.id === selectedCustomer.id ? updated : c));
    setSelectedCustomer(updated);
  };

  const customerOrders = selectedCustomer 
    ? orders.filter(o => o.client_phone === selectedCustomer.phone)
    : [];

  // Get all unique tags for filter tabs
  const allTagsSet = new Set<string>();
  customers.forEach(c => c.tags?.forEach(t => allTagsSet.add(t)));
  const uniqueTags = Array.from(allTagsSet);

  const filteredCustomers = customers.filter(c => {
    const matchesTag = activeTag === 'all' || c.tags?.includes(activeTag);
    const matchesSearch = 
      c.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
      c.phone.includes(searchQuery) ||
      (c.address_default && c.address_default.toLowerCase().includes(searchQuery.toLowerCase()));
    return matchesTag && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Search and Filters */}
      <div className="flex flex-col xl:flex-row gap-4 justify-between items-center bg-[#0A0F0A] border border-gold/10 p-5 rounded-lg shadow-xl">
        {/* Horizontal tag tabs */}
        <div className="flex flex-wrap items-center gap-1.5 overflow-x-auto w-full xl:w-auto">
          <button
            onClick={() => setActiveTag('all')}
            className={`px-4 py-2 rounded text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
              activeTag === 'all'
                ? 'bg-gold text-olive shadow'
                : 'bg-[#121A12]/40 text-crema/60 border border-gold/5 hover:bg-[#1E2C1E] hover:text-gold'
            }`}
          >
            Todos
          </button>
          {uniqueTags.map(tag => (
            <button
              key={tag}
              onClick={() => setActiveTag(tag)}
              className={`px-4 py-2 rounded text-xs font-semibold tracking-wider uppercase transition-all duration-200 ${
                activeTag === tag
                  ? 'bg-gold text-olive shadow'
                  : 'bg-[#121A12]/40 text-crema/60 border border-gold/5 hover:bg-[#1E2C1E] hover:text-gold'
              }`}
            >
              {tag}
            </button>
          ))}
        </div>

        {/* Search Input */}
        <div className="relative w-full xl:w-80">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-crema/30" />
          <input
            type="text"
            placeholder="Buscar por nombre, tel o dirección..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#121A12]/50 border border-gold/10 rounded pl-9 pr-3 py-2 text-xs text-crema focus:outline-none focus:border-gold transition-colors"
          />
        </div>
      </div>

      {/* Directory Table */}
      <div className="bg-[#0A0F0A] border border-gold/10 rounded-lg shadow-xl overflow-hidden">
        {loading ? (
          <div className="p-20 text-center animate-pulse">
            <span className="editorial-title text-2xl text-gold">Consultando tarjetero de clientes...</span>
          </div>
        ) : filteredCustomers.length === 0 ? (
          <div className="p-20 text-center">
            <Users className="w-12 h-12 text-gold/20 mx-auto mb-3" />
            <p className="editorial-title text-lg text-crema/50">Sin clientes en el directorio</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="bg-[#121A12]/60 border-b border-gold/10 text-gold font-semibold uppercase tracking-wider">
                  <th className="p-4">Cliente</th>
                  <th className="p-4">Dirección Frecuente</th>
                  <th className="p-4 text-center">Pedidos</th>
                  <th className="p-4 text-right">Total Gastado</th>
                  <th className="p-4">Etiquetas</th>
                  <th className="p-4 text-center">Acciones</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gold/5">
                {filteredCustomers.map((c) => (
                  <tr key={c.id} className="hover:bg-[#121A12]/20 transition-colors">
                    <td className="p-4 space-y-0.5">
                      <p className="font-semibold text-crema text-sm">{c.name}</p>
                      <span className="text-[10px] text-crema/40">{c.phone}</span>
                    </td>
                    <td className="p-4 max-w-xs truncate text-crema/70">
                      {c.address_default || 'No registrada'}
                    </td>
                    <td className="p-4 font-semibold text-crema text-center">{c.orders_count}</td>
                    <td className="p-4 font-bold text-gold text-right">${c.total_spent.toFixed(2)}</td>
                    <td className="p-4">
                      <div className="flex flex-wrap gap-1">
                        {c.tags?.map((t, idx) => (
                          <span key={idx} className="bg-gold/10 border border-gold/25 text-gold text-[9px] font-semibold px-2 py-0.5 rounded">
                            {t}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center justify-center">
                        <button
                          onClick={() => handleOpenDetails(c)}
                          className="px-3.5 py-1.5 rounded bg-[#121A12] border border-gold/15 text-gold hover:bg-gold hover:text-olive transition-all duration-300 text-[10px] font-semibold uppercase tracking-wider inline-flex items-center gap-1"
                        >
                          <Notebook className="w-3 h-3" />
                          <span>Ficha CRM</span>
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

      {/* CRM CUSTOMER OVERLAY SCREEN */}
      {selectedCustomer && (
        <div className="fixed inset-0 z-50 overflow-y-auto">
          <div className="absolute inset-0 bg-[#000]/65 backdrop-blur-sm" onClick={() => setSelectedCustomer(null)} />
          <div className="flex min-h-full items-center justify-center p-4">
            <div className="relative w-full max-w-2xl rounded-lg bg-[#0E150E] border border-gold/25 p-6 shadow-2xl space-y-6">
              
              <div className="flex justify-between items-center border-b border-gold/15 pb-4">
                <div className="space-y-0.5">
                  <h3 className="editorial-title text-xl text-gold font-light">Ficha de Cliente CRM</h3>
                  <span className="text-xs text-crema/40">{selectedCustomer.name} &bull; {selectedCustomer.phone}</span>
                </div>
                <button
                  onClick={() => setSelectedCustomer(null)}
                  className="text-crema/40 hover:text-crema text-lg font-bold"
                >
                  &times;
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Notes and tags (Left) */}
                <div className="space-y-5">
                  {/* Notes Form */}
                  <div className="space-y-2 text-xs">
                    <span className="text-[10px] text-gold/60 uppercase tracking-wider block font-semibold">Notas Internas de Servicio</span>
                    <textarea
                      value={notesText}
                      onChange={(e) => setNotesText(e.target.value)}
                      rows={4}
                      className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-sm text-crema focus:outline-none focus:border-gold font-light"
                      placeholder="Historial, quejas, preferencias específicas, velas gratis..."
                    />
                    <button
                      onClick={handleSaveNotes}
                      className="bg-gold text-olive px-4 py-2 rounded text-[10px] font-bold uppercase hover:bg-gold-bright transition-all"
                    >
                      Guardar Notas
                    </button>
                  </div>

                  {/* Tags Manager */}
                  <div className="space-y-3 text-xs border-t border-gold/10 pt-4">
                    <span className="text-[10px] text-gold/60 uppercase tracking-wider block font-semibold">Etiquetas del Cliente</span>
                    
                    <div className="flex flex-wrap gap-1.5">
                      {selectedCustomer.tags?.map((t, idx) => (
                        <span key={idx} className="bg-gold/10 border border-gold/20 text-gold px-2 py-0.5 rounded-full inline-flex items-center gap-1.5 font-medium">
                          <span>{t}</span>
                          <button onClick={() => handleRemoveTag(t)} className="text-red-400 font-bold hover:text-red-300">
                            &times;
                          </button>
                        </span>
                      ))}
                    </div>

                    <div className="flex gap-2">
                      <input
                        type="text"
                        placeholder="Nueva etiqueta..."
                        value={newTagText}
                        onChange={(e) => setNewTagText(e.target.value)}
                        className="flex-1 bg-[#121A12] border border-gold/15 rounded px-2 py-1 text-xs text-crema"
                      />
                      <button
                        onClick={handleAddTag}
                        className="bg-[#121A12] border border-gold/20 hover:bg-gold hover:text-olive px-3 rounded text-[10px] font-bold uppercase transition-all"
                      >
                        Añadir
                      </button>
                    </div>
                  </div>
                </div>

                {/* Orders History List (Right) */}
                <div className="space-y-4 border-l border-gold/10 pl-0 md:pl-6 text-xs">
                  <span className="text-[10px] text-gold/60 uppercase tracking-wider block font-semibold">Historial de Compras ({customerOrders.length})</span>
                  
                  <div className="space-y-3 max-h-72 overflow-y-auto pr-1">
                    {customerOrders.length === 0 ? (
                      <p className="text-crema/40 py-6 text-center italic">Sin compras registradas aún.</p>
                    ) : (
                      customerOrders.map(o => (
                        <div key={o.id} className="bg-[#121A12]/40 border border-gold/5 p-3 rounded space-y-1">
                          <div className="flex justify-between font-semibold">
                            <span className="text-gold font-mono">{o.order_number}</span>
                            <span className="text-crema">${o.total.toFixed(2)}</span>
                          </div>
                          <div className="flex justify-between text-[10px] text-crema/40">
                            <span>{o.delivery_date}</span>
                            <span className="uppercase font-bold">{o.status}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}
    </div>
  );
}
