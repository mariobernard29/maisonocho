"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Menu, X, Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "../../hooks/use-cart";

export default function Header() {
  const cart = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isContactOpen, setIsContactOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const itemCount = mounted ? cart.getItemCount() : 0;
  const subtotal = mounted ? cart.getSubtotal() : 0;

  return (
    <>
      <header
        className={`sticky top-0 w-full glass-panel border-b border-olive/5 transition-all duration-300 ${
          isCartOpen || isOpen || isContactOpen ? "z-[9999]" : "z-50"
        }`}
      >
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex h-20 items-center justify-between">
            <Link href="/" className="flex items-center group">
              <img
                src="/logos/logo_headersinfondo_500x200.png"
                alt="Maison VIII Logo"
                className="h-12 w-auto object-contain transition-transform duration-300 group-hover:scale-103"
              />
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center space-x-10">
              <Link
                href="/"
                className="text-sm font-medium tracking-wide text-charcoal hover:text-gold transition-colors duration-300"
              >
                Inicio
              </Link>
              <Link
                href="/menu"
                className="text-sm font-medium tracking-wide text-charcoal hover:text-gold transition-colors duration-300"
              >
                Menú
              </Link>
              <Link
                href="/club"
                className="text-sm font-medium tracking-wide text-charcoal hover:text-gold transition-colors duration-300"
              >
                Le Club 8
              </Link>
              <button
                onClick={() => setIsContactOpen(true)}
                className="text-sm font-medium tracking-wide text-charcoal hover:text-gold transition-colors duration-300 focus:outline-none"
              >
                Contacto
              </button>
            </nav>

            {/* Action Buttons */}
            <div className="flex items-center gap-4">
              {/* Cart Button */}
              <button
                onClick={() => setIsCartOpen(true)}
                className="relative p-2.5 rounded-full text-olive hover:bg-beige transition-colors duration-300 focus:outline-none"
                aria-label="Ver Carrito"
              >
                <ShoppingBag className="w-5 h-5 stroke-[1.5]" />
                {itemCount > 0 && (
                  <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-gold-bright text-[9px] font-bold text-olive animate-pulse">
                    {itemCount}
                  </span>
                )}
              </button>

              {/* Mobile Menu Button */}
              <button
                onClick={() => setIsOpen(!isOpen)}
                className="p-2 md:hidden text-olive hover:bg-beige rounded-full transition-colors duration-300"
                aria-label="Menú principal"
              >
                {isOpen ? (
                  <X className="w-6 h-6" />
                ) : (
                  <Menu className="w-6 h-6" />
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Mobile Navigation Drawer */}
        {isOpen && (
          <div className="md:hidden border-t border-olive/5 bg-crema/95 backdrop-blur-lg animate-fade-in-up py-4 px-6 space-y-4">
            <Link
              href="/"
              onClick={() => setIsOpen(false)}
              className="block text-base font-medium text-charcoal hover:text-gold py-2"
            >
              Inicio
            </Link>
            <Link
              href="/menu"
              onClick={() => setIsOpen(false)}
              className="block text-base font-medium text-charcoal hover:text-gold py-2"
            >
              Menú
            </Link>
            <Link
              href="/club"
              onClick={() => setIsOpen(false)}
              className="block text-base font-medium text-charcoal hover:text-gold py-2"
            >
              Le Club 8
            </Link>
            <button
              onClick={() => {
                setIsOpen(false);
                setIsContactOpen(true);
              }}
              className="block w-full text-left text-base font-medium text-charcoal hover:text-gold py-2 focus:outline-none"
            >
              Contacto
            </button>
          </div>
        )}
      </header>

      {/* CONTACT POPUP MODAL */}
      {isContactOpen && (
        <div className="fixed inset-0 z-[99999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div
            onClick={() => setIsContactOpen(false)}
            className="absolute inset-0 bg-charcoal/50 backdrop-blur-sm transition-opacity duration-300"
          />

          {/* Contact Card */}
          <div className="relative w-full max-w-sm bg-crema border border-gold/30 rounded-lg p-6 shadow-2xl overflow-hidden z-10 animate-fade-in-up">
            {/* Premium Top Border Accent */}
            <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-olive via-gold to-olive" />

            {/* Close Button */}
            <button
              onClick={() => setIsContactOpen(false)}
              className="absolute top-4 right-4 p-1.5 rounded-full text-olive/40 hover:text-olive hover:bg-olive/5 transition-colors"
              title="Cerrar"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="text-center space-y-4 mt-2">
              <span className="editorial-subtitle text-gold text-xs tracking-[0.2em] font-medium uppercase block">
                Maison VIII
              </span>
              <h3 className="editorial-title text-2xl font-light text-olive">
                Contacto
              </h3>
              <p className="text-[11px] text-olive/60 font-light leading-relaxed max-w-xs mx-auto">
                Estamos ubicados en Los Mochis, Sinaloa. Escríbenos o visítanos
                en nuestras redes sociales oficiales.
              </p>
            </div>

            <div className="mt-6 space-y-3">
              {/* WhatsApp Button */}
              <a
                href="https://wa.me/5266824214557"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between bg-olive hover:bg-gold hover:text-olive text-crema p-4 rounded text-xs font-semibold tracking-wider transition-all duration-300 uppercase shadow"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.514 2.266 2.268 3.507 5.28 3.505 8.484-.004 6.657-5.34 11.997-11.953 11.997-2.005-.001-3.973-.502-5.724-1.455L0 24zm6.49-3.218c1.642.975 3.541 1.489 5.467 1.49h.006c5.544 0 10.05-4.505 10.054-10.055.002-2.689-1.043-5.216-2.946-7.12C17.228 3.192 14.7 2.147 12.013 2.147c-5.548 0-10.055 4.505-10.06 10.056-.002 1.953.509 3.858 1.48 5.51L2.438 21.73l4.109-1.077z" />
                  </svg>
                  <span>WhatsApp</span>
                </span>
                <span className="font-mono text-[10px] text-crema/60 tracking-normal">
                  +52 668 242 14557
                </span>
              </a>

              {/* Instagram Button */}
              <a
                href="https://www.instagram.com/maison8.reposteriafina"
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between bg-crema border border-olive/15 text-olive hover:border-gold hover:text-gold p-4 rounded text-xs font-semibold tracking-wider transition-all duration-300 uppercase shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <svg
                    className="w-4 h-4 fill-none stroke-current stroke-2"
                    viewBox="0 0 24 24"
                  >
                    <rect x="2" y="2" width="20" height="20" rx="5" ry="5" />
                    <path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z" />
                    <line x1="17.5" y1="6.5" x2="17.51" y2="6.5" />
                  </svg>
                  <span>Instagram</span>
                </span>
                <span className="text-[10px] text-olive/40 tracking-normal">
                  @maison8.reposteriafina
                </span>
              </a>

              {/* Facebook Button (Editable Link) */}
              <a
                href="https://www.facebook.com/YOUR_FACEBOOK_PAGE_HERE" // <-- PEGUE AQUÍ SU LINK DE FACEBOOK CUANDO ESTÉ LISTO
                target="_blank"
                rel="noopener noreferrer"
                className="w-full flex items-center justify-between bg-crema border border-olive/15 text-olive hover:border-gold hover:text-gold p-4 rounded text-xs font-semibold tracking-wider transition-all duration-300 uppercase shadow-sm"
              >
                <span className="flex items-center gap-2">
                  <svg className="w-4 h-4 fill-current" viewBox="0 0 24 24">
                    <path d="M9 8H7v3h2v9h4v-9h3.61L17 8h-4V7a1 1 0 0 1 1-1h3V2h-3c-3.3 0-6 2.7-6 6z" />
                  </svg>
                  <span>Facebook</span>
                </span>
                <span className="text-[10px] text-olive/40 tracking-normal">
                  Ir a Facebook
                </span>
              </a>
            </div>

            <div className="border-t border-olive/5 mt-5 pt-4 text-center">
              <span className="text-[9px] text-olive/35 uppercase tracking-widest font-semibold block">
                Maison VIII &bull; Repostería Fina
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Slide-out Shopping Cart Drawer - Rendered outside <header> to bypass iOS WebKit stacking context bugs */}
      {isCartOpen && (
        <div className="fixed inset-0 z-[9999] overflow-hidden">
          <div
            className="absolute inset-0 bg-charcoal/40 backdrop-blur-sm transition-opacity duration-500"
            onClick={() => setIsCartOpen(false)}
          />
          <div className="fixed inset-y-0 right-0 pl-10 max-w-full flex">
            <div className="w-screen max-w-md bg-crema flex flex-col border-l border-gold/10 shadow-2xl animate-fade-in-up">
              <div className="flex-1 py-6 overflow-y-auto px-4 sm:px-6">
                <div className="flex items-start justify-between border-b border-olive/5 pb-5">
                  <h2 className="editorial-title text-2xl font-light text-olive">
                    Su Carrito
                  </h2>
                  <button
                    onClick={() => setIsCartOpen(false)}
                    className="p-1 text-olive/60 hover:text-olive rounded-full transition-colors focus:outline-none"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                <div className="mt-8">
                  {itemCount === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-center">
                      <ShoppingBag className="w-16 h-16 text-gold/30 stroke-[1] mb-4" />
                      <p className="editorial-title text-xl text-olive/60 font-light">
                        El carrito está vacío
                      </p>
                      <p className="text-xs text-olive/40 mt-1">
                        Descubra nuestras deliciosas creaciones y añádalas aquí.
                      </p>
                      <Link
                        href="/menu"
                        onClick={() => setIsCartOpen(false)}
                        className="mt-6 inline-flex items-center justify-center bg-olive text-crema text-xs tracking-widest font-semibold py-3 px-8 rounded hover:bg-gold transition-colors duration-300 uppercase"
                      >
                        Ver Menú
                      </Link>
                    </div>
                  ) : (
                    <div className="flow-root">
                      <ul className="-my-6 divide-y divide-olive/5">
                        {cart.items.map((item) => (
                          <li key={item.cartId} className="py-6 flex">
                            <div className="flex-shrink-0 w-20 h-20 border border-gold/10 rounded-md overflow-hidden bg-beige flex items-center justify-center relative">
                              {item.product.image_url &&
                              (item.product.image_url.startsWith(
                                "data:image/",
                              ) ||
                                item.product.image_url.startsWith("http")) ? (
                                <img
                                  src={item.product.image_url}
                                  alt={item.product.name}
                                  className="absolute inset-0 w-full h-full object-cover"
                                />
                              ) : (
                                <span className="editorial-title text-xs text-gold/80 font-bold select-none">
                                  VIII
                                </span>
                              )}
                            </div>

                            <div className="ml-4 flex-1 flex flex-col">
                              <div>
                                <div className="flex justify-between text-sm font-medium text-olive">
                                  <h3 className="editorial-title text-base font-medium">
                                    {item.product.name}
                                  </h3>
                                  <p className="ml-4 font-semibold text-olive">
                                    $
                                    {(
                                      item.singleUnitPrice * item.quantity
                                    ).toFixed(2)}
                                  </p>
                                </div>
                                {Object.keys(item.variantChoices).length >
                                  0 && (
                                  <p className="mt-1 text-xs text-gold font-light">
                                    {Object.entries(item.variantChoices)
                                      .map(([k, v]) => `${k}: ${v}`)
                                      .join(", ")}
                                  </p>
                                )}
                              </div>
                              <div className="flex-1 flex items-end justify-between text-xs">
                                <div className="flex items-center border border-olive/10 rounded overflow-hidden">
                                  <button
                                    onClick={() =>
                                      cart.updateQuantity(
                                        item.cartId,
                                        item.quantity - 1,
                                      )
                                    }
                                    className="p-1 text-olive/60 hover:bg-beige transition-colors"
                                  >
                                    <Minus className="w-3.5 h-3.5" />
                                  </button>
                                  <span className="px-2.5 font-medium text-olive">
                                    {item.quantity}
                                  </span>
                                  <button
                                    onClick={() =>
                                      cart.updateQuantity(
                                        item.cartId,
                                        item.quantity + 1,
                                      )
                                    }
                                    className="p-1 text-olive/60 hover:bg-beige transition-colors"
                                  >
                                    <Plus className="w-3.5 h-3.5" />
                                  </button>
                                </div>

                                <div className="flex">
                                  <button
                                    onClick={() => cart.removeItem(item.cartId)}
                                    className="text-gold hover:text-red-500 font-medium flex items-center gap-1 transition-colors"
                                  >
                                    <Trash2 className="w-3.5 h-3.5" />
                                    <span>Eliminar</span>
                                  </button>
                                </div>
                              </div>
                            </div>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>

              {itemCount > 0 && (
                <div className="border-t border-olive/5 py-6 px-4 sm:px-6 bg-beige/30">
                  <div className="flex justify-between text-base font-medium text-olive">
                    <p className="editorial-title text-lg">Subtotal</p>
                    <p className="font-bold text-lg">${subtotal.toFixed(2)}</p>
                  </div>
                  <p className="mt-0.5 text-xs text-olive/50">
                    Costo de envío calculado en el checkout.
                  </p>
                  <div className="mt-6">
                    <Link
                      href="/checkout"
                      onClick={() => setIsCartOpen(false)}
                      className="w-full flex items-center justify-center bg-olive text-crema text-xs tracking-widest font-semibold py-4 px-6 rounded shadow-lg hover:bg-gold transition-colors duration-300 uppercase"
                    >
                      Proceder al Pago
                    </Link>
                  </div>
                  <div className="mt-4 flex justify-center text-center text-xs text-olive/60">
                    <p>
                      o{" "}
                      <button
                        type="button"
                        className="text-gold font-semibold hover:underline"
                        onClick={() => setIsCartOpen(false)}
                      >
                        Continuar Comprando
                        <span aria-hidden="true"> &rarr;</span>
                      </button>
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}
