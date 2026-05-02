import React, { useState, useCallback } from "react";
import { Link } from "wouter";
import { Helmet } from "react-helmet-async";
import { Layout } from "@/components/layout";
import { useTranslation } from "react-i18next";
import { useLang } from "@/hooks/useLang";
import { SUPPORTED_LANGS } from "@/i18n";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Search,
  CheckCircle2,
  XCircle,
  FileJson,
  Hash,
  ShieldCheck,
  Loader2,
  AlertTriangle,
  Info,
  Database,
  ExternalLink,
} from "lucide-react";
import { sha256 } from "@/lib/crypto";
import { getRecord } from "@workspace/api-client-react";

// ── Types ────────────────────────────────────────────────────────────────────

interface FileHashEntry {
  sha256: string;
  name?: string;
  size?: number;
}

interface ManifestData {
  protocol?: string;
  packageHash?: string;
  fileHashes?: FileHashEntry[];
  createdAtLocal?: string;
  eventType?: string;
  evidenceType?: string;
  [key: string]: unknown;
}

type MatchResult =
  | { kind: "match"; against: string; label: string }
  | { kind: "no-match"; computed: string; expected: string; label: string }
  | { kind: "manifest-valid"; packageHash: string }
  | { kind: "manifest-tampered"; packageHash: string; computed: string }
  | { kind: "error"; message: string };

// ── Helpers ──────────────────────────────────────────────────────────────────

function truncate(s: string, n = 16) {
  return s.length > n ? s.slice(0, n) + "…" : s;
}

async function hashFile(file: File): Promise<string> {
  const buffer = await file.arrayBuffer();
  return sha256(buffer);
}

/**
 * Re-computes the packageHash the same way create.tsx does:
 * sha256(JSON.stringify(baseManifest, null, 2))
 *
 * IMPORTANT: The downloaded proof package contains two extra fields that are
 * added AFTER the hash is computed and must therefore be excluded here:
 *   - packageHash  (the hash itself, obviously)
 *   - retractionToken  (raw UUID added post-hash for local storage only)
 */
async function recomputePackageHash(manifest: ManifestData): Promise<string> {
  const { packageHash: _ph, retractionToken: _rt, ...rest } = manifest;
  void _ph; void _rt;
  return sha256(JSON.stringify(rest, null, 2));
}

function parseManifest(text: string): ManifestData | null {
  try {
    const parsed = JSON.parse(text);
    if (typeof parsed !== "object" || parsed === null) return null;
    return parsed as ManifestData;
  } catch {
    return null;
  }
}

const HEX64 = /^[0-9a-f]{64}$/i;

// ── Registry Lookup ────────────────────────────────────────────────────────────

