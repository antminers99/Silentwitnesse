import { Router } from "express";
import { eq } from "drizzle-orm";
import { db, witnessRecordsTable } from "@workspace/db";
import crypto from "crypto";

const router = Router();

// ── POST /retract ─────────────────────────────────────────────────────────────
// Holder provides packageHash + retractionToken.
// Server hashes token and compares against stored hash. No raw token is stored.

router.post("/retract", async (req, res): Promise<void> => {
  const body = req.body as Record<string, string>;
  const { packageHash, retractionToken } = body;

  if (!packageHash || !retractionToken) {
    res.status(400).json({ error: "packageHash and retractionToken are required." });
    return;
  }
  if (!/^[a-f0-9]{64}$/i.test(packageHash)) {
    res.status(400).json({ error: "Invalid packageHash format." });
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
  if (!record.retractionTokenHash || record.retractionTokenHash !== tokenHash) {
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
