import i18n from "i18next";
import { initReactI18next } from "react-i18next";

import en from "./locales/en.json";
import ar from "./locales/ar.json";
import fr from "./locales/fr.json";
import es from "./locales/es.json";
import de from "./locales/de.json";
import tr from "./locales/tr.json";
import ru from "./locales/ru.json";
import fa from "./locales/fa.json";
import ku from "./locales/ku.json";
import pt from "./locales/pt.json";
import uk from "./locales/uk.json";
import it from "./locales/it.json";
import he from "./locales/he.json";
import ur from "./locales/ur.json";
import hi from "./locales/hi.json";
import id from "./locales/id.json";
import zh from "./locales/zh.json";
import ja from "./locales/ja.json";
import ko from "./locales/ko.json";

export const SUPPORTED_LANGS = [
  "en","ar","fr","es","de","tr","ru","fa","ku","pt","uk",
  "it","he","ur","hi","id","zh","ja","ko",
] as const;
export type Lang = (typeof SUPPORTED_LANGS)[number];
export const RTL_LANGS: Lang[] = ["ar","fa","ku","he","ur"];

export function isValidLang(l: string): l is Lang {
  return (SUPPORTED_LANGS as readonly string[]).includes(l);
}

export function detectBrowserLang(): Lang {
  const nav = (navigator.language ?? "en").slice(0, 2).toLowerCase();
  return isValidLang(nav) ? nav : "en";
}

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    ar: { translation: ar },
    fr: { translation: fr },
    es: { translation: es },
    de: { translation: de },
    tr: { translation: tr },
    ru: { translation: ru },
    fa: { translation: fa },
    ku: { translation: ku },
    pt: { translation: pt },
    uk: { translation: uk },
    it: { translation: it },
    he: { translation: he },
    ur: { translation: ur },
    hi: { translation: hi },
    id: { translation: id },
    zh: { translation: zh },
    ja: { translation: ja },
    ko: { translation: ko },
  },
  lng: "en",
  fallbackLng: "en",
  interpolation: { escapeValue: false },
});

export default i18n;
