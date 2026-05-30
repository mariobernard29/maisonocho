"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { ShoppingBag, Menu, X, Trash2, Plus, Minus } from "lucide-react";
import { useCart } from "../../hooks/use-cart";

export default function Header() {
  const cart = useCart();
  const [isOpen, setIsOpen] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Avoid hydration mismatch
  useEffect(() => {
    setMounted(true);
  }, []);

  const itemCount = mounted ? cart.getItemCount() : 0;
  const subtotal = mounted ? cart.getSubtotal() : 0;

  return (
    <header className={`sticky top-0 w-full glass-panel border-b border-olive/5 transition-all duration-300 ${
      isCartOpen || isOpen ? 'z-[9999]' : 'z-50'
    }`}>
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
        </div>
      )}

      {/* Slide-out Shopping Cart Drawer */}
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
    </header>
  );
}
