"use client";

import Link from "next/link";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import RevealOnScroll from "./RevealOnScroll";

interface FooterProps {
  variant?: "landing" | "minimal";
}


export default function Footer({ variant = "landing" }: FooterProps) {
  if (variant === "minimal") {
    return (
      <footer className="bg-slate-50 w-full mt-auto border-t border-slate-200/50">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8 px-8 py-12 max-w-7xl mx-auto text-sm">
          <div className="col-span-1 md:col-span-1">
            <div className="text-xl font-black text-slate-900 mb-4">
              SportTime
            </div>
            <p className="text-slate-500">
              © {new Date().getFullYear()} SportTime. Platform Booking Olahraga Terbaik.
            </p>
          </div>
          <div>
            <h6 className="font-bold mb-4 uppercase tracking-widest text-[10px]">
              Informasi
            </h6>
            <ul className="space-y-2">
              <li>
                <Link
                  className="text-slate-500 hover:underline decoration-lime-500 underline-offset-4"
                  href="#"
                >
                  Hubungi Kami
                </Link>
              </li>
              <li>
                <Link
                  className="text-slate-500 hover:underline decoration-lime-500 underline-offset-4"
                  href="#"
                >
                  Area Semarang
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h6 className="font-bold mb-4 uppercase tracking-widest text-[10px]">
              Mitra
            </h6>
            <ul className="space-y-2">
              <li>
                <Link
                  className="text-slate-500 hover:underline decoration-lime-500 underline-offset-4"
                  href="#"
                >
                  Registrasi Mitra
                </Link>
              </li>
              <li>
                <Link
                  className="text-slate-500 hover:underline decoration-lime-500 underline-offset-4"
                  href="#"
                >
                  Acara Korporasi
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h6 className="font-bold mb-4 uppercase tracking-widest text-[10px]">
              Legal
            </h6>
            <ul className="space-y-2">
              <li>
                <Link
                  className="text-slate-500 hover:underline decoration-lime-500 underline-offset-4"
                  href="#"
                >
                  Ketentuan Layanan
                </Link>
              </li>
              <li>
                <Link
                  className="text-slate-500 hover:underline decoration-lime-500 underline-offset-4"
                  href="#"
                >
                  Kebijakan Privasi
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    );
  }

  /* ── Landing / Default Footer ── */
  const colVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: (i: number) => ({
      opacity: 1,
      y: 0,
      transition: { delay: i * 0.1, duration: 0.5, ease: "easeOut" as const },
    }),
  };

  return (
    <RevealOnScroll>
      <footer className="bg-white/40 backdrop-blur-xl border-t border-white/20 w-full mt-auto">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-8 py-16 max-w-7xl mx-auto text-sm">
          <motion.div
            custom={0}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={colVariants}
            className="col-span-1 md:col-span-1"
          >
            <span className="text-xl font-black text-slate-900 mb-6 block">
              SportTime
            </span>
            <p className="text-slate-500 leading-relaxed mb-6">
              Rasakan masa depan olahraga di Semarang. Booking cepat, venue premium,
              dan komunitas yang luar biasa.
            </p>
            <div className="flex gap-4">
              <motion.div
                whileHover={{ scale: 1.15, rotate: 5 }}
                whileTap={{ scale: 0.9 }}
                className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center text-primary-dim hover:bg-primary-fixed transition-colors shadow-sm cursor-pointer"
              >
                <span className="material-symbols-outlined">share</span>
              </motion.div>
              <motion.a
                whileHover={{ scale: 1.15, rotate: -5 }}
                whileTap={{ scale: 0.9 }}
                href="mailto:jalansukses0507@gmail.com"
                className="w-10 h-10 rounded-full bg-white/50 backdrop-blur-sm flex items-center justify-center text-primary-dim hover:bg-primary-fixed transition-colors shadow-sm cursor-pointer block"
              >
                <span className="material-symbols-outlined">mail</span>
              </motion.a>
            </div>
          </motion.div>
          <motion.div
            custom={1}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={colVariants}
          >
            <h4 className="font-bold text-slate-900 mb-6">Produk</h4>
            <ul className="space-y-4">
              <li>
                <Link
                  className="text-slate-500 hover:text-lime-600 hover:translate-x-1.5 transition-all duration-300 inline-block"
                  href="/explore"
                >
                  Jelajahi Venue
                </Link>
              </li>
              <li>
                <Link
                  className="text-slate-500 hover:text-lime-600 hover:translate-x-1.5 transition-all duration-300 inline-block"
                  href="#"
                >
                  Cara Kerja
                </Link>
              </li>
              <li>
                <Link
                  className="text-slate-500 hover:text-lime-600 hover:translate-x-1.5 transition-all duration-300 inline-block"
                  href="#"
                >
                  Harga
                </Link>
              </li>
              <li>
                <Link
                  className="text-slate-500 hover:text-lime-600 hover:translate-x-1.5 transition-all duration-300 inline-block"
                  href="#"
                >
                  Registrasi Mitra
                </Link>
              </li>
            </ul>
          </motion.div>
          <motion.div
            custom={2}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={colVariants}
          >
            <h4 className="font-bold text-slate-900 mb-6">Sumber Daya</h4>
            <ul className="space-y-4">
              <li>
                <Link
                  className="text-slate-500 hover:text-lime-600 hover:translate-x-1.5 transition-all duration-300 inline-block"
                  href="#"
                >
                  Area Semarang
                </Link>
              </li>
              <li>
                <Link
                  className="text-slate-500 hover:text-lime-600 hover:translate-x-1.5 transition-all duration-300 inline-block"
                  href="#"
                >
                  Hubungi Kami
                </Link>
              </li>
              <li>
                <Link
                  className="text-slate-500 hover:text-lime-600 hover:translate-x-1.5 transition-all duration-300 inline-block"
                  href="#"
                >
                  Kebijakan Privasi
                </Link>
              </li>
              <li>
                <Link
                  className="text-slate-500 hover:text-lime-600 hover:translate-x-1.5 transition-all duration-300 inline-block"
                  href="#"
                >
                  Ketentuan Layanan
                </Link>
              </li>
            </ul>
          </motion.div>
          <motion.div
            custom={3}
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={colVariants}
          >
            <h4 className="font-bold text-slate-900 mb-6">Tetap Terupdate</h4>
            <p className="text-slate-500 mb-4">
              Dapatkan info promo dan jadwal terbaru.
            </p>
            <form className="flex" onSubmit={(e) => { e.preventDefault(); toast.success("Terima kasih telah berlangganan info SportTime!"); }}>
              <input
                className="bg-white/50 backdrop-blur-sm rounded-l-xl border-none focus:ring-0 px-4 w-full text-xs"
                placeholder="Email"
                type="text"
              />
              <button type="submit" className="bg-primary px-4 py-3 rounded-r-xl text-primary-fixed btn-3d cursor-pointer hover:brightness-110 transition-all">
                <span className="material-symbols-outlined text-sm">send</span>
              </button>
            </form>
          </motion.div>
        </div>
        <div className="border-t border-white/20 py-8 px-8">
          <div className="max-w-7xl mx-auto flex flex-col md:flex-row justify-between items-center gap-4 text-slate-500 text-xs">
            <p>
              © {new Date().getFullYear()} SportTime. Platform Booking Olahraga Terbaik.
            </p>
            <div className="flex gap-6">
              <Link className="hover:text-lime-500 hover:scale-110 transition-all duration-300 inline-block" href="#">
                Instagram
              </Link>
              <Link className="hover:text-lime-500 hover:scale-110 transition-all duration-300 inline-block" href="#">
                TikTok
              </Link>
              <Link className="hover:text-lime-500 hover:scale-110 transition-all duration-300 inline-block" href="#">
                Twitter
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </RevealOnScroll>
  );
}
