"use client";

import { useState, useEffect, useRef, FormEvent } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { MapContainer, TileLayer, Marker, useMapEvents, useMap } from "react-leaflet";
import L from "leaflet";
import "leaflet/dist/leaflet.css";

const defaultIcon = L.icon({
  iconUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png",
  iconRetinaUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon-2x.png",
  shadowUrl: "https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png",
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
});

L.Marker.prototype.options.icon = defaultIcon;

function compressImage(dataUrl: string, maxWidth: number, quality: number, callback: (result: string) => void) {
  const img = new Image();
  img.onload = () => {
    const canvas = document.createElement("canvas");
    let w = img.width;
    let h = img.height;
    if (w > maxWidth) {
      h = (h * maxWidth) / w;
      w = maxWidth;
    }
    canvas.width = w;
    canvas.height = h;
    const ctx = canvas.getContext("2d")!;
    ctx.drawImage(img, 0, 0, w, h);
    const ext = canvas.toDataURL("image/webp").indexOf("image/webp") === -1 ? "image/jpeg" : "image/webp";
    callback(canvas.toDataURL(ext, quality));
  };
  img.src = dataUrl;
}

interface Venue {
  id: string | number;
  slug?: string;
  name: string;
  address: string;
  courts: number;
  pricePerHour: string;
  status: string;
  facilities: string[];
  image: string;
  images?: string[];
  rating: number;
  totalBookings: number;
  latitude?: number;
  longitude?: number;
  sport_type?: string;
}

const SPORT_OPTIONS = [
  { value: "padel", label: "Padel" },
  { value: "futsal", label: "Futsal" },
  { value: "basket", label: "Basket" },
  { value: "badminton", label: "Badminton" },
  { value: "tennis", label: "Tennis" },
  { value: "voli", label: "Voli" },
  { value: "other", label: "Olahraga Lainnya" },
];

function DraggableMarker({
  lat,
  lng,
  onMove,
  mapCenter,
  setMapCenter,
}: {
  lat: string;
  lng: string;
  onMove: (lat: string, lng: string) => void;
  mapCenter: [number, number];
  setMapCenter: React.Dispatch<React.SetStateAction<[number, number]>>;
}) {
  const markerRef = useRef<L.Marker>(null);
  const map = useMap();

  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      onMove(lat.toFixed(6), lng.toFixed(6));
      setMapCenter([lat, lng]);
    },
  });

  useEffect(() => {
    map.flyTo(mapCenter, map.getZoom());
  }, [mapCenter]);

  const latNum = parseFloat(lat);
  const lngNum = parseFloat(lng);
  const hasPos = !isNaN(latNum) && !isNaN(lngNum);

  return hasPos ? (
    <Marker
      draggable={true}
      position={[latNum, lngNum]}
      ref={markerRef}
      eventHandlers={{
        dragend() {
          const marker = markerRef.current;
          if (marker) {
            const { lat: mlat, lng: mlng } = marker.getLatLng();
            onMove(mlat.toFixed(6), mlng.toFixed(6));
            setMapCenter([mlat, mlng]);
          }
        },
      }}
    />
  ) : null;
}

