import React from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { SUPPORTED_LANGS } from "@/i18n";
import { Globe, CheckCircle2, Database, AlertTriangle } from "lucide-react";

export default function ForHumanRights() {
  const { t } = useTranslation();
  const { lang, langHref } = useLang();

  return (
    <Layout>
      <Helmet>
        <title>{t("seo.forHumanRightsTitle")}</title>
        <meta name="description" content={t("seo.forHumanRightsDesc")} />
        <link rel="canonical" href={`https://silentwi.com/${lang}/for-human-rights`} />
        <meta property="og:title" content={t("seo.forHumanRightsTitle")} />
        <meta property="og:description" content={t("seo.forHumanRightsDesc")} />
        <meta name="twitter:card" content="summary" />
        {SUPPORTED_LANGS.map((l) => (
          <link key={l} rel="alternate" hrefLang={l} href={`https://silentwi.com/${l}/for-human-rights`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href="https://silentwi.com/en/for-human-rights" />
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-serif text-primary">{t("forHumanRights.title")}</h1>
          <p className="text-muted-foreground">{t("forHumanRights.subtitle")}</p>
        </div>

        <div className="bg-muted/40 border border-border rounded-lg p-5 text-sm sm:text-base text-muted-foreground leading-relaxed">
          {t("forHumanRights.intro")}
        </div>

        {/* Use cases */}
        <div className="border border-border rounded-lg p-5 sm:p-6 space-y-3">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0" />
            {t("forHumanRights.usesTitle")}
          </h2>
          <ul className="space-y-2">
            {(["use1","use2","use3","use4"] as const).map((key) => (
              <li key={key} className="flex gap-2 text-sm text-muted-foreground">
                <span className="text-primary mt-0.5 flex-shrink-0">•</span>
                {t(`forHumanRights.${key}`)}
              </li>
            ))}
          </ul>
        </div>

        {/* How records appear */}
        <div className="border border-border rounded-lg p-5 sm:p-6 space-y-2">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <Database className="w-5 h-5 text-primary flex-shrink-0" />
            {t("forHumanRights.howTitle")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("forHumanRights.howText")}
          </p>
        </div>

        {/* Disclaimer */}
        <div className="border border-amber-500/40 bg-amber-500/5 rounded-lg p-5 space-y-2">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
            {t("forHumanRights.disclaimerTitle")}
          </h2>
          <p className="text-sm text-muted-foreground leading-relaxed">
            {t("forHumanRights.disclaimerText")}
          </p>
        </div>

        <div className="flex flex-col sm:flex-row gap-3">
          <Button asChild size="lg" className="flex-1">
            <Link href={langHref("/create")}>{t("forHumanRights.ctaCreate")}</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="flex-1">
            <Link href={langHref("/records")}>{t("forHumanRights.ctaRegistry")}</Link>
          </Button>
        </div>
      </div>
    </Layout>
  );
}
