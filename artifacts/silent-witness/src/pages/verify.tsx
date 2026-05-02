import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Search, UploadCloud, CheckCircle2, XCircle } from "lucide-react";
import { sha256 } from "@/lib/crypto";

export default function Verify() {
  const [expectedHash, setExpectedHash] = useState("");
  const [fileToVerify, setFileToVerify] = useState<File | null>(null);
  const [manifestData, setManifestData] = useState<any>(null);
  const [isVerifying, setIsVerifying] = useState(false);
  const [result, setResult] = useState<boolean | null>(null);

  const handleManifestUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        setManifestData(json);
        if (json.packageHash) {
          setExpectedHash(json.packageHash);
        } else if (json.fileHashes && json.fileHashes.length > 0) {
          setExpectedHash(json.fileHashes[0].sha256);
        }
      } catch (err) {
        console.error("Invalid manifest JSON");
      }
    };
    reader.readAsText(file);
  };

  const verifyFile = async () => {
    if (!fileToVerify || !expectedHash) return;
    setIsVerifying(true);
    setResult(null);

    try {
      const buffer = await fileToVerify.arrayBuffer();
      const hash = await sha256(buffer);
      
      // If we have a manifest, check against fileHashes. Otherwise check against the text input.
      let matched = false;
      if (manifestData && manifestData.fileHashes) {
        matched = manifestData.fileHashes.some((fh: any) => fh.sha256 === hash);
      } else {
        matched = hash === expectedHash.trim().toLowerCase();
      }

      setResult(matched);
    } catch (err) {
      console.error(err);
      setResult(false);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-12">
        <div className="mb-10 text-center">
          <h1 className="text-3xl font-serif text-primary tracking-tight mb-4 flex items-center justify-center gap-3">
            <Search className="w-8 h-8" />
            Verify Evidence
          </h1>
          <p className="text-lg text-muted-foreground">
            Check if a local file matches a published fingerprint exactly.
          </p>
        </div>

        <div className="bg-card border border-border p-6 sm:p-8 rounded-lg shadow-sm space-y-8">
          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Step 1: Provide the Expected Fingerprint</h3>
            <div className="grid gap-4">
              <div>
                <Label htmlFor="hash-input">Paste a SHA-256 Hash</Label>
                <Input 
                  id="hash-input"
                  placeholder="e.g. a1b2c3d4..." 
                  value={expectedHash}
                  onChange={(e) => setExpectedHash(e.target.value)}
                  className="font-mono text-sm"
                />
              </div>
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>
              <div>
                <Label htmlFor="manifest-upload">Upload Manifest JSON</Label>
                <Input 
                  id="manifest-upload"
                  type="file" 
                  accept=".json"
                  onChange={handleManifestUpload}
                />
              </div>
            </div>

            {manifestData && (
              <div className="mt-4 p-4 bg-muted text-sm border border-border rounded">
                <p><strong>Protocol Version:</strong> {manifestData.protocol}</p>
                <p><strong>Package Hash:</strong> <span className="font-mono text-xs">{manifestData.packageHash}</span></p>
                {manifestData.fileHashes && (
                  <div className="mt-2">
                    <p><strong>Expected File Hashes:</strong></p>
                    <ul className="list-disc pl-5 mt-1 font-mono text-xs space-y-1">
                      {manifestData.fileHashes.map((fh: any, i: number) => (
                        <li key={i}>{fh.sha256}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="space-y-4">
            <h3 className="font-semibold text-lg">Step 2: Select Local File</h3>
            <p className="text-sm text-muted-foreground">
              Select the file from your device. It will be hashed locally and not uploaded.
            </p>
            <Input 
              type="file" 
              onChange={(e) => setFileToVerify(e.target.files?.[0] || null)}
            />
          </div>

          <div className="pt-4 border-t border-border">
            <Button 
              size="lg" 
              className="w-full" 
              onClick={verifyFile}
              disabled={!fileToVerify || !expectedHash || isVerifying}
            >
              {isVerifying ? "Computing Hash..." : "Compare"}
            </Button>
          </div>

          {result !== null && (
            <div className={`mt-6 p-6 rounded-lg border flex flex-col items-center justify-center text-center ${result ? 'bg-primary/5 border-primary/20 text-primary' : 'bg-destructive/5 border-destructive/20 text-destructive'}`}>
              {result ? (
                <>
                  <CheckCircle2 className="w-12 h-12 mb-3 text-primary" />
                  <h4 className="text-xl font-semibold mb-1">Exact cryptographic match ✓</h4>
                  <p className="text-sm opacity-80">
                    The file you selected matches the expected fingerprint.
                  </p>
                </>
              ) : (
                <>
                  <XCircle className="w-12 h-12 mb-3 text-destructive" />
                  <h4 className="text-xl font-semibold mb-1">No match ✗</h4>
                  <p className="text-sm opacity-80">
                    The file does not match the expected fingerprint. It may have been altered or is a different file.
                  </p>
                </>
              )}
              <p className="text-xs mt-4 opacity-60">
                Careful wording: "Exact cryptographic match" not "verified" or "proven truth".
              </p>
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
