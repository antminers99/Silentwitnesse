import React from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { SUPPORTED_LANGS } from "@/i18n";
import { WifiOff, Wifi, ListOrdered, Download } from "lucide-react";

export default function OfflinePage() {
  const { t } = useTranslation();
  const { lang, langHref } = useLang();

  return (
    <Layout>
      <Helmet>
        <title>{t("seo.offlineTitle")}</title>
        <meta name="description" content={t("seo.offlineDesc")} />
        <link rel="canonical" href={`https://silentwi.com/${lang}/offline`} />
        <meta property="og:title" content={t("seo.offlineTitle")} />
        <meta property="og:description" content={t("seo.offlineDesc")} />
        <meta name="twitter:card" content="summary" />
        {SUPPORTED_LANGS.map((l) => (
          <link key={l} rel="alternate" hrefLang={l} href={`https://silentwi.com/${l}/offline`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href="https://silentwi.com/en/offline" />
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-serif text-primary">{t("offline.title")}</h1>
          <p className="text-muted-foreground">{t("offline.subtitle")}</p>
        </div>

        {/* What works offline */}
        <div className="border border-border rounded-lg p-5 sm:p-6 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <WifiOff className="w-5 h-5 text-primary flex-shrink-0" />
            {t("offline.howTitle")}
          </h2>
          <ul className="space-y-2">
            {(["how1","how2","how3"] as const).map((key) => (
              <li key={key} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-green-500 mt-0.5 flex-shrink-0">✓</span>
                {t(`offline.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        {/* What requires internet */}
        <div className="border border-border rounded-lg p-5 sm:p-6 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Wifi className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            {t("offline.limitTitle")}
          </h2>
          <ul className="space-y-2">
            {(["limit1","limit2","limit3"] as const).map((key) => (
              <li key={key} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-muted-foreground/60 mt-0.5 flex-shrink-0">–</span>
                {t(`offline.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        {/* Instructions for higher safety */}
        <div className="border border-border rounded-lg p-5 sm:p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-primary flex-shrink-0" />
            {t("offline.instructionsTitle")}
          </h2>
          {(["instructions1","instructions2","instructions3","instructions4","instructions5"] as const).map((key, i) => (
            <div key={key} className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-muted-foreground leading-snug">{t(`offline.${key}`)}</p>
            </div>
          ))}
        </div>

        {/* Standalone / coming soon */}
        <div className="border border-dashed border-border rounded-lg p-5 space-y-2 opacity-75">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Download className="w-5 h-5 text-muted-foreground flex-shrink-0" />
            {t("offline.standaloneTitle")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("offline.standaloneText")}
          </p>
          <span className="inline-block text-xs border border-border rounded px-2 py-0.5 text-muted-foreground">
            {t("offline.standaloneBadge")}
          </span>
        </div>

        <Button asChild size="lg" className="w-full">
          <Link href={langHref("/create")}>{t("offline.ctaCreate")}</Link>
        </Button>
      </div>
    </Layout>
  );
}
