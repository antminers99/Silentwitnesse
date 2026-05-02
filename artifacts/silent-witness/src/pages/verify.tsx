import React, { useState } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search, CheckCircle2, XCircle } from "lucide-react";
import { sha256 } from "@/lib/crypto";

export default function Verify() {
  const [expectedHash, setExpectedHash] = useState("");
  const [fileToVerify, setFileToVerify] = useState<File | null>(null);
  const [manifestData, setManifestData] = useState<Record<string, unknown> | null>(null);
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
          setExpectedHash(String(json.packageHash));
        } else if (Array.isArray(json.fileHashes) && json.fileHashes.length > 0) {
          setExpectedHash(String(json.fileHashes[0].sha256));
        }
      } catch {
        // ignore parse error
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
      let matched = false;
      if (manifestData && Array.isArray(manifestData.fileHashes)) {
        matched = (manifestData.fileHashes as Array<{ sha256: string }>).some(
          (fh) => fh.sha256 === hash
        );
      } else {
        matched = hash === expectedHash.trim().toLowerCase();
      }
      setResult(matched);
    } catch {
      setResult(false);
    } finally {
      setIsVerifying(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8 sm:mb-10 text-center">
          <h1 className="text-2xl sm:text-3xl font-serif text-primary tracking-tight mb-3 flex items-center justify-center gap-2 sm:gap-3">
            <Search className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
            Verify Evidence
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Check if a local file matches a published fingerprint exactly.
          </p>
        </div>

        <div className="bg-card border border-border p-4 sm:p-6 lg:p-8 rounded-lg shadow-sm space-y-6 sm:space-y-8">
          {/* Step 1 */}
          <div className="space-y-4">
            <h3 className="font-semibold text-base sm:text-lg">
              Step 1: Provide the Expected Fingerprint
            </h3>
            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="hash-input">Paste a SHA-256 Hash</Label>
                <Input
                  id="hash-input"
                  placeholder="e.g. a1b2c3d4..."
                  value={expectedHash}
                  onChange={(e) => setExpectedHash(e.target.value)}
                  className="font-mono text-xs sm:text-sm"
                  data-testid="input-expected-hash"
                />
              </div>

              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <span className="w-full border-t border-border" />
                </div>
                <div className="relative flex justify-center text-xs uppercase">
                  <span className="bg-card px-2 text-muted-foreground">Or</span>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="manifest-upload">Upload Manifest JSON</Label>
                <Input
                  id="manifest-upload"
                  type="file"
                  accept=".json"
                  onChange={handleManifestUpload}
                  data-testid="input-manifest-upload"
                />
              </div>
            </div>

            {manifestData && (
              <div className="mt-4 p-3 sm:p-4 bg-muted text-xs sm:text-sm border border-border rounded space-y-1.5">
                <p>
                  <strong>Protocol Version:</strong>{" "}
                  {String(manifestData.protocol ?? "—")}
                </p>
                <p className="break-all">
                  <strong>Package Hash:</strong>{" "}
                  <span className="font-mono text-xs">
                    {String(manifestData.packageHash ?? "—")}
                  </span>
                </p>
                {Array.isArray(manifestData.fileHashes) &&
                  manifestData.fileHashes.length > 0 && (
                    <div>
                      <p className="font-medium mb-1">Expected File Hashes:</p>
                      <ul className="space-y-1 font-mono text-xs break-all">
                        {(
                          manifestData.fileHashes as Array<{ sha256: string }>
                        ).map((fh, i) => (
                          <li
                            key={i}
                            className="bg-background p-1.5 rounded border border-border"
                          >
                            {fh.sha256}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
              </div>
            )}
          </div>

          {/* Step 2 */}
          <div className="space-y-3">
            <h3 className="font-semibold text-base sm:text-lg">
              Step 2: Select Local File
            </h3>
            <p className="text-xs sm:text-sm text-muted-foreground">
              Select the file from your device. It will be hashed locally and not uploaded.
            </p>
            <Input
              type="file"
              onChange={(e) => setFileToVerify(e.target.files?.[0] || null)}
              data-testid="input-file-verify"
            />
          </div>

          {/* Compare button */}
          <div className="pt-4 border-t border-border">
            <Button
              size="lg"
              className="w-full"
              onClick={verifyFile}
              disabled={!fileToVerify || !expectedHash || isVerifying}
              data-testid="button-compare"
            >
              {isVerifying ? "Computing Hash..." : "Compare"}
            </Button>
          </div>

          {/* Result */}
          {result !== null && (
            <div
              className={`p-5 sm:p-6 rounded-lg border flex flex-col items-center justify-center text-center gap-3 ${
                result
                  ? "bg-primary/5 border-primary/20 text-primary"
                  : "bg-destructive/5 border-destructive/20 text-destructive"
              }`}
              data-testid={result ? "result-match" : "result-no-match"}
            >
              {result ? (
                <>
                  <CheckCircle2 className="w-10 h-10 sm:w-12 sm:h-12" />
                  <div>
                    <h4 className="text-lg sm:text-xl font-semibold mb-1">
                      Exact cryptographic match
                    </h4>
                    <p className="text-xs sm:text-sm opacity-80">
                      The file you selected matches the expected fingerprint.
                    </p>
                  </div>
                </>
              ) : (
                <>
                  <XCircle className="w-10 h-10 sm:w-12 sm:h-12" />
                  <div>
                    <h4 className="text-lg sm:text-xl font-semibold mb-1">
                      No match
                    </h4>
                    <p className="text-xs sm:text-sm opacity-80">
                      The file does not match the expected fingerprint. It may
                      have been altered or is a different file.
                    </p>
                  </div>
                </>
              )}
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}
