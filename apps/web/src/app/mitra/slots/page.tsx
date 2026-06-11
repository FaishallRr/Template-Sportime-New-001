"use client";

import { useState, useEffect, useRef } from "react";
import toast from "react-hot-toast";

type Venue = {
  id: string | number;
  name: string;
};

type SlotData = {
  id: string;
  court_id: string;
  date: string;
  start_time: string;
  end_time: string;
  status:
    | "available"
    | "booked"
    | "locked"
    | "blocked"
    | "ditutup"
    | "tersedia"
    | "dipesan";
};

type MatrixSlot = {
  id?: string;
  status: "tersedia" | "dipesan" | "ditutup";
};

const statusColors: Record<string, string> = {
  tersedia: "bg-lime-50 border-lime-200 text-lime-700 hover:bg-lime-100",
  dipesan: "bg-blue-50 border-blue-200 text-blue-600 cursor-not-allowed",
  ditutup:
    "bg-slate-100 border-slate-200 text-slate-400 line-through hover:bg-slate-200",
};

export default function MitraSlotsPage() {
  const [venues, setVenues] = useState<Venue[]>([]);
  const [selectedCourt, setSelectedCourt] = useState<string | null>(null);
  const [slotsData, setSlotsData] = useState<SlotData[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [daysToShow, setDaysToShow] = useState(4); // State untuk responsive days
  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Modal State
  const [showModal, setShowModal] = useState(false);
  const [manualTime, setManualTime] = useState({
    start: "06:00",
    end: "22:00",
  });
  const [slotDuration, setSlotDuration] = useState(90); // default 90 menit

  // Detect screen size for responsive days display
  useEffect(() => {
    const handleResize = () => {
      if (typeof window !== "undefined") {
        if (window.innerWidth < 640) {
          setDaysToShow(2); // mobile: 2 hari
        } else if (window.innerWidth < 1024) {
          setDaysToShow(3); // tablet: 3 hari
        } else {
          setDaysToShow(4); // desktop: 4 hari
        }
      }
    };

    handleResize();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const fetchVenues = async () => {
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];
      const res = await fetch("/api/mitra/venues", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success && data.data && data.data.length > 0) {
        setVenues(data.data);
        setSelectedCourt(String(data.data[0].id));
      } else {
        toast.error(
          "Belum ada lapangan. Silakan tambahkan lapangan terlebih dahulu.",
        );
      }
    } catch (e) {
      console.error("Venues fetch error:", e);
      toast.error("Gagal memuat daftar lapangan.");
    }
  };

  const fetchSlots = async () => {
    if (!selectedCourt) return;
    setIsLoading(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];
      // Fetch slots with venue_id parameter
      const res = await fetch(
        `/api/mitra/slots?venue_id=${selectedCourt}`,
        {
          headers: { Authorization: "Bearer " + token },
        },
      );
      const data = await res.json();
      if (data.success) {
        setSlotsData(data.data || []);
      }
    } catch (e) {
      toast.error("Gagal memuat jadwal dari server.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

  useEffect(() => {
    fetchSlots();
  }, [selectedCourt]);

  const handleGenerate = async (start = "06:00", end = "22:00") => {
    if (!selectedCourt) {
      toast.error("Pilih lapangan terlebih dahulu.");
      return;
    }
    const toastId = toast.loading("Membuat jadwal otomatis...");
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];

      const payload = {
        venue_id: selectedCourt,
        start_time: start,
        end_time: end,
        slot_duration: slotDuration,
      };

      const res = await fetch(
        "/api/mitra/slots/generate",
        {
          method: "POST",
          headers: {
            Authorization: "Bearer " + token,
            "Content-Type": "application/json",
          },
          body: JSON.stringify(payload),
        },
      ).then((r) => r.json());

      if (res.success) {
        toast.success(res.message || "Jadwal berhasil dibuat!", {
          id: toastId,
        });
        setShowModal(false);
        // Reload slots after delay to ensure backend has saved
        setTimeout(() => fetchSlots(), 3000);
      } else {
        toast.error(res.error || "Gagal membuat jadwal.", { id: toastId });
      }
    } catch (e) {
      toast.error("Gagal menghubungi server.", { id: toastId });
    }
  };

  const toggleSlot = async (slotId: string, currentStatus: string) => {
    if (currentStatus === "dipesan" || currentStatus === "booked") return;
    const newStatus =
      currentStatus === "tersedia" || currentStatus === "available"
        ? "blocked"
        : "available";

    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];
      const res = await fetch("/api/mitra/slots/status", {
        method: "PUT",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ slot_id: slotId, status: newStatus }),
      }).then((r) => r.json());

      if (res.success) {
        fetchSlots(); // Silent reload map state
      } else {
        toast.error(res.error);
      }
    } catch (e) {
      toast.error("Gagal mengubah status slot.");
    }
  };

  // Convert raw DB slots to a 2D matrix [date][time]
  const datesSet = Array.from(new Set(slotsData.map((s) => s.date))).sort();
  const timesSet = Array.from(
    new Set(slotsData.map((s) => s.start_time)),
  ).sort();

  const grid: Record<string, Record<string, MatrixSlot>> = {};
  datesSet.forEach((d) => {
    grid[d] = {};
    timesSet.forEach((t) => {
      grid[d][t] = { status: "ditutup" }; // default closed if missing
    });
  });

  let statTersedia = 0,
    statDipesan = 0,
    statDitutup = 0;

  slotsData.forEach((s) => {
    let st: MatrixSlot["status"] = "ditutup";
    if (s.status === "available") st = "tersedia";
    if (s.status === "booked" || s.status === "locked") st = "dipesan";
    if (s.status === "blocked") st = "ditutup";

    grid[s.date] = grid[s.date] || {};
    grid[s.date][s.start_time] = { id: s.id, status: st };

    if (st === "tersedia") statTersedia++;
    if (st === "dipesan") statDipesan++;
    if (st === "ditutup") statDitutup++;
  });

  return (
    <div className="space-y-8 relative">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-2xl md:text-3xl font-black tracking-tight text-slate-900">
            Manajemen Jadwal & Slot
          </h1>
          <p className="text-slate-400 mt-1 text-sm md:text-base">
            Atur ketersediaan jam operasional lapangan Anda
          </p>
        </div>
        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
          <select
            value={selectedCourt || ""}
            onChange={(e) => setSelectedCourt(e.target.value)}
            className="bg-white border border-slate-200 rounded-xl px-3 md:px-4 py-2.5 text-sm font-bold text-slate-700 order-2 sm:order-1 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%236f768e%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10"
          >
            <option value="">Pilih Lapangan...</option>
            {venues.map((venue) => (
              <option key={venue.id} value={String(venue.id)}>
                {venue.name}
              </option>
            ))}
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="flex items-center justify-center gap-2 bg-slate-900 text-white px-3 md:px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors cursor-pointer order-3 sm:order-2 min-h-[44px]"
          >
            <span className="material-symbols-outlined text-lg">schedule</span>
            <span className="hidden sm:inline">Atur Jam Manual</span>
            <span className="sm:hidden">Atur</span>
          </button>
          <button
            onClick={() => handleGenerate("06:00", "22:00")}
            className="flex items-center justify-center gap-2 bg-lime-500 text-white px-3 md:px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-lime-600 transition-colors cursor-pointer order-1 sm:order-3 min-h-[44px]"
          >
            <span className="material-symbols-outlined text-lg">
              auto_fix_high
            </span>
            <span className="hidden sm:inline">Buat Otomatis</span>
            <span className="sm:hidden">Otomatis</span>
          </button>
        </div>
      </div>

      {/* Legend + Stats */}
      <div className="flex flex-col sm:flex-row flex-wrap gap-3 md:gap-6 bg-white rounded-2xl p-4 border border-slate-100">
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-lime-100 border border-lime-300" />
          <span className="text-xs sm:text-sm text-slate-600">
            Terbuka ({statTersedia})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-blue-100 border border-blue-300" />
          <span className="text-xs sm:text-sm text-slate-600">
            Dipesan ({statDipesan})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-100 border border-slate-300" />
          <span className="text-xs sm:text-sm text-slate-600">
            Ditutup ({statDitutup})
          </span>
        </div>
        <div className="flex items-center gap-2">
          <div className="w-4 h-4 rounded bg-slate-50 border border-slate-200" />
          <span className="text-xs sm:text-sm text-slate-400">
            Lewat
          </span>
        </div>
        <span className="text-xs text-slate-400 w-full sm:ml-auto sm:w-auto">
          Klik slot untuk ubah ·{" "}
          {venues.find((v) => String(v.id) === selectedCourt)?.name ||
            "Pilih lapangan"}
        </span>
      </div>

      {/* Calendar Grid */}
      <div className="bg-white rounded-2xl border border-slate-100 overflow-hidden">
        <div
          ref={scrollContainerRef}
          className="overflow-x-auto min-h-[300px] scroll-smooth"
        >
          {isLoading ? (
            <div className="flex items-center justify-center p-12 text-slate-400 font-medium">
              Memuat Jadwal...
            </div>
          ) : datesSet.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-8 md:p-16 text-center">
              <span className="material-symbols-outlined text-5xl md:text-6xl text-slate-200 mb-4">
                calendar_today
              </span>
              <p className="text-slate-500 font-bold mb-2 text-sm md:text-base">
                Belum ada jadwal minggu ini
              </p>
              <p className="text-slate-400 text-xs md:text-sm mb-6 max-w-md">
                Silakan klik "Buat Otomatis" atau "Atur Jam Manual" untuk
                meng-generate jam sewa lapangan Anda.
              </p>
              <button
                onClick={() => handleGenerate("06:00", "22:00")}
                className="bg-lime-500 text-white px-4 md:px-6 py-2 md:py-3 rounded-xl text-xs md:text-sm font-bold hover:bg-lime-600 min-h-[44px]"
              >
                Terapkan Jadwal Default
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-100 sticky top-0 bg-white z-10">
                  <th className="px-2 md:px-3 py-3 md:py-4 text-left text-[10px] md:text-xs font-bold uppercase tracking-wider text-slate-500 w-16 md:w-20 bg-slate-50 sticky left-0 z-20">
                    Jam
                  </th>
                  {datesSet.slice(0, daysToShow).map((date) => {
                    const cleanDate = date.includes("T") ? date.split("T")[0] : date;
                    const dObj = new Date(cleanDate + "T00:00:00");
                    const hari = [
                      "Min",
                      "Sen",
                      "Sel",
                      "Rab",
                      "Kam",
                      "Jum",
                      "Sab",
                    ][dObj.getDay()];
                    const tgl = dObj.getDate();
                    return (
                      <th
                        key={date}
                        className="px-2 md:px-3 py-3 md:py-4 text-center min-w-24 md:min-w-28 hover:bg-slate-50 transition-colors"
                      >
                        <div className="text-[9px] md:text-xs font-bold uppercase tracking-wider text-slate-400">
                          {hari}
                        </div>
                        <div className="text-sm md:text-lg font-black text-slate-900">
                          {tgl}
                        </div>
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {timesSet.map((time) => (
                  <tr
                    key={time}
                    className="border-b border-slate-50 hover:bg-slate-50/30 transition-colors"
                  >
                    <td className="px-2 md:px-3 py-2 md:py-3 text-[10px] md:text-sm font-mono font-bold text-slate-600 bg-slate-50 whitespace-nowrap sticky left-0 z-5">
                      {time}
                    </td>
                    {datesSet.slice(0, daysToShow).map((date) => {
                      const slot = grid[date][time] || { status: "ditutup" };
                      const now = new Date();
                      const nowWIB = new Date(now.toLocaleString("en-US", { timeZone: "Asia/Jakarta" }));
                      const slotEnd = new Date(`${date}T${time}:00+07:00`);
                      const isPast = slotEnd < nowWIB;
                      const isPastBooked = isPast && slot.status === "dipesan";
                      const isPastAvailable = isPast && slot.status === "tersedia";
                      return (
                        <td key={date} className="px-2 md:py-2.5">
                          <button
                            onClick={() =>
                              slot.id &&
                              slot.status !== "dipesan" &&
                              !isPast &&
                              toggleSlot(slot.id, slot.status)
                            }
                            disabled={slot.status === "dipesan" || !slot.id || isPast}
                            className={`w-full py-2 md:py-2.5 text-sm font-bold rounded-lg border-2 transition-all cursor-pointer disabled:cursor-not-allowed min-h-[44px] ${isPast ? "bg-slate-50 border-slate-100 text-slate-300" : statusColors[slot.status]}`}
                          >
                            {isPast
                              ? "Lewat"
                              : slot.status === "dipesan"
                                ? "Pesan"
                                : slot.status === "ditutup"
                                  ? "Tutup"
                                  : "Buka"}
                          </button>
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Modal Jam Manual */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl p-6 md:p-8 w-full max-w-md shadow-2xl border border-slate-100">
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg md:text-xl font-bold text-slate-900">
                Atur Jam Operasional
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-slate-400 hover:text-slate-600 transition-colors min-h-[44px] min-w-[44px] flex items-center justify-center"
              >
                <span className="material-symbols-outlined">close</span>
              </button>
            </div>

            <div className="space-y-4 mb-8">
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Jam Buka
                </label>
                <input
                  type="time"
                  value={manualTime.start}
                  onChange={(e) =>
                    setManualTime({ ...manualTime, start: e.target.value })
                  }
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Jam Tutup
                </label>
                <input
                  type="time"
                  value={manualTime.end}
                  onChange={(e) =>
                    setManualTime({ ...manualTime, end: e.target.value })
                  }
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none font-bold text-slate-800"
                />
              </div>
              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                  Durasi Slot
                </label>
                <select
                  value={slotDuration}
                  onChange={(e) => setSlotDuration(Number(e.target.value))}
                  className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none font-bold text-slate-800 appearance-none bg-[url('data:image/svg+xml;charset=utf-8,%3Csvg%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%20viewBox%3D%220%200%2024%2024%22%20fill%3D%22%236f768e%22%3E%3Cpath%20d%3D%22M7%2010l5%205%205-5z%22%2F%3E%3C%2Fsvg%3E')] bg-[length:20px] bg-[right_12px_center] bg-no-repeat pr-10"
                >
                  <option value={30}>30 Menit</option>
                  <option value={60}>1 Jam</option>
                  <option value={90}>1.5 Jam</option>
                  <option value={120}>2 Jam</option>
                </select>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3">
              <button
                onClick={() => handleGenerate(manualTime.start, manualTime.end)}
                className="flex-1 bg-lime-500 text-white py-3 rounded-xl font-bold hover:bg-lime-600 transition-colors min-h-[48px]"
              >
                Simpan Jadwal
              </button>
              <button
                onClick={() => setShowModal(false)}
                className="bg-slate-100 text-slate-600 px-6 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors min-h-[48px]"
              >
                Batal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
