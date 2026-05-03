import React, { useState, useMemo } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { SUPPORTED_LANGS } from "@/i18n";
import {
  CheckCircle2,
  XCircle,
  Shield,
  FileText,
  Search,
  Hash,
  Clock,
  Lock,
  Download,
  AlertTriangle,
} from "lucide-react";

/* ── Fuzzy-search text normaliser ─────────────────────────────────────────── */
function normalizeSearch(text: string): string {
  return text
    .toLowerCase()
    .replace(/[\u064B-\u065F\u0670]/g, "")    // Arabic tashkeel
    .replace(/[أإآ]/g, "ا")                   // Alef variants → ا
    .replace(/ة/g, "ه")                       // Teh marbuta → ه
    .replace(/ى/g, "ي")                       // Alef maqsura → ي
    .replace(/[^\u0600-\u06FFa-z0-9\s]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
}

const FAQ_IDS = ["1", "2", "3", "4", "5", "6", "7", "8"] as const;

const PROVES_KEYS = ["proves1", "proves2", "proves3"] as const;
const NOT_PROVES_KEYS = [
  "notProves1", "notProves2", "notProves3", "notProves4", "notProves5",
] as const;
const AUDIENCE_KEYS = [
  "audience1", "audience2", "audience3",
  "audience4", "audience5", "audience6",
] as const;

const simpleSteps = [
  { num: "1", titleKey: "simpleStep1Title", descKey: "simpleStep1Desc", Icon: FileText },
  { num: "2", titleKey: "simpleStep2Title", descKey: "simpleStep2Desc", Icon: Hash },
  { num: "3", titleKey: "simpleStep3Title", descKey: "simpleStep3Desc", Icon: Clock },
];

const privacyItems = [
  { key: "privacyItem1", Icon: Shield },
  { key: "privacyItem2", Icon: Hash },
  { key: "privacyItem3", Icon: Search },
  { key: "privacyItem4", Icon: Clock },
  { key: "privacyItem5", Icon: Download },
  { key: "privacyItem6", Icon: AlertTriangle },
];

/* ── Component ────────────────────────────────────────────────────────────── */
export default function HowItWorks() {
  const { t } = useTranslation();
  const { lang, langHref, isRtl } = useLang();
  const [faqQuery, setFaqQuery] = useState("");
  const [openFaq, setOpenFaq] = useState<string | null>(null);

  const filteredFaq = useMemo(() => {
    if (!faqQuery.trim()) return [...FAQ_IDS];
    const nq = normalizeSearch(faqQuery);
    const words = nq.split(" ").filter((w) => w.length > 0);
    return FAQ_IDS.filter((id) => {
      const haystack = normalizeSearch(
        [
          t(`howItWorks.faq${id}q`),
          t(`howItWorks.faq${id}a`),
          t(`howItWorks.faq${id}k`, ""),
        ].join(" ")
      );
      return words.some((w) => haystack.includes(w));
    });
  }, [faqQuery, t]);

  return (
    <Layout>
      <Helmet>
        <title>{t("seo.howItWorksTitle")}</title>
        <meta name="description" content={t("seo.howItWorksDesc")} />
        <link rel="canonical" href={`https://silentwi.com/${lang}/how-it-works`} />
        <meta property="og:title" content={t("seo.howItWorksTitle")} />
        <meta property="og:description" content={t("seo.howItWorksDesc")} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        {SUPPORTED_LANGS.map((l) => (
          <link key={l} rel="alternate" hrefLang={l} href={`https://silentwi.com/${l}/how-it-works`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href="https://silentwi.com/en/how-it-works" />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-14 space-y-10 sm:space-y-14">

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <section className="text-center space-y-4">
          <h1 className="text-3xl sm:text-4xl font-serif text-primary leading-tight">
            {t("howItWorks.heroTitle")}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground max-w-xl mx-auto leading-relaxed">
            {t("howItWorks.heroSubtitle")}
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center pt-1">
            <Button asChild size="lg">
              <Link href={langHref("/create")}>{t("howItWorks.ctaStart")}</Link>
            </Button>
          </div>
        </section>

        {/* ── Privacy callout ───────────────────────────────────────────── */}
        <div className="flex items-center gap-3 bg-primary/5 border border-primary/20 rounded-xl px-5 py-4">
          <Lock className="w-5 h-5 text-primary flex-shrink-0" />
          <p className="text-sm sm:text-base font-semibold text-primary">
            {t("howItWorks.privacyCallout")}
          </p>
        </div>

        {/* ── Simple 3 steps ────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl sm:text-2xl font-serif text-foreground mb-6 text-center">
            {t("howItWorks.simpleStepsTitle")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {simpleSteps.map(({ num, titleKey, descKey, Icon }) => (
              <div key={num} className="border border-border rounded-xl p-5 space-y-3 bg-card">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-sm font-bold flex-shrink-0">
                    {num}
                  </div>
                  <Icon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <div className="font-semibold text-foreground text-sm">
                    {t(`howItWorks.${titleKey}`)}
                  </div>
                  <div className="text-sm text-muted-foreground mt-1 leading-snug">
                    {t(`howItWorks.${descKey}`)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── What this proves ──────────────────────────────────────────── */}
        <section className="border border-emerald-200 dark:border-emerald-900 rounded-xl p-5 sm:p-6 space-y-3 bg-emerald-50/50 dark:bg-emerald-950/20">
          <h2 className="text-lg sm:text-xl font-semibold text-emerald-800 dark:text-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
            {t("howItWorks.provesTitle")}
          </h2>
          <ul className="space-y-2.5">
            {PROVES_KEYS.map((k) => (
              <li key={k} className="flex gap-2.5 text-sm text-emerald-900 dark:text-emerald-200 leading-relaxed">
                <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0 mt-0.5" />
                {t(`howItWorks.${k}`)}
              </li>
            ))}
          </ul>
        </section>

        {/* ── What this does NOT prove ──────────────────────────────────── */}
        <section className="border border-amber-200 dark:border-amber-800 rounded-xl p-5 sm:p-6 space-y-3 bg-amber-50/60 dark:bg-amber-950/20">
          <h2 className="text-lg sm:text-xl font-semibold text-amber-800 dark:text-amber-300 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 flex-shrink-0" />
            {t("howItWorks.notProvesTitle")}
          </h2>
          <ul className="space-y-2.5">
            {NOT_PROVES_KEYS.map((k) => (
              <li key={k} className="flex gap-2.5 text-sm text-amber-900 dark:text-amber-200 leading-relaxed">
                <XCircle className="w-4 h-4 text-amber-500 flex-shrink-0 mt-0.5" />
                {t(`howItWorks.${k}`)}
              </li>
            ))}
          </ul>
        </section>

        {/* ── Who is this for ───────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl sm:text-2xl font-serif text-foreground mb-5 text-center">
            {t("howItWorks.audienceTitle")}
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
            {AUDIENCE_KEYS.map((k) => (
              <div
                key={k}
                className="border border-border rounded-xl p-3.5 text-center text-sm font-medium text-foreground bg-card hover:border-primary/40 transition-colors"
              >
                {t(`howItWorks.${k}`)}
              </div>
            ))}
          </div>
        </section>

        {/* ── Plain-language example ────────────────────────────────────── */}
        <section className="border-s-4 border-primary bg-primary/5 px-5 py-4 space-y-2 rounded-e-xl">
          <h2 className="text-base font-semibold text-foreground">
            {t("howItWorks.exampleTitle")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            &ldquo;{t("howItWorks.exampleText")}&rdquo;
          </p>
        </section>

        {/* ── Safety and privacy ────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl sm:text-2xl font-serif text-foreground mb-5 text-center">
            {t("howItWorks.privacyTitle")}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {privacyItems.map(({ key, Icon }) => (
              <div key={key} className="flex items-center gap-3 border border-border rounded-xl p-3.5 bg-card">
                <Icon className="w-4 h-4 text-primary flex-shrink-0" />
                <span className="text-sm font-medium text-foreground">
                  {t(`howItWorks.${key}`)}
                </span>
              </div>
            ))}
          </div>
        </section>

        {/* ── FAQ ───────────────────────────────────────────────────────── */}
        <section>
          <h2 className="text-xl sm:text-2xl font-serif text-foreground mb-4">
            {t("howItWorks.faqTitle")}
          </h2>

          {/* Search input */}
          <div className="relative mb-4">
            <Search
              className={`absolute top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none ${
                isRtl ? "end-3" : "start-3"
              }`}
            />
            <input
              type="search"
              value={faqQuery}
              onChange={(e) => {
                setFaqQuery(e.target.value);
                setOpenFaq(null);
              }}
              placeholder={t("howItWorks.faqSearchPlaceholder")}
              className={`w-full border border-border rounded-lg bg-background text-foreground text-sm py-2.5 focus:outline-none focus:ring-2 focus:ring-primary/40 ${
                isRtl ? "pr-4 pl-9" : "pl-9 pr-4"
              }`}
              dir={isRtl ? "rtl" : "ltr"}
            />
          </div>

          {/* FAQ results */}
          {filteredFaq.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center border border-border rounded-lg px-4">
              {t("howItWorks.faqNoResults")}
            </p>
          ) : (
            <div className="space-y-2">
              {filteredFaq.map((id) => (
                <div key={id} className="border border-border rounded-lg overflow-hidden">
                  <button
                    type="button"
                    onClick={() => setOpenFaq(openFaq === id ? null : id)}
                    className="w-full text-start flex items-center justify-between px-4 py-3.5 text-sm font-medium hover:bg-muted/50 transition-colors gap-3"
                  >
                    <span>{t(`howItWorks.faq${id}q`)}</span>
                    <span className="text-muted-foreground flex-shrink-0 text-base leading-none">
                      {openFaq === id ? "−" : "+"}
                    </span>
                  </button>
                  {openFaq === id && (
                    <div className="px-4 py-3.5 text-sm text-muted-foreground leading-relaxed border-t border-border bg-muted/20">
                      {t(`howItWorks.faq${id}a`)}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </section>

        {/* ── Language notice ───────────────────────────────────────────── */}
        <p className="text-xs text-muted-foreground text-center border-t border-border pt-4">
          {t("howItWorks.langNotice")}
        </p>

        {/* ── CTA ───────────────────────────────────────────────────────── */}
        <Button asChild size="lg" className="w-full">
          <Link href={langHref("/create")}>{t("howItWorks.ctaCreate")}</Link>
        </Button>

      </div>
    </Layout>
  );
}
