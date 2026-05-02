import React, { useState } from "react";
import { Link, useLocation } from "wouter";
import { Shield, Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";

const navLinks = [
  { href: "/create", label: "Create Record" },
  { href: "/verify", label: "Verify" },
  { href: "/records", label: "Registry" },
  { href: "/protocol", label: "Protocol" },
  { href: "/safety", label: "Safety" },
];

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="border-b border-border bg-card sticky top-0 z-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-14 sm:h-16 flex items-center justify-between">
          <Link
            href="/"
            className="flex items-center gap-2 group"
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
            {navLinks.map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className={`hover:text-foreground transition-colors ${location === href ? "text-foreground" : ""}`}
              >
                {label}
              </Link>
            ))}
          </nav>

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

        {/* Mobile dropdown menu */}
        {menuOpen && (
          <div
            className="md:hidden border-t border-border bg-card"
            data-testid="nav-mobile"
          >
            <nav className="max-w-5xl mx-auto px-4 py-3 flex flex-col gap-1">
              {navLinks.map(({ href, label }) => (
                <Link
                  key={href}
                  href={href}
                  onClick={() => setMenuOpen(false)}
                  className={`py-2.5 px-3 rounded text-sm font-medium transition-colors ${
                    location === href
                      ? "bg-muted text-foreground"
                      : "text-muted-foreground hover:bg-muted hover:text-foreground"
                  }`}
                >
                  {label}
                </Link>
              ))}
            </nav>
          </div>
        )}
      </header>

      <main className="flex-grow min-w-0">{children}</main>

      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-6 sm:py-8 text-center text-sm text-muted-foreground">
          <p className="leading-relaxed">
            This app sends only the public record if you press Submit. It never
            sends the original evidence file.
          </p>
          <div className="mt-3 flex flex-wrap justify-center gap-x-4 gap-y-1">
            <Link href="/protocol" className="hover:underline">
              Read the Protocol
            </Link>
            <span className="hidden sm:inline">&middot;</span>
            <Link href="/safety" className="hover:underline">
              Safety Guide
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
