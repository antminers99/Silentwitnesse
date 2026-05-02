import React, { useState, useRef } from "react";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { SUPPORTED_LANGS } from "@/i18n";
import { QRCodeCanvas } from "qrcode.react";
import { Copy, Download, Printer } from "lucide-react";

const SITE_URL = "https://silentwi.com";

export default function SharePage() {
  const { t } = useTranslation();
  const { lang } = useLang();
  const [copiedMsg, setCopiedMsg] = useState(false);
  const [copiedLink, setCopiedLink] = useState(false);
  const qrRef = useRef<HTMLCanvasElement>(null);

  function copyToClipboard(text: string, which: "msg" | "link") {
    navigator.clipboard.writeText(text).then(() => {
      if (which === "msg") {
        setCopiedMsg(true);
        setTimeout(() => setCopiedMsg(false), 2000);
      } else {
        setCopiedLink(true);
        setTimeout(() => setCopiedLink(false), 2000);
      }
    });
  }

  function downloadQR() {
    const canvas = qrRef.current;
    if (!canvas) return;
    const url = canvas.toDataURL("image/png");
    const a = document.createElement("a");
    a.href = url;
    a.download = "silentwi-qr.png";
    a.click();
  }

  const shortMessage = t("share.shortMessage");

  return (
    <Layout>
      <Helmet>
        <title>{t("seo.shareTitle")}</title>
        <meta name="description" content={t("seo.shareDesc")} />
        <link rel="canonical" href={`https://silentwi.com/${lang}/share`} />
        <meta property="og:title" content={t("seo.shareTitle")} />
        <meta property="og:description" content={t("seo.shareDesc")} />
        <meta name="twitter:card" content="summary" />
        {SUPPORTED_LANGS.map((l) => (
          <link key={l} rel="alternate" hrefLang={l} href={`https://silentwi.com/${l}/share`} />
        ))}
        <link rel="alternate" hrefLang="x-default" href="https://silentwi.com/en/share" />
      </Helmet>

      <div className="max-w-2xl mx-auto px-4 py-12 sm:py-20 space-y-8 print:py-4">
        <div className="text-center space-y-2 print:space-y-1">
          <h1 className="text-3xl sm:text-4xl font-serif text-primary">{t("share.title")}</h1>
          <p className="text-muted-foreground print:hidden">{t("share.subtitle")}</p>
        </div>

        {/* QR Code */}
        <div className="border border-border rounded-lg p-6 flex flex-col items-center gap-4 print:border-black">
          <h2 className="font-semibold text-foreground">{t("share.qrTitle")}</h2>
          <p className="text-sm text-muted-foreground text-center">{t("share.qrDesc")}</p>
          <QRCodeCanvas
            ref={qrRef}
            value={SITE_URL}
            size={200}
            marginSize={2}
            className="rounded"
          />
          <p className="text-sm font-mono text-muted-foreground">{SITE_URL}</p>
          <Button
            variant="outline"
            size="sm"
            className="gap-2 print:hidden"
            onClick={downloadQR}
          >
            <Download className="w-4 h-4" />
            {t("share.qrDownload")}
          </Button>
        </div>

        {/* Short message */}
        <div className="border border-border rounded-lg p-5 space-y-3 print:hidden">
          <h2 className="font-semibold text-foreground">{t("share.shortMessageTitle")}</h2>
          <p className="text-sm text-muted-foreground leading-relaxed bg-muted/40 rounded p-3 border border-border">
            {shortMessage}
          </p>
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => copyToClipboard(shortMessage, "msg")}
            >
              <Copy className="w-4 h-4" />
              {copiedMsg ? t("share.copied") : t("share.copyMessage")}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="gap-2"
              onClick={() => copyToClipboard(SITE_URL, "link")}
            >
              <Copy className="w-4 h-4" />
              {copiedLink ? t("share.copied") : t("share.copyLink")}
            </Button>
          </div>
        </div>

        {/* Printable poster */}
        <div className="border border-border rounded-lg p-6 space-y-4 print:border-black print:p-4">
          <h2 className="font-semibold text-foreground print:hidden">{t("share.posterTitle")}</h2>
          <div className="text-center space-y-3 py-4">
            <p className="text-lg sm:text-xl font-semibold text-foreground">{t("share.posterLine1")}</p>
            <div className="space-y-1 text-muted-foreground">
              <p>{t("share.posterLine2")}</p>
              <p>{t("share.posterLine3")}</p>
              <p>{t("share.posterLine4")}</p>
              <p>{t("share.posterLine5")}</p>
            </div>
            <p className="text-xl font-mono font-bold text-primary pt-2">{t("share.posterSite")}</p>
          </div>
        </div>

        <Button
          variant="outline"
          size="lg"
          className="w-full gap-2 print:hidden"
          onClick={() => window.print()}
        >
          <Printer className="w-4 h-4" />
          {t("share.printPoster")}
        </Button>
      </div>
    </Layout>
  );
}
