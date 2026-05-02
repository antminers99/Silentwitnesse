import React from "react";
import { Link, useLocation } from "wouter";
import { Shield } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const [location] = useLocation();

  return (
    <div className="min-h-[100dvh] flex flex-col">
      <header className="border-b border-border bg-card">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 group">
            <Shield className="w-6 h-6 text-primary group-hover:text-primary/80 transition-colors" />
            <span className="font-serif font-semibold text-lg text-primary">Silent Witness</span>
          </Link>
          
          <nav className="flex items-center gap-6 text-sm font-medium text-muted-foreground">
            <Link 
              href="/create" 
              className={`hover:text-foreground transition-colors ${location === "/create" ? "text-foreground" : ""}`}
            >
              Create Record
            </Link>
            <Link 
              href="/verify" 
              className={`hover:text-foreground transition-colors ${location === "/verify" ? "text-foreground" : ""}`}
            >
              Verify
            </Link>
            <Link 
              href="/records" 
              className={`hover:text-foreground transition-colors ${location === "/records" ? "text-foreground" : ""}`}
            >
              Registry
            </Link>
            <Link 
              href="/protocol" 
              className={`hover:text-foreground transition-colors ${location === "/protocol" ? "text-foreground" : ""}`}
            >
              Protocol
            </Link>
            <Link 
              href="/safety" 
              className={`hover:text-foreground transition-colors ${location === "/safety" ? "text-foreground" : ""}`}
            >
              Safety
            </Link>
          </nav>
        </div>
      </header>

      <main className="flex-grow">
        {children}
      </main>

      <footer className="border-t border-border bg-card mt-auto">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8 text-center text-sm text-muted-foreground">
          <p>This app sends only the public record if you press Submit. It never sends the original evidence file.</p>
          <div className="mt-4 flex justify-center gap-4">
            <Link href="/protocol" className="hover:underline">Read the Protocol</Link>
            <span>&middot;</span>
            <Link href="/safety" className="hover:underline">Safety Guide</Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
