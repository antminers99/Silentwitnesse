import React from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { SUPPORTED_LANGS } from "@/i18n";
import { Newspaper, CheckCircle2, ListOrdered, AlertTriangle } from "lucide-react";

export default function ForJournalists() {
  const { t } = useTranslation();
  const { lang, langHref } = useLang();

  return (
    <Layout>
      <Helmet>
        <title>{t("seo.forJournalistsTitle")}</title>
        <meta name="description" content={t("seo.forJournalistsDesc")} />
        <link rel="canonical" href={`https://silentwi.com/${lang}/for-journalists`} />
        <meta property="og:title" content={t("seo.forJournalistsTitle")} />
        <meta property="og:description" content={t("seo.forJournalistsDesc")} />
        <meta name="twitter:card" content="summary" />
        {SUPPORTED_LANGS.map((l) => (
          <link key={l} rel="alternate" hrefLang={l} href={`https://silentwi.com/${l}/for-journalists`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href="https://silentwi.com/en/for-journalists" />
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-serif text-primary">{t("forJournalists.title")}</h1>
          <p className="text-muted-foreground">{t("forJournalists.subtitle")}</p>
        </div>

        <div className="bg-muted/40 border border-border rounded-lg p-5 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t("forJournalists.intro")}
        </div>

        {/* Use cases */}
        <div className="border border-border rounded-lg p-5 sm:p-6 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            {t("forJournalists.usesTitle")}
          </h2>
          <ul className="space-y-2">
            {(["use1","use2","use3"] as const).map((key) => (
              <li key={key} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                {t(`forJournalists.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        {/* How it works */}
        <div className="border border-border rounded-lg p-5 sm:p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-primary flex-shrink-0" />
            {t("forJournalists.howTitle")}
          </h2>
          {(["how1","how2","how3","how4"] as const).map((key, i) => (
            <div key={key} className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </div>
              <p className="text-sm text-muted-foreground leading-snug">{t(`forJournalists.${key}`)}</p>
            </div>
          ))}
        </div>

        {/* Disclaimer */}
        <div className="border border-amber-500/40 bg-amber-500/5 rounded-lg p-5 space-y-2">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            {t("forJournalists.disclaimerTitle")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("forJournalists.disclaimerText")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg" className="flex-1">
            <Link href={langHref("/create")}>{t("forJournalists.ctaCreate")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1">
            <Link href={langHref("/verify")}>{t("forJournalists.ctaVerify")}</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
