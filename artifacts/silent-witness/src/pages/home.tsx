import React from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, Search, BookOpen, AlertTriangle } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { SUPPORTED_LANGS } from "@/i18n";

export default function Home() {
  const { t } = useTranslation();
  const { lang, langHref } = useLang();

  return (
    <Layout>
      <Helmet>
        <title>{t("seo.homeTitle")}</title>
        <meta name="description" content={t("seo.homeDesc")} />
        <link rel="canonical" href={`https://silentwi.com/${lang}`} />
        <meta property="og:title" content={t("seo.homeTitle")} />
        <meta property="og:description" content={t("seo.homeDesc")} />
        <meta property="og:type" content="website" />
        <meta name="twitter:card" content="summary" />
        <meta name="twitter:title" content={t("seo.homeTitle")} />
        <meta name="twitter:description" content={t("seo.homeDesc")} />
        {SUPPORTED_LANGS.map((l) => (
          <link key={l} rel="alternate" hrefLang={l} href={`https://silentwi.com/${l}`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href="https://silentwi.com/en" />
      </Helmet>

      <div className="max-w-3xl mx-auto px-4 py-14 sm:py-24">
        {/* Hero */}
        <div className="text-center space-y-4 sm:space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-primary tracking-tight">
            {t("home.title")}
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            {t("home.subtitle")}
          </p>
          <p className="text-sm sm:text-base text-muted-foreground/70 italic max-w-xl mx-auto pt-1">
            &ldquo;{t("home.slogan")}&rdquo;
          </p>
        </div>

        {/* Plain-language intro */}
        <div className="mt-8 sm:mt-12 bg-muted/40 border border-border rounded-lg p-5 sm:p-6 space-y-2 text-sm sm:text-base text-muted-foreground leading-relaxed">
          <p>{t("home.intro1")}</p>
          <p>{t("home.intro2")}</p>
          <p className="font-medium text-foreground">{t("home.intro3")}</p>
          <p>{t("home.intro4")}</p>
        </div>

        {/* 3-step block */}
        <div className="mt-8 sm:mt-10 bg-card border border-border rounded-lg p-5 sm:p-8 shadow-sm">
          <h2 className="text-base sm:text-lg font-semibold mb-5 sm:mb-6 flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
            {t("home.stepsTitle")}
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-5 sm:gap-6 text-sm">
            {/* Step 1 */}
            <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 flex-1 sm:text-center sm:max-w-[180px]">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold sm:hidden">
                1
              </div>
              <div>
                <div className="font-medium text-foreground mb-1 sm:mb-2">
                  <span className="hidden sm:inline">1. </span>{t("home.step1Title")}
                </div>
                <div className="text-muted-foreground text-sm leading-snug">
                  {t("home.step1Desc")}
                </div>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block opacity-50 flex-shrink-0 rtl:rotate-180" />

            {/* Step 2 */}
            <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 flex-1 sm:text-center sm:max-w-[180px]">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold sm:hidden">
                2
              </div>
              <div>
                <div className="font-medium text-foreground mb-1 sm:mb-2">
                  <span className="hidden sm:inline">2. </span>{t("home.step2Title")}
                </div>
                <div className="text-muted-foreground text-sm leading-snug">
                  {t("home.step2Desc")}
                </div>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block opacity-50 flex-shrink-0 rtl:rotate-180" />

            {/* Step 3 */}
            <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 flex-1 sm:text-center sm:max-w-[180px]">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold sm:hidden">
                3
              </div>
              <div>
                <div className="font-medium text-foreground mb-1 sm:mb-2">
                  <span className="hidden sm:inline">3. </span>{t("home.step3Title")}
                </div>
                <div className="text-muted-foreground text-sm leading-snug">
                  {t("home.step3Desc")}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* How verification works */}
        <div className="mt-8 sm:mt-10 border border-border rounded-lg p-5 sm:p-6 space-y-4">
          <h2 className="text-base sm:text-lg font-semibold text-foreground">
            How verification works
          </h2>
          <ol className="space-y-2 text-sm text-muted-foreground leading-relaxed list-decimal list-inside">
            <li>A user creates a fingerprint from the original file.</li>
            <li>The original file stays with the user.</li>
            <li>Silent Witness records the fingerprint and registry time.</li>
            <li>Later, if the original file is safely shared, anyone can select that file on the Verify page.</li>
            <li>The browser calculates the fingerprint again.</li>
            <li>If the new fingerprint matches the old one, the later file is exactly the same file that was fingerprinted earlier.</li>
          </ol>
          <div className="flex items-start gap-2 text-xs text-amber-800 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded p-3">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <span>This proves a file match, not that the event happened.</span>
          </div>
          <div className="bg-muted/60 border border-border rounded p-4 text-xs font-mono text-muted-foreground leading-relaxed space-y-0.5">
            <div>Original file</div>
            <div className="ps-2">→ fingerprint created locally</div>
            <div className="ps-2">→ fingerprint stored in registry</div>
            <div className="ps-2">→ later file selected</div>
            <div className="ps-2">→ fingerprint calculated again</div>
            <div className="ps-2">→ match / no match</div>
          </div>
        </div>

        {/* CTAs */}
        <div className="mt-8 sm:mt-10 flex flex-col gap-3">
          <Button asChild size="lg" className="w-full text-base" data-testid="button-create-record">
            <Link href={langHref("/create")}>{t("home.ctaCreate")}</Link>
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button asChild variant="outline" size="lg" className="w-full text-sm sm:text-base" data-testid="button-verify-evidence">
              <Link href={langHref("/verify")}>
                <Search className="w-4 h-4 me-2 flex-shrink-0" />
                {t("home.ctaVerify")}
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg" className="w-full text-sm sm:text-base" data-testid="button-how-it-works">
              <Link href={langHref("/how-it-works")}>
                <BookOpen className="w-4 h-4 me-2 flex-shrink-0" />
                {t("home.ctaHowItWorks")}
              </Link>
            </Button>
          </div>
        </div>

        {/* Audience links */}
        <div className="mt-6 grid grid-cols-3 gap-2 text-center text-xs text-muted-foreground">
          <Link href={langHref("/for-witnesses")} className="hover:text-foreground hover:underline transition-colors p-2">
            {t("nav.forWitnesses")}
          </Link>
          <Link href={langHref("/for-journalists")} className="hover:text-foreground hover:underline transition-colors p-2">
            {t("nav.forJournalists")}
          </Link>
          <Link href={langHref("/for-human-rights")} className="hover:text-foreground hover:underline transition-colors p-2">
            {t("nav.forHumanRights")}
          </Link>
        </div>

        {/* Disclaimer */}
        <div className="mt-8 sm:mt-12">
          <div className="bg-muted text-muted-foreground px-4 py-3 rounded text-xs sm:text-sm border border-border leading-relaxed text-center">
            {t("home.disclaimer")}
          </div>
        </div>
      </div>
    </Layout>
  );
}
