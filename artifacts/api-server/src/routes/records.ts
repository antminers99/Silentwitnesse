import { Router, type IRouter } from "express";
import { eq, desc, sql, and, inArray } from "drizzle-orm";
import crypto from "crypto";
import { db, witnessRecordsTable } from "@workspace/db";
import {
  ListRecordsQueryParams,
  CreateRecordBody,
  GetRecordParams,
} from "@workspace/api-zod";

const router: IRouter = Router();

const PHONE_REGEX = /\d[\d\s\-.]{7,}/;
const GPS_REGEX = /\d+\.\d+,\s*\d+\.\d+/;
const VIOLENT_PHRASES =
  /\bgo\s+kill\b|\bkill\s+him\b|\bkill\s+her\b|\bkill\s+them\b|\ball\s+of\s+them\b/i;
const UNSAFE_PATTERNS =
  /\b(go\s+kill|murder|assassinate|execute|all\s+guilty|they\s+deserve\s+to\s+die)\b/i;
const MAX_PUBLIC_NOTE_LENGTH = 200;

// Publication statuses that appear in the public registry
const PUBLIC_STATUSES = ["public_timestamped_record", "exact_match_published"];

const submissionCounts = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

function getIpHash(ip: string): string {
  return crypto
    .createHash("sha256")
    .update(ip + "silent-witness-salt")
    .digest("hex")
    .slice(0, 16);
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const ipHash = getIpHash(ip);
  const entry = submissionCounts.get(ipHash);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    submissionCounts.set(ipHash, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) return false;
  entry.count++;
  return true;
}

function validatePublicNote(note: string | null | undefined): string | null {
  if (!note) return null;
  if (note.length > MAX_PUBLIC_NOTE_LENGTH)
    return `Public note is too long (max ${MAX_PUBLIC_NOTE_LENGTH} characters).`;
  if (PHONE_REGEX.test(note))
    return "Public note appears to contain a phone number. Remove it before submitting publicly.";
  if (GPS_REGEX.test(note))
    return "Public note appears to contain GPS coordinates. Remove them before submitting publicly.";
  if (VIOLENT_PHRASES.test(note) || UNSAFE_PATTERNS.test(note))
    return "Public note contains language that cannot be submitted publicly.";
  return null;
}

function computeQualityLevel(body: {
  eventType: string;
  evidenceType: string;
  safeDescriptor?: unknown;
}): string {
  const descriptorEntries =
    body.safeDescriptor &&
    typeof body.safeDescriptor === "object"
      ? Object.entries(body.safeDescriptor as Record<string, unknown>).filter(
          ([k, v]) => v != null && k !== "mediaType"
        )
      : [];
  const hasDescriptor = descriptorEntries.length > 0;

  // D: both withheld with no meaningful descriptor, or no descriptor at all
  const bothWithheld =
    body.eventType === "withheld" && body.evidenceType === "withheld";
  if (bothWithheld && !hasDescriptor) return "D";
  if (!body.safeDescriptor || !hasDescriptor) return "D";

  // A: known event, known evidence, has descriptor
  if (body.evidenceType !== "withheld" && body.eventType !== "withheld") return "A";
  // B: known evidence or known event, has descriptor
  if (body.evidenceType !== "withheld" || body.eventType !== "withheld") return "B";
  // C: both withheld but has some descriptor
  return "C";
}

/** Public serialiser — only fields safe for the public API. */
function serializeRecord(r: typeof witnessRecordsTable.$inferSelect) {
  return {
    id: r.id,
    packageHash: r.packageHash,
    originalHash: r.originalHash ?? null,
    safeCopyHash: r.safeCopyHash ?? null,
    eventType: r.eventType,
    evidenceType: r.evidenceType,
    country: r.country,
    region: r.region,
    city: r.city,
    safeDescriptor: r.safeDescriptor,
    qualityLevel: r.qualityLevel,
    publicationStatus: r.publicationStatus,
    status: r.status,
    publicWarning: r.publicWarning,
    createdAtLocal: r.createdAtLocal ?? "",
    serverReceivedAtUtc: r.serverReceivedAtUtc.toISOString(),
    approvedAtUtc: r.approvedAtUtc?.toISOString() ?? null,
    isDemo: r.isDemo,
  };
}

