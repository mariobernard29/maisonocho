"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useSearchParams, useRouter } from "next/navigation";
import Link from "next/link";
import {
  Check,
  Printer,
  Calendar,
  Clock,
  MapPin,
  CreditCard,
  ChevronRight,
} from "lucide-react";
import Header from "../../components/client/Header";
import Footer from "../../components/client/Footer";
import { db } from "../../lib/supabase";
import { Order } from "../../types";

function SuccessContent() {
  const searchParams = useSearchParams();
  const router = useRouter();
  const orderId = searchParams.get("order_id");

  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function loadOrder() {
      if (!orderId) {
        setLoading(false);
        return;
      }
      try {
        const orders = await db.getOrders();
        const found = orders.find((o) => o.id === orderId);
        if (found) {
          setOrder(found);
        }
      } catch (err) {
        console.error("Error loading success order:", err);
      } finally {
        setLoading(false);
      }
    }
    loadOrder();
  }, [orderId]);

  const handlePrint = () => {
    if (typeof window !== "undefined") {
      window.print();
    }
  };

  if (loading) {
    return (
      <div className="flex flex-col min-h-screen bg-crema items-center justify-center">
        <div className="animate-pulse text-center">
          <span className="editorial-title text-4xl text-olive">
            MAISON VIII
          </span>
          <p className="text-xs text-gold tracking-widest mt-2">
            Cargando su ticket...
          </p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="flex flex-col min-h-screen bg-crema items-center justify-center text-center p-4">
        <h2 className="editorial-title text-3xl text-olive font-light">
          No encontramos su pedido
        </h2>
        <p className="text-sm text-olive/60 mt-2">
          Si acaba de realizar una orden, puede revisar su historial.
        </p>
        <Link
          href="/menu"
          className="mt-6 inline-flex bg-olive text-crema text-xs tracking-widest font-semibold py-3.5 px-8 rounded uppercase"
        >
          Volver a la Boutique
        </Link>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-crema">
      <Header />

      <main className="flex-grow mx-auto max-w-2xl w-full px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center space-y-4 mb-8">
          <div className="w-14 h-14 rounded-full bg-olive text-gold flex items-center justify-center mx-auto shadow-lg">
            <Check className="w-8 h-8 stroke-[2.5]" />
          </div>
          <span className="editorial-subtitle text-[10px] text-gold tracking-[0.25em] font-bold block">
            Pedido Recibido
          </span>
          <h1 className="editorial-title text-3xl sm:text-4xl text-olive font-light">
            ¡Gracias por su preferencia!
          </h1>
          <p className="text-sm text-charcoal/70 max-w-md mx-auto leading-relaxed">
            Su orden **{order.order_number}** ha sido ingresada en el sistema.
            Le enviaremos una confirmación a su WhatsApp a la brevedad.
          </p>
        </div>

        {/* Ticket Container */}
        <div
          id="print-ticket"
          className="glass-panel-gold rounded-lg shadow-xl p-6 sm:p-8 bg-white/80 border border-gold/25 relative space-y-6"
        >
          {/* Elegant header banner */}
          <div className="text-center border-b border-olive/10 pb-5 space-y-1.5">
            <h2 className="editorial-title text-2xl tracking-widest text-olive font-medium">
              M A I S O N V I I I
            </h2>
            <p className="text-[10px] tracking-[0.1em] text-gold font-light">
              EL ARTE DE CELEBRAR LO EXTRAODINARIO
            </p>
            <p className="text-xs text-olive/50 font-mono mt-1">
              FOLIO: {order.order_number}
            </p>
          </div>

          {/* Delivery & Schedule Details */}
          <div className="grid grid-cols-2 gap-4 text-xs">
            <div className="space-y-1">
              <span className="text-[10px] text-olive/40 uppercase tracking-wider block">
                Cliente
              </span>
              <span className="font-semibold text-olive block">
                {order.client_name}
              </span>
              <span className="text-olive/75 block">{order.client_phone}</span>
            </div>
            <div className="space-y-1 text-right">
              <span className="text-[10px] text-olive/40 uppercase tracking-wider block">
                Método de Pago
              </span>
              <span className="font-semibold text-olive uppercase block">
                {order.payment_method === "efectivo" && "Efectivo"}
                {order.payment_method === "transferencia" && "Transferencia"}
                {order.payment_method === "link_pago" &&
                  "Link de Pago (Tarjeta)"}
              </span>
              <span className="text-[10px] px-2 py-0.5 rounded bg-amber-500/10 text-amber-600 font-semibold border border-amber-500/15 uppercase">
                {order.payment_status === "pendiente" ? "Pendiente" : "Pagado"}
              </span>
            </div>
          </div>

          <div className="border-t border-b border-olive/5 py-4 space-y-2 text-xs">
            <div className="flex items-start gap-2">
              <MapPin className="w-4 h-4 text-gold flex-shrink-0 mt-0.5" />
              <div className="space-y-1">
                <div>
                  <span className="text-[10px] text-olive/40 uppercase tracking-wider block">
                    Entrega a Domicilio
                  </span>
                  <span className="text-olive leading-relaxed">
                    {order.delivery_address}
                  </span>
                </div>
                {order.delivery_instructions && (
                  <div className="mt-1">
                    <span className="text-[9px] text-gold uppercase tracking-wider block font-semibold">
                      Referencias de Entrega
                    </span>
                    <span className="text-olive/80 font-light leading-relaxed block italic">
                      {order.delivery_instructions}
                    </span>
                  </div>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 pt-2">
              <div className="flex items-center gap-1.5">
                <Calendar className="w-4 h-4 text-gold" />
                <span className="text-olive font-medium">
                  {order.delivery_date}
                </span>
              </div>
              <div className="flex items-center gap-1.5 justify-end">
                <Clock className="w-4 h-4 text-gold" />
                <span className="text-olive font-medium">
                  {order.delivery_time_slot}
                </span>
              </div>
            </div>
          </div>

          {/* Items Summary Table */}
          <div className="space-y-3">
            <span className="text-[10px] text-olive/40 uppercase tracking-wider block">
              Detalle del Pedido
            </span>
            <div className="divide-y divide-olive/5">
              {order.items?.map((item, idx) => (
                <div
                  key={idx}
                  className="py-2.5 flex justify-between gap-3 text-xs"
                >
                  <div className="flex-1">
                    <span className="font-semibold text-olive">
                      {item.quantity}x
                    </span>{" "}
                    <span className="text-olive">{item.product_name}</span>
                    {Object.keys(item.variant_choices || {}).length > 0 && (
                      <span className="block text-[9px] text-gold font-light mt-0.5">
                        {Object.entries(item.variant_choices)
                          .map(([k, v]) => `${k}: ${v}`)
                          .join(", ")}
                      </span>
                    )}
                  </div>
                  <span className="font-semibold text-olive text-right">
                    ${(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Pricing Totals */}
          <div className="border-t border-olive/10 pt-4 space-y-2.5 text-xs">
            <div className="flex justify-between items-center text-olive/75">
              <span>Subtotal</span>
              <span className="font-medium">${order.subtotal.toFixed(2)}</span>
            </div>
            <div className="flex justify-between items-center text-olive/75">
              <span>Tarifa de Envío ({order.distance_km} km)</span>
              <span className="font-medium">
                ${order.delivery_fee.toFixed(2)}
              </span>
            </div>
            <div className="flex justify-between items-center text-sm border-t border-olive/5 pt-2.5">
              <span className="editorial-title text-base text-olive font-semibold">
                Total Neto
              </span>
              <span className="font-bold text-olive text-lg">
                ${order.total.toFixed(2)}
              </span>
            </div>
          </div>

          {/* Notes */}
          {order.notes && (
            <div className="bg-beige/40 p-3 rounded border border-olive/5 text-[11px] text-olive/75">
              <span className="font-bold block mb-0.5">
                Comentarios especiales:
              </span>
              <p className="font-light italic">{order.notes}</p>
            </div>
          )}
        </div>

        {/* Action Buttons & Navigation */}
        <div className="mt-8 flex flex-col sm:flex-row justify-between items-center gap-4">
          <button
            onClick={handlePrint}
            className="w-full sm:w-auto inline-flex items-center justify-center gap-2 border border-olive/15 hover:bg-olive hover:text-crema text-olive text-xs tracking-wider font-semibold py-3 px-6 rounded uppercase transition-all duration-300"
          >
            <Printer className="w-4 h-4" />
            <span>Imprimir Ticket</span>
          </button>

          <Link
            href="/menu"
            className="w-full sm:w-auto bg-olive text-crema hover:bg-gold hover:text-olive hover:scale-102 text-xs tracking-wider font-semibold py-3 px-8 rounded uppercase text-center transition-all duration-300 shadow"
          >
            <span>Volver a la Boutique</span>
          </Link>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function SuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex flex-col min-h-screen bg-crema items-center justify-center">
          <div className="animate-pulse text-center">
            <span className="editorial-title text-4xl text-olive">
              MAISON VIII
            </span>
            <p className="text-xs text-gold tracking-widest mt-2">
              Cargando...
            </p>
          </div>
        </div>
      }
    >
      <SuccessContent />
    </Suspense>
  );
}
