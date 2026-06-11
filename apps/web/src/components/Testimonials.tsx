"use client";

import { motion } from "framer-motion";

const testimonials = [
  {
    id: "testimonial-andra",
    text: "Booking di sini benar-benar mengubah cara saya main olahraga. Cukup buka app, pilih jadwal, bayar QRIS — selesai! Tidak perlu nunggu balasan chat admin berjam-jam. Sangat recommended!",
    name: "Andra Wijaya",
    role: "Pemain Rutin",
    initials: "AW",
    image: "https://randomuser.me/api/portraits/men/32.jpg",
    offset: false,
  },
  {
    id: "testimonial-sisca",
    text: "Fasilitas sangat clean dan lapangan-lapangannya standar internasional. Saya rutin booking untuk main bareng teman kantor sore hari. Harganya juga fair dan transparan, gak ada biaya tersembunyi.",
    name: "Sisca Pratama",
    role: "Anggota Komunitas",
    initials: "SP",
    image: "https://randomuser.me/api/portraits/women/47.jpg",
    offset: true,
  },
];

const fadeSlideUp = {
  hidden: { opacity: 0, y: 40 },
  visible: {
    opacity: 1,
    y: 0,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

const scaleIn = {
  hidden: { opacity: 0, scale: 0.9 },
  visible: {
    opacity: 1,
    scale: 1,
    transition: { duration: 0.6, ease: "easeOut" as const },
  },
};

export default function Testimonials() {
  return (
    <section id="testimonials" className="py-24">
      <div className="container mx-auto px-6 grid md:grid-cols-2 gap-16 items-center">
        {/* Left column - testimonial cards */}
        <motion.div
          className="relative"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.2 }}
          variants={{
            hidden: {},
            visible: {
              transition: { staggerChildren: 0.15, delayChildren: 0.1 },
            },
          }}
        >
          <div className="absolute -top-12 -left-12 w-24 h-24 hero-gradient rounded-full opacity-20 blur-2xl" />
          <motion.h2
            variants={fadeSlideUp}
            className="text-4xl md:text-5xl font-black text-on-surface leading-tight mb-8"
          >
            Apa Kata <br />
            <span className="text-primary-dim">Para Pemain?</span>
          </motion.h2>

          <div className="space-y-6">
            {testimonials.map((t) => (
              <motion.div
                key={t.id}
                variants={fadeSlideUp}
                whileHover={{ y: -8, transition: { type: "spring", stiffness: 200 } }}
                whileTap={{ scale: 0.98 }}
                className={`p-6 glass-panel rounded-2xl shadow-xl shadow-on-surface/5 border border-white/50 relative tilt-card ${
                  t.offset ? "md:ml-8" : ""
                }`}
              >
                <span className="material-symbols-outlined text-primary-fixed-dim text-6xl absolute top-4 right-6 opacity-40">
                  format_quote
                </span>
                <p className="text-on-surface-variant italic mb-4 relative z-10">
                  &ldquo;{t.text}&rdquo;
                </p>
                <div className="flex items-center gap-3">
                  <img
                    src={t.image}
                    alt={t.name}
                    loading="lazy"
                    className="w-10 h-10 rounded-full object-cover shadow-inner"
                  />
                  <div>
                    <p className="font-bold text-on-surface">{t.name}</p>
                    <p className="text-xs text-outline">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </motion.div>

        {/* Right column - image + community badge */}
        <motion.div
          className="relative"
          variants={scaleIn}
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, amount: 0.3 }}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            className="rounded-[3rem] w-full aspect-square object-cover shadow-2xl tilt-card"
            loading="lazy"
            alt="Sekelompok teman tertawa dan bersorak setelah pertandingan olahraga"
            src="https://lh3.googleusercontent.com/aida-public/AB6AXuAjLQYSdBsjiPddMuBVMdKJs6BsTnscxzJ_TwaGhLZJXVBIZCSVDivSgQVD68wYVO6s3JRSs0jyAC7OK1JVhwNrvm-d9yMpL20t09DT8oTJ1McfJa3ZsI92WoXwnoKKCASsA-OwuunjNRswA4JuGCp08RZBmItHuZnzKTBeJsTVEijn2DYd16a9h9hogbORP9d75dIYu5_EK1UsFj7L7YzMtzS0JO7vZ0s2FhCRzpwdw4usYoV3lDf0_dVTCGoAe6v3omLaxZdxRL1F"
          />
          <div className="hidden md:block absolute -bottom-8 -right-8 glass-panel p-8 rounded-3xl border border-white/40 shadow-2xl max-w-xs">
            <div className="flex items-center gap-4 mb-4">
              <div className="flex -space-x-3">
                <img
                  src="https://randomuser.me/api/portraits/men/15.jpg"
                  alt="Rendra Kusuma"
                  loading="lazy"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="https://randomuser.me/api/portraits/men/22.jpg"
                  alt="Budi Nusanto"
                  loading="lazy"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                />
                <img
                  src="https://randomuser.me/api/portraits/women/58.jpg"
                  alt="Dewi Wulandari"
                  loading="lazy"
                  className="w-10 h-10 rounded-full border-2 border-white object-cover"
                />
              </div>
              <span className="text-sm font-bold text-on-surface">
                +1.200 Pemain Aktif
              </span>
            </div>
            <p className="text-sm text-on-surface-variant">
              Ribuan pemain di Semarang sudah merasakan kemudahan booking online
              24 jam dengan SportTime. Jadilah bagian dari komunitas yang terus
              berkembang!
            </p>
          </div>
        </motion.div>
      </div>
    </section>
  );
}
