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

// ── Safety validation patterns ─────────────────────────────────────────────
const PHONE_REGEX = /\d[\d\s\-.]{7,}/;
const GPS_REGEX = /\d{1,3}\.\d{4,},?\s*\d{1,3}\.\d{4,}/;
const URL_REGEX = /https?:\/\/|www\./i;
const EMAIL_REGEX = /\S+@\S+\.\S+/;
const STREET_ADDRESS_REGEX = /\b\d+\s+[a-z]+\s+(st|street|ave|avenue|rd|road|blvd|dr|drive|ln|lane)\b/i;
const PLATE_REGEX = /\b[A-Z]{1,3}[\s-]?\d{3,5}[\s-]?[A-Z]{0,3}\b/;
const VIOLENT_PHRASES = /\b(go\s+kill|kill\s+him|kill\s+her|kill\s+them|all\s+of\s+them|they\s+deserve\s+to\s+die|murder|assassinate|execute)\b/i;

// Publication statuses that appear in the public registry
const PUBLIC_STATUSES = ["accepted_public", "exact_match_published"];

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

/**
 * Validate a location string field for unsafe patterns.
 * Returns an error message string if unsafe, null if safe.
 */
function validateLocationField(value: string | null | undefined, fieldName: string): string | null {
  if (!value) return null;
  if (PHONE_REGEX.test(value))
    return `${fieldName} appears to contain a phone number.`;
  if (GPS_REGEX.test(value))
    return `${fieldName} appears to contain GPS coordinates.`;
  if (URL_REGEX.test(value))
    return `${fieldName} must not contain URLs.`;
  if (EMAIL_REGEX.test(value))
    return `${fieldName} must not contain email addresses.`;
  if (STREET_ADDRESS_REGEX.test(value))
    return `${fieldName} must not contain street addresses.`;
  if (PLATE_REGEX.test(value))
    return `${fieldName} appears to contain a vehicle plate number.`;
  if (VIOLENT_PHRASES.test(value))
    return `${fieldName} contains language that cannot be submitted.`;
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

  const bothWithheld =
    body.eventType === "withheld" && body.evidenceType === "withheld";
  if (bothWithheld && !hasDescriptor) return "D";
  if (!body.safeDescriptor || !hasDescriptor) return "D";

  if (body.evidenceType !== "withheld" && body.eventType !== "withheld") return "A";
  if (body.evidenceType !== "withheld" || body.eventType !== "withheld") return "B";
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
// GET /records — public registry; only accepted records.
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
// Runs policy checks. If safe: sets publicationStatus = accepted_public (immediately public).
// If unsafe or quality D: returns rejected_by_policy with reason.
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

  // Location field safety checks
  const locationErrors = [
    validateLocationField(body.country ?? null, "Country"),
    validateLocationField(body.region ?? null, "Region"),
    validateLocationField(body.city ?? null, "City"),
  ].filter(Boolean);

  if (locationErrors.length > 0) {
    res.status(400).json({
      status: "rejected_by_policy",
      reason: locationErrors[0],
    });
    return;
  }

  // Duplicate check
  const existing = await db
    .select({
      id: witnessRecordsTable.id,
      serverReceivedAtUtc: witnessRecordsTable.serverReceivedAtUtc,
      publicationStatus: witnessRecordsTable.publicationStatus,
    })
    .from(witnessRecordsTable)
    .where(eq(witnessRecordsTable.packageHash, body.packageHash))
    .limit(1);

  if (existing.length > 0) {
    const isPublic = PUBLIC_STATUSES.includes(existing[0]!.publicationStatus);
    res.status(409).json({
      status: "already_registered",
      error: "already_registered",
      recordUrl: isPublic ? `/records/${body.packageHash}` : null,
      serverReceivedAtUtc: existing[0]!.serverReceivedAtUtc.toISOString(),
    });
    return;
  }

  // Quality level is always computed server-side
  const qualityLevel = computeQualityLevel(body);

  if (qualityLevel === "D") {
    res.status(400).json({
      status: "rejected_by_policy",
      reason:
        "Record does not meet minimum quality threshold. Provide at least an event type, evidence type, and a descriptor.",
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
      // publicationStatus — always accepted_public for records that pass policy checks
      publicationStatus: "accepted_public",
      isDemo: false,
    })
    .returning();

  req.log.info({ packageHash: body.packageHash, qualityLevel }, "New witness record accepted");
  res.status(201).json(serializeRecord(record));
});

// ──────────────────────────────────────────────────────────────────────────────
// GET /records/:packageHash
// Only exposes public records. Non-public returns 404 to avoid leaking metadata.
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
