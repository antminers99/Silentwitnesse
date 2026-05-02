import React from "react";
import { useParams, Link } from "wouter";
import { Layout } from "@/components/layout";
import { useGetRecord, getGetRecordQueryKey } from "@workspace/api-client-react";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Calendar, Clock, MapPin, AlertTriangle, ShieldAlert } from "lucide-react";
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

export default function RecordDetail() {
  const params = useParams<{ packageHash: string }>();
  const packageHash = params.packageHash ?? "";

  const { data: record, isLoading, isError } = useGetRecord(packageHash, {
    query: {
      queryKey: getGetRecordQueryKey(packageHash),
      enabled: packageHash.length > 0,
    },
  });

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
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className="font-mono text-xs">
                    Level {record.qualityLevel}
                  </Badge>
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
                  {formatLocalTime(record.createdAtLocal)}
                  <span className="text-xs text-muted-foreground ml-2 font-sans">local device time</span>
                </div>
                <div className="flex items-start gap-1.5 text-xs text-amber-700 dark:text-amber-400 mt-1">
                  <AlertTriangle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" />
                  <span>
                    This time comes from the user&apos;s device and is not independently
                    verified.
                  </span>
                </div>
              </div>

              {/* Registry timestamp */}
              <div className="bg-primary/5 border border-primary/20 rounded-lg p-4 space-y-1.5">
                <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-primary/70">
                  <Calendar className="w-3.5 h-3.5" />
                  Registry timestamp
                </div>
                <div className="font-mono text-base sm:text-lg text-foreground">
                  {formatUtcTime(record.serverReceivedAtUtc)}
                </div>
                <div className="text-xs text-muted-foreground">
                  Recorded by the Silent Witness server when this fingerprint was submitted.
                </div>
              </div>

              {/* Combined explanation */}
              <div className="text-xs text-muted-foreground bg-muted/40 border border-border rounded p-3 leading-relaxed">
                Local creation time is provided by the user&apos;s device. Registry timestamp
                is recorded by the Silent Witness server when the fingerprint was submitted.
              </div>
            </div>

            <Separator />

            {/* ── Verification wording ──────────────────────────────────── */}
            <div className="space-y-3">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                What this record proves
              </h2>
              <div className="flex items-start gap-3 bg-destructive/5 border border-destructive/20 rounded-lg p-4">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-destructive mt-0.5" />
                <p className="text-sm text-destructive/90 leading-relaxed font-medium">
                  This record is a timestamped fingerprint only. It is not public proof that
                  the event happened. Verification requires the original file or text to match
                  the stored fingerprint.
                </p>
              </div>
              <div className="flex items-start gap-3 bg-muted/40 border border-border rounded-lg p-4">
                <ShieldAlert className="w-4 h-4 flex-shrink-0 text-muted-foreground mt-0.5" />
                <p className="text-sm text-muted-foreground leading-relaxed">
                  A registry timestamp proves only that this fingerprint was submitted to the
                  registry no later than that server time. It does not prove when the original
                  file was created and does not prove that the event happened.
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

            {/* ── Fingerprint ───────────────────────────────────────────── */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Package Fingerprint (SHA-256)
              </h2>
              <code className="block bg-muted border border-border rounded px-3 py-2 text-xs font-mono break-all text-foreground">
                {record.packageHash}
              </code>
              <p className="text-xs text-muted-foreground">
                This hash uniquely identifies the witness record package. Original files
                are never transmitted.
              </p>
            </div>

            <Separator />

            {/* ── Status ────────────────────────────────────────────────── */}
            <div className="space-y-2">
              <h2 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">
                Verification status
              </h2>
              <Badge
                variant="secondary"
                className="bg-muted text-muted-foreground font-normal"
              >
                Not publicly verified
              </Badge>
              <p className="text-xs text-muted-foreground">
                Records are shown as &ldquo;Not publicly verified&rdquo; unless reviewed by a verified
                partner organisation.
              </p>
            </div>
          </div>
        )}
      </div>
    </Layout>
  );
}
