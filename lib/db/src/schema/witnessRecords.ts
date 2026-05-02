import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const witnessRecordsTable = pgTable("witness_records", {
  id: serial("id").primaryKey(),
  packageHash: text("package_hash").notNull().unique(),
  // Original file SHA-256 (single-file records). Optional — bundle hash for packages.
  originalHash: text("original_hash"),
  // Optional: hash of a safe/compressed export of the original for platform-resilient matching
  safeCopyHash: text("safe_copy_hash"),
  // Placeholder for future perceptual fingerprinting — not implemented in MVP
  mediaFingerprint: text("media_fingerprint"),
  eventType: text("event_type").notNull(),
  evidenceType: text("evidence_type").notNull(),
  country: text("country"),
  region: text("region"),
  city: text("city"),
  safeDescriptor: jsonb("safe_descriptor"),
  qualityLevel: text("quality_level").notNull().default("C"),
  // Policy-based publication status — set server-side only
  // accepted_public: passes all policy checks, visible in registry
  // rejected_by_policy: failed safety/quality checks, never shown publicly
  // retracted_by_holder: holder used retraction token
  // exact_match_published: a later file was verified as byte-for-byte identical
  publicationStatus: text("publication_status").notNull().default("accepted_public"),
  // Record vocabulary status
  status: text("status").notNull().default("timestamped_only_not_verified"),
  publicWarning: text("public_warning").notNull(),
  // Provided by the user's browser at fingerprint creation time (not independently verified)
  createdAtLocal: text("created_at_local"),
  // Set exclusively by the server when it receives the POST — never from client input
  serverReceivedAtUtc: timestamp("server_received_at_utc", { withTimezone: true })
    .notNull()
    .defaultNow(),
  retractedAtUtc: timestamp("retracted_at_utc", { withTimezone: true }),
  // Hash of the holder's retraction token — never store the raw token
  retractionTokenHash: text("retraction_token_hash"),
  isDemo: boolean("is_demo").notNull().default(false),
  submitterIp: text("submitter_ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).defaultNow(),
});

export const insertWitnessRecordSchema = createInsertSchema(witnessRecordsTable).omit({
  id: true,
  serverReceivedAtUtc: true, // always set by server
  retractedAtUtc: true,
  createdAt: true,
  updatedAt: true,
  submitterIp: true,
  publicationStatus: true, // always set by server
  qualityLevel: true,      // always computed by server
});

export type InsertWitnessRecord = z.infer<typeof insertWitnessRecordSchema>;
export type WitnessRecord = typeof witnessRecordsTable.$inferSelect;

export const rateLimitTable = pgTable("rate_limit", {
  id: serial("id").primaryKey(),
  ipHash: text("ip_hash").notNull(),
  count: integer("count").notNull().default(1),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});
