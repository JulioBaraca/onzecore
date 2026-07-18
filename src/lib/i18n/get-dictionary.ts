import { cache } from "react";
import { cookies } from "next/headers";
import { DEFAULT_LOCALE, LOCALE_COOKIE, isLocale, type Locale } from "@/lib/i18n/locales";
import pt from "@/lib/i18n/dictionaries/pt";

export type Dictionary = typeof pt;

const loaders: Record<Locale, () => Promise<Dictionary>> = {
  pt: async () => pt,
  en: async () => (await import("@/lib/i18n/dictionaries/en")).default,
};

export const getLocale = cache(async (): Promise<Locale> => {
  const cookieStore = await cookies();
  const value = cookieStore.get(LOCALE_COOKIE)?.value;
  return isLocale(value) ? value : DEFAULT_LOCALE;
});

export const getDictionary = cache(async (): Promise<Dictionary> => {
  const locale = await getLocale();
  return loaders[locale]();
});
