import React from "react";
import Link from "next/link";

export default function Footer() {
  return (
    <footer className="bg-olive text-crema/90 border-t border-gold/15 py-12 px-4 sm:px-6 lg:px-8 mt-auto">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10 border-b border-crema/10 pb-10">
          {/* Logo & Philosophy */}
          <div className="space-y-4">
            <h3 className="editorial-title text-2xl tracking-wider text-gold font-light">
              MAISON VIII
            </h3>
            <p className="text-sm font-light text-crema/70 leading-relaxed max-w-sm">
              Inspirada en lo tradicional y creada con el detalle de la alta
              cocina, Maison VIII redefine el arte de la repostería.{" "}
            </p>
          </div>

          {/* Opening Hours */}
          <div className="space-y-4">
            <h4 className="editorial-subtitle text-xs tracking-[0.2em] text-gold font-medium">
              Horario de Servicio
            </h4>
            <ul className="space-y-2 text-sm font-light text-crema/75">
              <li>Lunes a Sábado: 09:00 - 20:00</li>
              <li className="text-gold/80 font-normal">Martes: Cerrado</li>
              <li className="text-xs text-crema/50 mt-2">
                *Pedidos especiales comunicate por WhatsApp con un mínimo de 48
                horas de anticipación.
              </li>
            </ul>
          </div>

          {/* Quick Links */}
          <div className="space-y-4">
            <h4 className="editorial-subtitle text-xs tracking-[0.2em] text-gold font-medium">
              Tienda
            </h4>
            <div className="flex flex-col space-y-2 text-sm font-light text-crema/75">
              <Link href="/" className="hover:text-gold transition-colors">
                Inicio
              </Link>
              <Link href="/menu" className="hover:text-gold transition-colors">
                Menú de Especialidad
              </Link>
              <Link
                href="/admin"
                className="hover:text-gold transition-colors text-gold/90 font-medium"
              >
                CRM Administrativo
              </Link>
            </div>
          </div>
        </div>

        <div className="flex flex-col md:flex-row items-center justify-between pt-8 text-xs font-light text-crema/45 gap-4">
          <p>
            &copy; {new Date().getFullYear()} Maison Ocho. Todos los derechos
            reservados.
          </p>
          <p className="mt-2 md:mt-0 italic tracking-wide text-crema/30 text-[10px] hover:text-gold transition-colors">
            Desarrollado por Bernard Digital Products
          </p>
          <p className="mt-2 md:mt-0 tracking-[0.1em] uppercase text-gold/60">
            El Lujo hecho Repostería
          </p>
        </div>
      </div>
    </footer>
  );
}
