"use client";

import React, { useState, useEffect } from "react";
import {
  Settings,
  MapPin,
  Calendar,
  Clock,
  Phone,
  Plus,
  Trash2,
  Save,
  AlertCircle,
} from "lucide-react";
import { db } from "../../../lib/supabase";
import { DeliveryZone, BlockedDate, BlockedHour } from "../../../types";
import { generateUUID } from "../../../lib/uuid";

export default function AdminConfiguracion() {
  const [activeTab, setActiveTab] = useState<
    "logistics" | "schedule" | "notifications"
  >("logistics");
  const [loading, setLoading] = useState(true);

  // Settings states
  const [whatsappAdmin, setWhatsappAdmin] = useState("");
  const [googleMapsOrigin, setGoogleMapsOrigin] = useState("");
  const [kitchenLat, setKitchenLat] = useState<number>(19.432608);
  const [kitchenLng, setKitchenLng] = useState<number>(-99.133209);
  const [clientTemplate, setClientTemplate] = useState("");
  const [adminTemplate, setAdminTemplate] = useState("");
  const [showPrepTime, setShowPrepTime] = useState<boolean>(true);

  // Custom scheduling states
  const [restDays, setRestDays] = useState<number[]>([0]); // 0 = Sunday (default)
  const [timeSlots, setTimeSlots] = useState<string[]>([]);
  const [newTimeSlot, setNewTimeSlot] = useState("");

  // Editing zone states
  const [editingZoneId, setEditingZoneId] = useState<string | null>(null);
  const [editMinKm, setEditMinKm] = useState<number>(0);
  const [editMaxKm, setEditMaxKm] = useState<number>(0);
  const [editPrice, setEditPrice] = useState<number>(0);

  // Tables states
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);

  // Form Inputs for Tables additions
  const [newMinKm, setNewMinKm] = useState<number>(0);
  const [newMaxKm, setNewMaxKm] = useState<number>(0);
  const [newPrice, setNewPrice] = useState<number>(0);

  const [newBlockedDate, setNewBlockedDate] = useState("");
  const [newBlockedReason, setNewBlockedReason] = useState("");

  useEffect(() => {
    async function loadData() {
      try {
        const [sett, zoneList, dateList] = await Promise.all([
          db.getSettings(),
          db.getDeliveryZones(),
          db.getBlockedDates(),
        ]);

        // Populate settings states
        setWhatsappAdmin(sett.whatsapp_number_admin || "");
        setGoogleMapsOrigin(sett.google_maps_origin_link || "");
        setKitchenLat(sett.delivery_kitchen_coords?.lat || 19.432608);
        setKitchenLng(sett.delivery_kitchen_coords?.lng || -99.133209);
        setClientTemplate(sett.whatsapp_template_client || "");
        setAdminTemplate(sett.whatsapp_template_admin || "");
        setShowPrepTime(
          sett.show_prep_time === true || sett.show_prep_time === "true",
        );

        // Load custom time slots
        if (sett.time_slots) {
          try {
            const slots =
              typeof sett.time_slots === "string"
                ? JSON.parse(sett.time_slots)
                : sett.time_slots;
            if (Array.isArray(slots)) setTimeSlots(slots);
          } catch (e) {
            console.error(e);
          }
        } else {
          setTimeSlots([
            "09:00 - 11:00",
            "11:00 - 13:00",
            "13:00 - 15:00",
            "15:00 - 17:00",
            "17:00 - 19:00",
          ]);
        }

        // Load custom rest days
        if (sett.rest_days) {
          try {
            const days =
              typeof sett.rest_days === "string"
                ? JSON.parse(sett.rest_days)
                : sett.rest_days;
            if (Array.isArray(days)) setRestDays(days);
          } catch (e) {
            console.error(e);
          }
        }

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
        whatsapp_template_admin: adminTemplate,
        show_prep_time: showPrepTime,
        rest_days: restDays,
        time_slots: timeSlots,
      };

      await db.saveSettings(payload);
      alert("Configuraciones generales guardadas con éxito! ✨");
    } catch (err) {
      console.error(err);
      alert("Error al guardar configuraciones.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveScheduleSettings = async () => {
    setLoading(true);
    try {
      const payload = {
        whatsapp_number_admin: whatsappAdmin,
        google_maps_origin_link: googleMapsOrigin,
        delivery_kitchen_coords: { lat: kitchenLat, lng: kitchenLng },
        whatsapp_template_client: clientTemplate,
        whatsapp_template_admin: adminTemplate,
        show_prep_time: showPrepTime,
        rest_days: restDays,
        time_slots: timeSlots,
      };

      await db.saveSettings(payload);
      alert("Horarios de entrega y días de descanso guardados con éxito! ✨");
    } catch (err) {
      console.error(err);
      alert("Error al guardar horarios y días de descanso.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddTimeSlot = () => {
    const trimmed = newTimeSlot.trim();
    if (!trimmed) return;
    if (timeSlots.includes(trimmed)) {
      alert("Este horario ya existe.");
      return;
    }
    setTimeSlots((prev) => [...prev, trimmed].sort());
    setNewTimeSlot("");
  };

  const handleDeleteTimeSlot = (slot: string) => {
    setTimeSlots((prev) => prev.filter((s) => s !== slot));
  };

  const handleToggleRestDay = (dayNum: number) => {
    setRestDays((prev) => {
      if (prev.includes(dayNum)) {
        return prev.filter((d) => d !== dayNum);
      } else {
        return [...prev, dayNum].sort();
      }
    });
  };

  const handleStartEditZone = (zone: DeliveryZone) => {
    setEditingZoneId(zone.id);
    setEditMinKm(zone.min_km);
    setEditMaxKm(zone.max_km);
    setEditPrice(zone.price);
  };

  const handleCancelEditZone = () => {
    setEditingZoneId(null);
  };

  const handleSaveEditZone = async (zone: DeliveryZone) => {
    if (editMaxKm <= editMinKm || editPrice < 0) {
      alert("Por favor verifique los rangos de kilómetros y el precio.");
      return;
    }
    setLoading(true);
    try {
      const updatedZone: DeliveryZone = {
        ...zone,
        min_km: editMinKm,
        max_km: editMaxKm,
        price: editPrice,
      };
      await db.saveDeliveryZone(updatedZone);
      setZones((prev) =>
        prev
          .map((z) => (z.id === zone.id ? updatedZone : z))
          .sort((a, b) => a.min_km - b.min_km),
      );
      setEditingZoneId(null);
      alert("Tarifa actualizada con éxito! ✨");
    } catch (e) {
      console.error(e);
      alert("Error al actualizar tarifa.");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteZone = async (id: string) => {
    if (!confirm("¿Está seguro de que desea eliminar esta tarifa de envío?"))
      return;
    setLoading(true);
    try {
      await db.deleteDeliveryZone(id);
      setZones((prev) => prev.filter((z) => z.id !== id));
      alert("Tarifa de envío eliminada con éxito.");
    } catch (e) {
      console.error(e);
      alert("Error al eliminar la tarifa.");
    } finally {
      setLoading(false);
    }
  };

  const handleAddZone = async () => {
    if (newMaxKm <= newMinKm || newPrice < 0) {
      alert("Por favor verifique los rangos de kilómetros y el precio.");
      return;
    }
    setLoading(true);
    try {
      const zoneObj: DeliveryZone = {
        id: generateUUID(),
        min_km: newMinKm,
        max_km: newMaxKm,
        price: newPrice,
        is_blocked: false,
      };
      await db.saveDeliveryZone(zoneObj);
      setZones((prev) =>
        [...prev, zoneObj].sort((a, b) => a.min_km - b.min_km),
      );
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
    setZones((prev) => prev.map((z) => (z.id === zone.id ? updated : z)));
  };

  const handleAddBlockedDate = async () => {
    if (!newBlockedDate || !newBlockedReason.trim()) return;
    setLoading(true);
    try {
      const dateObj: BlockedDate = {
        id: generateUUID(),
        date: newBlockedDate,
        reason: newBlockedReason.trim(),
      };
      await db.saveBlockedDate(dateObj);
      setBlockedDates((prev) =>
        [...prev, dateObj].sort((a, b) => a.date.localeCompare(b.date)),
      );
      setNewBlockedDate("");
      setNewBlockedReason("");
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
      setBlockedDates((prev) => prev.filter((d) => d.id !== id));
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
          <span className="editorial-title text-3xl text-gold">
            MAISON VIII
          </span>
          <p className="text-xs text-crema/40 mt-1 uppercase tracking-widest">
            Cargando Panel de Control...
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 animate-fade-in-up">
      {/* Category selector row */}
      <div className="flex border-b border-gold/15 pb-4 gap-4">
        {[
          { id: "logistics", name: "Zonas y Envío", icon: MapPin },
          { id: "schedule", name: "Fechas y Horarios", icon: Calendar },
          { id: "notifications", name: "WhatsApp y Plantillas", icon: Phone },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-5 py-3 rounded text-xs font-semibold tracking-wider uppercase inline-flex items-center gap-2 transition-all ${
                activeTab === tab.id
                  ? "bg-gold text-olive shadow-lg font-bold"
                  : "bg-[#121A12]/40 text-crema/60 border border-gold/5 hover:bg-[#1E2C1E] hover:text-gold"
              }`}
            >
              <Icon className="w-4 h-4" />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* TAB 1: LOGISTICS */}
      {activeTab === "logistics" && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Settings origins */}
          <div className="lg:col-span-5 space-y-6">
            <div className="bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-5 text-xs">
              <h3 className="editorial-title text-lg text-gold font-light border-b border-gold/15 pb-3">
                Dirección Origen (Dark Kitchen)
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">
                    Link de Google Maps
                  </label>
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
                    <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">
                      Latitud Coordenadas
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={kitchenLat}
                      onChange={(e) =>
                        setKitchenLat(parseFloat(e.target.value))
                      }
                      className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-xs text-crema focus:outline-none focus:border-gold"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">
                      Longitud Coordenadas
                    </label>
                    <input
                      type="number"
                      step="0.000001"
                      value={kitchenLng}
                      onChange={(e) =>
                        setKitchenLng(parseFloat(e.target.value))
                      }
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

            {/* Catalog display settings */}
            <div className="bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-5 text-xs">
              <h3 className="editorial-title text-lg text-gold font-light border-b border-gold/15 pb-3">
                Visualización del Catálogo
              </h3>
              <div className="flex items-center justify-between p-3.5 bg-[#121A12]/40 border border-gold/5 rounded">
                <div className="pr-4">
                  <span className="font-semibold text-crema block text-xs">
                    Mostrar Tiempo de Preparación
                  </span>
                  <span className="text-[10px] text-crema/40 leading-relaxed block font-light mt-0.5">
                    Muestra la etiqueta &apos;Prep: X min&apos; en la tienda y
                    landing page.
                  </span>
                </div>
                <label className="relative inline-flex items-center cursor-pointer flex-shrink-0">
                  <input
                    type="checkbox"
                    checked={showPrepTime}
                    onChange={(e) => setShowPrepTime(e.target.checked)}
                    className="sr-only peer"
                  />
                  <div className="w-9 h-5 bg-[#121A12] border border-gold/15 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-gold/40 after:border-gold/30 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-gold/20 peer-checked:after:bg-gold"></div>
                </label>
              </div>

              <button
                onClick={handleSaveSettings}
                className="w-full inline-flex items-center justify-center gap-2 bg-gold text-olive hover:bg-gold-bright py-3 rounded font-bold uppercase transition-all shadow-lg text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Visualización</span>
              </button>
            </div>
          </div>

          {/* Zones Table CRUD */}
          <div className="lg:col-span-7 bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-6 text-xs">
            <h3 className="editorial-title text-lg text-gold font-light border-b border-gold/15 pb-3">
              Tarifario de Envío por Distancia
            </h3>

            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="bg-[#121A12]/40 border-b border-gold/10 text-gold font-semibold uppercase tracking-wider">
                    <th className="p-3">Rango Min</th>
                    <th className="p-3">Rango Max</th>
                    <th className="p-3 text-right">Precio Envío</th>
                    <th className="p-3 text-center">Estado</th>
                    <th className="p-3 text-center">Acciones</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gold/5">
                  {zones.map((z) => {
                    const isEditing = editingZoneId === z.id;
                    return (
                      <tr
                        key={z.id}
                        className="hover:bg-[#121A12]/20 transition-colors"
                      >
                        {isEditing ? (
                          <>
                            <td className="p-2">
                              <input
                                type="number"
                                value={editMinKm}
                                onChange={(e) =>
                                  setEditMinKm(parseFloat(e.target.value) || 0)
                                }
                                className="w-16 bg-[#121A12] border border-gold/25 rounded px-2 py-1 text-crema text-xs text-center focus:outline-none focus:border-gold"
                              />
                            </td>
                            <td className="p-2">
                              <input
                                type="number"
                                value={editMaxKm}
                                onChange={(e) =>
                                  setEditMaxKm(parseFloat(e.target.value) || 0)
                                }
                                className="w-16 bg-[#121A12] border border-gold/25 rounded px-2 py-1 text-crema text-xs text-center focus:outline-none focus:border-gold"
                              />
                            </td>
                            <td className="p-2 text-right">
                              <input
                                type="number"
                                value={editPrice}
                                onChange={(e) =>
                                  setEditPrice(parseFloat(e.target.value) || 0)
                                }
                                className="w-20 bg-[#121A12] border border-gold/25 rounded px-2 py-1 text-crema text-xs text-right focus:outline-none focus:border-gold"
                              />
                            </td>
                            <td className="p-2 text-center text-crema/30">-</td>
                            <td className="p-2 text-center flex items-center justify-center gap-1.5 pt-3.5">
                              <button
                                onClick={() => handleSaveEditZone(z)}
                                className="px-2 py-1 rounded bg-green-500/10 border border-green-500/25 text-green-400 font-bold text-[10px] hover:bg-green-500/20 transition-colors"
                              >
                                Guardar
                              </button>
                              <button
                                onClick={handleCancelEditZone}
                                className="px-2 py-1 rounded bg-olive/10 border border-olive/20 text-crema/60 font-bold text-[10px] hover:bg-olive/20 transition-colors"
                              >
                                Cancelar
                              </button>
                            </td>
                          </>
                        ) : (
                          <>
                            <td className="p-3 font-semibold text-crema">
                              {z.min_km} km
                            </td>
                            <td className="p-3 font-semibold text-crema">
                              {z.max_km === 99 ? "8+ km" : `${z.max_km} km`}
                            </td>
                            <td className="p-3 font-bold text-gold text-right">
                              ${z.price.toFixed(2)}
                            </td>
                            <td className="p-3 text-center">
                              <button
                                onClick={() => handleToggleZoneBlocked(z)}
                                className={`px-3 py-1 rounded text-[9px] font-bold border uppercase transition-colors ${
                                  z.is_blocked
                                    ? "bg-red-500/10 border-red-500/25 text-red-400"
                                    : "bg-green-500/10 border-green-500/25 text-green-400"
                                }`}
                              >
                                {z.is_blocked ? "Bloqueada" : "Activa"}
                              </button>
                            </td>
                            <td className="p-3 text-center flex items-center justify-center gap-2">
                              <button
                                onClick={() => handleStartEditZone(z)}
                                className="px-2.5 py-1 rounded bg-gold/10 border border-gold/25 text-gold hover:bg-gold/20 font-bold text-[10px] transition-colors"
                              >
                                Editar
                              </button>
                              <button
                                onClick={() => handleDeleteZone(z.id)}
                                className="px-2.5 py-1 rounded bg-red-500/10 border border-red-500/25 text-red-400 hover:bg-red-500/20 font-bold text-[10px] transition-colors"
                              >
                                Eliminar
                              </button>
                            </td>
                          </>
                        )}
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Add Zone Row */}
            <div className="bg-[#121A12]/40 border border-gold/10 p-4 rounded space-y-3">
              <span className="text-[10px] font-semibold tracking-wider text-gold uppercase block">
                Crear Nueva Regla / Zona
              </span>
              <div className="grid grid-cols-3 gap-2">
                <input
                  type="number"
                  placeholder="Min Km"
                  value={isNaN(newMinKm) || newMinKm === 0 ? "" : newMinKm}
                  onChange={(e) => setNewMinKm(parseFloat(e.target.value) || 0)}
                  className="bg-[#0A0F0A] border border-gold/15 rounded px-3 py-2 text-crema"
                />
                <input
                  type="number"
                  placeholder="Max Km"
                  value={isNaN(newMaxKm) || newMaxKm === 0 ? "" : newMaxKm}
                  onChange={(e) => setNewMaxKm(parseFloat(e.target.value) || 0)}
                  className="bg-[#0A0F0A] border border-gold/15 rounded px-3 py-2 text-crema"
                />
                <input
                  type="number"
                  placeholder="Precio ($)"
                  value={isNaN(newPrice) || newPrice === 0 ? "" : newPrice}
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

      {/* TAB 2: SCHEDULE (WEEKLY REST DAYS, TIME SLOTS, AND BLOCKED DATES) */}
      {activeTab === "schedule" && (
        <div className="space-y-8 text-xs">
          {/* Row 1: Weekly Rest Days & Time Slots */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            {/* Weekly Rest Days Card */}
            <div className="lg:col-span-5 bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-5">
              <h3 className="editorial-title text-lg text-gold font-light border-b border-gold/15 pb-3">
                Días de Descanso (Semanal)
              </h3>
              <p className="text-[10px] text-crema/40 leading-relaxed block font-light -mt-2">
                Selecciona los días de la semana en los que la boutique
                permanece cerrada. Los clientes no podrán agendar entregas en
                estos días.
              </p>

              <div className="space-y-2.5">
                {[
                  { name: "Domingo", num: 0 },
                  { name: "Lunes", num: 1 },
                  { name: "Martes", num: 2 },
                  { name: "Miércoles", num: 3 },
                  { name: "Jueves", num: 4 },
                  { name: "Viernes", num: 5 },
                  { name: "Sábado", num: 6 },
                ].map((day) => {
                  const isChecked = restDays.includes(day.num);
                  return (
                    <label
                      key={day.num}
                      className="flex items-center justify-between p-3 bg-[#121A12]/40 border border-gold/5 rounded cursor-pointer hover:bg-[#1E2C1E]/30 transition-colors"
                    >
                      <span className="font-medium text-crema text-xs">
                        {day.name}
                      </span>
                      <input
                        type="checkbox"
                        checked={isChecked}
                        onChange={() => handleToggleRestDay(day.num)}
                        className="rounded border-gold/20 bg-[#0A0F0A] text-gold focus:ring-0 focus:ring-offset-0 h-4 w-4"
                      />
                    </label>
                  );
                })}
              </div>

              <button
                onClick={handleSaveScheduleSettings}
                className="w-full inline-flex items-center justify-center gap-2 bg-gold text-olive hover:bg-gold-bright py-3 rounded font-bold uppercase transition-all shadow-lg text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Días de Descanso</span>
              </button>
            </div>

            {/* Time Slots Card */}
            <div className="lg:col-span-7 bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-6">
              <h3 className="editorial-title text-lg text-gold font-light border-b border-gold/15 pb-3">
                Horarios de Entrega
              </h3>
              <p className="text-[10px] text-crema/40 leading-relaxed block font-light -mt-2">
                Administra los intervalos de horario disponibles para los
                pedidos. Los clientes seleccionarán uno de estos rangos al
                finalizar su compra.
              </p>

              {/* Time Slots List */}
              <div className="space-y-2.5 max-h-64 overflow-y-auto pr-1">
                {timeSlots.length === 0 ? (
                  <p className="text-crema/40 text-center py-6 italic">
                    No hay horarios configurados.
                  </p>
                ) : (
                  timeSlots.map((slot) => (
                    <div
                      key={slot}
                      className="bg-[#121A12]/40 border border-gold/5 p-3 rounded flex justify-between items-center"
                    >
                      <span className="font-mono font-bold text-crema text-sm">
                        {slot}
                      </span>
                      <button
                        onClick={() => handleDeleteTimeSlot(slot)}
                        className="p-1.5 rounded bg-[#121A12] border border-red-500/15 text-red-400 hover:bg-red-950 transition-colors"
                        title="Eliminar Horario"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))
                )}
              </div>

              {/* Add Time Slot Row */}
              <div className="bg-[#121A12]/40 border border-gold/10 p-4 rounded space-y-3">
                <span className="text-[10px] font-semibold tracking-wider text-gold uppercase block">
                  Añadir Intervalo de Horario
                </span>
                <div className="flex gap-2">
                  <input
                    type="text"
                    placeholder="Ej: 13:00 - 15:00"
                    value={newTimeSlot}
                    onChange={(e) => setNewTimeSlot(e.target.value)}
                    className="flex-grow bg-[#0A0F0A] border border-gold/15 rounded px-3 py-2 text-crema text-xs focus:outline-none focus:border-gold"
                  />
                  <button
                    onClick={handleAddTimeSlot}
                    className="bg-gold text-olive hover:bg-gold-bright px-5 rounded font-bold uppercase text-xs"
                  >
                    Añadir
                  </button>
                </div>
              </div>

              <button
                onClick={handleSaveScheduleSettings}
                className="w-full inline-flex items-center justify-center gap-2 bg-gold text-olive hover:bg-gold-bright py-3 rounded font-bold uppercase transition-all shadow-lg text-xs"
              >
                <Save className="w-4 h-4" />
                <span>Guardar Horarios</span>
              </button>
            </div>
          </div>

          {/* Row 2: Blocked Dates */}
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
            <div className="lg:col-span-5 bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-5">
              <h3 className="editorial-title text-lg text-gold font-light border-b border-gold/15 pb-3">
                Bloqueo de Fechas Especiales
              </h3>

              <div className="space-y-4">
                <div>
                  <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">
                    Fecha a Bloquear
                  </label>
                  <input
                    type="date"
                    value={newBlockedDate}
                    onChange={(e) => setNewBlockedDate(e.target.value)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-xs text-crema focus:outline-none focus:border-gold"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">
                    Motivo (Ej. Navidad)
                  </label>
                  <input
                    type="text"
                    value={newBlockedReason}
                    onChange={(e) => setNewBlockedReason(e.target.value)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-xs text-crema focus:outline-none focus:border-gold"
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
              <h3 className="editorial-title text-lg text-gold font-light border-b border-gold/15 pb-3">
                Fechas Bloqueadas Activas
              </h3>

              <div className="space-y-3 max-h-80 overflow-y-auto pr-1">
                {blockedDates.length === 0 ? (
                  <p className="text-crema/40 text-center py-8 italic">
                    No hay fechas bloqueadas actualmente.
                  </p>
                ) : (
                  blockedDates.map((d) => (
                    <div
                      key={d.id}
                      className="bg-[#121A12]/40 border border-gold/5 p-4 rounded flex justify-between items-center"
                    >
                      <div className="space-y-0.5">
                        <span className="font-bold text-crema text-sm">
                          {d.date}
                        </span>
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
        </div>
      )}

      {/* TAB 3: NOTIFICATIONS & WHATSAPP TEMPLATES */}
      {activeTab === "notifications" && (
        <div className="bg-[#0A0F0A] border border-gold/10 p-6 rounded-lg shadow-xl space-y-6 text-xs">
          <div className="flex justify-between items-center border-b border-gold/15 pb-3">
            <h3 className="editorial-title text-lg text-gold font-light">
              Configuración de Mensajería WhatsApp (YCLOUD)
            </h3>
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
                <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">
                  Número del Administrador (Destinatario Alertas)
                </label>
                <input
                  type="text"
                  value={whatsappAdmin}
                  onChange={(e) => setWhatsappAdmin(e.target.value)}
                  className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-xs text-crema focus:outline-none focus:border-gold"
                  placeholder="Ej. +525512345678"
                />
              </div>

              <div>
                <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">
                  Plantilla Mensaje Cliente
                </label>
                <textarea
                  value={clientTemplate}
                  onChange={(e) => setClientTemplate(e.target.value)}
                  rows={8}
                  className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-xs text-crema focus:outline-none focus:border-gold font-mono leading-relaxed"
                />
                <span className="text-[9px] text-crema/40 block mt-1">
                  Variables utilizables: &#123;nombre&#125;, &#123;folio&#125;,
                  &#123;fecha&#125;, &#123;hora&#125;, &#123;productos&#125;,
                  &#123;direccion&#125;, &#123;instrucciones&#125;,
                  &#123;subtotal&#125;, &#123;envio&#125;, &#123;total&#125;
                </span>
              </div>
            </div>

            <div className="space-y-4">
              <div className="bg-[#121A12]/30 border border-gold/10 p-4 rounded text-xs text-crema/70 space-y-2">
                <span className="font-semibold text-gold block flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" />
                  <span>Configuración API Twilio</span>
                </span>
                <p>
                  Las credenciales principales de la pasarela de WhatsApp
                  (YCLOUD Account SID, Auth Token y WhatsApp Sender Number)
                  deben configurarse en el archivo `.env.local` en producción
                  para mayor seguridad del servidor.
                </p>
              </div>

              <div>
                <label className="text-[10px] font-semibold tracking-wider text-gold uppercase block mb-1.5">
                  Plantilla Mensaje Alerta Negocio (Admin)
                </label>
                <textarea
                  value={adminTemplate}
                  onChange={(e) => setAdminTemplate(e.target.value)}
                  rows={8}
                  className="w-full bg-[#121A12] border border-gold/15 rounded p-3 text-xs text-crema focus:outline-none focus:border-gold font-mono leading-relaxed"
                />
                <span className="text-[9px] text-crema/40 block mt-1">
                  Variables utilizables: &#123;folio&#125;, &#123;nombre&#125;,
                  &#123;telefono&#125;, &#123;fecha&#125;, &#123;hora&#125;,
                  &#123;direccion&#125;, &#123;instrucciones&#125;,
                  &#123;comentarios&#125;, &#123;productos&#125;,
                  &#123;subtotal&#125;, &#123;envio&#125;, &#123;total&#125;,
                  &#123;forma_pago&#125;, &#123;waLink&#125;
                </span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
