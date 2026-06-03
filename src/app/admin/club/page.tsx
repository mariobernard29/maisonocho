'use client';

import React, { useState, useEffect } from 'react';
import { 
  Award, 
  Search, 
  TrendingUp, 
  Users, 
  DollarSign, 
  ShoppingBag, 
  ChevronRight,
  ArrowUpDown,
  Download
} from 'lucide-react';
import { db } from '../../../lib/supabase';
import { Customer } from '../../../types';

export default function AdminClubLoyalty() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Search & Filter States
  const [searchQuery, setSearchQuery] = useState('');
  const [activeTab, setActiveTab] = useState<'ranking' | 'members'>('ranking');

  useEffect(() => {
    async function loadCustomers() {
      try {
        const data = await db.getCustomers();
        setCustomers(data);
      } catch (e) {
        console.error('Error loading customers in loyalty dashboard:', e);
      } finally {
        setLoading(false);
      }
    }
    loadCustomers();
  }, []);

  // Filter members (only those registered in Le Club 8 - having an email)
  const loyaltyMembers = customers.filter(c => c.email);

  // Best Customers Ranking (All customers sorted by total_spent descending)
  const bestCustomers = [...customers].sort((a, b) => b.total_spent - a.total_spent);

  // Filtered lists for rendering based on searchQuery
  const filteredBestCustomers = bestCustomers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredLoyaltyMembers = loyaltyMembers.filter(c => 
    c.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    c.phone.includes(searchQuery) ||
    (c.email && c.email.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  // Stats Calculations
  const totalMembers = loyaltyMembers.length;
  const totalLoyaltyBalance = loyaltyMembers.reduce((acc, curr) => acc + Number(curr.loyalty_balance || 0), 0);
  const totalLoyaltyAccumulated = loyaltyMembers.reduce((acc, curr) => acc + Number(curr.loyalty_accumulated || 0), 0);
  
  const avgSpentMembers = totalMembers > 0 
    ? loyaltyMembers.reduce((acc, curr) => acc + curr.total_spent, 0) / totalMembers
    : 0;

  const nonMembers = customers.filter(c => !c.email);
  const avgSpentNonMembers = nonMembers.length > 0
    ? nonMembers.reduce((acc, curr) => acc + curr.total_spent, 0) / nonMembers.length
    : 0;

  const handleExportCSV = () => {
    const dataToExport = activeTab === 'ranking' ? filteredBestCustomers : filteredLoyaltyMembers;
    if (dataToExport.length === 0) return;

    const headers = ['Nombre', 'Teléfono', 'Email', 'Pedidos Totales', 'Total Consumido', 'Saldo Disponible', 'Total Acumulado'];
    const rows = dataToExport.map(c => [
      c.name,
      `'${c.phone}`,
      c.email || 'No Registrado',
      c.orders_count,
      c.total_spent,
      c.loyalty_balance || 0,
      c.loyalty_accumulated || 0
    ]);

    const csvContent = "data:text/csv;charset=utf-8," 
      + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `maison_viii_club8_${activeTab}_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="space-y-8 text-xs text-[#FAF8F5]">
      
      {/* Loading State */}
      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 space-y-4">
          <div className="animate-spin rounded-full h-8 w-8 border border-t-gold border-r-transparent border-b-transparent border-l-transparent" />
          <p className="text-crema/40 text-xs tracking-wider uppercase">Cargando datos de fidelización...</p>
        </div>
      ) : (
        <>
          {/* STATS OVERVIEW WIDGETS */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            
            {/* Widget 1: Miembros totales */}
            <div className="bg-[#0A0F0A] border border-gold/10 p-5 rounded-lg shadow-xl relative overflow-hidden flex flex-col justify-between h-28">
              <div className="absolute right-4 top-4 w-9 h-9 rounded-full bg-gold/10 text-gold flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-crema/40 uppercase tracking-wider block">Miembros Le Club 8</span>
              <div>
                <p className="text-2xl font-bold text-gold font-mono">{totalMembers}</p>
                <span className="text-[9px] text-crema/30 block mt-0.5">Clientes registrados en el programa.</span>
              </div>
            </div>

            {/* Widget 2: Saldo circulante */}
            <div className="bg-[#0A0F0A] border border-gold/10 p-5 rounded-lg shadow-xl relative overflow-hidden flex flex-col justify-between h-28">
              <div className="absolute right-4 top-4 w-9 h-9 rounded-full bg-gold/10 text-gold flex items-center justify-center">
                <DollarSign className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-crema/40 uppercase tracking-wider block">Saldo Circulante (Monedero)</span>
              <div>
                <p className="text-2xl font-bold text-gold font-mono">${totalLoyaltyBalance.toFixed(2)}</p>
                <span className="text-[9px] text-crema/30 block mt-0.5">Saldo total disponible para descuentos.</span>
              </div>
            </div>

            {/* Widget 3: Recompensas Acumuladas */}
            <div className="bg-[#0A0F0A] border border-gold/10 p-5 rounded-lg shadow-xl relative overflow-hidden flex flex-col justify-between h-28">
              <div className="absolute right-4 top-4 w-9 h-9 rounded-full bg-gold/10 text-gold flex items-center justify-center">
                <Award className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-crema/40 uppercase tracking-wider block">Total Recompensas Entregadas</span>
              <div>
                <p className="text-2xl font-bold text-gold font-mono">${totalLoyaltyAccumulated.toFixed(2)}</p>
                <span className="text-[9px] text-crema/30 block mt-0.5">Histórico abonado al 1% de compras.</span>
              </div>
            </div>

            {/* Widget 4: Incremento Ticket Medio */}
            <div className="bg-[#0A0F0A] border border-gold/10 p-5 rounded-lg shadow-xl relative overflow-hidden flex flex-col justify-between h-28">
              <div className="absolute right-4 top-4 w-9 h-9 rounded-full bg-gold/10 text-gold flex items-center justify-center">
                <TrendingUp className="w-5 h-5" />
              </div>
              <span className="text-[10px] text-crema/40 uppercase tracking-wider block">Consumo Promedio Club vs General</span>
              <div>
                <p className="text-base font-bold text-gold font-mono">
                  ${avgSpentMembers.toFixed(0)} <span className="text-[10px] text-crema/40 font-sans font-light">vs ${avgSpentNonMembers.toFixed(0)}</span>
                </p>
                <span className="text-[9px] text-crema/30 block mt-0.5">Gasto medio histórico por miembro del club.</span>
              </div>
            </div>

          </div>

          {/* MAIN DIRECTORY CARD */}
          <div className="bg-[#0A0F0A] border border-gold/10 rounded-lg shadow-2xl p-6 space-y-6">
            
            {/* Toolbar and filter headers */}
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-gold/15 pb-4">
              <div className="flex border border-gold/15 rounded overflow-hidden">
                <button
                  onClick={() => { setActiveTab('ranking'); setSearchQuery(''); }}
                  className={`px-5 py-2.5 font-bold uppercase transition-all tracking-wider text-[10px] ${
                    activeTab === 'ranking' 
                      ? 'bg-gold text-olive' 
                      : 'bg-[#121A12] text-gold hover:bg-[#1E2C1E]'
                  }`}
                >
                  Mejores Clientes (Ranking)
                </button>
                <button
                  onClick={() => { setActiveTab('members'); setSearchQuery(''); }}
                  className={`px-5 py-2.5 font-bold uppercase transition-all tracking-wider text-[10px] ${
                    activeTab === 'members' 
                      ? 'bg-gold text-olive' 
                      : 'bg-[#121A12] text-gold hover:bg-[#1E2C1E]'
                  }`}
                >
                  Miembros Registrados ({totalMembers})
                </button>
              </div>

              <div className="flex items-center gap-3 w-full sm:w-auto">
                <div className="relative flex-1 sm:flex-initial">
                  <Search className="w-4 h-4 text-gold/40 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="bg-[#121A12] border border-gold/15 rounded-md pl-9 pr-4 py-2.5 w-full sm:w-64 text-crema focus:outline-none focus:border-gold placeholder-crema/20"
                    placeholder="Buscar por nombre, tel o email..."
                  />
                </div>
                
                <button
                  onClick={handleExportCSV}
                  className="bg-[#121A12] border border-gold/25 text-gold hover:bg-gold hover:text-olive px-4 py-2.5 rounded font-bold uppercase transition-all flex items-center gap-2"
                  title="Exportar a Excel/CSV"
                >
                  <Download className="w-4 h-4" />
                  <span className="hidden sm:inline">Exportar</span>
                </button>
              </div>
            </div>

            {/* TAB CONTENT: RANKING BEST CUSTOMERS */}
            {activeTab === 'ranking' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gold uppercase tracking-wider font-semibold">Ranking de Consumo de Clientes</span>
                  <span className="text-crema/40 text-[10px]">Muestra todos los clientes ordenados por gasto total acumulado</span>
                </div>

                <div className="border border-gold/10 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#121A12] border-b border-gold/15 text-gold font-bold">
                          <th className="p-4 text-center w-12">Lugar</th>
                          <th className="p-4">Cliente</th>
                          <th className="p-4">Contacto</th>
                          <th className="p-4 text-center">Pedidos</th>
                          <th className="p-4 text-right">Consumo Neto</th>
                          <th className="p-4 text-right text-gold/80">Saldo Le Club 8</th>
                          <th className="p-4 text-center">Tipo</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gold/5 text-crema/80">
                        {filteredBestCustomers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-crema/40 italic">
                              No se encontraron clientes que coincidan con la búsqueda.
                            </td>
                          </tr>
                        ) : (
                          filteredBestCustomers.map((c, index) => (
                            <tr key={c.id} className="hover:bg-[#121A12]/40 transition-colors">
                              <td className="p-4 text-center font-mono font-bold text-gold">
                                {index + 1}
                              </td>
                              <td className="p-4 font-semibold text-crema">
                                {c.name}
                              </td>
                              <td className="p-4">
                                <p>{c.phone}</p>
                                {c.email && <p className="text-[10px] text-crema/40 font-light mt-0.5">{c.email}</p>}
                              </td>
                              <td className="p-4 text-center font-mono font-medium">
                                {c.orders_count}
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-crema">
                                ${c.total_spent.toFixed(2)}
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-gold">
                                {c.email ? `$${(c.loyalty_balance || 0).toFixed(2)}` : '-'}
                              </td>
                              <td className="p-4 text-center">
                                <span className={`px-2 py-0.5 rounded text-[8px] font-bold uppercase ${
                                  c.email 
                                    ? 'bg-gold/10 border border-gold/25 text-gold' 
                                    : 'bg-crema/5 border border-crema/10 text-crema/40'
                                }`}>
                                  {c.email ? 'Miembro Club' : 'General'}
                                </span>
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

            {/* TAB CONTENT: LOYALTY CLUB MEMBERS */}
            {activeTab === 'members' && (
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] text-gold uppercase tracking-wider font-semibold">Directorio de Socios Le Club 8</span>
                  <span className="text-crema/40 text-[10px]">Muestra los clientes que se han dado de alta en la web</span>
                </div>

                <div className="border border-gold/10 rounded-lg overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-[#121A12] border-b border-gold/15 text-gold font-bold">
                          <th className="p-4">Socio</th>
                          <th className="p-4">Teléfono</th>
                          <th className="p-4">Email de Registro</th>
                          <th className="p-4 text-center">Pedidos</th>
                          <th className="p-4 text-right">Acumulado Histórico</th>
                          <th className="p-4 text-right text-gold">Saldo Disponible</th>
                          <th className="p-4 text-center">Fecha Alta</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gold/5 text-crema/80">
                        {filteredLoyaltyMembers.length === 0 ? (
                          <tr>
                            <td colSpan={7} className="p-8 text-center text-crema/40 italic">
                              No hay miembros registrados que coincidan con la búsqueda.
                            </td>
                          </tr>
                        ) : (
                          filteredLoyaltyMembers.map((c) => (
                            <tr key={c.id} className="hover:bg-[#121A12]/40 transition-colors">
                              <td className="p-4 font-semibold text-crema">
                                {c.name}
                              </td>
                              <td className="p-4 font-mono">
                                {c.phone}
                              </td>
                              <td className="p-4 font-light">
                                {c.email}
                              </td>
                              <td className="p-4 text-center font-mono font-medium">
                                {c.orders_count}
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-crema/70">
                                ${(c.loyalty_accumulated || 0).toFixed(2)}
                              </td>
                              <td className="p-4 text-right font-mono font-bold text-gold">
                                ${(c.loyalty_balance || 0).toFixed(2)}
                              </td>
                              <td className="p-4 text-center text-[10px] text-crema/40">
                                {c.created_at ? new Date(c.created_at).toLocaleDateString() : 'N/D'}
                              </td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}

          </div>
        </>
      )}
    </div>
  );
}
