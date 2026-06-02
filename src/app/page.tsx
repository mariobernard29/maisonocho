"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight, Star, Heart, Award, ShieldCheck } from "lucide-react";
import Header from "../components/client/Header";
import Footer from "../components/client/Footer";
import { db } from "../lib/supabase";
import { Product } from "../types";

export default function HomePage() {
  const [featuredProducts, setFeaturedProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showPrepTime, setShowPrepTime] = useState<boolean>(true);

  useEffect(() => {
    async function loadData() {
      try {
        const [prods, settings] = await Promise.all([
          db.getProducts(),
          db.getSettings()
        ]);
        setFeaturedProducts(prods.filter((p) => p.is_featured));
        if (settings && typeof settings.show_prep_time !== "undefined") {
          setShowPrepTime(settings.show_prep_time === true || settings.show_prep_time === "true");
        }
      } catch (err) {
        console.error("Error loading homepage products:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  return (
    <div className="flex flex-col min-h-screen bg-crema">
      <Header />

      {/* Hero Section */}
      <section className="relative min-h-[85vh] bg-olive flex items-center justify-center py-20 px-4 sm:px-6 lg:px-8 overflow-hidden">
        {/* Subtle decorative grid lines */}
        <div className="absolute inset-0 opacity-10 pointer-events-none">
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(197,168,128,0.2)_1px,transparent_1px),linear-gradient(to_bottom,rgba(197,168,128,0.2)_1px,transparent_1px)] bg-[size:4rem_4rem]"></div>
        </div>

        {/* Glowing radial gold aura */}
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-gold/10 rounded-full blur-[120px] pointer-events-none" />

        <div className="mx-auto max-w-5xl text-center relative z-10 space-y-8">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="space-y-4"
          >
            <span className="editorial-subtitle text-gold text-xs sm:text-sm tracking-[0.3em] font-medium block">
              El arte de celebrar lo extraordinario
            </span>
            <h1 className="editorial-title text-4xl sm:text-6xl lg:text-7xl font-extralight text-crema leading-[1.1] max-w-4xl mx-auto">
              La distinción del{" "}
              <span className="text-gold italic font-normal">
                lujo artesanal
              </span>{" "}
              en cada bocado
            </h1>
          </motion.div>

          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.8 }}
            transition={{ delay: 0.4, duration: 0.8 }}
            className="text-crema/75 text-base sm:text-lg font-light max-w-2xl mx-auto leading-relaxed"
          >
            Boutique de repostería fina artesanal en Los Mochis, Sinaloa.
            Elaboramos roles de canela, New York rolls, galletas estilo New York
            y tartas gourmet, todo bajo los más estrictos estándares de calidad.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.6, duration: 0.8 }}
            className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4"
          >
            <Link
              href="/menu"
              className="w-full sm:w-auto bg-gold text-olive hover:bg-gold-bright hover:scale-105 active:scale-95 transition-all duration-300 text-xs tracking-[0.2em] font-semibold py-4 px-8 rounded shadow-lg uppercase"
            >
              Explorar Menú
            </Link>
            <a
              href="#historia"
              className="w-full sm:w-auto text-crema hover:text-gold border border-crema/25 hover:border-gold/50 transition-all duration-300 text-xs tracking-[0.2em] font-semibold py-4 px-8 rounded uppercase"
            >
              Nuestra Filosofía
            </a>
          </motion.div>
        </div>
      </section>

      {/* Core Brand Merits (Apple style three columns) */}
      <section className="py-16 bg-beige/40 border-b border-olive/5">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-olive/5 border border-gold/20 flex items-center justify-center text-gold">
                <Award className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="editorial-title text-xl text-olive font-medium">
                Técnica Tradicional
              </h3>
              <p className="text-sm font-light text-charcoal/70 leading-relaxed max-w-xs">
                Creamos piezas únicas bajo un estilo minimalista, cuidando cada
                detalle con absoluta precisión artesanal.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-olive/5 border border-gold/20 flex items-center justify-center text-gold">
                <Heart className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="editorial-title text-xl text-olive font-medium">
                Ingredientes de Calidad
              </h3>
              <p className="text-sm font-light text-charcoal/70 leading-relaxed max-w-xs">
                Ingredientes selectos y frescura diaria, transformados en
                creaciones con precisión artesanal.
              </p>
            </div>
            <div className="flex flex-col items-center text-center p-6 space-y-3">
              <div className="w-12 h-12 rounded-full bg-olive/5 border border-gold/20 flex items-center justify-center text-gold">
                <ShieldCheck className="w-5 h-5 stroke-[1.5]" />
              </div>
              <h3 className="editorial-title text-xl text-olive font-medium">
                Alta Exclusividad
              </h3>
              <p className="text-sm font-light text-charcoal/70 leading-relaxed max-w-xs">
                Producción limitada por día bajo pedido previo, asegurando
                frescura absoluta y un sabor incomparable.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="py-24 px-4 sm:px-6 lg:px-8">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-16">
            <div className="space-y-3">
              <span className="editorial-subtitle text-xs text-gold tracking-[0.25em] font-medium block">
                Selección de Temporada
              </span>
              <h2 className="editorial-title text-3xl sm:text-5xl font-extralight text-olive leading-[1.2]">
                Creaciones{" "}
                <span className="italic text-gold font-normal">Destacadas</span>
              </h2>
            </div>
            <Link
              href="/menu"
              className="mt-4 md:mt-0 flex items-center gap-2 text-xs tracking-widest font-semibold text-olive hover:text-gold uppercase group transition-colors duration-300"
            >
              <span>Ver el Menú Completo</span>
              <ArrowRight className="w-4 h-4 transition-transform group-hover:translate-x-1 duration-300" />
            </Link>
          </div>

          {loading ? (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {[1, 2, 3].map((i) => (
                <div
                  key={i}
                  className="animate-pulse bg-beige/50 rounded-lg h-96 border border-olive/5"
                />
              ))}
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {featuredProducts.map((prod) => (
                <motion.div
                  key={prod.id}
                  whileHover={{ y: -8 }}
                  transition={{ duration: 0.3 }}
                  className="glass-panel rounded overflow-hidden border border-olive/5 flex flex-col h-full group"
                >
                  {/* Image wrapper */}
                  <div className="relative aspect-[4/3] bg-beige flex items-center justify-center overflow-hidden border-b border-olive/5">
                    {prod.image_url &&
                    (prod.image_url.startsWith("data:image/") ||
                      prod.image_url.startsWith("http")) ? (
                      <img
                        src={prod.image_url}
                        alt={prod.name}
                        className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      />
                    ) : (
                      <>
                        {/* Decorative Maison watermark inside placeholder */}
                        <div className="absolute inset-0 flex items-center justify-center bg-olive/5 group-hover:scale-105 transition-transform duration-700">
                          <span className="editorial-title text-6xl text-olive/5 font-extrabold select-none">
                            VIII
                          </span>
                        </div>
                        {/* Minimal graphic showing product brand */}
                        <div className="w-20 h-20 rounded-full border border-gold/30 bg-crema flex items-center justify-center shadow-inner relative z-10">
                          <span className="editorial-title text-gold font-semibold text-base tracking-widest">
                            VIII
                          </span>
                        </div>
                      </>
                    )}
                    {showPrepTime && (
                      <div className="absolute bottom-3 left-3 bg-olive text-crema text-[9px] tracking-widest font-semibold px-2.5 py-1 rounded uppercase">
                        Prep: {prod.prep_time_minutes} min
                      </div>
                    )}
                  </div>

                  {/* Body content */}
                  <div className="p-6 flex-1 flex flex-col justify-between space-y-4">
                    <div className="space-y-2">
                      <div className="flex justify-between items-start gap-2">
                        <h3 className="editorial-title text-xl font-medium text-olive group-hover:text-gold transition-colors duration-300">
                          {prod.name}
                        </h3>
                        <span className="font-bold text-olive text-lg">
                          ${prod.price}
                        </span>
                      </div>
                      <p className="text-xs text-charcoal/70 font-light leading-relaxed line-clamp-3">
                        {prod.description}
                      </p>
                    </div>

                    <Link
                      href={`/menu?prod=${prod.slug}`}
                      className="w-full text-center border border-olive/15 text-olive group-hover:bg-olive group-hover:text-crema text-xs tracking-widest font-semibold py-3 px-4 rounded transition-all duration-300 uppercase"
                    >
                      Ordenar Ahora
                    </Link>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* Brand Story (El Lujo es la Calma) */}
      <section
        id="historia"
        className="py-24 bg-olive text-crema relative overflow-hidden border-t border-b border-gold/15"
      >
        <div className="absolute inset-0 opacity-5 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,rgba(255,255,255,0.15),transparent)] bg-[size:100%_100%]"></div>
        </div>

        <div className="mx-auto max-w-5xl px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Visual Column */}
            <div className="aspect-[4/5] bg-crema/5 rounded border border-gold/30 flex items-center justify-center relative overflow-hidden group">
              <img
                src="/logos/Roles_cocina_maison_896x1195px.jpeg"
                alt="Nuestra Cocina - Roles de Canela Maison VIII"
                className="absolute inset-0 w-full h-full group-hover:scale-105 transition-transform duration-700"
              />
              <div className="absolute inset-0 bg-olive/10 group-hover:bg-transparent transition-colors duration-700"></div>
            </div>

            {/* Text Column */}
            <div className="space-y-6">
              <span className="editorial-subtitle text-xs text-gold tracking-[0.25em] font-medium block">
                Nuestra Tradición
              </span>
              <h2 className="editorial-title text-4xl sm:text-5xl font-extralight leading-tight">
                El Arte de <br />
                <span className="italic text-gold font-normal">
                  Esculpir la Dulzura
                </span>
              </h2>
              <p className="text-sm font-light text-crema/75 leading-relaxed">
                Maison VIII nació en Los Mochis, Sinaloa, con una filosofía
                firme: elevar la repostería fina a una experiencia artística e
                inmersiva, distanciándonos de la pastelería tradicional para
                crear piezas inigualables.
              </p>
              <p className="text-sm font-light text-crema/75 leading-relaxed">
                Especializados en roles de canela monumentales, crujientes New
                York rolls, galletas al estilo New York y tartas finas. Cada
                creación es tratada como una joya culinaria bajo los más
                rigurosos estándares de calidad.
              </p>
              <div className="pt-4">
                <Link
                  href="/menu"
                  className="inline-flex items-center gap-3 text-xs tracking-widest font-semibold text-gold hover:text-crema uppercase transition-colors duration-300"
                >
                  <span>Descubra la Colección</span>
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Luxury Call-to-Action */}
      <section className="py-28 px-4 sm:px-6 lg:px-8 bg-crema text-center relative">
        <div className="mx-auto max-w-3xl space-y-8">
          <span className="editorial-subtitle text-xs text-gold tracking-[0.25em] font-medium block">
            Su Mesa de Gala
          </span>
          <h2 className="editorial-title text-3xl sm:text-5xl font-extralight text-olive leading-[1.2]">
            Haga de su próxima celebración un{" "}
            <span className="italic text-gold font-normal">
              evento memorable
            </span>
          </h2>
          <p className="text-sm font-light text-charcoal/70 leading-relaxed max-w-xl mx-auto">
            Haga su pedido con anticipación hoy mismo. Ofrecemos servicio de
            entrega a domicilio.
          </p>
          <div className="pt-4">
            <Link
              href="/menu"
              className="bg-olive text-crema hover:bg-gold hover:text-olive hover:scale-105 active:scale-95 transition-all duration-300 text-xs tracking-[0.25em] font-semibold py-4 px-10 rounded shadow-xl uppercase"
            >
              Comenzar Mi Pedido
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
}
