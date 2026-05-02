import React from "react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { SUPPORTED_LANGS } from "@/i18n";
import { Shield, EyeOff, Trash2, MapPin, Network } from "lucide-react";

const guides = [
  {
    icon: <Network className="w-5 h-5 text-primary flex-shrink-0" />,
    title: "Don't upload evidence to unknown servers",
    body: "Silent Witness operates entirely in your browser. It never uploads your photos, videos, or documents. Be extremely cautious of any tool that asks you to upload sensitive files before you are ready to publish them.",
  },
  {
    icon: <EyeOff className="w-5 h-5 text-primary flex-shrink-0" />,
    title: "Keep originals safe",
    body: "The fingerprint we create is only a reference. If you delete or lose the original file, the fingerprint is useless. It cannot be used to reconstruct the file.",
  },
  {
    icon: <Trash2 className="w-5 h-5 text-primary flex-shrink-0" />,
    title: "A fingerprint cannot recover a deleted file",
    body: "If you delete the original you cannot show the content. Ensure you have backed up the original evidence securely on an offline device or a trusted encrypted cloud service if safe to do so.",
  },
  {
    icon: <MapPin className="w-5 h-5 text-primary flex-shrink-0" />,
    title: "Your private note stays on your device",
    body: 'The private note field is never submitted to the registry — it lives only in your downloaded proof package. Even so, avoid writing full names, phone numbers, exact addresses, or GPS coordinates in it, in case the file is ever accessed by others.',
  },
];

export default function Safety() {
  const { t } = useTranslation();
  const { lang } = useLang();
  return (
    <Layout>
      <Helmet>
        <title>{t("seo.safetyTitle")}</title>
        <meta name="description" content={t("seo.safetyDesc")} />
        <link rel="canonical" href={`https://silentwi.com/${lang}/safety`} />
        <meta property="og:title" content={t("seo.safetyTitle")} />
        <meta property="og:description" content={t("seo.safetyDesc")} />
        <meta name="twitter:card" content="summary" />
        {SUPPORTED_LANGS.map((l) => (
          <link key={l} rel="alternate" hrefLang={l} href={`https://silentwi.com/${l}/safety`} />
        ))}
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8 sm:mb-12">
          <h1 className="text-2xl sm:text-3xl font-serif text-primary tracking-tight mb-3 flex items-center gap-2 sm:gap-3">
            <Shield className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
            Safety Guide
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Critical instructions for protecting yourself and your evidence.
          </p>
        </div>

        <div className="grid gap-4 sm:grid-cols-2 mb-8 sm:mb-12">
          {guides.map(({ icon, title, body }) => (
            <div
              key={title}
              className="bg-card border border-border p-4 sm:p-6 rounded-lg"
            >
              <div className="flex items-start gap-3 mb-3">
                {icon}
                <h3 className="font-semibold text-sm sm:text-base text-foreground leading-snug">
                  {title}
                </h3>
              </div>
              <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed pl-8">
                {body}
              </p>
            </div>
          ))}
        </div>

        <div className="bg-muted p-4 sm:p-6 rounded border border-border">
          <h4 className="font-semibold mb-2 text-sm sm:text-base">
            Architectural Note
          </h4>
          <p className="text-xs sm:text-sm text-muted-foreground leading-relaxed">
            Future versions may anchor daily Merkle roots to OpenTimestamps or
            a public blockchain. This MVP does not do that yet. Currently,
            timestamps rely on the server's receipt time.
          </p>
        </div>
      </div>
    </Layout>
  );
}
