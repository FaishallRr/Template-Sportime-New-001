"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import StatCard from "@/components/dashboard/StatCard";

type Review = {
  id: string;
  user_name: string;
  user_initials: string;
  rating: number;
  comment: string;
  created_at: string;
  reply_text: string | null;
  venue_name: string;
};

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

export default function MitraReviewsPage() {
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
      if (!token) return;

      const res = await fetch("/api/mitra/reviews", {
        headers: { Authorization: `Bearer ${token}` }
      });
      const data = await res.json();

      if (data.success && data.data) {
        setReviews(data.data);
      }
    } catch (e) {
      console.error("Failed to fetch reviews:", e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, []);

  const handleReply = async (reviewId: string) => {
    if (!replyText.trim()) {
      toast.error("Balasan tidak boleh kosong.");
      return;
    }

    setSubmitting(true);
    try {
      const token = document.cookie.split('; ').find(row => row.startsWith('access_token='))?.split('=')[1];
      const res = await fetch(`/api/mitra/reviews/${reviewId}/reply`, {
        method: "POST",
        headers: {
          "Authorization": `Bearer ${token}`,
          "Content-Type": "application/json"
        },
        body: JSON.stringify({ reply_text: replyText })
      });
      const data = await res.json();

      if (data.success) {
        toast.success("Balasan berhasil dikirim!");
        setReplyingTo(null);
        setReplyText("");
        fetchReviews();
      } else {
        toast.error(data.error || "Gagal mengirim balasan.");
      }
    } catch (e) {
      toast.error("Gagal menghubungi server.");
    } finally {
      setSubmitting(false);
    }
  };

  const avgRating = reviews.length > 0
    ? (reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length).toFixed(1)
    : "0";

  const repliedCount = reviews.filter(r => r.reply_text).length;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-black tracking-tight text-slate-900">Ulasan & Kritik Pemain</h1>
        <p className="text-slate-400 mt-1">Lihat ulasan dan balas feedback pengguna lapangan Anda</p>
      </div>

      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-slate-100 rounded-2xl h-24 animate-pulse" />
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
          <StatCard icon="reviews" label="Total Ulasan" value={String(reviews.length)} iconBg="bg-blue-50 text-blue-600" />
          <StatCard icon="star" label="Rata-rata Rating" value={avgRating} iconBg="bg-amber-50 text-amber-600" />
          <StatCard icon="reply" label="Telah Dibalas" value={`${repliedCount}/${String(reviews.length)}`} iconBg="bg-lime-50 text-lime-600" />
        </div>
      )}

      {/* Info Box */}
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 flex items-start gap-3">
        <span className="material-symbols-outlined text-amber-600 text-xl mt-0.5">info</span>
        <div>
          <p className="text-sm font-bold text-amber-900">Perlu Bantuan dengan Ulasan?</p>
          <p className="text-xs text-amber-700 mt-1">
            Jika ada ulasan yang melanggar ketentuan atau perlu dihapus,hubungi admin untuk mendapatkan bantuan.
          </p>
        </div>
      </div>

      {/* Reviews List */}
      <div className="space-y-4">
        {loading ? (
          Array.from({ length: 3 }).map((_, i) => (
            <div key={i} className="bg-white rounded-2xl p-6 border border-slate-100">
              <div className="h-24 bg-slate-100 animate-pulse rounded-xl" />
            </div>
          ))
        ) : reviews.length === 0 ? (
          <div className="text-center py-12 bg-white rounded-2xl border border-slate-100">
            <span className="material-symbols-outlined text-5xl text-slate-200 mb-4">rate_review</span>
            <p className="text-slate-500 font-medium">Belum ada ulasan untuk lapangan Anda.</p>
          </div>
        ) : (
          reviews.map((review) => (
            <div key={review.id} className="bg-white rounded-2xl p-6 border border-slate-100">
              <div className="flex items-start gap-4">
                <div className="w-11 h-11 rounded-full bg-slate-100 flex items-center justify-center font-bold text-sm text-slate-600 shrink-0">
                  {review.user_initials || review.user_name?.substring(0, 2).toUpperCase() || "?"}
                </div>
                <div className="flex-grow">
                  <div className="flex items-center gap-3 mb-1">
                    <span className="font-bold text-slate-800">{review.user_name}</span>
                    <StarRating rating={review.rating} />
                  </div>
                  <p className="text-xs text-slate-400 mb-3">
                    {new Date(review.created_at).toLocaleDateString("id-ID", { day: "numeric", month: "short", year: "numeric" })}
                    {review.venue_name && ` · ${review.venue_name}`}
                  </p>
                  <p className="text-sm text-slate-600 leading-relaxed">{review.comment}</p>

                  {/* Existing Reply */}
                  {review.reply_text && (
                    <div className="mt-4 ml-4 pl-4 border-l-2 border-lime-200 bg-lime-50/50 p-4 rounded-r-xl">
                      <p className="text-xs font-bold text-lime-700 mb-1">Balasan Anda</p>
                      <p className="text-sm text-slate-600">{review.reply_text}</p>
                    </div>
                  )}

                  {/* Reply Form */}
                  {!review.reply_text && replyingTo === review.id && (
                    <div className="mt-4 space-y-3">
                      <textarea
                        className="w-full bg-slate-50 rounded-xl p-4 border-none focus:ring-2 focus:ring-lime-200 outline-none text-sm resize-none"
                        rows={3}
                        placeholder="Tulis balasan untuk ulasan ini..."
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        disabled={submitting}
                      />
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleReply(review.id)}
                          disabled={submitting}
                          className="bg-lime-500 text-white px-6 py-2 min-h-[44px] rounded-lg text-sm font-bold hover:bg-lime-600 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          {submitting ? "Mengirim..." : "Kirim Balasan"}
                        </button>
                        <button
                          onClick={() => { setReplyingTo(null); setReplyText(""); }}
                          disabled={submitting}
                          className="bg-slate-100 text-slate-500 px-6 py-2 min-h-[44px] rounded-lg text-sm font-bold hover:bg-slate-200 transition-colors cursor-pointer disabled:opacity-50"
                        >
                          Batal
                        </button>
                      </div>
                    </div>
                  )}

                  {/* Reply Button */}
                  {!review.reply_text && replyingTo !== review.id && (
                    <button
                      onClick={() => setReplyingTo(review.id)}
                      className="mt-3 flex items-center gap-2 text-sm font-bold text-lime-600 hover:text-lime-700 transition-colors cursor-pointer min-h-[44px]"
                    >
                      <span className="material-symbols-outlined text-lg">reply</span>
                      Balas
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}