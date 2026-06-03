'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { 
  Award, 
  Lock, 
  Mail, 
  Phone, 
  User, 
  CreditCard, 
  TrendingUp, 
  LogOut, 
  ShoppingBag, 
  AlertCircle, 
  CheckCircle,
  HelpCircle,
  Eye
} from 'lucide-react';
import Header from '../../components/client/Header';
import Footer from '../../components/client/Footer';
import { db } from '../../lib/supabase';
import { Customer, Order } from '../../types';

export default function LeClub8Page() {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [loading, setLoading] = useState(true);
  
  // Session State
  const [userProfile, setUserProfile] = useState<Customer | null>(null);
  const [userOrders, setUserOrders] = useState<Order[]>([]);
  
  // Auth Form State
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  
  // Feedback
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');
  const [actionLoading, setActionLoading] = useState(false);

  useEffect(() => {
    setMounted(true);
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const profile = await db.getCurrentUserLoyalty();
      if (profile) {
        setUserProfile(profile);
        // Load user orders history matching phone number
        const allOrders = await db.getOrders();
        const matched = allOrders.filter(
          o => o.client_phone.replace(/\D/g, '') === profile.phone.replace(/\D/g, '')
        );
        setUserOrders(matched);
      }
    } catch (e) {
      console.error('Session verification error:', e);
    } finally {
      setLoading(false);
    }
  };

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    setSuccessMsg('');
    setActionLoading(true);

    try {
      if (isRegister) {
        // Register new user
        if (!name || !email || !phone || !password) {
          throw new Error('Todos los campos son obligatorios.');
        }
        if (phone.replace(/\D/g, '').length < 10) {
          throw new Error('El número de teléfono debe tener al menos 10 dígitos.');
        }
        const profile = await db.signUpLoyalty(email, phone, name, password);
        setSuccessMsg('¡Registro exitoso en LE CLUB 8! ✨');
        setUserProfile(profile);
        // Load orders
        const allOrders = await db.getOrders();
        const matched = allOrders.filter(
          o => o.client_phone.replace(/\D/g, '') === profile.phone.replace(/\D/g, '')
        );
        setUserOrders(matched);
      } else {
        // Sign in
        if (!email || !password) {
          throw new Error('Correo y contraseña son obligatorios.');
        }
        const profile = await db.signInLoyalty(email, password);
        setUserProfile(profile);
        // Load orders
        const allOrders = await db.getOrders();
        const matched = allOrders.filter(
          o => o.client_phone.replace(/\D/g, '') === profile.phone.replace(/\D/g, '')
        );
        setUserOrders(matched);
      }
    } catch (err: any) {
      setErrorMsg(err.message || 'Ocurrió un error inesperado. Intente nuevamente.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleLogout = async () => {
    setLoading(true);
    try {
      await db.signOutLoyalty();
      setUserProfile(null);
      setUserOrders([]);
      setEmail('');
      setPassword('');
      setName('');
      setPhone('');
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex flex-col min-h-screen bg-crema">
      <Header />

      <main className="flex-grow py-12 px-4 sm:px-6 lg:px-8">
        {loading ? (
          <div className="max-w-md mx-auto py-20 text-center animate-pulse">
            <span className="editorial-title text-4xl text-olive">LE CLUB 8</span>
            <p className="text-xs text-gold tracking-widest mt-2">Cargando su espacio VIP...</p>
          </div>
        ) : !userProfile ? (
          /* AUTHENTICATION PORTAL */
          <div className="max-w-md mx-auto bg-[#0A0F0A] border border-gold/20 rounded-lg p-8 sm:p-10 shadow-2xl relative overflow-hidden">
            {/* Background design accents */}
            <div className="absolute top-0 right-0 w-32 h-32 bg-gold/5 rounded-full blur-xl pointer-events-none" />
            
            <div className="text-center space-y-3 mb-8">
              <div className="w-12 h-12 rounded-full bg-gold/10 text-gold flex items-center justify-center mx-auto border border-gold/20">
                <Award className="w-6 h-6 stroke-[1.5]" />
              </div>
              <h1 className="editorial-title text-3xl text-gold font-light tracking-wide">LE CLUB 8</h1>
              <p className="text-[10px] text-crema/55 uppercase tracking-widest leading-relaxed">
                El club de recompensas exclusivo de Maison VIII
              </p>
            </div>

            {errorMsg && (
              <div className="bg-red-500/10 border border-red-500/25 p-3 rounded mb-5 text-red-400 text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-light">{errorMsg}</span>
              </div>
            )}

            {successMsg && (
              <div className="bg-green-500/10 border border-green-500/25 p-3 rounded mb-5 text-green-400 text-xs flex items-start gap-2">
                <CheckCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span className="font-light">{successMsg}</span>
              </div>
            )}

            <form onSubmit={handleAuthSubmit} className="space-y-4 text-xs text-[#FAF8F5]">
              {isRegister && (
                <>
                  <div>
                    <label className="text-[9px] font-semibold tracking-wider text-gold uppercase block mb-1">Nombre Completo</label>
                    <div className="relative">
                      <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/30" />
                      <input
                        type="text"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        className="w-full bg-[#121A12] border border-gold/15 rounded pl-9 pr-3 py-2.5 text-xs text-crema placeholder-crema/20 focus:outline-none focus:border-gold"
                        placeholder="Ej. Sofía Rodríguez"
                      />
                    </div>
                  </div>

                  <div>
                    <label className="text-[9px] font-semibold tracking-wider text-gold uppercase block mb-1">Teléfono Móvil (WhatsApp)</label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/30" />
                      <input
                        type="tel"
                        required
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        className="w-full bg-[#121A12] border border-gold/15 rounded pl-9 pr-3 py-2.5 text-xs text-crema placeholder-crema/20 focus:outline-none focus:border-gold"
                        placeholder="Ej. +52 55 1234 5678"
                      />
                    </div>
                    <span className="text-[9px] text-crema/35 mt-1 block">Debe coincidir con el teléfono usado al hacer tus pedidos.</span>
                  </div>
                </>
              )}

              <div>
                <label className="text-[9px] font-semibold tracking-wider text-gold uppercase block mb-1">Correo Electrónico</label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/30" />
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded pl-9 pr-3 py-2.5 text-xs text-crema placeholder-crema/20 focus:outline-none focus:border-gold"
                    placeholder="sofia@ejemplo.com"
                  />
                </div>
              </div>

              <div>
                <label className="text-[9px] font-semibold tracking-wider text-gold uppercase block mb-1">Contraseña</label>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gold/30" />
                  <input
                    type="password"
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full bg-[#121A12] border border-gold/15 rounded pl-9 pr-3 py-2.5 text-xs text-crema placeholder-crema/20 focus:outline-none focus:border-gold"
                    placeholder="••••••••••••"
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={actionLoading}
                className="w-full bg-gold text-olive hover:bg-gold-bright transition-all duration-300 py-3 rounded text-[10px] font-semibold tracking-widest uppercase shadow-md flex items-center justify-center"
              >
                {actionLoading ? 'Procesando...' : (isRegister ? 'Registrarse en el Club' : 'Iniciar Sesión')}
              </button>
            </form>

            <div className="text-center mt-6 pt-4 border-t border-gold/10 text-xs text-crema/60 font-light">
              {isRegister ? (
                <p>
                  ¿Ya eres miembro?{' '}
                  <button 
                    onClick={() => { setIsRegister(false); setErrorMsg(''); }} 
                    className="text-gold font-medium hover:underline focus:outline-none"
                  >
                    Inicia Sesión aquí
                  </button>
                </p>
              ) : (
                <p>
                  ¿Aún no tienes cuenta?{' '}
                  <button 
                    onClick={() => { setIsRegister(true); setErrorMsg(''); }} 
                    className="text-gold font-medium hover:underline focus:outline-none"
                  >
                    Regístrate gratis aquí
                  </button>
                </p>
              )}
            </div>
          </div>
        ) : (
          /* MEMBERS VIP DASHBOARD */
          <div className="max-w-4xl mx-auto space-y-10 animate-fade-in-up">
            
            {/* Portal Header */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-olive/15 pb-6">
              <div className="space-y-1">
                <span className="editorial-subtitle text-[9px] text-gold tracking-widest font-bold uppercase">Portal de Fidelidad</span>
                <h1 className="editorial-title text-3xl sm:text-4xl text-olive font-light">Mi Monedero VIP</h1>
              </div>
              <button
                onClick={handleLogout}
                className="inline-flex items-center gap-1.5 bg-olive/5 text-olive hover:bg-olive hover:text-crema border border-olive/15 px-4 py-2 rounded text-[10px] font-semibold tracking-wider uppercase transition-all duration-300"
              >
                <LogOut className="w-3.5 h-3.5" />
                <span>Cerrar Sesión</span>
              </button>
            </div>

            {/* Virtual Membership Card & Statistics */}
            <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-start">
              
              {/* Virtual Loyalty Card (Column span 5) */}
              <div className="md:col-span-5 flex justify-center">
                <div className="relative w-full max-w-[340px] aspect-[1.586] rounded-2xl bg-gradient-to-br from-[#121A12] via-[#0A0F0A] to-[#1e2a1e] border border-gold/40 shadow-2xl p-6 flex flex-col justify-between text-[#FAF8F5] overflow-hidden select-none group">
                  {/* Elegant gold foil decoration */}
                  <div className="absolute -top-24 -right-24 w-48 h-48 bg-gradient-to-br from-gold/10 to-transparent rounded-full blur-2xl group-hover:scale-110 transition-transform duration-700" />
                  
                  {/* Top layout */}
                  <div className="flex justify-between items-start z-10">
                    <div className="space-y-0.5">
                      <h4 className="editorial-title text-lg tracking-widest text-gold font-light">M A I S O N</h4>
                      <p className="text-[7px] tracking-[0.25em] text-crema/40 uppercase -mt-1">VIII • FINE PASTRY</p>
                    </div>
                    <div className="px-2.5 py-0.5 border border-gold/30 rounded text-[7px] font-semibold tracking-widest text-gold uppercase bg-[#121A12]">
                      LE CLUB 8
                    </div>
                  </div>

                  {/* Mid Layout - Saldo */}
                  <div className="my-auto pt-2 z-10">
                    <span className="text-[8px] text-crema/40 uppercase tracking-widest block mb-0.5">Saldo Disponible</span>
                    <span className="text-2xl sm:text-3xl font-bold text-gold tracking-tight font-mono">
                      ${(userProfile.loyalty_balance || 0).toFixed(2)} <span className="text-xs font-sans font-light">MXN</span>
                    </span>
                  </div>

                  {/* Bottom Layout */}
                  <div className="flex justify-between items-end border-t border-gold/10 pt-3 mt-1 z-10">
                    <div className="space-y-0.5">
                      <span className="text-[7px] text-crema/45 uppercase tracking-widest block">Socio</span>
                      <span className="text-xs font-medium tracking-wide text-crema block">{userProfile.name}</span>
                    </div>
                    <div className="text-right">
                      <span className="text-[7px] text-crema/45 uppercase tracking-widest block">No. Miembro</span>
                      <span className="text-[9px] font-mono text-gold/80 block">
                        8000 {userProfile.phone.replace(/\D/g, '').slice(-8).replace(/(\d{4})(\d{4})/, '$1 $2')}
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Loyalty Program Indicator Statistics (Column span 7) */}
              <div className="md:col-span-7 grid grid-cols-2 gap-4">
                
                {/* Stat 1: Acumulado total */}
                <div className="bg-[#121A12]/5 border border-olive/10 rounded-lg p-5 space-y-1 relative overflow-hidden">
                  <div className="absolute right-3 top-3 w-8 h-8 rounded-full bg-gold/10 text-gold flex items-center justify-center">
                    <TrendingUp className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-olive/50 font-semibold uppercase tracking-wider block">Acumulado Histórico</span>
                  <p className="text-2xl font-bold font-mono text-olive">${(userProfile.loyalty_accumulated || 0).toFixed(2)}</p>
                  <span className="text-[9px] text-olive/40 block leading-tight">Total acumulado desde tu registro.</span>
                </div>

                {/* Stat 2: Total Pedidos */}
                <div className="bg-[#121A12]/5 border border-olive/10 rounded-lg p-5 space-y-1 relative overflow-hidden">
                  <div className="absolute right-3 top-3 w-8 h-8 rounded-full bg-gold/10 text-gold flex items-center justify-center">
                    <ShoppingBag className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-olive/50 font-semibold uppercase tracking-wider block">Pedidos Realizados</span>
                  <p className="text-2xl font-bold font-mono text-olive">{userProfile.orders_count || 0}</p>
                  <span className="text-[9px] text-olive/40 block leading-tight">Pedidos vinculados en el programa.</span>
                </div>

                {/* Stat 3: Total Gastado */}
                <div className="bg-[#121A12]/5 border border-olive/10 rounded-lg p-5 space-y-1 relative overflow-hidden">
                  <div className="absolute right-3 top-3 w-8 h-8 rounded-full bg-gold/10 text-gold flex items-center justify-center">
                    <CreditCard className="w-4 h-4" />
                  </div>
                  <span className="text-[10px] text-olive/50 font-semibold uppercase tracking-wider block">Consumo Total</span>
                  <p className="text-2xl font-bold font-mono text-olive">${(userProfile.total_spent || 0).toFixed(2)}</p>
                  <span className="text-[9px] text-olive/40 block leading-tight">Total de compras netas históricas.</span>
                </div>

                {/* Info Card - Rules */}
                <div className="bg-gold/5 border border-gold/20 rounded-lg p-5 space-y-1.5 flex flex-col justify-between">
                  <span className="text-[10px] text-gold font-bold uppercase tracking-wider block">Tasa del Programa</span>
                  <p className="text-sm text-olive leading-relaxed font-light">
                    Acumulas el <span className="font-bold text-gold">5%</span> de cashback digital de cada compra para usarlo como descuento en tu siguiente checkout.
                  </p>
                </div>
              </div>

            </div>

            {/* Member Orders / Rewards History */}
            <div className="space-y-4">
              <h3 className="editorial-title text-xl text-olive font-medium border-b border-olive/5 pb-2">
                Historial de Recompensas
              </h3>
              
              {userOrders.length === 0 ? (
                <div className="bg-white/40 border border-olive/5 rounded-lg p-10 text-center">
                  <ShoppingBag className="w-10 h-10 text-olive/20 mx-auto mb-3" />
                  <p className="text-xs text-olive/55 font-light">No tienes pedidos registrados en el Club todavía.</p>
                  <Link 
                    href="/menu" 
                    className="mt-4 inline-flex bg-olive text-crema text-[10px] tracking-widest font-semibold py-2.5 px-6 rounded uppercase hover:bg-olive-bright transition-colors"
                  >
                    Realizar Primer Pedido
                  </Link>
                </div>
              ) : (
                <div className="bg-white/60 border border-olive/10 rounded-lg shadow overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-xs text-left border-collapse">
                      <thead>
                        <tr className="bg-olive/5 text-olive font-semibold border-b border-olive/10">
                          <th className="p-4 uppercase tracking-wider">Folio</th>
                          <th className="p-4 uppercase tracking-wider">Fecha</th>
                          <th className="p-4 uppercase tracking-wider text-right">Total Pedido</th>
                          <th className="p-4 uppercase tracking-wider text-right">Descuento Usado</th>
                          <th className="p-4 uppercase tracking-wider text-right text-gold">Abono (5%)</th>
                          <th className="p-4 uppercase tracking-wider text-center">Estado</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-olive/5 text-olive/85">
                        {userOrders.map((o) => (
                          <tr key={o.id} className="hover:bg-white/40 transition-colors">
                            <td className="p-4 font-mono font-semibold">{o.order_number}</td>
                            <td className="p-4 font-light">{o.delivery_date}</td>
                            <td className="p-4 text-right font-medium">${o.total.toFixed(2)}</td>
                            <td className="p-4 text-right font-medium text-green-700">
                              {o.loyalty_discount && o.loyalty_discount > 0 ? `-$${o.loyalty_discount.toFixed(2)}` : '$0.00'}
                            </td>
                            <td className="p-4 text-right font-bold text-gold">
                              +${(o.loyalty_earned || (o.subtotal * 0.05)).toFixed(2)}
                            </td>
                            <td className="p-4 text-center">
                              <span className={`px-2 py-0.5 rounded-full text-[9px] font-medium border ${
                                o.status === 'entregado' 
                                  ? 'bg-green-100 border-green-200 text-green-700' 
                                  : o.status === 'cancelado'
                                  ? 'bg-red-100 border-red-200 text-red-700'
                                  : 'bg-amber-100 border-amber-200 text-amber-700'
                              }`}>
                                {o.status === 'pendiente' && 'Pendiente'}
                                {o.status === 'confirmado' && 'Confirmado'}
                                {o.status === 'preparacion' && 'En Cocina'}
                                {o.status === 'camino' && 'En Camino'}
                                {o.status === 'entregado' && 'Entregado'}
                                {o.status === 'cancelado' && 'Cancelado'}
                              </span>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>

          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
