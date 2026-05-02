import React from "react";
import { Link } from "wouter";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, ShieldCheck, FileText, Search } from "lucide-react";

export default function Home() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-24 sm:py-32">
        <div className="text-center space-y-6">
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-serif text-primary tracking-tight">
            Silent Witness
          </h1>
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-2xl mx-auto">
            Preserve proof without publishing danger.
          </p>
        </div>

        <div className="mt-16 bg-card border border-border rounded-lg p-6 sm:p-8 shadow-sm">
          <h2 className="text-lg font-semibold mb-6 flex items-center justify-center gap-2">
            <ShieldCheck className="w-5 h-5 text-primary" />
            How it works
          </h2>
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8 text-sm text-center">
            <div className="flex-1 max-w-[200px]">
              <div className="font-medium text-foreground mb-2">1. Choose File</div>
              <div className="text-muted-foreground">Select evidence or write testimony on your device.</div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground hidden sm:block opacity-50" />
            <div className="flex-1 max-w-[200px]">
              <div className="font-medium text-foreground mb-2">2. Local Fingerprint</div>
              <div className="text-muted-foreground">Browser computes a cryptographic hash. Original stays on device.</div>
            </div>
            <ArrowRight className="w-5 h-5 text-muted-foreground hidden sm:block opacity-50" />
            <div className="flex-1 max-w-[200px]">
              <div className="font-medium text-foreground mb-2">3. Publish Record</div>
              <div className="text-muted-foreground">Save proof package or publish only the fingerprint to the registry.</div>
            </div>
          </div>
        </div>

        <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
          <Button asChild size="lg" className="w-full sm:w-auto text-base">
            <Link href="/create">Create a Witness Record</Link>
          </Button>
          <Button asChild variant="outline" size="lg" className="w-full sm:w-auto text-base">
            <Link href="/verify">
              <Search className="w-4 h-4 mr-2" />
              Verify Evidence
            </Link>
          </Button>
          <Button asChild variant="secondary" size="lg" className="w-full sm:w-auto text-base">
            <Link href="/protocol">
              <FileText className="w-4 h-4 mr-2" />
              Read the Protocol
            </Link>
          </Button>
        </div>

        <div className="mt-20 text-center">
          <div className="inline-block bg-muted text-muted-foreground px-4 py-2 rounded text-sm border border-border">
            <strong>Critical Disclaimer:</strong> A fingerprint is not proof that an event happened. It is a timestamped reference.
          </div>
        </div>
      </div>
    </Layout>
  );
}
