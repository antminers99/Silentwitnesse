import { pgTable, text, serial, timestamp, integer, boolean, jsonb } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod/v4";

export const witnessRecordsTable = pgTable("witness_records", {
  id: serial("id").primaryKey(),
  packageHash: text("package_hash").notNull().unique(),
  eventType: text("event_type").notNull(),
  evidenceType: text("evidence_type").notNull(),
  country: text("country"),
  region: text("region"),
  city: text("city"),
  safeDescriptor: jsonb("safe_descriptor"),
  status: text("status").notNull().default("timestamped_only_not_verified"),
  qualityLevel: text("quality_level").notNull().default("C"),
  publicWarning: text("public_warning").notNull(),
  // Provided by the user's browser at fingerprint creation time (not independently verified)
  createdAtLocal: text("created_at_local").notNull(),
  // Set exclusively by the server when it receives the POST — never from client input
  serverReceivedAtUtc: timestamp("server_received_at_utc", { withTimezone: true })
    .notNull()
    .defaultNow(),
  isDemo: boolean("is_demo").notNull().default(false),
  submitterIp: text("submitter_ip"),
  // Internal created_at kept for ordering / internal use
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWitnessRecordSchema = createInsertSchema(witnessRecordsTable).omit({
  id: true,
  serverReceivedAtUtc: true, // always set by server
  createdAt: true,
  submitterIp: true,
});

export type InsertWitnessRecord = z.infer<typeof insertWitnessRecordSchema>;
export type WitnessRecord = typeof witnessRecordsTable.$inferSelect;

export const rateLimitTable = pgTable("rate_limit", {
  id: serial("id").primaryKey(),
  ipHash: text("ip_hash").notNull(),
  count: integer("count").notNull().default(1),
  windowStart: timestamp("window_start", { withTimezone: true }).notNull().defaultNow(),
});
