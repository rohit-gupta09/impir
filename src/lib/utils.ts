import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export function normalizeImageUrl(url?: string | null) {
  if (!url) return null;

  const trimmedUrl = url.trim();
  if (!trimmedUrl) return null;

  if (
    trimmedUrl.startsWith("data:") ||
    trimmedUrl.startsWith("blob:") ||
    trimmedUrl.startsWith("/")
  ) {
    return trimmedUrl;
  }

  try {
    return encodeURI(trimmedUrl);
  } catch {
    return trimmedUrl;
  }
}
