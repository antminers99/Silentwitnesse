import React from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { useGetRecord, getGetRecordQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, MapPin, AlertTriangle, ShieldAlert, CheckCircle2, XCircle } from "lucide-react";
import { format } from "date-fns";

function formatLocalTime(iso: string): string {
  try {
    return format(new Date(iso), "yyyy-MM-dd HH:mm");
  } catch {
    return iso;
  }
}

function formatUtcTime(iso: string): string {
  try {
    const d = new Date(iso);
    return (
      d.getUTCFullYear() +
      "-" +
      String(d.getUTCMonth() + 1).padStart(2, "0") +
      "-" +
      String(d.getUTCDate()).padStart(2, "0") +
      " " +
      String(d.getUTCHours()).padStart(2, "0") +
      ":" +
      String(d.getUTCMinutes()).padStart(2, "0") +
      " UTC"
    );
  } catch {
    return iso;
  }
}

const STATUS_LABELS: Record<string, { label: string; variant: "default" | "secondary" | "destructive" | "outline" }> = {
  accepted_public: { label: "Accepted Public Fingerprint", variant: "default" },
  rejected_by_policy: { label: "Rejected by Policy", variant: "destructive" },
  retracted_by_holder: { label: "Retracted by Holder", variant: "secondary" },
  exact_match_published: { label: "Exact Match Verified", variant: "default" },
};

