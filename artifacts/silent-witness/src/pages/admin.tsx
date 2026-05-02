import React, { useState, useEffect, useCallback } from "react";
import { Layout } from "@/components/layout";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  ShieldAlert,
  CheckCircle2,
  XCircle,
  EyeOff,
  Loader2,
  RefreshCw,
  Lock,
  LogOut,
} from "lucide-react";

// ── Types ─────────────────────────────────────────────────────────────────────

interface AdminRecord {
  id: number;
  packageHash: string;
  originalHash: string | null;
  eventType: string;
  evidenceType: string;
  country: string | null;
  region: string | null;
  city: string | null;
  safeDescriptor: Record<string, string | number | boolean | null> | null;
  qualityLevel: string;
  publicationStatus: string;
  reviewStatus: string;
  reviewerNotes: string | null;
  publicWarning: string;
  createdAtLocal: string;
  serverReceivedAtUtc: string;
  approvedAtUtc: string | null;
  rejectedAtUtc: string | null;
  isDemo: boolean;
}

interface ApiResponse {
  records: AdminRecord[];
  pendingCount?: number;
}

const BASE = "/api";

function fmtUtc(iso: string | null | undefined): string {
  if (!iso) return "—";
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

function shortHash(h: string) {
  return h.slice(0, 12) + "…";
}

const QUALITY_COLORS: Record<string, string> = {
  A: "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300",
  B: "bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-300",
  C: "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300",
  D: "bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-300",
};

// ── Password Gate ─────────────────────────────────────────────────────────────

function PasswordGate({ onAuth }: { onAuth: (password: string) => void }) {
  const [input, setInput] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);

  const attempt = async () => {
    if (!input.trim()) return;
    setChecking(true);
    setError(null);
    try {
      const res = await fetch(`${BASE}/admin/records?status=pending_review&limit=0`, {
        headers: { "x-admin-password": input },
      });
      if (res.ok || res.status === 200) {
        onAuth(input);
      } else if (res.status === 401) {
        setError("Incorrect password.");
      } else if (res.status === 503) {
        setError(
          "Admin review is not configured on this server. Set the ADMIN_REVIEW_PASSWORD environment variable."
        );
      } else {
        setError("Unexpected error. Try again.");
      }
    } catch {
      setError("Could not reach server.");
    } finally {
      setChecking(false);
    }
  };

  return (
    <div className="max-w-sm mx-auto px-4 py-16">
      <div className="flex flex-col items-center gap-4 text-center mb-8">
        <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center">
          <Lock className="w-6 h-6 text-primary" />
        </div>
        <h1 className="text-2xl font-serif text-primary">Reviewer Dashboard</h1>
        <p className="text-sm text-muted-foreground">
          Enter the admin review password to continue.
        </p>
      </div>
      <div className="space-y-3">
        <Label htmlFor="admin-pw">Admin Password</Label>
        <Input
          id="admin-pw"
          type="password"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && void attempt()}
          autoFocus
        />
        {error && (
          <p className="text-xs text-destructive flex items-center gap-1">
            <XCircle className="w-3.5 h-3.5 flex-shrink-0" />
            {error}
          </p>
        )}
        <Button className="w-full" onClick={() => void attempt()} disabled={checking || !input.trim()}>
          {checking ? <Loader2 className="w-4 h-4 animate-spin mr-2" /> : null}
          Sign in
        </Button>
      </div>
    </div>
  );
}

// ── Record Card ───────────────────────────────────────────────────────────────

