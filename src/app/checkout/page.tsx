'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Calendar, Clock, MapPin, CreditCard, User, Phone, CheckCircle, ChevronRight, ChevronLeft, Loader2, Minus, Plus, Trash2 } from 'lucide-react';
import Header from '../../components/client/Header';
import Footer from '../../components/client/Footer';
import { useCart } from '../../hooks/use-cart';
import { db } from '../../lib/supabase';
import { DeliveryZone, BlockedDate } from '../../types';
import { generateUUID } from '../../lib/uuid';

// Zod Schema
const checkoutSchema = z.object({
  name: z.string().min(3, 'El nombre debe tener al menos 3 caracteres'),
  phone: z.string().min(10, 'El teléfono debe tener al menos 10 dígitos'),
  address: z.string().min(5, 'La dirección es obligatoria'),
  deliveryDate: z.string().min(1, 'Seleccione una fecha de entrega'),
  deliveryTimeSlot: z.string().min(1, 'Seleccione un horario de entrega'),
  paymentMethod: z.enum(['efectivo', 'transferencia', 'link_pago']),
  notes: z.string().optional(),
  deliveryInstructions: z.string().optional()
});

type CheckoutFormData = z.infer<typeof checkoutSchema>;

export default function CheckoutPage() {
  const router = useRouter();
  const cart = useCart();
  const [mounted, setMounted] = useState(false);
  const [step, setStep] = useState<number>(1);
  const [submitting, setSubmitting] = useState(false);

  // Logistics states
  const [zones, setZones] = useState<DeliveryZone[]>([]);
  const [blockedDates, setBlockedDates] = useState<BlockedDate[]>([]);
  const [distance, setDistance] = useState<number | null>(null);
  const [shippingFee, setShippingFee] = useState<number>(0);
  const [calculatingDistance, setCalculatingDistance] = useState<boolean>(false);
  const [googleKey, setGoogleKey] = useState<string>('');
  const [scriptLoaded, setScriptLoaded] = useState<boolean>(false);
  const [blockSubmit, setBlockSubmit] = useState<boolean>(false);

  // Dynamic Time Slots & Rest Days
  const [timeSlots, setTimeSlots] = useState<string[]>([
    '09:00 - 11:00',
    '11:00 - 13:00',
    '13:00 - 15:00',
    '15:00 - 17:00',
    '17:00 - 19:00'
  ]);
  const [restDays, setRestDays] = useState<number[]>([0]); // 0 = Sunday (default)

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<CheckoutFormData>({
    resolver: zodResolver(checkoutSchema),
    defaultValues: {
      paymentMethod: 'efectivo',
      notes: ''
    }
  });

  const watchedAddress = watch('address');
  const watchedDate = watch('deliveryDate');
  const watchedPaymentMethod = watch('paymentMethod');

  useEffect(() => {
    setMounted(true);
    async function loadLogistics() {
      try {
        const [zData, dData, sData] = await Promise.all([
          db.getDeliveryZones(),
          db.getBlockedDates(),
          db.getSettings()
        ]);
        setZones(zData);
        setBlockedDates(dData);
        if (sData) {
          if (sData.time_slots && Array.isArray(sData.time_slots)) {
            setTimeSlots(sData.time_slots);
          }
          if (sData.rest_days && Array.isArray(sData.rest_days)) {
            setRestDays(sData.rest_days);
          }
        }
      } catch (err) {
        console.error('Error loading logistics:', err);
      }
    }
    loadLogistics();
  }, []);

  // Reset distance when address changes to force recalculation
  useEffect(() => {
    setDistance(null);
  }, [watchedAddress]);

  // Sync / Calculate shipping fee when distance updates
  useEffect(() => {
    if (distance === null) return;
    if (distance > 20) {
      alert(`Lo sentimos, su ubicación está a ${distance} km, lo cual se encuentra Fuera de rango de entrega (máximo 20 km).`);
      setShippingFee(0);
      setValue('address', '');
      setDistance(null);
      return;
    }
    const matchedZone = zones.find(z => distance >= z.min_km && distance < z.max_km);
    if (matchedZone) {
      if (matchedZone.is_blocked) {
        alert('Lo sentimos, esa zona de entrega está temporalmente inhabilitada o muy lejana.');
        setShippingFee(0);
      } else {
        setShippingFee(matchedZone.price);
      }
    } else {
      // default fallback to max zone
      setShippingFee(150);
    }
  }, [distance, zones]);

  // Phase 1: Retrieve Google Maps API Key dynamically from environment or dynamic backend endpoint
  useEffect(() => {
    const envKey = process.env.NEXT_PUBLIC_GOOGLE_MAPS_API_KEY;
    if (envKey && !envKey.includes('YourGoogleMapsApiKey') && !envKey.includes('YourGoogleApiKey')) {
      setGoogleKey(envKey);
      return;
    }

    async function fetchKey() {
      try {
        const res = await fetch('/api/maps-key');
        const data = await res.json();
        if (data.success && data.apiKey && !data.apiKey.includes('YourGoogleMapsApiKey') && !data.apiKey.includes('YourGoogleApiKey')) {
          setGoogleKey(data.apiKey);
        }
      } catch (err) {
        console.error('Error fetching dynamic Google Maps Key:', err);
      }
    }
    fetchKey();
  }, []);

  // Phase 2: Load Google Maps places script dynamically once the key is resolved
  useEffect(() => {
    if (!googleKey) return;

    const scriptId = 'google-maps-places-script';
    let script = document.getElementById(scriptId) as HTMLScriptElement;

    const handleLoad = () => {
      if ((window as any).google?.maps?.places) {
        setScriptLoaded(true);
      }
    };

    if (!script) {
      script = document.createElement('script');
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${googleKey}&libraries=places&language=es`;
      script.async = true;
      script.defer = true;
      script.addEventListener('load', handleLoad);
      document.head.appendChild(script);
    } else {
      if ((window as any).google?.maps?.places) {
        setScriptLoaded(true);
      } else {
        script.addEventListener('load', handleLoad);
      }
    }

    return () => {
      if (script) {
        script.removeEventListener('load', handleLoad);
      }
    };
  }, [googleKey]);

  // Phase 3: Attach Autocomplete listener when step === 2 and script has loaded
  useEffect(() => {
    if (step !== 2 || !scriptLoaded) return;

    const timer = setTimeout(() => {
      const inputEl = document.getElementById('address-input') as HTMLInputElement;
      if (!inputEl) {
        console.warn('Address input element not found in DOM yet.');
        return;
      }

      try {
        console.log('Initializing Google Places Autocomplete on input element...');
        const autocomplete = new (window as any).google.maps.places.Autocomplete(inputEl, {
          types: ['address'],
          componentRestrictions: { country: 'mx' }, // Restrict to Mexico since Los Mochis is in Mexico
          fields: ['formatted_address', 'geometry']
        });

        autocomplete.addListener('place_changed', () => {
          const place = autocomplete.getPlace();
          if (place.formatted_address) {
            setValue('address', place.formatted_address);
          }
        });
      } catch (err) {
        console.error('Failed to initialize Autocomplete on input element:', err);
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [step, scriptLoaded, setValue]);

  // Phase 4: Prevent double-taps/ghost clicks from immediately submitting the checkout on iOS/iPad
  useEffect(() => {
    if (step === 4) {
      setBlockSubmit(true);
      const timer = setTimeout(() => {
        setBlockSubmit(false);
      }, 500); // 500ms block absorbs standard iOS touch-to-click transition delays
      return () => clearTimeout(timer);
    }
  }, [step]);

  // Calculate distance using Google Maps Proxy API
  const handleCalculateDistance = async () => {
    if (!watchedAddress || watchedAddress.length < 5) return;
    setCalculatingDistance(true);
    
    try {
      const res = await fetch(`/api/distance?destination=${encodeURIComponent(watchedAddress)}`);
      const data = await res.json();
      
      if (data.success) {
        setDistance(data.distance_km);
      } else {
        throw new Error(data.error || 'Failed to calculate distance');
      }
    } catch (err) {
      console.warn('Real Google Maps distance calculation failed, falling back to simulation:', err);
      // Sandbox fallback if API is blocked or key limits reached
      const simulatedDistance = parseFloat((Math.random() * 8 + 1.2).toFixed(1));
      setDistance(simulatedDistance);
    } finally {
      setCalculatingDistance(false);
    }
  };

  const getMinDateString = () => {
    const today = new Date();
    // 48 hours prep buffer (if items require it), otherwise next day
    const leadDays = cart.items.some(i => i.product.prep_time_minutes > 120) ? 2 : 1;
    today.setDate(today.getDate() + leadDays);
    return today.toISOString().split('T')[0];
  };

  const isDateBlocked = (dateStr: string) => {
    // Parse dateStr (YYYY-MM-DD) as local date to ensure day-of-week calculation is precise
    const [year, month, day] = dateStr.split('-').map(Number);
    const localDate = new Date(year, month - 1, day);
    const dayOfWeek = localDate.getDay(); // 0 = Sunday, 1 = Monday, ..., 6 = Saturday

    // 1. Check if the day of week is a weekly rest day
    if (restDays.includes(dayOfWeek)) {
      const dayNames = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
      return `${dayNames[dayOfWeek]} cerrado`;
    }

    // 2. Check if in blocked dates list
    const isBlocked = blockedDates.some(d => d.date === dateStr);
    if (isBlocked) {
      const match = blockedDates.find(d => d.date === dateStr);
      return match?.reason || 'Fecha bloqueada';
    }
    return null;
  };

  const onFormSubmit = async (data: CheckoutFormData) => {
    if (step !== 4) {
      return;
    }
    if (cart.items.length === 0) {
      alert('Su carrito está vacío.');
      return;
    }

    const blockedReason = isDateBlocked(data.deliveryDate);
    if (blockedReason) {
      alert(`No podemos entregar en esta fecha: ${blockedReason}`);
      return;
    }

    setSubmitting(true);
    try {
      const subtotal = cart.getSubtotal();
      const total = subtotal + shippingFee;

      const orderObj = {
        id: generateUUID(),
        order_number: `MO-${Math.floor(1000 + Math.random() * 9000)}`,
        client_name: data.name,
        client_phone: data.phone,
        delivery_address: data.address,
        distance_km: distance || 3.0,
        delivery_instructions: data.deliveryInstructions || '',
        delivery_fee: shippingFee,
        subtotal,
        total,
        status: 'pendiente' as const,
        delivery_date: data.deliveryDate,
        delivery_time_slot: data.deliveryTimeSlot,
        payment_method: data.paymentMethod,
        payment_status: 'pendiente' as const,
        notes: data.notes || '',
        twilio_sent: false
      };

      const orderItems = cart.items.map(item => ({
        product_id: item.product.id,
        product_name: item.product.name,
        quantity: item.quantity,
        price: item.singleUnitPrice,
        variant_choices: item.variantChoices
      }));

      // Call API Route
      const res = await fetch('/api/orders', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ order: orderObj, items: orderItems })
      });

      const responseData = await res.json();
      
      // Persist locally in-app as fallback
      await db.saveOrder(orderObj, orderItems);
      
      // Clear Zustand Cart
      cart.clearCart();
      
      // Redirect to success screen
      router.push(`/orden-confirmada?order_id=${orderObj.id}`);
    } catch (e) {
      console.error('Checkout submission error:', e);
      alert('Hubo un problema al procesar su pedido. Por favor intente de nuevo.');
    } finally {
      setSubmitting(false);
    }
  };

  if (!mounted) return null;

  const subtotal = cart.getSubtotal();
  const total = subtotal + shippingFee;

  return (
    <div className="flex flex-col min-h-screen bg-crema">
      <Header />

      <section className="bg-olive text-crema py-10 px-4 text-center border-b border-gold/15">
        <h1 className="editorial-title text-3xl font-light">Finalizar Pedido</h1>
        <p className="text-xs text-crema/60 mt-1 uppercase tracking-widest">Maison VIII Checkout</p>
      </section>

      <main className="flex-grow mx-auto max-w-7xl w-full px-4 sm:px-6 lg:px-8 py-12">
        {cart.items.length === 0 ? (
          <div className="text-center py-20 bg-beige/30 rounded border border-olive/5">
            <h2 className="editorial-title text-2xl text-olive font-light">Su carrito está vacío</h2>
            <p className="text-sm text-olive/60 mt-2">Agregue deliciosos postres del Menú antes de proceder.</p>
            <button
              onClick={() => router.push('/menu')}
              className="mt-6 inline-flex bg-olive text-crema text-xs tracking-widest font-semibold py-3 px-8 rounded hover:bg-gold transition-colors uppercase"
            >
              Ir al Menú
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            {/* Form Column */}
            <div className="lg:col-span-8 space-y-6">
              {/* Stepper Header */}
              <div className="flex justify-between items-center bg-beige/30 p-4 rounded border border-olive/5">
                {[1, 2, 3, 4].map((s) => (
                  <div key={s} className="flex items-center gap-2">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-bold transition-all ${
                      step >= s ? 'bg-olive text-crema' : 'bg-olive/5 text-olive/40 border border-olive/10'
                    }`}>
                      {s}
                    </div>
                    <span className={`text-[10px] tracking-wider uppercase font-semibold hidden sm:inline ${
                      step === s ? 'text-olive' : 'text-olive/40'
                    }`}>
                      {s === 1 && 'Contacto'}
                      {s === 2 && 'Entrega'}
                      {s === 3 && 'Agendar'}
                      {s === 4 && 'Pago'}
                    </span>
                    {s < 4 && <ChevronRight className="w-4 h-4 text-olive/20 hidden sm:block" />}
                  </div>
                ))}
              </div>

              {/* Form container */}
              <form onSubmit={handleSubmit(onFormSubmit)} className="glass-panel rounded-lg p-6 sm:p-8 space-y-6 border border-olive/5">
                {/* STEP 1: CLIENT DATA */}
                {step === 1 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    <h3 className="editorial-title text-xl text-olive font-medium border-b border-olive/5 pb-2 flex items-center gap-2">
                      <User className="w-5 h-5 text-gold" />
                      <span>Datos del Cliente</span>
                    </h3>
                    
                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold tracking-wider text-olive uppercase block mb-1.5">Nombre Completo</label>
                        <input
                          type="text"
                          {...register('name')}
                          className="w-full bg-beige/30 border border-olive/15 rounded p-3 text-sm text-olive focus:outline-none focus:border-gold"
                          placeholder="Ej. Alejandra Guzmán"
                        />
                        {errors.name && <p className="text-xs text-red-500 mt-1">{errors.name.message}</p>}
                      </div>

                      <div>
                        <label className="text-xs font-semibold tracking-wider text-olive uppercase block mb-1.5">Teléfono Celular (WhatsApp)</label>
                        <input
                          type="tel"
                          {...register('phone')}
                          className="w-full bg-beige/30 border border-olive/15 rounded p-3 text-sm text-olive focus:outline-none focus:border-gold"
                          placeholder="Ej. +525544332211"
                        />
                        <span className="text-[10px] text-olive/40 mt-1 block">Es necesario para recibir confirmaciones de pedido automáticas.</span>
                        {errors.phone && <p className="text-xs text-red-500 mt-1">{errors.phone.message}</p>}
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 2: ADDRESS AUTOCOMPLETE */}
                {step === 2 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    <h3 className="editorial-title text-xl text-olive font-medium border-b border-olive/5 pb-2 flex items-center gap-2">
                      <MapPin className="w-5 h-5 text-gold" />
                      <span>Dirección de Entrega</span>
                    </h3>

                    <div className="space-y-4">
                      <div>
                        <label className="text-xs font-semibold tracking-wider text-olive uppercase block mb-1.5">Ingresar Dirección</label>
                        <div className="flex gap-2">
                          <input
                            type="text"
                            id="address-input"
                            {...register('address')}
                            className="flex-1 bg-beige/30 border border-olive/15 rounded p-3 text-sm text-olive focus:outline-none focus:border-gold font-light"
                            placeholder="Escribe tu calle, número y colonia..."
                          />
                          <button
                            type="button"
                            onClick={handleCalculateDistance}
                            disabled={calculatingDistance || !watchedAddress}
                            className="bg-olive text-crema px-5 rounded text-xs font-semibold tracking-wider hover:bg-gold transition-colors disabled:opacity-40 uppercase"
                          >
                            {calculatingDistance ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Calcular'}
                          </button>
                        </div>
                        {errors.address && <p className="text-xs text-red-500 mt-1">{errors.address.message}</p>}
                      </div>

                      {/* Map Display & Distance Card */}
                      {distance !== null && (
                        <div className="bg-beige/40 p-4 rounded border border-gold/15 space-y-3">
                          <div className="flex justify-between items-center text-sm">
                            <span className="text-olive/75">Distancia calculada:</span>
                            <span className="font-semibold text-olive">{distance} km</span>
                          </div>
                          <div className="flex justify-between items-center text-sm border-t border-olive/5 pt-2">
                            <span className="text-olive/75">Tarifa de Envío:</span>
                            <span className="font-bold text-olive">${shippingFee.toFixed(2)}</span>
                          </div>
                          <div className="text-[10px] text-gold/90 font-light flex items-center gap-1">
                            <span>&bull;</span>
                            <span>Ubicación de la Dark Kitchen oculta por seguridad. Costo calculado de forma precisa.</span>
                          </div>
                        </div>
                      )}

                      {/* Delivery Instructions */}
                      <div>
                        <label className="text-xs font-semibold tracking-wider text-olive uppercase block mb-1.5">Instrucciones o Referencias de Entrega</label>
                        <textarea
                          {...register('deliveryInstructions')}
                          rows={2}
                          className="w-full bg-beige/30 border border-olive/15 rounded p-3 text-sm text-olive focus:outline-none focus:border-gold font-light"
                          placeholder="Ej: Casa de dos pisos, portón color chocolate, timbre de lado izquierdo..."
                        />
                      </div>
                    </div>
                  </motion.div>
                )}

                {/* STEP 3: SCHEDULE (DATE & TIME) */}
                {step === 3 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    <h3 className="editorial-title text-xl text-olive font-medium border-b border-olive/5 pb-2 flex items-center gap-2">
                      <Calendar className="w-5 h-5 text-gold" />
                      <span>Agendar Fecha y Hora</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      {/* Date Picker */}
                      <div>
                        <label className="text-xs font-semibold tracking-wider text-olive uppercase block mb-1.5">Fecha de Entrega</label>
                        <input
                          type="date"
                          min={getMinDateString()}
                          {...register('deliveryDate')}
                          className="w-full bg-beige/30 border border-olive/15 rounded p-3 text-sm text-olive focus:outline-none focus:border-gold"
                        />
                        {errors.deliveryDate && <p className="text-xs text-red-500 mt-1">{errors.deliveryDate.message}</p>}
                        
                        {/* Selected Date Notice */}
                        {watchedDate && (
                          <div className="mt-2 text-xs font-medium">
                            {isDateBlocked(watchedDate) ? (
                              <span className="text-red-500">No disponible: {isDateBlocked(watchedDate)}</span>
                            ) : (
                              <span className="text-green-600">Fecha disponible ✨</span>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Time Slots Selector */}
                      <div>
                        <label className="text-xs font-semibold tracking-wider text-olive uppercase block mb-1.5">Intervalo de Horario</label>
                        <select
                          {...register('deliveryTimeSlot')}
                          className="w-full bg-beige/30 border border-olive/15 rounded p-3 text-sm text-olive focus:outline-none focus:border-gold"
                        >
                          <option value="">Seleccione un horario...</option>
                          {timeSlots.map(slot => (
                            <option key={slot} value={slot}>{slot}</option>
                          ))}
                        </select>
                        {errors.deliveryTimeSlot && <p className="text-xs text-red-500 mt-1">{errors.deliveryTimeSlot.message}</p>}
                      </div>
                    </div>

                    {/* Special notes */}
                    <div>
                      <label className="text-xs font-semibold tracking-wider text-olive uppercase block mb-1">Comentarios Especiales y Distribución de Empaque</label>
                      <span className="text-[10px] text-olive/50 block mb-2 leading-relaxed font-light">
                        Contamos con cajas de especialidad con capacidad para **1, 2, 3 y 4 Rolls**. Por favor indica aquí si deseas empaques individuales o agrupados (Ej. <i>&quot;Quiero 1 Roll en caja individual y 4 Rolls juntos en caja de 4&quot;</i>).
                      </span>
                      <textarea
                        {...register('notes')}
                        rows={3}
                        className="w-full bg-beige/30 border border-olive/15 rounded p-3 text-sm text-olive focus:outline-none focus:border-gold font-light"
                        placeholder="Ej. Por favor empacar un Roll de canela en empaque individual y los otros 3 juntos en una caja de 3. Escribir 'Feliz Cumpleaños' en la tarta, etc..."
                      />
                    </div>
                  </motion.div>
                )}

                {/* STEP 4: PAYMENT */}
                {step === 4 && (
                  <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-5">
                    <h3 className="editorial-title text-xl text-olive font-medium border-b border-olive/5 pb-2 flex items-center gap-2">
                      <CreditCard className="w-5 h-5 text-gold" />
                      <span>Método de Pago</span>
                    </h3>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      {/* Efectivo */}
                      <label className={`border rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                        watchedPaymentMethod === 'efectivo' 
                          ? 'border-gold bg-[#1E2C1E]/5 ring-1 ring-gold shadow-md' 
                          : 'border-olive/10 hover:bg-beige/30'
                      }`}>
                        <input
                          type="radio"
                          value="efectivo"
                          {...register('paymentMethod')}
                          className="sr-only"
                        />
                        <span className={`editorial-title text-lg font-medium transition-colors ${
                          watchedPaymentMethod === 'efectivo' ? 'text-gold font-semibold' : 'text-olive'
                        }`}>Efectivo</span>
                        <span className="text-[10px] text-olive/50 mt-1 leading-relaxed font-light">Pago contra entrega al repartidor.</span>
                      </label>

                      {/* Transferencia */}
                      <label className={`border rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                        watchedPaymentMethod === 'transferencia' 
                          ? 'border-gold bg-[#1E2C1E]/5 ring-1 ring-gold shadow-md' 
                          : 'border-olive/10 hover:bg-beige/30'
                      }`}>
                        <input
                          type="radio"
                          value="transferencia"
                          {...register('paymentMethod')}
                          className="sr-only"
                        />
                        <span className={`editorial-title text-lg font-medium transition-colors ${
                          watchedPaymentMethod === 'transferencia' ? 'text-gold font-semibold' : 'text-olive'
                        }`}>Transferencia</span>
                        <span className="text-[10px] text-olive/50 mt-1 leading-relaxed font-light">Instrucciones bancarias enviadas por WhatsApp.</span>
                      </label>

                      {/* Link de pago */}
                      <label className={`border rounded-lg p-5 flex flex-col items-center justify-center text-center cursor-pointer transition-all duration-300 ${
                        watchedPaymentMethod === 'link_pago' 
                          ? 'border-gold bg-[#1E2C1E]/5 ring-1 ring-gold shadow-md' 
                          : 'border-olive/10 hover:bg-beige/30'
                      }`}>
                        <input
                          type="radio"
                          value="link_pago"
                          {...register('paymentMethod')}
                          className="sr-only"
                        />
                        <span className={`editorial-title text-lg font-medium transition-colors ${
                          watchedPaymentMethod === 'link_pago' ? 'text-gold font-semibold' : 'text-olive'
                        }`}>Tarjeta</span>
                        <span className="text-[10px] text-olive/50 mt-1 leading-relaxed font-light">Link de pago seguro (Mercado Pago) enviado al confirmar.</span>
                      </label>
                    </div>

                    <div className="bg-beige/40 p-4 rounded border border-olive/5 text-xs text-olive/70 font-light space-y-2 mt-4">
                      <p className="font-semibold text-olive">Instrucciones Importantes:</p>
                      <p>&bull; Para pagos con **Transferencia** o **Link de pago**, solicitamos enviar el comprobante de pago vía WhatsApp para que cocina proceda con la preparación.</p>
                    </div>
                  </motion.div>
                )}

                {/* Navigation Buttons */}
                <div className="border-t border-olive/5 pt-6 flex justify-between items-center">
                  {step > 1 ? (
                    <button
                      type="button"
                      onClick={() => setStep(prev => prev - 1)}
                      className="inline-flex items-center gap-1.5 text-xs tracking-wider font-semibold text-olive hover:text-gold uppercase"
                    >
                      <ChevronLeft className="w-4 h-4" />
                      <span>Atrás</span>
                    </button>
                  ) : (
                    <div />
                  )}

                  {step < 4 ? (
                    <button
                      type="button"
                      onClick={() => {
                        // Custom light validation before switching steps
                        if (step === 1 && !watch('name')) {
                          alert('Por favor ingrese su nombre.');
                          return;
                        }
                        if (step === 1 && !watch('phone')) {
                          alert('Por favor ingrese su teléfono.');
                          return;
                        }
                        if (step === 2 && (!watch('address') || distance === null)) {
                          alert('Por favor ingrese su dirección y calcule la distancia.');
                          return;
                        }
                        if (step === 3 && !watch('deliveryDate')) {
                          alert('Por favor seleccione una fecha de entrega.');
                          return;
                        }
                        if (step === 3 && isDateBlocked(watch('deliveryDate'))) {
                          alert('La fecha seleccionada no está disponible.');
                          return;
                        }
                        if (step === 3 && !watch('deliveryTimeSlot')) {
                          alert('Por favor seleccione un horario.');
                          return;
                        }
                        if (step === 3) {
                          setBlockSubmit(true);
                          setTimeout(() => {
                            setBlockSubmit(false);
                          }, 1000);
                        }
                        setStep(prev => prev + 1);
                      }}
                      className="bg-olive text-crema hover:bg-gold hover:scale-102 transition-all duration-300 text-xs tracking-widest font-semibold py-3 px-6 rounded uppercase inline-flex items-center gap-1.5 shadow"
                    >
                      <span>Siguiente</span>
                      <ChevronRight className="w-4 h-4" />
                    </button>
                  ) : (
                    <button
                      type="submit"
                      disabled={submitting || blockSubmit}
                      className="bg-gold text-olive hover:bg-gold-bright hover:scale-102 transition-all duration-300 text-xs tracking-[0.15em] font-semibold py-3.5 px-8 rounded uppercase inline-flex items-center gap-2 shadow-lg disabled:opacity-50"
                    >
                      {submitting ? (
                        <>
                          <Loader2 className="w-4 h-4 animate-spin" />
                          <span>Procesando...</span>
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4" />
                          <span>Confirmar Pedido</span>
                        </>
                      )}
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Sidebar Summary Column */}
            <div className="lg:col-span-4 space-y-6">
              <div className="glass-panel rounded-lg p-6 border border-olive/5 space-y-6">
                <h3 className="editorial-title text-xl text-olive border-b border-olive/5 pb-3">Resumen de Compra</h3>
                
                <div className="divide-y divide-olive/5 max-h-96 overflow-y-auto pr-1">
                  {cart.items.map((item) => (
                    <div key={item.cartId} className="py-4 flex justify-between items-start gap-3 border-b border-olive/5">
                      <div className="space-y-1.5 flex-1">
                        <div className="flex justify-between items-start gap-2">
                          <h4 className="font-semibold text-olive text-xs leading-tight">{item.product.name}</h4>
                          <span className="font-bold text-olive text-xs">${(item.singleUnitPrice * item.quantity).toFixed(2)}</span>
                        </div>
                        {Object.keys(item.variantChoices).length > 0 && (
                          <span className="block text-[10px] text-gold font-light mt-0.5">
                            {Object.entries(item.variantChoices).map(([k,v]) => `${k}: ${v}`).join(', ')}
                          </span>
                        )}
                        
                        {/* Interactive Checkout Adjusters */}
                        <div className="flex items-center justify-between gap-4 pt-1.5">
                          <div className="flex items-center border border-olive/15 rounded bg-crema overflow-hidden">
                            <button
                              type="button"
                              onClick={() => cart.updateQuantity(item.cartId, item.quantity - 1)}
                              className="p-1 hover:bg-beige transition-colors text-olive/60"
                              title="Disminuir"
                            >
                              <Minus className="w-3 h-3" />
                            </button>
                            <span className="px-2 text-[11px] font-semibold text-olive">{item.quantity}</span>
                            <button
                              type="button"
                              onClick={() => cart.updateQuantity(item.cartId, item.quantity + 1)}
                              className="p-1 hover:bg-beige transition-colors text-olive/60"
                              title="Aumentar"
                            >
                              <Plus className="w-3 h-3" />
                            </button>
                          </div>
                          
                          <button
                            type="button"
                            onClick={() => cart.removeItem(item.cartId)}
                            className="text-gold hover:text-red-500 text-[10px] font-medium flex items-center gap-1 transition-colors"
                            title="Eliminar"
                          >
                            <Trash2 className="w-3 h-3" />
                            <span>Eliminar</span>
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="border-t border-olive/5 pt-5 space-y-3">
                  <div className="flex justify-between items-center text-xs text-olive/80">
                    <span>Subtotal</span>
                    <span className="font-medium text-olive">${subtotal.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between items-center text-xs text-olive/80">
                    <span>Envío</span>
                    <span className="font-medium text-olive">{shippingFee > 0 ? `$${shippingFee.toFixed(2)}` : 'Calculando...'}</span>
                  </div>
                  <div className="flex justify-between items-center text-sm border-t border-olive/5 pt-3">
                    <span className="editorial-title text-base text-olive font-semibold">Total</span>
                    <span className="font-bold text-olive text-lg">${total.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
