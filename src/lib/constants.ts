export const APP_NAME = "WAI Sales Assistant";
export const SESSION_COOKIE = "wai_session";
export const DEFAULT_BUSINESS_EMAIL = "ryanfajri28@gmail.com";
export const DEFAULT_LOGIN_PASSWORD = "1234567Rusdy";

export const LEAD_STATUS_COLOR: Record<string, string> = {
  hot: "bg-red-100 text-red-700 border-red-300",
  warm: "bg-amber-100 text-amber-800 border-amber-300",
  cold: "bg-zinc-100 text-zinc-700 border-zinc-300",
  complaint: "bg-rose-100 text-rose-700 border-rose-300",
  deal: "bg-emerald-100 text-emerald-700 border-emerald-300",
  lost: "bg-neutral-200 text-neutral-700 border-neutral-300",
};

export const ORDER_STATUS_LABEL: Record<string, string> = {
  draft: "Draft",
  confirmed: "Confirmed",
  waiting_payment: "Menunggu Pembayaran",
  paid: "Lunas",
  cancelled: "Dibatalkan",
  completed: "Selesai",
};

export const FOLLOW_UP_STATUS_LABEL: Record<string, string> = {
  pending: "Pending",
  sent: "Terkirim",
  cancelled: "Dibatalkan",
};
