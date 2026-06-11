"use client";

import { useState, useEffect } from "react";
import StatCard from "@/components/dashboard/StatCard";
import PageHeader from "@/components/dashboard/PageHeader";
import toast from "react-hot-toast";

interface Review {
  id: string;
  user: string;
  initials: string;
  venue: string;
  rating: number;
  text: string;
  date: string;
  visible: boolean;
  flagged: boolean;
  flag_reason: string;
  [key: string]: unknown;
}

const StarRating = ({ rating }: { rating: number }) => (
  <div className="flex gap-0.5">
    {Array.from({ length: 5 }).map((_, i) => (
      <span
        key={i}
        className={`material-symbols-outlined text-base ${i < rating ? "text-amber-400" : "text-slate-200"}`}
        style={{ fontVariationSettings: "'FILL' 1" }}
      >
        star
      </span>
    ))}
  </div>
);

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [stats, setStats] = useState({ total_reviews: 0, avg_rating: 0, flagged_count: 0 });
  const [filter, setFilter] = useState<"all" | "flagged">("all");
  const [isLoading, setIsLoading] = useState(true);

  const fetchReviews = async () => {
    setIsLoading(true);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];
      const res = await fetch("/api/admin/reviews", {
        headers: { Authorization: "Bearer " + token },
      });
      const data = await res.json();
      if (data.success && data.data) {
        setReviews(data.data.reviews || []);
        setStats({
          total_reviews: data.data.total_reviews || 0,
          avg_rating: data.data.avg_rating || 0,
          flagged_count: data.data.flagged_count || 0,
        });
      }
    } catch {
      toast.error("Gagal memuat ulasan");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleAction = async (reviewId: string, action: string) => {
    const labels: Record<string, string> = { approve: "menyetujui", flag: "menandai", delete: "menghapus" };
    if (!confirm(`Yakin ingin ${labels[action]} ulasan ini?`)) return;

    const toastId = toast.loading(`Sedang ${labels[action]}...`);
    try {
      const token = document.cookie
        .split("; ")
        .find((row) => row.startsWith("access_token="))
        ?.split("=")[1];
      const res = await fetch(`/api/admin/reviews/${reviewId}`, {
        method: "PATCH",
        headers: {
          Authorization: "Bearer " + token,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ action }),
      }).then((r) => r.json());

      if (res.success) {
        toast.success(res.message || "Berhasil!", { id: toastId });
        fetchReviews();
      } else {
        toast.error(res.error || "Gagal.", { id: toastId });
      }
    } catch {
      toast.error("Gagal menghubungi server.", { id: toastId });
    }
  };

  const filtered = filter === "all" ? reviews : reviews.filter((r) => r.flagged);

  return (
    <div className="space-y-8">
      <PageHeader
        title="Moderasi Ulasan"
        subtitle="Monitor dan moderasi ulasan pengguna"
        icon="reviews"
      />

      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 md:gap-6">
        <StatCard icon="reviews" label="Total Ulasan" value={String(stats.total_reviews)} trend="+12" trendUp iconBg="bg-blue-50 text-blue-600" />
        <StatCard icon="star" label="Rating Rata-rata" value={String(stats.avg_rating)} iconBg="bg-amber-50 text-amber-600" />
        <StatCard icon="flag" label="Ulasan Ditandai" value={String(stats.flagged_count)} trend={stats.flagged_count > 0 ? "perlu tindakan" : undefined} iconBg="bg-red-50 text-red-500" />
      </div>

      <div className="flex gap-2 overflow-x-auto pb-2 -mx-4 px-4 md:mx-0 md:px-0">
        <button
          onClick={() => setFilter("all")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer whitespace-nowrap min-h-[44px] ${filter === "all" ? "bg-slate-900 text-white" : "bg-white text-slate-500 hover:bg-slate-100 border border-slate-200"}`}
        >
          Semua Ulasan
        </button>
        <button
          onClick={() => setFilter("flagged")}
          className={`px-4 py-2 rounded-xl text-sm font-bold transition-all cursor-pointer flex items-center gap-2 whitespace-nowrap min-h-[44px] ${filter === "flagged" ? "bg-red-500 text-white" : "bg-white text-red-500 hover:bg-red-50 border border-red-200"}`}
        >
          <span className="material-symbols-outlined text-base">flag</span>
          Ditandai ({stats.flagged_count})
        </button>
      </div>

      {isLoading ? (
        <div className="text-center py-10 text-slate-400">Memuat ulasan...</div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-10 text-slate-400">Belum ada ulasan.</div>
      ) : (
        <div className="space-y-4">
          {filtered.map((review) => (
            <div
              key={review.id}
              className={`bg-white rounded-2xl p-6 border transition-all ${
                review.flagged ? "border-red-200 bg-red-50/30" : "border-slate-100"
              }`}
            >
              <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
                <div className="flex items-start gap-3 md:gap-4 min-w-0">
                  <div className="w-10 h-10 md:w-11 md:h-11 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-600 shrink-0">
                    {review.initials}
                  </div>
                  <div className="flex-grow min-w-0">
                    <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-1">
                      <span className="font-bold text-slate-800">{review.user}</span>
                      <StarRating rating={review.rating} />
                      {review.flagged && (
                        <span className="px-2 py-0.5 bg-red-100 text-red-600 text-xs font-bold rounded-full uppercase">
                          Ditandai
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-slate-400 mb-3">
                      {review.venue} · {review.date}
                    </p>
                    <p className="text-sm text-slate-600 leading-relaxed">
                      {review.text}
                    </p>
                  </div>
                </div>

                <div className="flex gap-2 shrink-0 ml-4">
                  <button onClick={() => handleAction(review.id, "approve")} className="p-2 rounded-lg hover:bg-emerald-50 text-slate-400 hover:text-emerald-600 transition-colors cursor-pointer min-h-[44px] min-w-[44px]" title="Approve">
                    <span className="material-symbols-outlined">check_circle</span>
                  </button>
                  <button onClick={() => handleAction(review.id, "flag")} className="p-2 rounded-lg hover:bg-amber-50 text-slate-400 hover:text-amber-600 transition-colors cursor-pointer min-h-[44px] min-w-[44px]" title="Flag">
                    <span className="material-symbols-outlined">flag</span>
                  </button>
                  <button onClick={() => handleAction(review.id, "delete")} className="p-2 rounded-lg hover:bg-red-50 text-slate-400 hover:text-red-500 transition-colors cursor-pointer min-h-[44px] min-w-[44px]" title="Delete">
                    <span className="material-symbols-outlined">delete</span>
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