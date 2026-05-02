import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Shield, Menu, X, Globe } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useTranslation } from "react-i18next";
import { SUPPORTED_LANGS, isValidLang } from "@/i18n";
import { useLang } from "@/hooks/useLang";

export function Layout({ children }: { children: React.ReactNode }) {
  const { t } = useTranslation();
  const { lang, langHref } = useLang();
  const [location, navigate] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);
  const [langOpen, setLangOpen] = useState(false);

  const navLinks = [
    { path: "/create", label: t("nav.create") },
    { path: "/verify", label: t("nav.verify") },
    { path: "/records", label: t("nav.registry") },
    { path: "/protocol", label: t("nav.protocol") },
    { path: "/safety", label: t("nav.safety") },
  ];

  function switchLang(newLang: string) {
    if (!isValidLang(newLang)) return;
    localStorage.setItem("sw-lang", newLang);
    const parts = location.split("/").filter(Boolean);
    const rest = parts.slice(1).join("/");
    navigate(`/${newLang}${rest ? `/${rest}` : ""}`);
    setLangOpen(false);
    setMenuOpen(false);
  }

  function isActive(path: string) {
    return location === langHref(path) || location.startsWith(langHref(path) + "/");
  }

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between gap-4">
          {/* Logo */}
          <Link
            href={langHref("/")}
            className="flex items-center gap-2 group shrink-0"
            onClick={() => setMenuOpen(false)}
          >
            <Shield className="w-5 h-5 sm:w-6 sm:h-6 text-primary group-hover:text-primary/80 transition-colors" />
            <span className="font-serif font-semibold text-base sm:text-lg text-primary">
              Silent Witness
            </span>
          </Link>

          {/* Desktop nav */}
          <nav
            className="hidden md:flex items-center gap-5 text-sm font-medium text-muted-foreground"
            data-testid="nav-desktop"
          >
            {navLinks.map(({ path, label }) => (
              <Link
                key={path}
                href={langHref(path)}
                className={`hover:text-foreground transition-colors ${isActive(path) ? "text-foreground" : ""}`}
              >
                {label}
              </Link>
            ))}
          </nav>

          {/* Language selector (desktop) + mobile menu button */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Language dropdown */}
            <div className="relative">
              <Button
                variant="ghost"
                size="sm"
                className="h-8 px-2 gap-1 text-muted-foreground hover:text-foreground"
                onClick={() => setLangOpen(!langOpen)}
                aria-label="Select language"
                data-testid="button-lang-selector"
              >
                <Globe className="w-4 h-4" />
                <span className="text-xs font-medium uppercase">{lang}</span>
              </Button>

              {langOpen && (
                <>
                  <div
                    className="fixed inset-0 z-10"
                    onClick={() => setLangOpen(false)}
                  />
                  <div className="absolute end-0 top-full mt-1 z-20 bg-card border border-border rounded-md shadow-lg py-1 min-w-[160px]">
                    {SUPPORTED_LANGS.map((l) => (
                      <button
                        key={l}
                        onClick={() => switchLang(l)}
                        className={`w-full text-start px-4 py-2 text-sm transition-colors hover:bg-muted ${
                          l === lang ? "text-primary font-medium" : "text-muted-foreground"
                        }`}
                      >
                        {t(`langNames.${l}`)}
                      </button>
                    ))}
                  </div>
                </>
              )}
            </div>

            {/* Mobile hamburger */}
            <Button
              variant="ghost"
              size="sm"
              className="md:hidden p-2"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle navigation menu"
              data-testid="button-mobile-menu"
            >
              {menuOpen ? (
                <X className="w-5 h-5 text-foreground" />
              ) : (
                <Menu className="w-5 h-5 text-foreground" />
              )}
            </Button>
          </div>
        </div>

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div className="md:hidden border-t border-border bg-card" data-testid="nav-mobile">
            <nav className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-1">
              {navLinks.map(({ path, label }) => (
                <Link
                  key={path}
                  href={langHref(path)}
                  onClick={() => setMenuOpen(false)}
                  className={`py-2.5 px-3 rounded text-sm font-medium transition-colors ${
                    isActive(path)
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              ))}

              {/* Language list in mobile */}
              <div className="mt-2 pt-2 border-t border-border">
                <p className="px-3 py-1 text-xs text-muted-foreground/60 uppercase tracking-wide">
                  Language
                </p>
                <div className="grid grid-cols-3 gap-1 mt-1">
                  {SUPPORTED_LANGS.map((l) => (
                    <button
                      key={l}
                      onClick={() => switchLang(l)}
                      className={`py-2 px-2 rounded text-xs font-medium transition-colors text-center ${
                        l === lang
                          ? "bg-primary text-primary-foreground"
                          : "text-muted-foreground hover:bg-muted hover:text-foreground"
                      }`}
                    >
                      {t(`langNames.${l}`)}
                    </button>
                  ))}
                </div>
              </div>
            </nav>
          </div>
        )}
      </header>

      <main className="flex-grow min-w-0">{children}</main>

      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center text-sm text-muted-foreground">
          <p className="leading-relaxed">
            When you submit, only the cryptographic fingerprint and safe metadata are sent.
            Your original file never leaves your device.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link href={langHref("/protocol")} className="hover:underline">
              {t("nav.protocol")}
            </Link>
            <span className="hidden sm:inline">&middot;</span>
            <Link href={langHref("/safety")} className="hover:underline">
              {t("nav.safety")}
            </Link>
            <span className="hidden sm:inline">&middot;</span>
            <Link href={langHref("/share")} className="hover:underline">
              {t("nav.share")}
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
