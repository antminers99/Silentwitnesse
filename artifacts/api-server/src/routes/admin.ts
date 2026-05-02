import { Router } from "express";
import { eq, desc, sql } from "drizzle-orm";
import { db, witnessRecordsTable, reviewActionsTable } from "@workspace/db";
import type { Request, Response, NextFunction } from "express";

const router = Router();

// ── Auth middleware ───────────────────────────────────────────────────────────

function requireAdminAuth(req: Request, res: Response, next: NextFunction): void {
  const password = process.env["ADMIN_REVIEW_PASSWORD"];
  if (!password) {
    res.status(503).json({
      error:
        "Admin review is not configured on this server. Set ADMIN_REVIEW_PASSWORD environment variable.",
    });
    return;
  }
  const provided = req.headers["x-admin-password"];
  if (!provided || provided !== password) {
    res.status(401).json({ error: "Unauthorized." });
    return;
  }
  next();
}

router.use("/admin", requireAdminAuth);

// ── Serialiser (includes admin-only fields) ───────────────────────────────────

function serializeAdminRecord(r: typeof witnessRecordsTable.$inferSelect) {
  return {
    id: r.id,
    packageHash: r.packageHash,
    originalHash: r.originalHash,
    safeCopyHash: r.safeCopyHash,
    eventType: r.eventType,
    evidenceType: r.evidenceType,
    country: r.country,
    region: r.region,
    city: r.city,
    safeDescriptor: r.safeDescriptor,
    qualityLevel: r.qualityLevel,
    publicationStatus: r.publicationStatus,
    reviewStatus: r.reviewStatus,
    reviewerNotes: r.reviewerNotes,
    status: r.status,
    publicWarning: r.publicWarning,
    createdAtLocal: r.createdAtLocal,
    serverReceivedAtUtc: r.serverReceivedAtUtc.toISOString(),
    approvedAtUtc: r.approvedAtUtc?.toISOString() ?? null,
    rejectedAtUtc: r.rejectedAtUtc?.toISOString() ?? null,
    retractedAtUtc: r.retractedAtUtc?.toISOString() ?? null,
    isDemo: r.isDemo,
    createdAt: r.createdAt.toISOString(),
  };
}

// ── GET /admin/records ────────────────────────────────────────────────────────

router.get("/admin/records", async (req, res): Promise<void> => {
  const status = (req.query["status"] as string) || "pending_review";

  const records = await db
    .select()
    .from(witnessRecordsTable)
    .where(eq(witnessRecordsTable.publicationStatus, status))
    .orderBy(desc(witnessRecordsTable.serverReceivedAtUtc))
    .limit(100);

  const countResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(witnessRecordsTable)
    .where(eq(witnessRecordsTable.publicationStatus, "pending_review"));

  res.json({
    records: records.map(serializeAdminRecord),
    pendingCount: countResult[0]?.count ?? 0,
  });
});

// ── GET /admin/records/:id ────────────────────────────────────────────────────

router.get("/admin/records/:id", async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] ?? "");
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid record id." });
    return;
  }
  const [record] = await db
    .select()
    .from(witnessRecordsTable)
    .where(eq(witnessRecordsTable.id, id))
    .limit(1);
  if (!record) {
    res.status(404).json({ error: "Not found." });
    return;
  }
  res.json(serializeAdminRecord(record));
});

// ── POST /admin/records/:id/approve ──────────────────────────────────────────

router.post("/admin/records/:id/approve", async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] ?? "");
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid record id." });
    return;
  }
  const now = new Date();
  const [updated] = await db
    .update(witnessRecordsTable)
    .set({
      publicationStatus: "public_timestamped_record",
      reviewStatus: "approved",
      approvedAtUtc: now,
      updatedAt: now,
    })
    .where(eq(witnessRecordsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Record not found." });
    return;
  }

  await db.insert(reviewActionsTable).values({
    recordId: id,
    action: "approve",
    reason: (req.body as Record<string, string>)["reason"] ?? null,
    reviewerLabel: (req.body as Record<string, string>)["reviewerLabel"] ?? "admin",
  });

  req.log.info({ recordId: id }, "Record approved by reviewer");
  res.json({ status: "approved", record: serializeAdminRecord(updated) });
});

// ── POST /admin/records/:id/reject ───────────────────────────────────────────

router.post("/admin/records/:id/reject", async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] ?? "");
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid record id." });
    return;
  }
  const reason = (req.body as Record<string, string>)["reason"];
  if (!reason) {
    res.status(400).json({ error: "A reason is required to reject a record." });
    return;
  }
  const now = new Date();
  const [updated] = await db
    .update(witnessRecordsTable)
    .set({
      publicationStatus: "rejected_for_public_registry",
      reviewStatus: "rejected",
      rejectedAtUtc: now,
      reviewerNotes: reason,
      updatedAt: now,
    })
    .where(eq(witnessRecordsTable.id, id))
    .returning();

  if (!updated) {
    res.status(404).json({ error: "Record not found." });
    return;
  }

  await db.insert(reviewActionsTable).values({
    recordId: id,
    action: "reject",
    reason,
    reviewerLabel: (req.body as Record<string, string>)["reviewerLabel"] ?? "admin",
  });

  req.log.info({ recordId: id, reason }, "Record rejected by reviewer");
  res.json({ status: "rejected" });
});

// ── POST /admin/records/:id/hide ─────────────────────────────────────────────

router.post("/admin/records/:id/hide", async (req, res): Promise<void> => {
  const id = parseInt(req.params["id"] ?? "");
  if (isNaN(id)) {
    res.status(400).json({ error: "Invalid record id." });
    return;
  }
  const reason =
    (req.body as Record<string, string>)["reason"] ?? "Hidden for safety by reviewer.";
  const now = new Date();
  await db
    .update(witnessRecordsTable)
    .set({
      publicationStatus: "rejected_for_public_registry",
      reviewStatus: "hidden_by_reviewer",
      rejectedAtUtc: now,
      reviewerNotes: reason,
      updatedAt: now,
    })
    .where(eq(witnessRecordsTable.id, id));

  await db.insert(reviewActionsTable).values({
    recordId: id,
    action: "hide",
    reason,
    reviewerLabel: (req.body as Record<string, string>)["reviewerLabel"] ?? "admin",
  });

  req.log.info({ recordId: id }, "Record hidden by reviewer");
  res.json({ status: "hidden" });
});

export default router;