export default function RecordDetail() {
  const params = useParams<{ packageHash: string }>();
  const packageHash = params.packageHash ?? "";

  const { data: record, isLoading, isError } = useGetRecord(packageHash, {
    query: {
      queryKey: getGetRecordQueryKey(packageHash),
      enabled: packageHash.length > 0,
    },
  });

  const r = record as (typeof record & { publicationStatus?: string; originalHash?: string | null; safeCopyHash?: string | null }) | undefined;
  const pubStatus = r?.publicationStatus;
  const statusInfo = pubStatus ? (STATUS_LABELS[pubStatus] ?? { label: pubStatus, variant: "outline" as const }) : null;
  const originalHash = r?.originalHash ?? null;
  const safeCopyHash = r?.safeCopyHash ?? null;

  return (
    <Layout>
      <div className="max-w-3xl mx-auto px-4 py-8 sm:py-12">
        <Link
          href="/records"
          className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Registry
        </Link>

        {isLoading && (
          <div className="space-y-4">
            <Skeleton className="h-8 w-2/3" />
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-5/6" />
            <Skeleton className="h-32 w-full" />
          </div>
        )}

        {isError && (
          <div className="bg-destructive/10 border border-destructive/20 rounded-lg p-6 text-center">
            <p className="text-destructive font-medium">Record not found.</p>
            <p className="text-sm text-muted-foreground mt-1">
              No public record exists for that fingerprint hash.
            </p>
          </div>
        )}

        {record && (
          <div className="space-y-6">
            {/* Title */}
            <div>
              <div className="flex items-start justify-between gap-3 mb-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-serif text-primary tracking-tight capitalize">
                  {record.eventType.replace(/_/g, " ")}
                </h1>
                <div className="flex items-center gap-2 flex-wrap">
                  <Badge variant="outline" className="font-mono text-xs">
                    Level {record.qualityLevel}
                  </Badge>
                  {statusInfo && (
                    <Badge variant={statusInfo.variant} className="text-xs">
                      {statusInfo.label}
                    </Badge>
                  )}
                  {record.isDemo && (
                    <Badge variant="secondary" className="text-xs">
                      Demo record
                    </Badge>
                  )}
                </div>
              </div>
              <p className="text-sm text-muted-foreground capitalize">
                {record.evidenceType.replace(/_/g, " ")}
                {[record.city, record.region, record.country].filter(Boolean).length > 0 && (
                  <span className="ml-2 inline-flex items-center gap-1">
                    <MapPin className="w-3 h-3" />
                    {[record.city, record.region, record.country].filter(Boolean).join(", ")}
                  </span>
                )}
              </p>
            </div>

            {/* Publication status notices */}
            {pubStatus === "retracted_by_holder" && (
              <div className="flex items-start gap-3 bg-muted/50 border border-border rounded-lg p-4">
                <XCircle className="w-4 h-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground">
                  This record has been retracted by the holder. The fingerprint is preserved but
                  no public metadata is displayed.
                </p>
              </div>
            )}
            {pubStatus === "exact_match_published" && (
              <div className="flex items-start gap-3 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 rounded-lg p-4">
                <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-green-600 dark:text-green-400 mt-0.5" />
                <p className="text-sm text-green-800 dark:text-green-300">
                  A later file has been verified as byte-for-byte identical to this fingerprint.
                </p>
              </div>
            )}

            <Separator />

            {/* ── Timestamp section ─────────────────────────────────────── */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Timestamps
              </h2>

              {/* Created locally */}
              <div className="bg-muted/40 border border-border rounded-lg p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                  <Clock className="w-3.5 h-3.5" />
                  Local creation time
                </div>
                <div className="font-mono text-base sm:text-lg text-foreground">
                  {record.createdAtLocal ? formatLocalTime(record.createdAtLocal) : "—"}
                  <span className="text-xs text-muted-foreground ml-2 font-sans">local device time</span>
                </div>
                <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    This time comes from the user&apos;s device and is not independently verified.
                  </span>
                </div>
              </div>

              {/* Registry timestamp */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/70">
                  <Calendar className="w-3.5 h-3.5" />
                  Registry timestamp (server-recorded)
                </div>
                <div className="font-mono text-base sm:text-lg text-foreground">
                  {formatUtcTime(record.serverReceivedAtUtc)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Set by the Silent Witness server when this fingerprint was received. The client cannot set or override this value.
                </div>
              </div>

              {/* Combined explanation */}
              <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded p-3 leading-relaxed">
                Local creation time is provided by the user&apos;s device and is not independently verified.
                Registry timestamp is recorded by the server at submission time.
                Neither timestamp proves when the original event occurred.
              </div>
            </div>

            <Separator />

            {/* ── What this record proves ────────────────────────────────── */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                What this record proves
              </h2>
              <div className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-destructive mt-0.5" />
                <p className="text-sm text-destructive/90 leading-relaxed font-medium">
                  This record is a fingerprint only. It does not prove that an event happened,
                  identify a perpetrator, or guarantee legal admissibility. Verification requires
                  the original file or exact safe copy.
                </p>
              </div>
              <div className="flex items-start gap-3 bg-muted/40 border border-border rounded-lg p-4">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A registry timestamp proves only that this fingerprint was submitted to the
                  registry no later than that server-recorded time. It does not prove when the
                  original file was created or that the event occurred.
                </p>
              </div>
              {record.publicWarning && (
                <div className="flex items-start gap-3 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                  <AlertTriangle className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
                  <p className="text-sm text-amber-800 dark:text-amber-300 leading-relaxed">
                    {record.publicWarning}
                  </p>
                </div>
              )}
            </div>

            <Separator />

            {/* ── Fingerprints ───────────────────────────────────────────── */}
            <div className="space-y-4">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Fingerprints (SHA-256)
              </h2>

              <div className="space-y-2">
                <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                  Package Hash
                </p>
                <code className="block bg-muted border border-border rounded px-3 py-2 text-xs font-mono break-all text-foreground">
                  {record.packageHash}
                </code>
                <p className="text-xs text-muted-foreground">
                  SHA-256 of the canonical manifest JSON. Uniquely identifies this witness record.
                  Original files are never transmitted or stored.
                </p>
              </div>

              {originalHash && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Original File Hash
                  </p>
                  <code className="block bg-muted border border-border rounded px-3 py-2 text-xs font-mono break-all text-foreground">
                    {originalHash}
                  </code>
                  <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400">
                    <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                    <span>
                      Exact match only if the later file is byte-for-byte identical. Files
                      shared via messaging or social platforms may be compressed, changing
                      this hash.
                    </span>
                  </div>
                </div>
              )}

              {safeCopyHash && (
                <div className="space-y-2">
                  <p className="text-xs text-muted-foreground font-medium uppercase tracking-wide">
                    Safe Copy Hash
                  </p>
                  <code className="block bg-muted border border-border rounded px-3 py-2 text-xs font-mono break-all text-foreground">
                    {safeCopyHash}
                  </code>
                </div>
              )}
            </div>

            <Separator />

            {/* ── Registry status ─────────────────────────────────────────── */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Registry status
              </h2>
              {statusInfo ? (
                <Badge variant={statusInfo.variant}>
                  {statusInfo.label}
                </Badge>
              ) : (
                <Badge variant="secondary" className="bg-muted text-muted-foreground font-normal">
                  Fingerprint only — not verified truth
                </Badge>
              )}
              <p className="text-xs text-muted-foreground">
                Fingerprint only — not verified truth. This record does not prove that an event
                happened or that the evidence is authentic.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
