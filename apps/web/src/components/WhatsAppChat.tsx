"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

export default function WhatsAppChat() {
  const [showPopup, setShowPopup] = useState(false);

  useEffect(() => {
    // Check if popup has already been shown in this session
    const popupShown = localStorage.getItem("wa-popup-shown");
    if (!popupShown) {
      // Show popup after 2 seconds of page load
      const timer = setTimeout(() => {
        setShowPopup(true);
        localStorage.setItem("wa-popup-shown", "true");
      }, 2000);

      // Auto hide popup after 8 seconds
      const hideTimer = setTimeout(() => {
        setShowPopup(false);
      }, 8000);

      return () => {
        clearTimeout(timer);
        clearTimeout(hideTimer);
      };
    }
  }, []);

  const handleWhatsAppClick = () => {
    window.open("https://wa.me/62895703047094", "_blank", "noreferrer");
  };

  const popupVariants = {
    hidden: { opacity: 0, scale: 0.8, y: 20 },
    visible: {
      opacity: 1,
      scale: 1,
      y: 0,
      transition: {
        type: "spring" as const,
        damping: 20,
        stiffness: 300,
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      y: 20,
      transition: { duration: 0.2 },
    },
  };

  return (
    <>
      {/* WhatsApp FAB Button */}
      <motion.a
        href="https://wa.me/62895703047094"
        target="_blank"
        rel="noreferrer"
        id="chat-fab"
        className="fixed bottom-8 right-8 w-16 h-16 rounded-full bg-gradient-to-br from-primary-fixed to-primary-dim text-on-primary-fixed shadow-2xl shadow-primary-fixed/50 flex items-center justify-center z-[100] hover:scale-110 active:scale-95 transition-all cursor-pointer"
        aria-label="Open WhatsApp chat"
        initial={{ scale: 0, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ delay: 0.5, type: "spring", damping: 15 }}
        whileHover={{ rotate: 15 }}
      >
        <span className="material-symbols-outlined text-3xl">whatsapp</span>
      </motion.a>

      {/* WhatsApp Notification Popup */}
      <AnimatePresence>
        {showPopup && (
          <motion.div
            className="fixed bottom-28 right-8 z-[90] max-w-xs"
            variants={popupVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
          >
            <div className="glass-panel rounded-2xl border border-white/40 shadow-xl backdrop-blur-xl p-4">
              {/* Header with icon */}
              <div className="flex items-start gap-3 mb-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center flex-shrink-0">
                  <span className="material-symbols-outlined text-white text-lg">
                    whatsapp
                  </span>
                </div>
                <div className="flex-1">
                  <p className="font-bold text-on-surface text-sm">
                    SportTime Support
                  </p>
                  <p className="text-xs text-green-600 font-medium">
                    💚 Online sekarang
                  </p>
                </div>
              </div>

              {/* Message */}
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.2 }}
                className="text-on-surface-variant text-sm mb-4 leading-relaxed"
              >
                Halo! Ada yang bisa kami bantu untuk booking lapangan Anda? 🎾
              </motion.p>

              {/* CTA Button */}
              <motion.button
                onClick={handleWhatsAppClick}
                className="w-full bg-gradient-to-r from-green-500 to-green-600 text-white font-semibold py-2 rounded-xl transition-all hover:shadow-lg active:scale-95 text-sm"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                Chat Sekarang
              </motion.button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
