import { Router, type IRouter } from "express";
import { eq, desc, sql, and } from "drizzle-orm";
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
const VIOLENT_PHRASES = /\bgo\s+kill\b|\bkill\s+him\b|\bkill\s+her\b|\bkill\s+them\b/i;
const MAX_PUBLIC_NOTE_LENGTH = 500;

const submissionCounts = new Map<string, { count: number; windowStart: number }>();
const RATE_LIMIT_WINDOW_MS = 60 * 60 * 1000;
const RATE_LIMIT_MAX = 10;

function getIpHash(ip: string): string {
  return crypto.createHash("sha256").update(ip + "silent-witness-salt").digest("hex").slice(0, 16);
}

function checkRateLimit(ip: string): boolean {
  const now = Date.now();
  const ipHash = getIpHash(ip);
  const entry = submissionCounts.get(ipHash);
  if (!entry || now - entry.windowStart > RATE_LIMIT_WINDOW_MS) {
    submissionCounts.set(ipHash, { count: 1, windowStart: now });
    return true;
  }
  if (entry.count >= RATE_LIMIT_MAX) {
    return false;
  }
  entry.count++;
  return true;
}

function validatePublicNote(note: string | null | undefined): string | null {
  if (!note) return null;
  if (note.length > MAX_PUBLIC_NOTE_LENGTH) {
    return "Public note is too long (max 500 characters).";
  }
  if (PHONE_REGEX.test(note)) {
    return "Public note appears to contain a phone number. Remove it before submitting publicly.";
  }
  if (GPS_REGEX.test(note)) {
    return "Public note appears to contain GPS coordinates. Remove them before submitting publicly.";
  }
  if (VIOLENT_PHRASES.test(note)) {
    return "Public note contains language that may incite violence. It cannot be submitted publicly.";
  }
  return null;
}

function computeQualityLevel(body: {
  eventType: string;
  evidenceType: string;
  safeDescriptor?: unknown;
}): string {
  const hasDescriptor =
    body.safeDescriptor &&
    typeof body.safeDescriptor === "object" &&
    Object.values(body.safeDescriptor as Record<string, unknown>).some((v) => v != null);

  if (body.evidenceType !== "withheld" && body.eventType !== "withheld" && hasDescriptor) {
    return "A";
  }
  if (body.evidenceType !== "withheld" && hasDescriptor) {
    return "B";
  }
  if (body.evidenceType === "written testimony" || !hasDescriptor) {
    return "C";
  }
  return "C";
}

router.get("/records/stats", async (req, res): Promise<void> => {
  const total = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(witnessRecordsTable)
    .where(eq(witnessRecordsTable.qualityLevel, "A"))
    .then((r) => 0)
    .catch(() => 0);

  const totalResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(witnessRecordsTable);
  const totalCount = totalResult[0]?.count ?? 0;

  const byEventType = await db
    .select({
      key: witnessRecordsTable.eventType,
      count: sql<number>`count(*)::int`,
    })
    .from(witnessRecordsTable)
    .groupBy(witnessRecordsTable.eventType)
    .orderBy(desc(sql`count(*)`));

  const byCountry = await db
    .select({
      key: witnessRecordsTable.country,
      count: sql<number>`count(*)::int`,
    })
    .from(witnessRecordsTable)
    .where(sql`${witnessRecordsTable.country} is not null`)
    .groupBy(witnessRecordsTable.country)
    .orderBy(desc(sql`count(*)`));

  const byQualityLevel = await db
    .select({
      key: witnessRecordsTable.qualityLevel,
      count: sql<number>`count(*)::int`,
    })
    .from(witnessRecordsTable)
    .groupBy(witnessRecordsTable.qualityLevel)
    .orderBy(witnessRecordsTable.qualityLevel);

  const oneDayAgo = new Date(Date.now() - 24 * 60 * 60 * 1000);
  const recentResult = await db
    .select({ count: sql<number>`count(*)::int` })
    .from(witnessRecordsTable)
    .where(sql`${witnessRecordsTable.createdAt} > ${oneDayAgo}`);
  const recentCount = recentResult[0]?.count ?? 0;

  res.json({
    total: totalCount,
    byEventType: byEventType.map((r) => ({ key: r.key ?? "unknown", count: r.count })),
    byCountry: byCountry.map((r) => ({ key: r.key ?? "unknown", count: r.count })),
    byQualityLevel: byQualityLevel.map((r) => ({ key: r.key, count: r.count })),
    recentCount,
  });
});

