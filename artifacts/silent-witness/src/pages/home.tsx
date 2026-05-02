import React from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, FileText, Search } from "lucide-react";

export default function Home() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-14 sm:py-24">
        <div className="text-center space-y-4 sm:space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-primary tracking-tight">
            Silent Witness
          </h1>
          <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Preserve proof without publishing danger.
          </p>
        </div>

        <div className="mt-10 sm:mt-16 bg-card border border-border rounded-lg p-5 sm:p-8 shadow-sm">
          <h2 className="text-base sm:text-lg font-semibold mb-5 sm:mb-6 flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary flex-shrink-0" />
            How it works
          </h2>
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-center gap-5 sm:gap-6 text-sm">
            <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 flex-1 sm:text-center sm:max-w-[180px]">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold sm:hidden">
                1
              </div>
              <div>
                <div className="font-medium text-foreground mb-1 sm:mb-2">
                  <span className="hidden sm:inline">1. </span>Choose File
                </div>
                <div className="text-muted-foreground text-sm leading-snug">
                  Select evidence or write testimony on your device.
                </div>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block opacity-50 flex-shrink-0" />

            <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 flex-1 sm:text-center sm:max-w-[180px]">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold sm:hidden">
                2
              </div>
              <div>
                <div className="font-medium text-foreground mb-1 sm:mb-2">
                  <span className="hidden sm:inline">2. </span>Local Fingerprint
                </div>
                <div className="text-muted-foreground text-sm leading-snug">
                  Browser computes a cryptographic hash. Original stays on device.
                </div>
              </div>
            </div>

            <ArrowRight className="w-4 h-4 text-muted-foreground hidden sm:block opacity-50 flex-shrink-0" />

            <div className="flex sm:flex-col items-start sm:items-center gap-3 sm:gap-2 flex-1 sm:text-center sm:max-w-[180px]">
              <div className="flex-shrink-0 w-7 h-7 rounded-full bg-primary text-primary-foreground flex items-center justify-center text-xs font-bold sm:hidden">
                3
              </div>
              <div>
                <div className="font-medium text-foreground mb-1 sm:mb-2">
                  <span className="hidden sm:inline">3. </span>Publish Record
                </div>
                <div className="text-muted-foreground text-sm leading-snug">
                  Save proof package or publish only the fingerprint to the registry.
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-8 sm:mt-12 flex flex-col gap-3">
          <Button
            asChild
            size="lg"
            className="w-full text-base"
            data-testid="button-create-record"
          >
            <Link href="/create">Create a Witness Record</Link>
          </Button>
          <div className="grid grid-cols-2 gap-3">
            <Button
              asChild
              variant="outline"
              size="lg"
              className="w-full text-sm sm:text-base"
              data-testid="button-verify-evidence"
            >
              <Link href="/verify">
                <Search className="w-4 h-4 mr-2 flex-shrink-0" />
                Verify Evidence
              </Link>
            </Button>
            <Button
              asChild
              variant="secondary"
              size="lg"
              className="w-full text-sm sm:text-base"
              data-testid="button-read-protocol"
            >
              <Link href="/protocol">
                <FileText className="w-4 h-4 mr-2 flex-shrink-0" />
                Read Protocol
              </Link>
            </Button>
          </div>
        </div>

        <div className="mt-10 sm:mt-16">
          <div className="bg-muted text-muted-foreground px-4 py-3 rounded text-xs sm:text-sm border border-border leading-relaxed text-center">
            Silent Witness may help show that a matching file, text, or evidence package existed
            before a recorded time. It does not prove that an event happened, identify a
            perpetrator, or guarantee legal admissibility.
          </div>
        </div>
      </div>
    </Layout>
  );
}
