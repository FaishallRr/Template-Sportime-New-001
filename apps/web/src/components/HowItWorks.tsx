"use client";

import { motion } from "framer-motion";

const steps = [
  {
    icon: "search",
    title: "Cari Lapangan",
    description:
      "Pilih lokasi venue olahraga terdekat dari posisimu dengan fasilitas terbaik di Semarang.",
    number: "01",
    offsetClass: "",
  },
  {
    icon: "event_available",
    title: "Booking Instan",
    description:
      "Pilih jadwal kosong, konfirmasi pembayaran, dan kode akses akan dikirim langsung ke WhatsApp-mu.",
    number: "02",
    offsetClass: "md:translate-y-4",
  },
  {
    icon: "sports_tennis",
    title: "Mulai Main",
    description:
      "Tunjukkan kode booking ke resepsionis atau scan di gate otomatis. Waktunya smash!",
    number: "03",
    offsetClass: "",
  },
];

const headerContainerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.15, delayChildren: 0.1 } },
};

const headerItem = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" as const } },
};

const cardVariants = {
  hidden: { opacity: 0, y: 60, scale: 0.95 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { delay: i * 0.15, duration: 0.6, ease: "easeOut" as const },
  }),
};

const numberPop = {
  hidden: { opacity: 0, scale: 0.3, rotate: -15 },
  visible: (i: number) => ({
    opacity: 0.5,
    scale: 1,
    rotate: 0,
    transition: {
      delay: 0.3 + i * 0.15,
      type: "spring" as const,
      stiffness: 200,
      damping: 12,
    },
  }),
};

export default function HowItWorks() {
  return (
    <section id="how-it-works" className="py-24 relative">
      <motion.div
        className="container mx-auto px-6 text-center mb-16"
        variants={headerContainerVariants}
        initial="hidden"
        whileInView="visible"
        viewport={{ once: true, amount: 0.3 }}
      >
        <motion.h2
          variants={headerItem}
          className="text-4xl md:text-5xl font-black text-on-surface tracking-tighter mb-4"
        >
          Cara Booking <span className="text-primary-dim">Gampang</span>
        </motion.h2>
        <motion.p
          variants={headerItem}
          className="text-on-surface-variant text-lg max-w-2xl mx-auto"
        >
          Tiga langkah mudah untuk memulai petualangan olahraga Anda di Semarang
          hari ini.
        </motion.p>
      </motion.div>

      <div className="container mx-auto px-6 relative">
        {/* Connector line (desktop) */}
        <div
          className="hidden md:block absolute top-24 left-[15%] right-[15%] h-px bg-gradient-to-r from-transparent via-primary/40 to-transparent"
          aria-hidden="true"
        />

        <div className="grid md:grid-cols-3 gap-8">
          {steps.map((step, index) => (
            <motion.div
              key={step.number}
              custom={index}
              initial="hidden"
              whileInView="visible"
              viewport={{ once: true, amount: 0.3 }}
              variants={cardVariants}
              className={`group relative p-8 rounded-[2rem] glass-panel border border-white/50 hover:shadow-2xl transition-all duration-500 tilt-card ${step.offsetClass}`}
            >
              <div className="w-16 h-16 rounded-2xl hero-gradient flex items-center justify-center text-on-primary mb-6 shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
                <span className="material-symbols-outlined text-3xl">
                  {step.icon}
                </span>
              </div>
              <h3 className="text-2xl font-bold mb-3">{step.title}</h3>
              <p className="text-on-surface-variant leading-relaxed">
                {step.description}
              </p>
              <motion.div
                custom={index}
                variants={numberPop}
                className="absolute top-8 right-8 text-6xl font-black text-surface-container-highest"
              >
                {step.number}
              </motion.div>
            </motion.div>
          ))}
        </div>
      </div>
    </section>
  );
}
