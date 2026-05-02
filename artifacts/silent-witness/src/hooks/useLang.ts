import { useLocation } from "wouter";
import { isValidLang, type Lang, RTL_LANGS } from "@/i18n";

export function useLang(): { lang: Lang; isRtl: boolean; langHref: (path: string) => string } {
  const [location] = useLocation();
  const seg = location.split("/")[1] ?? "";
  const lang: Lang = isValidLang(seg) ? seg : "en";
  const isRtl = RTL_LANGS.includes(lang);

  function langHref(path: string): string {
    const clean = path.startsWith("/") ? path : `/${path}`;
    return `/${lang}${clean}`;
  }

  return { lang, isRtl, langHref };
}
