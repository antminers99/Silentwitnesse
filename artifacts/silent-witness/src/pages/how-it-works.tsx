import React from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { SUPPORTED_LANGS } from "@/i18n";
import { HelpCircle, CheckCircle2, XCircle, Trash2, RefreshCw, ListOrdered } from "lucide-react";

function Section({ icon, title, children }: { icon: React.ReactNode; title: string; children: React.ReactNode }) {
  return (
    <div className="border border-border rounded-lg p-5 sm:p-6 space-y-2">
      <h2 className="font-semibold text-foreground flex items-center gap-2">
        <span className="text-primary flex-shrink-0">{icon}</span>
        {title}
      </h2>
      <div className="text-sm sm:text-base text-muted-foreground leading-relaxed">{children}</div>
    </div>
  );
}

export default function HowItWorks() {
  const { t } = useTranslation();
  const { lang, langHref } = useLang();

  return (
    <Layout>
      <Helmet>
        <title>{t("seo.howItWorksTitle")}</title>
        <meta name="description" content={t("seo.howItWorksDesc")} />
        <link rel="canonical" href={`https://silentwi.com/${lang}/how-it-works`} />
        <meta property="og:title" content={t("seo.howItWorksTitle")} />
        <meta property="og:description" content={t("seo.howItWorksDesc")} />
        <meta name="twitter:card" content="summary" />
        {SUPPORTED_LANGS.map((l) => (
          <link key={l} rel="alternate" hrefLang={l} href={`https://silentwi.com/${l}/how-it-works`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href="https://silentwi.com/en/how-it-works" />
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20 space-y-6">
        <div className="text-center space-y-2">
          <h1 className="text-3xl sm:text-4xl font-serif text-primary">{t("howItWorks.title")}</h1>
          <p className="text-muted-foreground">{t("howItWorks.subtitle")}</p>
        </div>

        <Section icon={<HelpCircle className="w-5 h-5" />} title={t("howItWorks.whatIsTitle")}>
          {t("howItWorks.whatIsText")}
        </Section>

        <Section icon={<CheckCircle2 className="w-5 h-5" />} title={t("howItWorks.whatProvesTitle")}>
          {t("howItWorks.whatProvesText")}
        </Section>

        <Section icon={<XCircle className="w-5 h-5" />} title={t("howItWorks.whatNotProvesTitle")}>
          {t("howItWorks.whatNotProvesText")}
        </Section>

        <Section icon={<Trash2 className="w-5 h-5" />} title={t("howItWorks.deletedTitle")}>
          {t("howItWorks.deletedText")}
        </Section>

        <Section icon={<RefreshCw className="w-5 h-5" />} title={t("howItWorks.compressionTitle")}>
          {t("howItWorks.compressionText")}
        </Section>

        {/* Steps */}
        <div className="border border-border rounded-lg p-5 sm:p-6 space-y-4">
          <h2 className="font-semibold text-foreground flex items-center gap-2">
            <ListOrdered className="w-5 h-5 text-primary flex-shrink-0" />
            {t("howItWorks.stepsTitle")}
          </h2>
          {(["step1","step2","step3","step4","step5"] as const).map((s, i) => (
            <div key={s} className="flex gap-3">
              <div className="flex-shrink-0 w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold mt-0.5">
                {i + 1}
              </div>
              <div>
                <div className="font-medium text-foreground text-sm">{t(`howItWorks.${s}Title`)}</div>
                <div className="text-sm text-muted-foreground leading-snug mt-0.5">{t(`howItWorks.${s}Desc`)}</div>
              </div>
            </div>
          ))}
        </div>

        <Button asChild size="lg" className="w-full">
          <Link href={langHref("/create")}>{t("howItWorks.ctaCreate")}</Link>
        </Button>
      </div>
    </Layout>
  );
}