// ──────────────────────────────────────────────────────────────────────────────
// GET /records/stats — must be registered before /records/:packageHash
// Only counts public records.
// ──────────────────────────────────────────────────────────────────────────────
router.get("/records/stats", async (req, res): Promise<void> => {
  const publicFilter = inArray(witnessRecordsTable.publicationStatus, PUBLIC_STATUSES);

  const [totalResult, byEventType, byCountry, byQualityLevel, recentResult] =
    await Promise.all([
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(witnessRecordsTable)
        .where(publicFilter),
      db
        .select({
          key: witnessRecordsTable.eventType,
          count: sql<number>`count(*)::int`,
        })
        .from(witnessRecordsTable)
        .where(publicFilter)
        .groupBy(witnessRecordsTable.eventType)
        .orderBy(desc(sql`count(*)`)),
      db
        .select({
          key: witnessRecordsTable.country,
          count: sql<number>`count(*)::int`,
        })
        .from(witnessRecordsTable)
        .where(and(publicFilter, sql`${witnessRecordsTable.country} is not null`))
        .groupBy(witnessRecordsTable.country)
        .orderBy(desc(sql`count(*)`)),
      db
        .select({
          key: witnessRecordsTable.qualityLevel,
          count: sql<number>`count(*)::int`,
        })
        .from(witnessRecordsTable)
        .where(publicFilter)
        .groupBy(witnessRecordsTable.qualityLevel)
        .orderBy(witnessRecordsTable.qualityLevel),
      db
        .select({ count: sql<number>`count(*)::int` })
        .from(witnessRecordsTable)
        .where(
          and(
            publicFilter,
            sql`${witnessRecordsTable.serverReceivedAtUtc} > now() - interval '24 hours'`
          )
        ),
    ]);

  res.json({
    total: totalResult[0]?.count ?? 0,
    byEventType: byEventType.map((r) => ({ key: r.key ?? "unknown", count: r.count })),
    byCountry: byCountry.map((r) => ({ key: r.key ?? "unknown", count: r.count })),
    byQualityLevel: byQualityLevel.map((r) => ({ key: r.key, count: r.count })),
    recentCount: recentResult[0]?.count ?? 0,
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /records — public registry; only approved records.
// ──────────────────────────────────────────────────────────────────────────────
router.get("/records", async (req, res): Promise<void> => {
  const parsed = ListRecordsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { country, region, city, eventType, evidenceType, qualityLevel, limit, offset } =
    parsed.data;

  const conditions = [inArray(witnessRecordsTable.publicationStatus, PUBLIC_STATUSES)];
  if (country) conditions.push(eq(witnessRecordsTable.country, country));
  if (region) conditions.push(eq(witnessRecordsTable.region, region));
  if (city) conditions.push(eq(witnessRecordsTable.city, city));
  if (eventType) conditions.push(eq(witnessRecordsTable.eventType, eventType));
  if (evidenceType) conditions.push(eq(witnessRecordsTable.evidenceType, evidenceType));
  if (qualityLevel) conditions.push(eq(witnessRecordsTable.qualityLevel, qualityLevel));
  conditions.push(sql`${witnessRecordsTable.qualityLevel} != 'D'`);

  const whereClause = and(...conditions);

  const [records, countResult] = await Promise.all([
    db
      .select()
      .from(witnessRecordsTable)
      .where(whereClause)
      .orderBy(desc(witnessRecordsTable.serverReceivedAtUtc))
      .limit(Math.min(limit, 100))
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(witnessRecordsTable)
      .where(whereClause),
  ]);

  res.json({
    records: records.map(serializeRecord),
    total: countResult[0]?.count ?? 0,
  });
});

// ──────────────────────────────────────────────────────────────────────────────
// POST /records
// Sets publicationStatus = pending_review. Record is not public until approved.
// ──────────────────────────────────────────────────────────────────────────────
router.post("/records", async (req, res): Promise<void> => {
  const ip =
    (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() ||
    req.ip ||
    "unknown";

  if (!checkRateLimit(ip)) {
    res.status(429).json({ error: "Rate limit exceeded. Please try again later." });
    return;
  }

  const parsed = CreateRecordBody.safeParse(req.body);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const body = parsed.data;

  // Honeypot — silently accept bots without storing anything
  if (body.honeypot) {
    res.status(201).json({ message: "ok" });
    return;
  }

  if (!body.packageHash || body.packageHash.length !== 64 || !/^[a-f0-9]+$/i.test(body.packageHash)) {
    res.status(400).json({ error: "Invalid package hash format. Expected SHA-256 hex string." });
    return;
  }

  const noteError = validatePublicNote(
    (body as Record<string, unknown>)["publicNote"] as string | null
  );
  if (noteError) {
    res.status(400).json({ error: noteError });
    return;
  }

  const existing = await db
    .select({
      id: witnessRecordsTable.id,
      serverReceivedAtUtc: witnessRecordsTable.serverReceivedAtUtc,
    })
    .from(witnessRecordsTable)
    .where(eq(witnessRecordsTable.packageHash, body.packageHash))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({
      status: "already_registered",
      error: "already_registered",
      recordUrl: `/records/${body.packageHash}`,
      serverReceivedAtUtc: existing[0]!.serverReceivedAtUtc.toISOString(),
    });
    return;
  }

  // Quality level is always computed server-side. Client-provided qualityLevel is ignored.
  const qualityLevel = computeQualityLevel(body);

  if (qualityLevel === "D") {
    res.status(400).json({
      error:
        "Low-quality records can be saved locally but are not accepted into the public registry. Please provide at least an event type, evidence type, and a descriptor.",
    });
    return;
  }

  const [record] = await db
    .insert(witnessRecordsTable)
    .values({
      packageHash: body.packageHash,
      originalHash: body.originalHash ?? null,
      eventType: body.eventType,
      evidenceType: body.evidenceType,
      country: body.country ?? null,
      region: body.region ?? null,
      city: body.city ?? null,
      safeDescriptor: (body.safeDescriptor as object) ?? null,
      status: "timestamped_only_not_verified",
      qualityLevel,
      publicWarning: body.publicWarning,
      createdAtLocal: body.createdAtLocal,
      retractionTokenHash: body.retractionTokenHash ?? null,
      // publicationStatus — always pending_review; NOT accepted from client
      publicationStatus: "pending_review",
      isDemo: false,
    })
    .returning();

  req.log.info({ packageHash: body.packageHash, qualityLevel }, "New witness record submitted");
  res.status(201).json(serializeRecord(record));
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /records/:packageHash
// Only exposes public records. Non-public records return 404 to avoid leaking
// metadata for records that are pending, rejected, or retracted.
// ──────────────────────────────────────────────────────────────────────────────
router.get("/records/:packageHash", async (req, res): Promise<void> => {
  const raw = Array.isArray(req.params.packageHash)
    ? req.params.packageHash[0]
    : req.params.packageHash;

  const params = GetRecordParams.safeParse({ packageHash: raw });
  if (!params.success) {
    res.status(400).json({ error: params.error.message });
    return;
  }

  const [record] = await db
    .select()
    .from(witnessRecordsTable)
    .where(eq(witnessRecordsTable.packageHash, params.data.packageHash))
    .limit(1);

  if (!record) {
    res.status(404).json({ error: "Record not found." });
    return;
  }

  if (!PUBLIC_STATUSES.includes(record.publicationStatus)) {
    res.status(404).json({ error: "Record not found." });
    return;
  }

  res.json(serializeRecord(record));
});

export default router;