function RegistryLookupMode() {
  const { langHref } = useLang();
  const [hashInput, setHashInput] = useState("");
  const [status, setStatus] = useState<
    | { kind: "idle" }
    | { kind: "loading" }
    | { kind: "found"; url: string; serverReceivedAtUtc: string }
    | { kind: "not-found" }
    | { kind: "invalid" }
  >({ kind: "idle" });

  const handleSearch = useCallback(async () => {
    const trimmed = hashInput.trim().toLowerCase();
    if (!trimmed) return;
    if (!HEX64.test(trimmed)) {
      setStatus({ kind: "invalid" });
      return;
    }
    setStatus({ kind: "loading" });
    try {
      const record = await getRecord(trimmed);
      setStatus({
        kind: "found",
        url: `/records/${trimmed}`,
        serverReceivedAtUtc: String(record.serverReceivedAtUtc ?? ""),
      });
    } catch {
      setStatus({ kind: "not-found" });
    }
  }, [hashInput]);

  return (
    <div className="space-y-5">
      <div className="bg-muted/40 border border-border rounded-lg p-4 text-sm text-muted-foreground leading-relaxed flex items-start gap-2">
        <Info className="w-4 h-4 flex-shrink-0 mt-0.5" />
        <span>
          Paste a SHA-256 fingerprint to check whether it has been registered in the public
          registry. No file is uploaded.
        </span>
      </div>

      <div className="space-y-2">
        <Label htmlFor="registry-hash-input">SHA-256 Fingerprint (64 hex characters)</Label>
        <div className="flex gap-2">
          <Input
            id="registry-hash-input"
            value={hashInput}
            onChange={(e) => { setHashInput(e.target.value); setStatus({ kind: "idle" }); }}
            onKeyDown={(e) => e.key === "Enter" && void handleSearch()}
            placeholder="e.g. a3f5c2…"
            className="font-mono text-xs sm:text-sm"
            data-testid="input-registry-hash"
          />
          <Button
            onClick={() => void handleSearch()}
            disabled={status.kind === "loading"}
            data-testid="button-registry-search"
          >
            {status.kind === "loading" ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Search className="w-4 h-4" />
            )}
          </Button>
        </div>
      </div>

      {status.kind === "invalid" && (
        <div className="flex items-start gap-3 rounded-lg border border-destructive/30 bg-destructive/5 p-4">
          <XCircle className="w-5 h-5 text-destructive flex-shrink-0 mt-0.5" />
          <p className="text-sm text-destructive">
            A SHA-256 fingerprint must be exactly 64 lowercase hexadecimal characters.
          </p>
        </div>
      )}

      {status.kind === "not-found" && (
        <div className="flex items-start gap-3 rounded-lg border border-border bg-muted/40 p-4">
          <XCircle className="w-5 h-5 text-muted-foreground flex-shrink-0 mt-0.5" />
          <p className="text-sm text-muted-foreground">
            No public registry record was found for this fingerprint.
          </p>
        </div>
      )}

      {status.kind === "found" && (
        <div className="flex items-start gap-3 rounded-lg border border-primary/20 bg-primary/5 p-4">
          <CheckCircle2 className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
          <div className="space-y-1.5 min-w-0">
            <p className="text-sm font-semibold text-primary">
              Fingerprint found in the public registry.
            </p>
            {status.serverReceivedAtUtc && (
              <p className="text-xs text-muted-foreground">
                Registry received:{" "}
                <span className="font-mono">
                  {new Date(status.serverReceivedAtUtc).toUTCString()}
                </span>
              </p>
            )}
            <Link
              href={langHref(status.url)}
              className="inline-flex items-center gap-1 text-xs text-primary underline underline-offset-2 hover:no-underline mt-1"
              data-testid="link-registry-record"
            >
              <ExternalLink className="w-3 h-3 flex-shrink-0" />
              View full record
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}

// ── Sub-components ────────────────────────────────────────────────────────────

function ResultPanel({ result }: { result: MatchResult }) {
  const isPositive =
    result.kind === "match" || result.kind === "manifest-valid";

  return (
    <div
      className={`rounded-lg border p-5 space-y-3 ${
        isPositive
          ? "bg-primary/5 border-primary/20"
          : "bg-destructive/5 border-destructive/20"
      }`}
      data-testid={isPositive ? "result-match" : "result-no-match"}
    >
      <div
        className={`flex items-center gap-3 ${
          isPositive ? "text-primary" : "text-destructive"
        }`}
      >
        {isPositive ? (
          <CheckCircle2 className="w-8 h-8 flex-shrink-0" />
        ) : (
          <XCircle className="w-8 h-8 flex-shrink-0" />
        )}
        <h4 className="text-base sm:text-lg font-semibold">
          {result.kind === "match" && "Exact cryptographic match"}
          {result.kind === "no-match" && "No match"}
          {result.kind === "manifest-valid" && "Manifest integrity confirmed"}
          {result.kind === "manifest-tampered" && "Manifest has been altered"}
          {result.kind === "error" && "Verification error"}
        </h4>
      </div>

      {result.kind === "match" && (
        <div className="text-sm space-y-1 text-muted-foreground">
          <p>The file matches the recorded fingerprint.</p>
          <p>
            Verified against:{" "}
            <span className="font-mono text-xs bg-muted px-1 py-0.5 rounded">
              {result.label}
            </span>
          </p>
        </div>
      )}

      {result.kind === "no-match" && (
        <div className="text-sm space-y-3 text-muted-foreground">
          <p>
            This file does not exactly match the stored hash. It may be a different file, or it
            may have been compressed or exported by another platform.
          </p>
          <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 text-xs">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5 text-amber-600 dark:text-amber-400" />
            <p className="text-amber-800 dark:text-amber-300">
              <strong>Compression warning:</strong> Files sent through WhatsApp, Telegram,
              Facebook, YouTube, or other platforms are often compressed or re-encoded, changing
              their SHA-256. Exact verification requires the original file or an exact safe copy —
              not a platform-downloaded version.
            </p>
          </div>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs bg-muted rounded p-3 break-all">
            <span className="text-muted-foreground whitespace-nowrap">Computed:</span>
            <span>{result.computed}</span>
            <span className="text-muted-foreground whitespace-nowrap">Expected:</span>
            <span>{result.expected}</span>
          </div>
        </div>
      )}

      {result.kind === "manifest-valid" && (
        <div className="text-sm space-y-1 text-muted-foreground">
          <p>The manifest file has not been modified since it was created.</p>
          <p className="font-mono text-xs bg-muted px-2 py-1 rounded break-all">
            {result.packageHash}
          </p>
        </div>
      )}

      {result.kind === "manifest-tampered" && (
        <div className="text-sm space-y-2 text-muted-foreground">
          <p>
            The manifest content does not match its recorded package hash. The file may have been edited.
          </p>
          <div className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 font-mono text-xs bg-muted rounded p-3 break-all">
            <span className="text-muted-foreground whitespace-nowrap">Recorded:</span>
            <span>{result.packageHash}</span>
            <span className="text-muted-foreground whitespace-nowrap">Computed:</span>
            <span>{result.computed}</span>
          </div>
        </div>
      )}

      {result.kind === "error" && (
        <p className="text-sm text-muted-foreground">{result.message}</p>
      )}

      {/* Always-visible wording note */}
      <div className="flex items-start gap-2 border-t border-current/10 pt-3 text-xs text-muted-foreground">
        <Info className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
        <span>
          A cryptographic match confirms the file is byte-for-byte identical to what was
          fingerprinted. It does not prove when the event happened or that the content is truthful.
        </span>
      </div>
    </div>
  );
}

function ComputedHashDisplay({ hash, label }: { hash: string; label: string }) {
  return (
    <div className="bg-muted/60 border border-border rounded p-3 space-y-1">
      <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">{label}</p>
      <code className="block text-xs font-mono break-all text-foreground">{hash}</code>
    </div>
  );
}

// ── Mode 1: File vs. Manifest ─────────────────────────────────────────────────

function FileVsManifestMode() {
  const [manifest, setManifest] = useState<ManifestData | null>(null);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);

  const handleManifest = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManifest(null);
    setManifestError(null);
    setResult(null);
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseManifest(ev.target?.result as string);
      if (!parsed) {
        setManifestError("File is not valid JSON or could not be parsed.");
        return;
      }
      if (!Array.isArray(parsed.fileHashes) || parsed.fileHashes.length === 0) {
        setManifestError(
          "Manifest does not contain any file fingerprints (fileHashes). " +
          "This manifest may be for a written testimony or a different record type."
        );
        return;
      }
      setManifest(parsed);
    };
    reader.readAsText(f);
  };

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setResult(null);
      setFileHash(null);
      const f = e.target.files?.[0] ?? null;
      setFile(f);
      if (!f) return;
      setIsHashing(true);
      try {
        const h = await hashFile(f);
        setFileHash(h);
      } finally {
        setIsHashing(false);
      }
    },
    []
  );

  const compare = () => {
    if (!manifest || !file || !fileHash) return;
    const entries = manifest.fileHashes as FileHashEntry[];
    const match = entries.find((e) => e.sha256 === fileHash);
    if (match) {
      setResult({
        kind: "match",
        against: match.sha256,
        label: match.name ? `file: ${match.name}` : "fingerprint in manifest",
      });
    } else {
      setResult({
        kind: "no-match",
        computed: fileHash,
        expected:
          entries.length === 1
            ? entries[0].sha256
            : `(${entries.length} fingerprints in manifest — none matched)`,
        label: "manifest fileHashes",
      });
    }
  };

  const ready = !!manifest && !!fileHash && !isHashing;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Upload the manifest JSON you saved when creating the witness record, then
        select the original file. The file is hashed locally — it is never uploaded.
      </p>

      {/* Manifest upload */}
      <div className="space-y-2">
        <Label htmlFor="manifest-file">Manifest JSON file</Label>
        <Input
          id="manifest-file"
          type="file"
          accept=".json,application/json"
          onChange={handleManifest}
          data-testid="input-manifest-upload"
        />
        {manifestError && (
          <div className="flex items-start gap-2 text-xs text-destructive">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {manifestError}
          </div>
        )}
        {manifest && (
          <div className="bg-muted/60 border border-border rounded p-3 text-xs space-y-1.5">
            {manifest.protocol && (
              <p>
                <span className="text-muted-foreground">Protocol:</span>{" "}
                <span className="font-mono">{String(manifest.protocol)}</span>
              </p>
            )}
            {manifest.eventType && (
              <p>
                <span className="text-muted-foreground">Event type:</span>{" "}
                <span className="capitalize">{String(manifest.eventType)}</span>
              </p>
            )}
            <p>
              <span className="text-muted-foreground">File fingerprints found:</span>{" "}
              <strong>{(manifest.fileHashes as FileHashEntry[]).length}</strong>
            </p>
            <ul className="space-y-1 mt-1">
              {(manifest.fileHashes as FileHashEntry[]).map((fh, i) => (
                <li
                  key={i}
                  className="font-mono text-xs bg-background border border-border rounded px-2 py-1 break-all"
                >
                  {fh.name && (
                    <span className="text-muted-foreground mr-2">{fh.name}:</span>
                  )}
                  {fh.sha256}
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* File selection */}
      <div className="space-y-2">
        <Label htmlFor="evidence-file">Evidence file to verify</Label>
        <p className="text-xs text-muted-foreground">
          Select the original file from your device. It is hashed locally and not uploaded.
        </p>
        <Input
          id="evidence-file"
          type="file"
          onChange={handleFile}
          data-testid="input-file-verify"
        />
        {isHashing && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Computing fingerprint…
          </div>
        )}
        {fileHash && !isHashing && (
          <ComputedHashDisplay
            hash={fileHash}
            label={`Computed fingerprint of "${file?.name ?? "selected file"}"`}
          />
        )}
      </div>

      {/* Compare */}
      <div className="pt-2 border-t border-border">
        <Button
          size="lg"
          className="w-full"
          onClick={compare}
          disabled={!ready}
          data-testid="button-compare"
        >
          Compare
        </Button>
      </div>

      {result && <ResultPanel result={result} />}
    </div>
  );
}

// ── Mode 2: File vs. Hash ────────────────────────────────────────────────────

function FileVsHashMode() {
  const [expectedHash, setExpectedHash] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [fileHash, setFileHash] = useState<string | null>(null);
  const [isHashing, setIsHashing] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);

  const handleFile = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      setResult(null);
      setFileHash(null);
      const f = e.target.files?.[0] ?? null;
      setFile(f);
      if (!f) return;
      setIsHashing(true);
      try {
        const h = await hashFile(f);
        setFileHash(h);
      } finally {
        setIsHashing(false);
      }
    },
    []
  );

  const compare = () => {
    if (!fileHash || !expectedHash.trim()) return;
    const norm = expectedHash.trim().toLowerCase();
    if (!/^[a-f0-9]{64}$/.test(norm)) {
      setResult({
        kind: "error",
        message:
          "The pasted hash does not look like a valid SHA-256 fingerprint (expected 64 hex characters).",
      });
      return;
    }
    if (fileHash === norm) {
      setResult({ kind: "match", against: norm, label: "pasted hash" });
    } else {
      setResult({ kind: "no-match", computed: fileHash, expected: norm, label: "pasted hash" });
    }
  };

  const ready = !!fileHash && !!expectedHash.trim() && !isHashing;

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Paste a SHA-256 fingerprint from the public registry or a manifest, then select
        the file you want to check. The file is hashed locally — it is never uploaded.
      </p>

      {/* Hash input */}
      <div className="space-y-2">
        <Label htmlFor="hash-input">SHA-256 fingerprint</Label>
        <Input
          id="hash-input"
          placeholder="64-character hex string — e.g. a1b2c3d4…"
          value={expectedHash}
          onChange={(e) => { setExpectedHash(e.target.value); setResult(null); }}
          className="font-mono text-xs sm:text-sm"
          data-testid="input-expected-hash"
          spellCheck={false}
        />
        {expectedHash.trim().length > 0 && !/^[a-f0-9]{64}$/i.test(expectedHash.trim()) && (
          <p className="text-xs text-amber-600 dark:text-amber-400">
            A SHA-256 hash must be exactly 64 lowercase hex characters.
          </p>
        )}
      </div>

      {/* File selection */}
      <div className="space-y-2">
        <Label htmlFor="evidence-file-hash">Evidence file to verify</Label>
        <p className="text-xs text-muted-foreground">
          Select the file from your device. It is hashed locally and not uploaded.
        </p>
        <Input
          id="evidence-file-hash"
          type="file"
          onChange={handleFile}
          data-testid="input-file-verify"
        />
        {isHashing && (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <Loader2 className="w-3.5 h-3.5 animate-spin" />
            Computing fingerprint…
          </div>
        )}
        {fileHash && !isHashing && (
          <ComputedHashDisplay
            hash={fileHash}
            label={`Computed fingerprint of "${file?.name ?? "selected file"}"`}
          />
        )}
      </div>

      {/* Compare */}
      <div className="pt-2 border-t border-border">
        <Button
          size="lg"
          className="w-full"
          onClick={compare}
          disabled={!ready}
          data-testid="button-compare"
        >
          Compare
        </Button>
      </div>

      {result && <ResultPanel result={result} />}
    </div>
  );
}