export default function MitraVenuesPage() {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [venues, setVenues] = useState<Venue[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Form State
  const [formData, setFormData] = useState({
    id: null as string | number | null,
    name: "",
    address: "",
    courts: 1,
    pricePerHour: "",
    sport_type: "padel",
    latitude: "",
    longitude: "",
    facilities: [] as string[],
    images: [] as string[], // Base64 encoded images
  });
  const [isEditing, setIsEditing] = useState(false);
  const [mapCenter, setMapCenter] = useState<[number, number]>([-6.9932, 110.4203]);

  useEffect(() => {
    const lat = parseFloat(formData.latitude);
    const lng = parseFloat(formData.longitude);
    if (!isNaN(lat) && !isNaN(lng)) {
      setMapCenter([lat, lng]);
    }
  }, [formData.latitude, formData.longitude]);

  const fetchVenues = async () => {
    setIsLoading(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];
      const res = await fetch("/api/mitra/venues", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setVenues(data.data);
      } else {
        setVenues([]);
      }
    } catch (e) {
      console.error(e);
      toast.error("Gagal memuat lapangan.");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchVenues();
  }, []);

const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;

    if (files.length + formData.images.length > 4) {
      toast.error(
        `Maksimal 4 gambar. Anda sudah memiliki ${formData.images.length} gambar.`,
      );
      return;
    }

    for (let i = 0; i < files.length; i++) {
      const file = files[i];

      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} bukan file gambar.`);
        continue;
      }

      const MAX_SIZE = 2 * 1024 * 1024;
      if (file.size > MAX_SIZE) {
        toast.error(`${file.name} terlalu besar. Maksimal 2MB.`);
        continue;
      }

      const reader = new FileReader();
      reader.onload = (event) => {
        if (event.target?.result) {
          compressImage(event.target.result as string, 1920, 0.8, (compressed) => {
            setFormData((prev) => ({
              ...prev,
              images: [...prev.images, compressed].slice(0, 4),
            }));
          });
        }
      };
      reader.readAsDataURL(file);
    }
  };

  const removeImage = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      images: prev.images.filter((_, i) => i !== index),
    }));
  };

  const handleFacilityToggle = (f: string) => {
    setFormData((prev) => ({
      ...prev,
      facilities: prev.facilities.includes(f)
        ? prev.facilities.filter((x) => x !== f)
        : [...prev.facilities, f],
    }));
  };

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault();

    // Validate images (min 1, max 4)
    if (formData.images.length === 0) {
      toast.error("Minimal harus ada 1 gambar.");
      return;
    }
    if (formData.images.length > 4) {
      toast.error("Maksimal 4 gambar.");
      return;
    }

    const btn = document.getElementById(
      "btn-simpan-lapangan",
    ) as HTMLButtonElement;
    btn.disabled = true;
    btn.innerText = "Menyimpan...";
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];
      const body = {
        name: formData.name,
        address: formData.address,
        courts: formData.courts,
        pricePerHour: parseInt(formData.pricePerHour.replace(/\D/g, "") || "0"),
        sport_type: formData.sport_type,
        latitude: parseFloat(formData.latitude || "0"),
        longitude: parseFloat(formData.longitude || "0"),
        facilities: formData.facilities,
        images: formData.images,
      };

      const isEdit = !!formData.id;
      const url = isEdit
        ? `/api/mitra/venues/${formData.id}`
        : "/api/mitra/venues";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(body),
      }).then((r) => r.json());

      if (res.success) {
        toast.success(isEdit ? "Berhasil diperbarui!" : "Berhasil disimpan!");
        setShowForm(false);
        setFormData({
          id: null,
          name: "",
          address: "",
          courts: 1,
          pricePerHour: "",
          sport_type: "padel",
          latitude: "",
          longitude: "",
          facilities: [],
          images: [],
        });
        setIsEditing(false);
        fetchVenues(); // Reload data
      } else {
        toast.error(res.error || "Gagal menyimpan data.");
      }
    } catch (e) {
      toast.error("Gagal menghubungi server.");
    } finally {
      btn.disabled = false;
      btn.innerText = "Simpan Lapangan";
    }
  };

  const handleDelete = async (id: string | number) => {
    if (
      !confirm(
        "Apakah Anda yakin ingin menghapus lapangan ini?\n\nCatatan: Admin memiliki backup riwayat penghapusan untuk audit trail.",
      )
    )
      return;

    const toastId = toast.loading("Menghapus lapangan...");
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];
      const res = await fetch("/api/mitra/venues/" + id, {
        method: "DELETE",
        headers: { Authorization: "Bearer " + token },
      }).then((r) => r.json());

      if (res.success) {
        toast.success("Lapangan berhasil dihapus. History disimpan di admin.", {
          id: toastId,
        });
        fetchVenues();
      } else {
        // Provide more specific error messages
        let errorMsg = res.error || "Gagal menghapus lapangan.";
        if (
          errorMsg.toLowerCase().includes("in use") ||
          errorMsg.toLowerCase().includes("digunakan")
        ) {
          errorMsg =
            "Tidak bisa menghapus lapangan karena masih ada jadwal atau pesanan aktif. Hapus atau batalkan pesanan terlebih dahulu.";
        }
        toast.error(errorMsg, { id: toastId });
      }
    } catch (e) {
      toast.error("Gagal menghubungi server saat menghapus.", { id: toastId });
    }
  };

  return (
    <div className="space-y-8">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-black tracking-tight text-slate-900">
            Lapangan Saya
          </h1>
          <p className="text-slate-400 mt-1">
            Kelola daftar fasilitas lapangan Anda
          </p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="flex items-center gap-2 bg-lime-500 text-white px-5 py-2.5 rounded-xl text-sm font-bold hover:bg-lime-600 transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-lg">
            {showForm ? "close" : "add"}
          </span>
          {showForm ? "Tutup Form" : "Tambah Lapangan"}
        </button>
      </div>

      {/* Info Box - Admin Only Delete */}
      <div className="bg-blue-50 border border-blue-200 rounded-2xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-blue-600 text-xl mt-0.5">
          info
        </span>
        <div>
          <p className="text-sm font-bold text-blue-900">
            Catatan Penghapusan Lapangan
          </p>
          <p className="text-xs text-blue-700 mt-1">
            Admin memiliki backup riwayat penghapusan lapangan untuk audit
            trail. Pastikan tidak ada pesanan aktif sebelum menghapus.
          </p>
        </div>
      </div>

      {/* Add/Edit Venue Form */}
      {showForm && (
        <form
          onSubmit={handleSubmit}
          className="bg-white rounded-2xl p-8 border border-slate-100 space-y-6"
        >
          <h3 className="text-xl font-bold text-slate-900">
            {formData.id ? "Edit Lapangan" : "Form Buat Lapangan"}
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Nama Lapangan / Fasilitas
              </label>
              <input
                required
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none"
                placeholder="Contoh: SportTime Gajahmada"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Alamat Lengkap
              </label>
              <input
                required
                value={formData.address}
                onChange={(e) =>
                  setFormData({ ...formData, address: e.target.value })
                }
                className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none"
                placeholder="Contoh: Jl. Gajahmada No. 122"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Jumlah Lapangan (Court)
              </label>
              <input
                required
                type="number"
                min="1"
                value={formData.courts}
                onChange={(e) =>
                  setFormData({ ...formData, courts: parseInt(e.target.value) || 1 })
                }
                className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none"
                placeholder="Contoh: 2"
              />
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Jenis Olahraga
              </label>
              <select
                required
                value={formData.sport_type}
                onChange={(e) =>
                  setFormData({ ...formData, sport_type: e.target.value })
                }
                className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none appearance-none"
              >
                {SPORT_OPTIONS.map((sport) => (
                  <option key={sport.value} value={sport.value}>
                    {sport.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Harga Sewa / Jam
              </label>
              <input
                required
                value={formData.pricePerHour}
                onChange={(e) =>
                  setFormData({ ...formData, pricePerHour: e.target.value })
                }
                className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none"
                placeholder="Contoh: 250000"
              />
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Lokasi di Peta
              </label>
              <div className="grid grid-cols-2 gap-4 mb-3">
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Garis Lintang (Latitude)
                  </label>
                  <input
                    value={formData.latitude}
                    onChange={(e) =>
                      setFormData({ ...formData, latitude: e.target.value })
                    }
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none"
                    placeholder="-6.9932"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Garis Bujur (Longitude)
                  </label>
                  <input
                    value={formData.longitude}
                    onChange={(e) =>
                      setFormData({ ...formData, longitude: e.target.value })
                    }
                    className="w-full bg-slate-50 rounded-xl px-4 py-3 border-none focus:ring-2 focus:ring-lime-200 outline-none"
                    placeholder="110.4203"
                  />
                </div>
              </div>
              <div className="h-[300px] rounded-xl overflow-hidden border border-slate-200">
                <MapContainer
                  center={mapCenter}
                  zoom={13}
                  className="h-full w-full"
                  scrollWheelZoom={true}
                >
                  <TileLayer
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>'
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                  />
                  <DraggableMarker
                    lat={formData.latitude}
                    lng={formData.longitude}
                    onMove={(lat, lng) =>
                      setFormData((prev) => ({ ...prev, latitude: lat, longitude: lng }))
                    }
                    mapCenter={mapCenter}
                    setMapCenter={setMapCenter}
                  />
                </MapContainer>
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Fasilitas Tersedia
              </label>
              <div className="flex flex-wrap gap-3">
                {[
                  "Parkir",
                  "Kamar Mandi",
                  "Sewa Raket",
                  "Cafe",
                  "WiFi",
                  "Loker",
                  "Kantin",
                ].map((f) => (
                  <label
                    key={f}
                    className="flex items-center gap-2 px-4 py-2 bg-slate-50 rounded-xl hover:bg-lime-50 transition-colors cursor-pointer"
                  >
                    <input
                      type="checkbox"
                      checked={formData.facilities.includes(f)}
                      onChange={() => handleFacilityToggle(f)}
                      className="text-lime-500 rounded border-slate-300 focus:ring-lime-200"
                    />
                    <span className="text-sm font-medium">{f}</span>
                  </label>
                ))}
              </div>
            </div>
            <div className="md:col-span-2">
              <label className="block text-xs font-bold uppercase tracking-wider text-slate-400 mb-2">
                Gambar Lapangan ({formData.images.length}/4)
              </label>
              <div className="border-2 border-dashed border-slate-300 rounded-xl p-6 text-center hover:border-lime-400 hover:bg-lime-50/30 transition-colors">
                <input
                  type="file"
                  id="image-upload"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  disabled={formData.images.length >= 4}
                />
                <label htmlFor="image-upload" className="cursor-pointer block">
                  <span className="material-symbols-outlined text-4xl text-slate-300 mb-2 inline-block">
                    image
                  </span>
                  <p className="text-sm font-bold text-slate-600 mb-1">
                    {formData.images.length >= 4
                      ? "Maksimal 4 gambar tercapai"
                      : "Klik untuk pilih atau drag & drop gambar"}
                  </p>
                  <p className="text-xs text-slate-400">
                    PNG, JPG, WebP (Max 1MB per gambar) - Minimal 1, Maksimal 4 gambar
                    gambar
                  </p>
                </label>
              </div>
              {formData.images.length > 0 && (
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4">
                  {formData.images.map((img, idx) => (
                    <div key={idx} className="relative group">
                      <img
                        src={img}
                        alt={`Preview ${idx + 1}`}
                        loading="lazy"
                        className="w-full h-32 object-cover rounded-lg border border-slate-200"
                      />
                      <button
                        type="button"
                        onClick={() => removeImage(idx)}
                        className="absolute top-1 right-1 bg-red-500 text-white p-1 rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <span className="material-symbols-outlined text-lg">
                          close
                        </span>
                      </button>
                      <p className="text-xs text-slate-400 mt-1 text-center">
                        Gambar {idx + 1}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              id="btn-simpan-lapangan"
              className="bg-lime-500 text-white px-8 py-3 rounded-xl font-bold hover:bg-lime-600 transition-colors cursor-pointer"
            >
              {formData.id ? "Perbarui Lapangan" : "Simpan Lapangan"}
            </button>
              <button
                type="button"
                onClick={() => {
                  setShowForm(false);
                  setFormData({
                    id: null,
                    name: "",
                    address: "",
                    courts: 1,
                    pricePerHour: "",
                    sport_type: "padel",
                    latitude: "",
                    longitude: "",
                    facilities: [],
                    images: [],
                  });
                  setIsEditing(false);
                }}
              className="bg-slate-100 text-slate-600 px-8 py-3 rounded-xl font-bold hover:bg-slate-200 transition-colors cursor-pointer"
            >
              Batal
            </button>
          </div>
        </form>
      )}

      {/* Venue Cards */}
      {isLoading ? (
        <div className="text-center py-10 text-slate-400 font-medium">
          Memuat lapangan...
        </div>
      ) : venues.length === 0 ? (
        <div className="text-center py-10 text-slate-400 font-medium bg-white rounded-2xl border border-slate-100">
          Belum ada lapangan yang ditambahkan.
        </div>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {venues.map((venue) => (
            <div
              key={venue.id}
              className="bg-white rounded-2xl border border-slate-100 overflow-hidden hover:shadow-lg transition-shadow"
            >
                <div className="h-48 overflow-hidden relative">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={venue.image}
                    alt={venue.name}
                    loading="lazy"
                    className="w-full h-full object-cover"
                  />
                  <div className="absolute top-4 right-4 flex gap-2">
                    <span
                      className={`px-3 py-1 rounded-full text-xs font-bold ${venue.status === "Active" ? "bg-emerald-500 text-white" : "bg-slate-500 text-white"}`}
                    >
                      {venue.status}
                    </span>
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-500 text-white">
                      {SPORT_OPTIONS.find(s => s.value === (venue.sport_type || "padel"))?.label || "Padel"}
                    </span>
                  </div>
                </div>
              <div className="p-6">
                <div className="flex justify-between items-start mb-2">
                  <h3 className="text-xl font-bold text-slate-900">
                    {venue.name}
                  </h3>
                  <div className="flex items-center gap-1 text-amber-500">
                    <span
                      className="material-symbols-outlined text-base"
                      style={{ fontVariationSettings: "'FILL' 1" }}
                    >
                      star
                    </span>
                    <span className="font-bold text-sm">
                      {venue.rating || "0.0"}
                    </span>
                  </div>
                </div>
                <p className="text-sm text-slate-400 mb-4 flex items-center gap-1">
                  <span className="material-symbols-outlined text-base">
                    location_on
                  </span>
                  {venue.address}
                </p>
                <div className="grid grid-cols-3 gap-4 mb-4">
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-lg font-black text-slate-800">
                      {venue.courts}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                      Courts
                    </p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-lg font-black text-slate-800">
                      {venue.totalBookings}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                      Pesanan
                    </p>
                  </div>
                  <div className="text-center p-3 bg-slate-50 rounded-xl">
                    <p className="text-lg font-black text-slate-800">
                      {String(venue.pricePerHour).replace("Rp ", "")}
                    </p>
                    <p className="text-[10px] uppercase tracking-widest text-slate-400 font-bold">
                      /Jam
                    </p>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2 mb-4">
                  {(venue.facilities || []).map((f) => (
                    <span
                      key={f}
                      className="px-3 py-1 bg-lime-50 text-lime-700 text-xs rounded-full font-medium"
                    >
                      {f}
                    </span>
                  ))}
                </div>
                <div className="flex gap-2 border-t border-slate-100 pt-4 mt-2">
                  <button
                     onClick={() => {
                       setFormData({
                         id: venue.id,
                         name: venue.name,
                         address: venue.address,
                         courts: venue.courts,
                         pricePerHour: String(venue.pricePerHour).replace(
                           /\D/g,
                           "",
                         ),
                         sport_type: venue.sport_type || "padel",
                         latitude: String(venue.latitude ?? ""),
                         longitude: String(venue.longitude ?? ""),
                         facilities: venue.facilities || [],
                         images:
                           venue.images && venue.images.length > 0
                             ? venue.images
                             : venue.image
                               ? [venue.image]
                               : [],
                       });
                       setShowForm(true);
                       setIsEditing(true);
                       window.scrollTo({ top: 0, behavior: "smooth" });
                     }}
                    className="flex-1 bg-slate-100 text-slate-700 py-2.5 rounded-xl text-sm font-bold hover:bg-slate-200 transition-colors cursor-pointer"
                  >
                    Ubah Data
                  </button>
                  <button
                    onClick={() => handleDelete(venue.id)}
                    className="px-4 py-2.5 bg-red-50 text-red-500 rounded-xl text-sm font-bold hover:bg-red-100 transition-colors cursor-pointer"
                    title="Hapus Lapangan"
                  >
                    <span className="material-symbols-outlined text-lg">
                      delete
                    </span>
                  </button>
                  <button
                    onClick={() => router.push("/venues/" + (venue.slug || venue.id))}
                    className="px-4 py-2.5 bg-slate-900 text-white rounded-xl text-sm font-bold hover:bg-slate-800 transition-colors cursor-pointer"
                    title="Cek Tampilan"
                  >
                    <span className="material-symbols-outlined text-lg">
                      visibility
                    </span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
