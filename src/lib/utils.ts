import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

function safelyEncodePathSegment(segment: string) {
  try {
    return encodeURI(decodeURIComponent(segment));
  } catch {
    return encodeURI(segment);
  }
}

export function normalizeImageUrl(url?: string | null) {
  if (!url) return null;

  const trimmedUrl = url
    .trim()
    .replace(/&amp;/g, "&")
    .replace(/\\/g, "/");

  if (!trimmedUrl) return null;

  if (
    trimmedUrl.startsWith("data:") ||
    trimmedUrl.startsWith("blob:") ||
    trimmedUrl.startsWith("/")
  ) {
    return trimmedUrl;
  }

  try {
    const normalizedInput = trimmedUrl.startsWith("//") ? `https:${trimmedUrl}` : trimmedUrl;
    const parsedUrl = new URL(normalizedInput);

    if (parsedUrl.hostname.endsWith("res.cloudinary.com")) {
      parsedUrl.protocol = "https:";
      parsedUrl.pathname = parsedUrl.pathname
        .split("/")
        .map((segment) => (segment ? safelyEncodePathSegment(segment) : segment))
        .join("/");

      return parsedUrl.toString();
    }

    return encodeURI(parsedUrl.toString());
  } catch {
    return trimmedUrl;
  }
}
