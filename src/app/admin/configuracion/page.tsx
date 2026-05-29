'use client';

import React, { useState, useEffect } from 'react';
import { Settings, MapPin, Calendar, Clock, Phone, Plus, Trash2, Save, AlertCircle } from 'lucide-react';
import { db } from '../../../lib/supabase';
import { DeliveryZone, BlockedDate, BlockedHour } from '../../../types';

export default function AdminConfiguracion() {
  const [activeTab, setActiveTab] = useState<'logistics' | 'schedule' | 'notifications'>('logistics');
  const [loading, setLoading] = useState(true);

  // Settings states
  const [whatsappAdmin, setWhatsappAdmin] = useState('');
  const [googleMapsOrigin, setGoogleMapsOrigin] = useState('');
  const [kitchenLat, setKitchenLat] = useState<number>(19.432608);
  const [kitchenLng, setKitchenLng] = useState<number>(-99.133209);
  const [clientTemplate, setClientTemplate] = useState('');
  const [adminTemplate, setAdminTemplate] = useState('');

  // Tables states
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);

  // Form Inputs for Tables additions
  const [newMinKm, setNewMinKm] = useState<number>(0);
  const [newMaxKm, setNewMaxKm] = useState<number>(0);
  const [newPrice, setNewPrice] = useState<number>(0);

  const [newBlockedDate, setNewBlockedDate] = useState('');
  const [newBlockedReason, setNewBlockedReason] = useState('');

  useEffect(() => {
    async function loadData() {
      try {
        const [sett, zoneList, dateList] = await Promise.all([
          db.getSettings(),
          db.getDeliveryZones(),
          db.getBlockedDates()
        ]);
        
        // Populate settings states
        setWhatsappAdmin(sett.whatsapp_number_admin || '');
        setGoogleMapsOrigin(sett.google_maps_origin_link || '');
        setKitchenLat(sett.delivery_kitchen_coords?.lat || 19.432608);
        setKitchenLng(sett.delivery_kitchen_coords?.lng || -99.133209);
        setClientTemplate(sett.whatsapp_template_client || '');
        setAdminTemplate(sett.whatsapp_template_admin || '');

        setZones(zoneList);
        setBlockedDates(dateList);
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  const handleSaveSettings = async () => {
    setLoading(true);
    try {
      const payload = {
        whatsapp_number_admin: whatsappAdmin,
        google_maps_origin_link: googleMapsOrigin,
        delivery_kitchen_coords: { lat: kitchenLat, lng: kitchenLng },
        whatsapp_template_client: clientTemplate,
        whatsapp_template_admin: adminTemplate
      };

      await db.saveSettings(payload);
      alert('Configuraciones generales guardadas con éxito! ✨');
    } catch (err) {
      console.error(err);
      alert('Error al guardar configuraciones.');
    } finally {
      setLoading(false);
    }
  };

  const handleAddZone = async () => {
    if (newMaxKm <= newMinKm || newPrice < 0) {
      alert('Por favor verifique los rangos de kilómetros y el precio.');
      return;
    }
    setLoading(true);
    try {
      const zoneObj: DeliveryZone = {
        id: `z_${Math.random().toString(36).substr(2, 9)}`,
        min_km: newMinKm,
        max_km: newMaxKm,
        price: newPrice,
        is_blocked: false
      };
      await db.saveDeliveryZone(zoneObj);
      setZones(prev => [...prev, zoneObj].sort((a,b) => a.min_km - b.min_km));
      setNewMinKm(newMaxKm);
      setNewMaxKm(0);
      setNewPrice(0);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleToggleZoneBlocked = async (zone: DeliveryZone) => {
    const updated = { ...zone, is_blocked: !zone.is_blocked };
    await db.saveDeliveryZone(updated);
    setZones(prev => prev.map(z => z.id === zone.id ? updated : z));
  };

  const handleAddBlockedDate = async () => {
    if (!newBlockedDate || !newBlockedReason.trim()) return;
    setLoading(true);
    try {
      const dateObj: BlockedDate = {
        id: `bd_${Math.random().toString(36).substr(2, 9)}`,
        date: newBlockedDate,
        reason: newBlockedReason.trim()
      };
      await db.saveBlockedDate(dateObj);
      setBlockedDates(prev => [...prev, dateObj].sort((a,b) => a.date.localeCompare(b.date)));
      setNewBlockedDate('');
      setNewBlockedReason('');
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteBlockedDate = async (id: string) => {
    setLoading(true);
    try {
      await db.deleteBlockedDate(id);
      setBlockedDates(prev => prev.filter(d => d.id !== id));
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  if (loading && zones.length === 0) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-pulse text-center">
          <span className="editorial-title text-3xl text-gold">MAISON VIII</span>
          <p className="text-xs text-crema/40 mt-1 uppercase tracking-widest">Cargando Panel de Control...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Category selector row */}
      <div className="flex border-b border-gold/15 pb-4 gap-4">
        {[
          { id: 'logistics', name: 'Zonas y Envío', icon: MapPin },
          { id: 'schedule', name: 'Fechas y Horarios', icon: Calendar },
          { id: 'notifications', name: 'WhatsApp y Plantillas', icon: Phone }
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 rounded text-xs font-semibold tracking-wider uppercase inline-flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? 'bg-gold text-olive shadow-lg font-bold'
                  : 'bg-[#121A12]/40 text-crema/60 border border-gold/5 hover:bg-[#1E2C1E] hover:text-gold'
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LOGISTICS */}
      {activeTab === 'logistics' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Settings origins */}
          <div className="lg:col-span-5 bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-5 text-xs">
            <h3 className="editorial-title text-lg text-gold font-light border-b border-gold/15 pb-3">Dirección Origen (Dark Kitchen)</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">Link de Google Maps</label>
                <input
                  type="text"
                  value={googleMapsOrigin}
                  onChange={(e) => setGoogleMapsOrigin(e.target.value)}
                  className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-xs text-crema focus:outline-none focus:border-gold"
                  placeholder="https://maps.app.goo.gl/..."
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">Latitud Coordenadas</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={kitchenLat}
                    onChange={(e) => setKitchenLat(parseFloat(e.target.value))}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-xs text-crema focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">Longitud Coordenadas</label>
                  <input
                    type="number"
                    step="0.000001"
                    value={kitchenLng}
                    onChange={(e) => setKitchenLng(parseFloat(e.target.value))}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-xs text-crema focus:outline-none focus:border-gold"
                  />
                </div>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full inline-flex items-center justify-center gap-2 bg-gold text-olive hover:bg-gold-bright py-3 rounded font-bold uppercase transition-all shadow-lg text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Ubicación</span>
              </button>
            </div>
          </div>

          {/* Zones Table CRUD */}
          <div className="lg:col-span-7 bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-6 text-xs">
            <h3 className="editorial-title text-lg text-gold font-light border-b border-gold/15 pb-3">Tarifario de Envío por Distancia</h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#121A12]/40 border-b border-gold/10 text-gold font-semibold uppercase tracking-wider">
                    <th className="p-3">Rango Min</th>
                    <th className="p-3">Rango Max</th>
                    <th className="p-3 text-right">Precio Envío</th>
                    <th className="p-3 text-center">Estado</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/5">
                  {zones.map((z) => (
                    <tr key={z.id} className="hover:bg-[#121A12]/20">
                      <td className="p-3 font-semibold text-crema">{z.min_km} km</td>
                      <td className="p-3 font-semibold text-crema">{z.max_km === 99 ? '8+ km' : `${z.max_km} km`}</td>
                      <td className="p-3 font-bold text-gold text-right">${z.price.toFixed(2)}</td>
                      <td className="p-3 text-center">
                        <button
                          onClick={() => handleToggleZoneBlocked(z)}
                          className={`px-3 py-1 rounded text-[9px] font-bold border uppercase transition-colors ${
                            z.is_blocked
                              ? 'bg-red-500/10 border-red-500/25 text-red-400'
                              : 'bg-green-500/10 border-green-500/25 text-green-400'
                          }`}
                        >
                          {z.is_blocked ? 'Bloqueada' : 'Activa'}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Add Zone Row */}
            <div className="bg-[#121A12]/40 border border-gold/10 p-4 rounded space-y-3">
              <span className="text-[10px] font-semibold tracking-wider text-gold uppercase block">Crear Nueva Regla / Zona</span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Min Km"
                  value={isNaN(newMinKm) || newMinKm === 0 ? '' : newMinKm}
                  onChange={(e) => setNewMinKm(parseFloat(e.target.value) || 0)}
                  className="bg-[#0A0F0A] border border-gold/15 rounded px-3 py-2 text-crema"
                />
                <input
                  type="number"
                  placeholder="Max Km"
                  value={isNaN(newMaxKm) || newMaxKm === 0 ? '' : newMaxKm}
                  onChange={(e) => setNewMaxKm(parseFloat(e.target.value) || 0)}
                  className="bg-[#0A0F0A] border border-gold/15 rounded px-3 py-2 text-crema"
                />
                <input
                  type="number"
                  placeholder="Precio ($)"
                  value={isNaN(newPrice) || newPrice === 0 ? '' : newPrice}
                  onChange={(e) => setNewPrice(parseFloat(e.target.value) || 0)}
                  className="bg-[#0A0F0A] border border-gold/15 rounded px-3 py-2 text-crema"
                />
              </div>
              <button
                onClick={handleAddZone}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-gold text-olive hover:bg-gold-bright py-2 rounded font-bold uppercase transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Agregar Regla</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: SCHEDULE (BLOCKED DATES) */}
      {activeTab === 'schedule' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 text-xs">
          <div className="lg:col-span-5 bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-5">
            <h3 className="editorial-title text-lg text-gold font-light border-b border-gold/15 pb-3">Bloqueo de Fechas Especiales</h3>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">Fecha a Bloquear</label>
                <input
                  type="date"
                  value={newBlockedDate}
                  onChange={(e) => setNewBlockedDate(e.target.value)}
                  className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-xs text-crema focus:outline-none"
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">Motivo (Ej. Navidad)</label>
                <input
                  type="text"
                  value={newBlockedReason}
                  onChange={(e) => setNewBlockedReason(e.target.value)}
                  className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-xs text-crema focus:outline-none"
                  placeholder="Ej. Vacaciones de Cocina"
                />
              </div>

              <button
                onClick={handleAddBlockedDate}
                className="w-full inline-flex items-center justify-center gap-1.5 bg-gold text-olive hover:bg-gold-bright py-3 rounded font-bold uppercase transition-all shadow-lg text-xs"
              >
                <Plus className="w-4 h-4" />
                <span>Bloquear Fecha</span>
              </button>
            </div>
          </div>

          <div className="lg:col-span-7 bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-6">
            <h3 className="editorial-title text-lg text-gold font-light border-b border-gold/15 pb-3">Fechas Bloqueadas Activas</h3>

            <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
              {blockedDates.length === 0 ? (
                <p className="text-crema/40 text-center py-8 italic">No hay fechas bloqueadas actualmente.</p>
              ) : (
                blockedDates.map((d) => (
                  <div key={d.id} className="bg-[#121A12]/40 border border-gold/5 p-4 rounded flex justify-between items-center">
                    <div className="space-y-0.5">
                      <span className="font-bold text-crema text-sm">{d.date}</span>
                      <p className="text-crema/60 font-light">{d.reason}</p>
                    </div>
                    <button
                      onClick={() => handleDeleteBlockedDate(d.id)}
                      className="p-2 rounded bg-[#121A12] border border-red-500/15 text-red-400 hover:bg-red-950 transition-colors"
                      title="Eliminar"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS & WHATSAPP TEMPLATES */}
      {activeTab === 'notifications' && (
        <div className="bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-6 text-xs">
          <div className="flex justify-between items-center border-b border-gold/15 pb-3">
            <h3 className="editorial-title text-lg text-gold font-light">Configuración de Mensajería WhatsApp (Twilio)</h3>
            <button
              onClick={handleSaveSettings}
              className="inline-flex items-center gap-1.5 bg-gold text-olive hover:bg-gold-bright px-5 py-2.5 rounded font-bold uppercase transition-all shadow-lg text-xs"
            >
              <Save className="w-3.5 h-3.5" />
              <span>Guardar Todo</span>
            </button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div>
                <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">Número del Administrador (Destinatario Alertas)</label>
                <input
                  type="text"
                  value={whatsappAdmin}
                  onChange={(e) => setWhatsappAdmin(e.target.value)}
                  className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-xs text-crema focus:outline-none focus:border-gold"
                  placeholder="Ej. +525512345678"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">Plantilla Mensaje Cliente</label>
                <textarea
                  value={clientTemplate}
                  onChange={(e) => setClientTemplate(e.target.value)}
                  rows={8}
                  className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-xs text-crema focus:outline-none focus:border-gold font-mono leading-relaxed"
                />
                <span className="text-[9px] text-crema/40 block mt-1">Variables utilizables: &#123;nombre&#125;, &#123;productos&#125;, &#123;total&#125;, &#123;fecha&#125;, &#123;hora&#125;</span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#121A12]/30 border border-gold/10 p-4 rounded text-xs text-crema/70 space-y-2">
                <span className="font-semibold text-gold block flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Configuración API Twilio</span>
                </span>
                <p>Las credenciales principales de la pasarela de WhatsApp (Twilio Account SID, Auth Token y WhatsApp Sender Number) deben configurarse en el archivo `.env.local` en producción para mayor seguridad del servidor.</p>
              </div>

              <div>
                <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">Plantilla Mensaje Alerta Negocio (Admin)</label>
                <textarea
                  value={adminTemplate}
                  onChange={(e) => setAdminTemplate(e.target.value)}
                  rows={8}
                  className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-xs text-crema focus:outline-none focus:border-gold font-mono leading-relaxed"
                />
                <span className="text-[9px] text-crema/40 block mt-1">Variables utilizables: &#123;nombre&#125;, &#123;telefono&#125;, &#123;direccion&#125;, &#123;productos&#125;, &#123;total&#125;, &#123;fecha&#125;, &#123;hora&#125;</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
