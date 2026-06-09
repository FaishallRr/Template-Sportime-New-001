import RevealOnScroll from "./RevealOnScroll";

const sportCategories = [
  {
    icon: "sports_tennis",
    name: "Padel",
    desc: "Lapangan kaca indoor/outdoor dengan pencahayaan profesional. Court 10×20m standar internasional.",
  },
  {
    icon: "sports_soccer",
    name: "Futsal",
    desc: "Lapangan indoor lantai vinil standar. Ideal untuk 5v5 dengan teman-teman atau kantor.",
  },
  {
    icon: "sports_basketball",
    name: "Basket",
    desc: "Full court indoor lantai kayu FIBA dan half court outdoor dengan ring standar.",
  },
  {
    icon: "sports_tennis",
    name: "Badminton",
    desc: "Gedung bulutangkis dengan lantai vinil premium. Tersedia 6 court untuk turnamen atau latihan.",
  },
  {
    icon: "sports_volleyball",
    name: "Voli",
    desc: "Lapangan voli indoor dengan standar profesional dan pencahayaan terang.",
  },
];

export default function SeoContent() {
  return (
    <section
      id="seo-content"
      className="py-20 bg-white"
      aria-label="Informasi lengkap sewa lapangan olahraga di Semarang"
    >
      <div className="container mx-auto px-6 max-w-5xl">
        <RevealOnScroll>
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-black text-slate-800 tracking-tight leading-tight">
              Platform <span className="text-primary block md:inline">Sewa Lapangan Olahraga di Semarang</span>
            </h2>
            <p className="mt-4 text-slate-500 text-lg max-w-2xl mx-auto">
              Booking online 24 jam untuk Padel, Futsal, Basket, Badminton & Voli. Harga transparan, konfirmasi instan, bayar QRIS.
            </p>
          </div>
        </RevealOnScroll>

        {/* Sport Category Cards */}
        <RevealOnScroll>
          <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-16">
            {sportCategories.map((sport) => (
              <div
                key={sport.name}
                className="bg-surface-container-low rounded-2xl p-5 text-center hover:shadow-lg hover:-translate-y-1 transition-all duration-300"
              >
                <span className="material-symbols-outlined text-4xl text-primary mb-2 block">
                  {sport.icon}
                </span>
                <h3 className="font-bold text-slate-800 text-lg">{sport.name}</h3>
                <p className="text-slate-500 text-xs mt-1 leading-relaxed">{sport.desc}</p>
              </div>
            ))}
          </div>
        </RevealOnScroll>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-slate-600 leading-relaxed">
          <RevealOnScroll delay={100}>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                  Sewa Lapangan Olahraga Semarang — Semua di Satu Platform
                </h3>
                <p>
                  <strong>SportTime</strong> adalah platform booking lapangan olahraga pertama dan terlengkap di Semarang. 
                  Dari Padel, Futsal, Basket, hingga Badminton dan Voli — semua venue mitra bersertifikasi 
                  tersedia dalam satu aplikasi. Cari jadwal kosong secara real-time, bandingkan harga, dan booking 
                  langsung tanpa perlu WhatsApp admin.
                </p>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                  Kenapa Harus Booking Online via SportTime?
                </h3>
                <ul className="list-none space-y-3 mt-3">
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>verified</span>
                    <span><strong>Harga transparan</strong> — tidak ada biaya tersembunyi. Lihat harga per jam langsung.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>bolt</span>
                    <span><strong>Booking real-time</strong> — status jadwal terupdate, bukan manual chat.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>payments</span>
                    <span><strong>Bayar QRIS & transfer</strong> — konfirmasi otomatis Midtrans, struk digital ke WhatsApp.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <span className="material-symbols-outlined text-primary mt-0.5" style={{ fontVariationSettings: "'FILL' 1" }}>map</span>
                    <span><strong>Navigasi langsung</strong> — rute Google Maps ke venue langsung dari aplikasi.</span>
                  </li>
                </ul>
              </div>
            </div>
          </RevealOnScroll>

          <RevealOnScroll delay={200}>
            <div className="space-y-6">
              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                  Daftar Harga Sewa Lapangan di Semarang 2026
                </h3>
                <div className="bg-surface-container-low rounded-2xl overflow-hidden">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="bg-primary/10">
                        <th className="text-left p-3 font-bold text-slate-700">Olahraga</th>
                        <th className="text-left p-3 font-bold text-slate-700">Mulai dari</th>
                        <th className="text-left p-3 font-bold text-slate-700 hidden md:table-cell">Tipe Lapangan</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      <tr><td className="p-3 font-medium">Badminton</td><td className="p-3 text-primary font-bold">Rp 80.000/jam</td><td className="p-3 text-slate-500 hidden md:table-cell">Vinil indoor</td></tr>
                      <tr><td className="p-3 font-medium">Voli</td><td className="p-3 text-primary font-bold">Rp 120.000/jam</td><td className="p-3 text-slate-500 hidden md:table-cell">Indoor</td></tr>
                      <tr><td className="p-3 font-medium">Futsal</td><td className="p-3 text-primary font-bold">Rp 150.000/jam</td><td className="p-3 text-slate-500 hidden md:table-cell">Vinil indoor</td></tr>
                      <tr><td className="p-3 font-medium">Padel</td><td className="p-3 text-primary font-bold">Rp 200.000/jam</td><td className="p-3 text-slate-500 hidden md:table-cell">Glass outdoor</td></tr>
                      <tr><td className="p-3 font-medium">Basket</td><td className="p-3 text-primary font-bold">Rp 200.000/jam</td><td className="p-3 text-slate-500 hidden md:table-cell">Kayu indoor / Outdoor</td></tr>
                    </tbody>
                  </table>
                </div>
                <p className="text-xs text-slate-400 mt-2">*Harga bervariasi tergantung venue dan jam. Cek jadwal untuk harga terbaru.</p>
              </div>

              <div>
                <h3 className="text-2xl font-bold text-slate-800 mb-3">
                  Area Layanan di Semarang
                </h3>
                <p>
                  SportTime melayani seluruh area Semarang dan sekitarnya, termasuk 
                  <strong> Gajahmungkur, Simpang Lima, Candi Baru, Pandanaran, Banyumanik, Tembalang,</strong> dan 
                  <strong> Semarang Tengah</strong>. Temukan venue olahraga terdekat dari lokasi Anda dengan fitur pencarian GPS.
                </p>
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </div>
    </section>
  );
}