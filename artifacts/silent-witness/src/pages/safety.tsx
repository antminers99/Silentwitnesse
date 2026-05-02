import React from "react";
import { Layout } from "@/components/layout";
import { Shield, EyeOff, Trash2, MapPin, Network } from "lucide-react";

export default function Safety() {
  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-12">
          <h1 className="text-3xl font-serif text-primary tracking-tight mb-4 flex items-center gap-3">
            <Shield className="w-8 h-8" />
            Safety Guide
          </h1>
          <p className="text-lg text-muted-foreground">Critical instructions for protecting yourself and your evidence.</p>
        </div>

        <div className="grid gap-8 sm:grid-cols-2 mb-12">
          <div className="bg-card border border-border p-6 rounded-lg">
            <Network className="w-6 h-6 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2 text-foreground">Don't upload evidence to unknown servers</h3>
            <p className="text-sm text-muted-foreground">
              Silent Witness operates entirely in your browser. It never uploads your photos, videos, or documents. Be extremely cautious of any tool that asks you to upload sensitive files before you are ready to publish them.
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-lg">
            <EyeOff className="w-6 h-6 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2 text-foreground">Keep originals safe</h3>
            <p className="text-sm text-muted-foreground">
              The fingerprint we create is only a reference. If you delete or lose the original file, the fingerprint is useless. It cannot be used to reconstruct the file.
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-lg">
            <Trash2 className="w-6 h-6 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2 text-foreground">A fingerprint cannot recover a deleted file</h3>
            <p className="text-sm text-muted-foreground">
              If you delete the original you cannot show the content. Ensure you have backed up the original evidence securely on an offline device or a trusted encrypted cloud service if safe to do so.
            </p>
          </div>

          <div className="bg-card border border-border p-6 rounded-lg">
            <MapPin className="w-6 h-6 text-primary mb-4" />
            <h3 className="font-semibold text-lg mb-2 text-foreground">Public notes must be general</h3>
            <p className="text-sm text-muted-foreground">
              Public notes must not include names, exact places, or direct accusations. Use broader locations only (e.g., "Northern District" rather than "123 Main Street"). If publishing any metadata may put someone at risk, save the record locally only.
            </p>
          </div>
        </div>

        <div className="bg-muted p-6 rounded border border-border">
          <h4 className="font-semibold mb-2">Architectural Note</h4>
          <p className="text-sm text-muted-foreground">
            Future versions may anchor daily Merkle roots to OpenTimestamps or a public blockchain. This MVP does not do that yet. Currently, timestamps rely on the server's receipt time.
          </p>
        </div>
      </div>
    </Layout>
  );
}
