'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { AlertCircle, CheckCircle2, X } from 'lucide-react';

export default function CustomAlertProvider({ children }: { children: React.ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [message, setMessage] = useState('');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    // Save the original alert just in case
    const originalAlert = window.alert;

    // Override the global window.alert
    window.alert = (msg: any) => {
      setMessage(String(msg));
      setIsOpen(true);
    };

    return () => {
      window.alert = originalAlert;
    };
  }, []);

  const handleClose = () => {
    setIsOpen(false);
  };

  // Determine if it is a success or warning/info based on message keywords
  const isSuccess = 
    message.toLowerCase().includes('éxito') || 
    message.toLowerCase().includes('exito') ||
    message.toLowerCase().includes('guardado') || 
    message.toLowerCase().includes('creada') || 
    message.toLowerCase().includes('agregado') || 
    message.toLowerCase().includes('eliminado') ||
    message.toLowerCase().includes('eliminada') ||
    message.toLowerCase().includes('disponible');

  return (
    <>
      {children}
      <AnimatePresence>
        {isOpen && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={handleClose}
              className="absolute inset-0 bg-[#1E2C1E]/50 backdrop-blur-sm"
            />

            {/* Modal Card */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 15 }}
              transition={{ type: 'spring', damping: 25, stiffness: 350 }}
              className="relative w-full max-w-md bg-crema border border-gold/30 rounded-lg p-6 shadow-2xl overflow-hidden z-10"
            >
              {/* Premium Top Border Accent */}
              <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-olive via-gold to-olive" />

              {/* Close Button */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 p-1.5 rounded-full text-olive/40 hover:text-olive hover:bg-olive/5 transition-colors"
                title="Cerrar"
              >
                <X className="w-4 h-4" />
              </button>

              <div className="flex items-start gap-4 mt-2">
                {/* Icon */}
                <div className={`p-3 rounded-full flex-shrink-0 ${
                  isSuccess ? 'bg-green-500/10 text-green-600' : 'bg-gold/10 text-gold'
                }`}>
                  {isSuccess ? (
                    <CheckCircle2 className="w-6 h-6" />
                  ) : (
                    <AlertCircle className="w-6 h-6" />
                  )}
                </div>

                {/* Content */}
                <div className="space-y-1.5 flex-1 pr-6">
                  <h4 className="editorial-title text-lg text-olive font-semibold tracking-wide">
                    {isSuccess ? 'Notificación' : 'Aviso Importante'}
                  </h4>
                  <p className="text-xs text-olive/80 leading-relaxed font-light whitespace-pre-line">
                    {message}
                  </p>
                </div>
              </div>

              {/* Button Action */}
              <div className="mt-6 flex justify-end">
                <button
                  onClick={handleClose}
                  className="bg-olive text-crema hover:bg-gold hover:text-olive px-6 py-2.5 rounded text-[10px] font-bold tracking-widest uppercase transition-all duration-300 shadow hover:shadow-md"
                >
                  Entendido
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  );
}
