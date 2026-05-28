const FALLBACK_SITE_URL = "https://www.proplaybrasil.com.br";

function trimTrailingSlash(value: string) {
  return value.replace(/\/+$/, "");
}

export function getSiteUrl() {
  const envUrl =
    process.env.NEXT_PUBLIC_SITE_URL?.trim() || process.env.NEXT_PUBLIC_APP_URL?.trim() || "";

  return trimTrailingSlash(envUrl || FALLBACK_SITE_URL);
}

export function getAbsoluteSiteUrl(pathname = "/") {
  const normalizedPath = pathname.startsWith("/") ? pathname : `/${pathname}`;
  return `${getSiteUrl()}${normalizedPath}`;
}
