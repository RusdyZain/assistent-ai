import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function formatRupiah(value: number | string | null | undefined) {
  const num = Number(value ?? 0);
  return new Intl.NumberFormat("id-ID", {
    style: "currency",
    currency: "IDR",
    maximumFractionDigits: 0,
  }).format(num);
}

export function formatDateTime(value: Date | string | null | undefined) {
  if (!value) return "-";
  const date = value instanceof Date ? value : new Date(value);
  if (Number.isNaN(date.getTime())) return "-";

  return new Intl.DateTimeFormat("id-ID", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(date);
}

export function normalizePhone(value: string) {
  const cleaned = value.replace(/[^0-9+]/g, "");
  if (cleaned.startsWith("+")) return cleaned;

  if (cleaned.startsWith("0")) {
    return `62${cleaned.slice(1)}`;
  }

  return cleaned;
}

export function truncate(value: string, length = 120) {
  if (value.length <= length) return value;
  return `${value.slice(0, length)}...`;
}