// ── Mode 3: Manifest integrity ────────────────────────────────────────────────

function ManifestIntegrityMode() {
  const [manifest, setManifest] = useState<ManifestData | null>(null);
  const [manifestError, setManifestError] = useState<string | null>(null);
  const [isChecking, setIsChecking] = useState(false);
  const [result, setResult] = useState<MatchResult | null>(null);

  const handleManifest = (e: React.ChangeEvent<HTMLInputElement>) => {
    setManifest(null);
    setManifestError(null);
    setResult(null);
    const f = e.target.files?.[0];
    if (!f) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const parsed = parseManifest(ev.target?.result as string);
      if (!parsed) {
        setManifestError("File is not valid JSON or could not be parsed.");
        return;
      }
      if (!parsed.packageHash) {
        setManifestError(
          "Manifest does not contain a packageHash field. Cannot verify integrity."
        );
        return;
      }
      setManifest(parsed);
    };
    reader.readAsText(f);
  };

  const check = async () => {
    if (!manifest?.packageHash) return;
    setIsChecking(true);
    try {
      const computed = await recomputePackageHash(manifest);
      const recorded = String(manifest.packageHash).toLowerCase();
      if (computed === recorded) {
        setResult({ kind: "manifest-valid", packageHash: recorded });
      } else {
        setResult({ kind: "manifest-tampered", packageHash: recorded, computed });
      }
    } catch {
      setResult({ kind: "error", message: "Failed to compute hash of manifest." });
    } finally {
      setIsChecking(false);
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-sm text-muted-foreground">
        Check whether a manifest JSON file has been modified since it was originally
        created. The manifest is re-hashed and compared against its recorded package hash.
      </p>

      <div className="space-y-2">
        <Label htmlFor="manifest-integrity">Manifest JSON file</Label>
        <Input
          id="manifest-integrity"
          type="file"
          accept=".json,application/json"
          onChange={handleManifest}
          data-testid="input-manifest-upload"
        />
        {manifestError && (
          <div className="flex items-start gap-2 text-xs text-destructive">
            <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
            {manifestError}
          </div>
        )}
        {manifest && (
          <div className="bg-muted/60 border border-border rounded p-3 text-xs space-y-1.5">
            {manifest.protocol && (
              <p>
                <span className="text-muted-foreground">Protocol:</span>{" "}
                <span className="font-mono">{String(manifest.protocol)}</span>
              </p>
            )}
            <p>
              <span className="text-muted-foreground">Recorded package hash:</span>
            </p>
            <code className="block font-mono break-all bg-background border border-border rounded px-2 py-1">
              {String(manifest.packageHash)}
            </code>
          </div>
        )}
      </div>

      <div className="pt-2 border-t border-border">
        <Button
          size="lg"
          className="w-full"
          onClick={check}
          disabled={!manifest || isChecking}
          data-testid="button-compare"
        >
          {isChecking ? (
            <span className="flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              Checking…
            </span>
          ) : (
            "Check Manifest Integrity"
          )}
        </Button>
      </div>

      {result && <ResultPanel result={result} />}
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

export default function Verify() {
  const { t } = useTranslation();
  const { lang } = useLang();
  return (
    <Layout>
      <Helmet>
        <title>{t("seo.verifyTitle")}</title>
        <meta name="description" content={t("seo.verifyDesc")} />
        <link rel="canonical" href={`https://silentwi.com/${lang}/verify`} />
        <meta property="og:title" content={t("seo.verifyTitle")} />
        <meta property="og:description" content={t("seo.verifyDesc")} />
        <meta name="twitter:card" content="summary" />
        {SUPPORTED_LANGS.map((l) => (
          <link key={l} rel="alternate" hrefLang={l} href={`https://silentwi.com/${l}/verify`} />
        ))}
      </Helmet>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <div className="mb-8 sm:mb-10 text-center">
          <h1 className="text-2xl sm:text-3xl font-serif text-primary tracking-tight mb-3 flex items-center justify-center gap-2 sm:gap-3">
            <Search className="w-6 h-6 sm:w-8 sm:h-8 flex-shrink-0" />
            {t("verify.title")}
          </h1>
          <p className="text-base sm:text-lg text-muted-foreground">
            Confirm a file matches its recorded fingerprint — locally, without uploading.
          </p>
        </div>

        <div className="bg-card border border-border rounded-lg shadow-sm p-4 sm:p-6 lg:p-8">
          <Tabs defaultValue="file-vs-manifest">
            <TabsList className="w-full mb-6 h-auto flex flex-col sm:flex-row gap-1 sm:gap-0">
              <TabsTrigger
                value="file-vs-manifest"
                className="flex-1 flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <FileJson className="w-4 h-4 flex-shrink-0" />
                File vs. Manifest
              </TabsTrigger>
              <TabsTrigger
                value="file-vs-hash"
                className="flex-1 flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <Hash className="w-4 h-4 flex-shrink-0" />
                File vs. Hash
              </TabsTrigger>
              <TabsTrigger
                value="manifest-integrity"
                className="flex-1 flex items-center gap-1.5 text-xs sm:text-sm"
              >
                <ShieldCheck className="w-4 h-4 flex-shrink-0" />
                Manifest Integrity
              </TabsTrigger>
              <TabsTrigger
                value="registry-lookup"
                className="flex-1 flex items-center gap-1.5 text-xs sm:text-sm"
                data-testid="tab-registry-lookup"
              >
                <Database className="w-4 h-4 flex-shrink-0" />
                Registry Lookup
              </TabsTrigger>
            </TabsList>

            <TabsContent value="file-vs-manifest">
              <FileVsManifestMode />
            </TabsContent>
            <TabsContent value="file-vs-hash">
              <FileVsHashMode />
            </TabsContent>
            <TabsContent value="manifest-integrity">
              <ManifestIntegrityMode />
            </TabsContent>
            <TabsContent value="registry-lookup">
              <RegistryLookupMode />
            </TabsContent>
          </Tabs>
        </div>
      </div>
    </Layout>
  );
}
