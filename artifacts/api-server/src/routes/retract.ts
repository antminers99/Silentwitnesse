import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, witnessRecordsTable } from "@workspace/db";
import crypto from "crypto";

const router = Router();

// ── Brute-force protection for retraction attempts ─────────────────────────
// Keyed by a salted hash of the packageHash so the key itself leaks nothing.
const retractAttempts = new Map<string, { count: number; windowStart: number }>();
const RETRACT_WINDOW_MS = 15 * 60 * 1000; // 15 minutes
const RETRACT_MAX_ATTEMPTS = 5;

function retractKey(packageHash: string): string {
  return crypto
    .createHash("sha256")
    .update("retract-rate:" + packageHash)
    .digest("hex")
    .slice(0, 16);
}

function checkRetractRateLimit(packageHash: string): boolean {
  const now = Date.now();
  const key = retractKey(packageHash);
  const entry = retractAttempts.get(key);
  if (!entry || now - entry.windowStart > RETRACT_WINDOW_MS) {
    retractAttempts.set(key, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RETRACT_MAX_ATTEMPTS) return false;
  entry.count++;
  return true;
}

// ── POST /retract ─────────────────────────────────────────────────────────────
// Holder provides packageHash + retractionToken.
// Server hashes token and compares against stored hash. No raw token is stored.
// Limited to 5 attempts per packageHash per 15 minutes to resist brute-force.

router.post("/retract", async (req, res): Promise<void> => {
  const body = req.body as Record<string, string>;
  const { packageHash, retractionToken } = body;

  if (!packageHash || typeof packageHash !== "string") {
    res.status(400).json({ error: "packageHash is required." });
    return;
  }
  if (!/^[a-f0-9]{64}$/i.test(packageHash)) {
    res.status(400).json({ error: "Invalid packageHash format. Expected 64-character hex string." });
    return;
  }
  if (!retractionToken || typeof retractionToken !== "string") {
    res.status(400).json({ error: "retractionToken is required." });
    return;
  }
  if (retractionToken.length > 200) {
    res.status(400).json({ error: "retractionToken too long." });
    return;
  }

  if (!checkRetractRateLimit(packageHash)) {
    res.status(429).json({
      error: "Too many retraction attempts for this record. Please wait 15 minutes and try again.",
    });
    return;
  }

  const tokenHash = crypto
    .createHash("sha256")
    .update("sw-retract:" + retractionToken)
    .digest("hex");

  const [record] = await db
    .select({
      id: witnessRecordsTable.id,
      retractionTokenHash: witnessRecordsTable.retractionTokenHash,
      publicationStatus: witnessRecordsTable.publicationStatus,
    })
    .from(witnessRecordsTable)
    .where(eq(witnessRecordsTable.packageHash, packageHash))
    .limit(1);

  if (!record) {
    res.status(404).json({ error: "No record found for that fingerprint." });
    return;
  }
  if (record.publicationStatus === "retracted_by_holder") {
    res.status(409).json({ error: "This record has already been retracted." });
    return;
  }
  if (!record.retractionTokenHash) {
    res.status(403).json({
      error:
        "This record was submitted without a retraction token and cannot be retracted.",
    });
    return;
  }

  // Timing-safe comparison to prevent timing attacks
  const storedBuf = Buffer.from(record.retractionTokenHash, "hex");
  const candidateBuf = Buffer.from(tokenHash, "hex");
  const tokensMatch =
    storedBuf.length === candidateBuf.length &&
    crypto.timingSafeEqual(storedBuf, candidateBuf);

  if (!tokensMatch) {
    res.status(403).json({
      error:
        "Invalid retraction token. Retraction is only possible with the original token saved in your proof package.",
    });
    return;
  }

  await db
    .update(witnessRecordsTable)
    .set({
      publicationStatus: "retracted_by_holder",
      retractedAtUtc: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(witnessRecordsTable.id, record.id));

  req.log.info({ packageHash }, "Record retracted by holder");
  res.json({ status: "retracted" });
});

export default router;
