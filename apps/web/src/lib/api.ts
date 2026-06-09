const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";
const DEFAULT_TIMEOUT = 15000;

export const API_ENDPOINTS = {
  login: `${API_BASE_URL}/api/auth/login`,
  refresh: `${API_BASE_URL}/api/auth/refresh`,
  me: `${API_BASE_URL}/api/auth/me`,
  profile: `${API_BASE_URL}/api/auth/profile`,

  venues: `${API_BASE_URL}/api/venues`,
  venueDetail: (id: string) => `${API_BASE_URL}/api/venues/${id}`,
  venueSlots: (id: string) => `${API_BASE_URL}/api/venues/${id}/slots`,

  mitraVenues: `${API_BASE_URL}/api/mitra/venues`,
  mitraAddVenue: `${API_BASE_URL}/api/mitra/venues`,
  mitraDeleteVenue: (id: string) => `${API_BASE_URL}/api/mitra/venues/${id}`,

  mitraSlots: `${API_BASE_URL}/api/mitra/slots`,
  mitraSlotsGenerate: `${API_BASE_URL}/api/mitra/slots/generate`,
  mitraSlotsStatus: `${API_BASE_URL}/api/mitra/slots/status`,

  mitraBookings: `${API_BASE_URL}/api/bookings/mitra`,
  userBookings: `${API_BASE_URL}/api/bookings/user`,
  allBookings: `${API_BASE_URL}/api/bookings/all`,
  createBooking: `${API_BASE_URL}/api/bookings`,
  bookingDetail: (id: string) => `${API_BASE_URL}/api/bookings/${id}`,
  cancelBooking: (id: string) => `${API_BASE_URL}/api/bookings/${id}/cancel`,
  mockPayment: `${API_BASE_URL}/api/bookings/mock-payment`,

  venuesReviews: (venueId: string) => `${API_BASE_URL}/api/venues/${venueId}/reviews`,
  mitraReviews: `${API_BASE_URL}/api/mitra/reviews`,
  mitraReplyReview: (id: string) => `${API_BASE_URL}/api/mitra/reviews/${id}/reply`,

  mitraDashboard: `${API_BASE_URL}/api/mitra/dashboard`,
  mitraRevenue: `${API_BASE_URL}/api/mitra/revenue`,
  mitraDailyRevenue: `${API_BASE_URL}/api/mitra/revenue/daily`,
  mitraTransactions: `${API_BASE_URL}/api/mitra/transactions`,
  adminDashboard: `${API_BASE_URL}/api/admin/dashboard`,
  adminTransactions: `${API_BASE_URL}/api/admin/transactions`,

  mitraProfile: `${API_BASE_URL}/api/mitra/profile`,
  mitraBank: `${API_BASE_URL}/api/mitra/bank`,
  mitraNotifications: `${API_BASE_URL}/api/mitra/notifications`,
  mitraSettings: `${API_BASE_URL}/api/mitra/settings`,
  mitraWithdrawals: `${API_BASE_URL}/api/mitra/withdrawals`,

  adminMitras: `${API_BASE_URL}/api/admin/mitras`,
  adminMitraStatus: (id: string) => `${API_BASE_URL}/api/admin/mitras/${id}/status`,
  adminReviews: `${API_BASE_URL}/api/admin/reviews`,
  adminReviewAction: (id: string) => `${API_BASE_URL}/api/admin/reviews/${id}`,
  adminDeletedVenues: `${API_BASE_URL}/api/admin/venues/deleted`,
  adminRestoreVenue: (id: string) => `${API_BASE_URL}/api/admin/venues/${id}/restore`,

  adminWithdrawals: `${API_BASE_URL}/api/admin/withdrawals`,
  adminApproveWithdrawal: (id: string) => `${API_BASE_URL}/api/admin/withdrawals/${id}/approve`,
  adminRejectWithdrawal: (id: string) => `${API_BASE_URL}/api/admin/withdrawals/${id}/reject`,

  adminPromos: `${API_BASE_URL}/api/admin/promos`,
  adminPromoDetail: (id: string) => `${API_BASE_URL}/api/admin/promos/${id}`,

  validatePromo: `${API_BASE_URL}/api/promo/validate`,
  health: `${API_BASE_URL}/api/health`,
};

export const getAuthToken = (): string | undefined => {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("access_token="))
    ?.split("=")[1];
};

export const getRefreshToken = (): string | undefined => {
  if (typeof document === "undefined") return undefined;
  return document.cookie
    .split("; ")
    .find((row) => row.startsWith("refresh_token="))
    ?.split("=")[1];
};

export const setCookie = (name: string, value: string, maxAge: number) => {
  document.cookie = `${name}=${value}; Path=/; SameSite=Lax; Max-Age=${maxAge}`;
};

let refreshPromise: Promise<string | null> | null = null;

async function refreshAccessToken(): Promise<string | null> {
  const refreshToken = getRefreshToken();
  if (!refreshToken) return null;

  try {
    const res = await fetch(API_ENDPOINTS.refresh, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });
    if (!res.ok) return null;

    const data = await res.json();
    if (!data.success || !data.data?.access_token) return null;

    const newToken = data.data.access_token;
    const expiresIn = data.data.expires_in || 86400;
    setCookie("access_token", newToken, expiresIn);
    return newToken;
  } catch {
    return null;
  }
}

export const fetchWithAuth = async (
  url: string,
  options?: RequestInit,
  timeout = DEFAULT_TIMEOUT,
): Promise<Response> => {
  const token = getAuthToken();
  const headers: Record<string, string> = {
    ...((options?.headers as Record<string, string>) || {}),
  };
  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  const doFetch = (): Promise<Response> =>
    fetch(url, { ...options, headers, signal: controller.signal });

  let response: Response;
  try {
    response = await doFetch();
  } finally {
    clearTimeout(timeoutId);
  }

  if (response.status === 401 && token) {
    if (!refreshPromise) {
      refreshPromise = refreshAccessToken();
    }
    const newToken = await refreshPromise;
    refreshPromise = null;

    if (newToken) {
      headers["Authorization"] = `Bearer ${newToken}`;
      const retryController = new AbortController();
      const retryTimeoutId = setTimeout(() => retryController.abort(), timeout);
      try {
        response = await fetch(url, { ...options, headers, signal: retryController.signal });
      } finally {
        clearTimeout(retryTimeoutId);
      }
    }
  }

  return response;
};

export const fetchJSON = async <T = unknown>(
  url: string,
  options?: RequestInit,
  timeout?: number,
): Promise<T> => {
  const res = await fetchWithAuth(url, options, timeout);
  return res.json();
};

export function handleApiError(error: unknown, showToast = true): string {
  let message = "Terjadi kesalahan. Silakan coba lagi.";

  if (error instanceof DOMException && error.name === "AbortError") {
    message = "Permintaan timeout. Periksa koneksi Anda.";
  } else if (error instanceof TypeError) {
    message = "Tidak dapat terhubung ke server. Periksa koneksi internet Anda.";
  } else if (error instanceof Error) {
    message = error.message;
  }

  if (showToast) {
    import("react-hot-toast").then((m) => m.default.error(message));
  }

  return message;
};