router.get("/records", async (req, res): Promise<void> => {
  const parsed = ListRecordsQueryParams.safeParse(req.query);
  if (!parsed.success) {
    res.status(400).json({ error: parsed.error.message });
    return;
  }

  const { country, region, city, eventType, evidenceType, qualityLevel, limit, offset } =
    parsed.data;

  const conditions = [];
  if (country) conditions.push(eq(witnessRecordsTable.country, country));
  if (region) conditions.push(eq(witnessRecordsTable.region, region));
  if (city) conditions.push(eq(witnessRecordsTable.city, city));
  if (eventType) conditions.push(eq(witnessRecordsTable.eventType, eventType));
  if (evidenceType) conditions.push(eq(witnessRecordsTable.evidenceType, evidenceType));
  if (qualityLevel) conditions.push(eq(witnessRecordsTable.qualityLevel, qualityLevel));
  conditions.push(sql`${witnessRecordsTable.qualityLevel} != 'D'`);

  const whereClause = conditions.length > 0 ? and(...conditions) : undefined;

  const [records, countResult] = await Promise.all([
    db
      .select()
      .from(witnessRecordsTable)
      .where(whereClause)
      .orderBy(desc(witnessRecordsTable.createdAt))
      .limit(Math.min(limit, 100))
      .offset(offset),
    db
      .select({ count: sql<number>`count(*)::int` })
      .from(witnessRecordsTable)
      .where(whereClause),
  ]);

  res.json({
    records: records.map((r) => ({
      id: r.id,
      packageHash: r.packageHash,
      eventType: r.eventType,
      evidenceType: r.evidenceType,
      country: r.country,
      region: r.region,
      city: r.city,
      safeDescriptor: r.safeDescriptor,
      status: r.status,
      qualityLevel: r.qualityLevel,
      publicWarning: r.publicWarning,
      createdAtUtc: r.createdAtUtc,
      isDemo: r.isDemo,
    })),
    total: countResult[0]?.count ?? 0,
  });
});

router.post("/records", async (req, res): Promise<void> => {
  const ip = (req.headers["x-forwarded-for"] as string)?.split(",")[0]?.trim() || req.ip || "unknown";

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

  if (body.honeypot) {
    res.status(201).json({ message: "ok" });
    return;
  }

  if (!body.packageHash || body.packageHash.length !== 64 || !/^[a-f0-9]+$/i.test(body.packageHash)) {
    res.status(400).json({ error: "Invalid package hash format. Expected SHA-256 hex string." });
    return;
  }

  const noteError = validatePublicNote((body as Record<string, unknown>).publicNote as string | null);
  if (noteError) {
    res.status(400).json({ error: noteError });
    return;
  }

  const existing = await db
    .select({ id: witnessRecordsTable.id })
    .from(witnessRecordsTable)
    .where(eq(witnessRecordsTable.packageHash, body.packageHash))
    .limit(1);

  if (existing.length > 0) {
    res.status(409).json({ error: "A record with this package hash already exists." });
    return;
  }

  const qualityLevel = computeQualityLevel(body);

  const [record] = await db
    .insert(witnessRecordsTable)
    .values({
      packageHash: body.packageHash,
      eventType: body.eventType,
      evidenceType: body.evidenceType,
      country: body.country ?? null,
      region: body.region ?? null,
      city: body.city ?? null,
      safeDescriptor: (body.safeDescriptor as object) ?? null,
      status: body.status,
      qualityLevel: body.qualityLevel ?? qualityLevel,
      publicWarning: body.publicWarning,
      createdAtUtc: body.createdAtUtc,
      isDemo: false,
      submitterIp: getIpHash(ip),
    })
    .returning();

  req.log.info({ packageHash: body.packageHash, qualityLevel }, "New witness record submitted");

  res.status(201).json({
    id: record.id,
    packageHash: record.packageHash,
    eventType: record.eventType,
    evidenceType: record.evidenceType,
    country: record.country,
    region: record.region,
    city: record.city,
    safeDescriptor: record.safeDescriptor,
    status: record.status,
    qualityLevel: record.qualityLevel,
    publicWarning: record.publicWarning,
    createdAtUtc: record.createdAtUtc,
    isDemo: record.isDemo,
  });
});

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

  res.json({
    id: record.id,
    packageHash: record.packageHash,
    eventType: record.eventType,
    evidenceType: record.evidenceType,
    country: record.country,
    region: record.region,
    city: record.city,
    safeDescriptor: record.safeDescriptor,
    status: record.status,
    qualityLevel: record.qualityLevel,
    publicWarning: record.publicWarning,
    createdAtUtc: record.createdAtUtc,
    isDemo: record.isDemo,
  });
});

export default router;