function RecordCard({
  record,
  password,
  onAction,
}: {
  record: AdminRecord;
  password: string;
  onAction: () => void;
}) {
  const [rejectDialog, setRejectDialog] = useState(false);
  const [rejectReason, setRejectReason] = useState("");
  const [loading, setLoading] = useState<string | null>(null);

  const doAction = async (
    action: "approve" | "reject" | "hide",
    body?: Record<string, string>
  ) => {
    setLoading(action);
    try {
      const res = await fetch(`${BASE}/admin/records/${record.id}/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-admin-password": password,
        },
        body: JSON.stringify(body ?? {}),
      });
      if (!res.ok) {
        const j = (await res.json()) as { error?: string };
        alert(j.error ?? "Action failed.");
      } else {
        onAction();
      }
    } catch {
      alert("Network error.");
    } finally {
      setLoading(null);
    }
  };

  const location = [record.city, record.region, record.country].filter(Boolean).join(", ");

  return (
    <div className="border border-border rounded-lg p-4 space-y-3 bg-card">
      <div className="flex items-start justify-between gap-2 flex-wrap">
        <div className="space-y-0.5 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-semibold capitalize text-sm">{record.eventType.replace(/_/g, " ")}</span>
            <span className="text-muted-foreground text-xs capitalize">
              / {record.evidenceType.replace(/_/g, " ")}
            </span>
            <span
              className={`text-xs px-1.5 py-0.5 rounded font-medium ${QUALITY_COLORS[record.qualityLevel] ?? ""}`}
            >
              Level {record.qualityLevel}
            </span>
          </div>
          {location && (
            <p className="text-xs text-muted-foreground">{location}</p>
          )}
        </div>
        <Badge variant="outline" className="font-mono text-xs shrink-0">
          {shortHash(record.packageHash)}
        </Badge>
      </div>

      <div className="grid grid-cols-2 gap-x-4 gap-y-1 text-xs">
        <div>
          <span className="text-muted-foreground">Server received: </span>
          <span className="font-mono">{fmtUtc(record.serverReceivedAtUtc)}</span>
        </div>
        <div>
          <span className="text-muted-foreground">Local device time: </span>
          <span className="font-mono">{fmtUtc(record.createdAtLocal)}</span>
        </div>
      </div>

      {record.publicWarning && (
        <div className="text-xs bg-muted/50 border border-border rounded px-3 py-2 text-muted-foreground">
          <span className="font-medium text-foreground">Public note: </span>
          {record.publicWarning}
        </div>
      )}

      {record.safeDescriptor && Object.keys(record.safeDescriptor as object).length > 0 && (
        <div className="text-xs bg-muted/50 border border-border rounded px-3 py-2 space-y-0.5">
          <p className="font-medium text-foreground mb-1">Safe descriptor</p>
          {Object.entries(record.safeDescriptor as Record<string, string | number | boolean | null>)
            .filter(([, v]) => v != null)
            .map(([k, v]) => (
              <div key={k} className="flex gap-2">
                <span className="text-muted-foreground shrink-0">{k}:</span>
                <span>{String(v)}</span>
              </div>
            ))}
        </div>
      )}

      {record.publicationStatus === "pending_review" && (
        <div className="flex gap-2 pt-1 border-t border-border">
          <Button
            size="sm"
            variant="default"
            className="flex-1 h-8 text-xs"
            disabled={!!loading}
            onClick={() => void doAction("approve")}
          >
            {loading === "approve" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin mr-1" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 mr-1" />
            )}
            Approve
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="flex-1 h-8 text-xs text-destructive border-destructive/30 hover:bg-destructive/5"
            disabled={!!loading}
            onClick={() => setRejectDialog(true)}
          >
            <XCircle className="w-3.5 h-3.5 mr-1" />
            Reject
          </Button>
          <Button
            size="sm"
            variant="outline"
            className="h-8 px-3 text-xs"
            disabled={!!loading}
            onClick={() => void doAction("hide", { reason: "Hidden for safety by reviewer." })}
          >
            {loading === "hide" ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : (
              <EyeOff className="w-3.5 h-3.5" />
            )}
          </Button>
        </div>
      )}

      {record.publicationStatus !== "pending_review" && (
        <div className="text-xs text-muted-foreground pt-1 border-t border-border">
          {record.publicationStatus === "public_timestamped_record" && (
            <span className="text-green-700 dark:text-green-400">
              ✓ Approved — {fmtUtc(record.approvedAtUtc)}
            </span>
          )}
          {record.publicationStatus === "rejected_for_public_registry" && (
            <span className="text-destructive">
              ✗ Rejected — {record.reviewerNotes ?? "no reason given"} — {fmtUtc(record.rejectedAtUtc)}
            </span>
          )}
          {record.publicationStatus === "retracted_by_holder" && (
            <span className="text-amber-600">⚑ Retracted by holder</span>
          )}
        </div>
      )}

      <Dialog open={rejectDialog} onOpenChange={setRejectDialog}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle>Reject record</DialogTitle>
          </DialogHeader>
          <div className="space-y-2">
            <Label>Reason (required)</Label>
            <Textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              rows={3}
              placeholder="Why is this record rejected?"
            />
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setRejectDialog(false)}>
              Cancel
            </Button>
            <Button
              size="sm"
              variant="destructive"
              disabled={!rejectReason.trim() || !!loading}
              onClick={async () => {
                setRejectDialog(false);
                await doAction("reject", { reason: rejectReason });
              }}
            >
              Reject
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ── Main Dashboard ────────────────────────────────────────────────────────────

function Dashboard({ password, onSignOut }: { password: string; onSignOut: () => void }) {
  const [tab, setTab] = useState("pending_review");
  const [data, setData] = useState<ApiResponse | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadRecords = useCallback(
    async (status: string) => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`${BASE}/admin/records?status=${encodeURIComponent(status)}`, {
          headers: { "x-admin-password": password },
        });
        if (!res.ok) {
          const j = (await res.json()) as { error?: string };
          setError(j.error ?? "Failed to load records.");
          return;
        }
        setData((await res.json()) as ApiResponse);
      } catch {
        setError("Network error.");
      } finally {
        setLoading(false);
      }
    },
    [password]
  );

  useEffect(() => {
    void loadRecords(tab);
  }, [tab, loadRecords]);

  const records = data?.records ?? [];
  const pendingCount = data?.pendingCount ?? 0;

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <div>
          <h1 className="text-2xl font-serif text-primary">Reviewer Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Review and approve submitted witness records.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {pendingCount > 0 && (
            <Badge variant="destructive" className="text-xs">
              {pendingCount} pending
            </Badge>
          )}
          <Button
            variant="outline"
            size="sm"
            onClick={() => void loadRecords(tab)}
            disabled={loading}
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <RefreshCw className="w-4 h-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={onSignOut}
            title="Sign out"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>

      <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 rounded-lg p-3 mb-6 text-xs">
        <ShieldAlert className="w-4 h-4 flex-shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
        <p className="text-amber-800 dark:text-amber-300">
          No original files are stored or shown here. You are reviewing fingerprints and safe public metadata only.
        </p>
      </div>

      <Tabs value={tab} onValueChange={setTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="pending_review">Pending Review</TabsTrigger>
          <TabsTrigger value="public_timestamped_record">Approved</TabsTrigger>
          <TabsTrigger value="rejected_for_public_registry">Rejected</TabsTrigger>
          <TabsTrigger value="retracted_by_holder">Retracted</TabsTrigger>
        </TabsList>

        {["pending_review", "public_timestamped_record", "rejected_for_public_registry", "retracted_by_holder"].map(
          (statusKey) => (
            <TabsContent key={statusKey} value={statusKey}>
              {loading && (
                <div className="flex items-center justify-center py-12 text-muted-foreground gap-2">
                  <Loader2 className="w-5 h-5 animate-spin" />
                  <span className="text-sm">Loading…</span>
                </div>
              )}
              {error && !loading && (
                <div className="text-sm text-destructive text-center py-8">{error}</div>
              )}
              {!loading && !error && records.length === 0 && (
                <div className="text-sm text-muted-foreground text-center py-12">
                  No records in this category.
                </div>
              )}
              {!loading && !error && records.length > 0 && (
                <div className="space-y-4">
                  {records.map((r) => (
                    <RecordCard
                      key={r.id}
                      record={r}
                      password={password}
                      onAction={() => void loadRecords(tab)}
                    />
                  ))}
                </div>
              )}
            </TabsContent>
          )
        )}
      </Tabs>
    </div>
  );
}

// ── Page ──────────────────────────────────────────────────────────────────────

const SESSION_KEY = "sw_admin_pw";

export default function AdminReview() {
  const [password, setPassword] = useState<string | null>(() => {
    try { return sessionStorage.getItem(SESSION_KEY); } catch { return null; }
  });

  const handleAuth = (pw: string) => {
    try { sessionStorage.setItem(SESSION_KEY, pw); } catch { /* ignore */ }
    setPassword(pw);
  };

  const handleSignOut = () => {
    try { sessionStorage.removeItem(SESSION_KEY); } catch { /* ignore */ }
    setPassword(null);
  };

  if (!password) {
    return (
      <Layout>
        <PasswordGate onAuth={handleAuth} />
      </Layout>
    );
  }

  return (
    <Layout>
      <Dashboard password={password} onSignOut={handleSignOut} />
    </Layout>
  );
}
