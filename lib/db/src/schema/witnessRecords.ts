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
  createdAtUtc: text("created_at_utc").notNull(),
  isDemo: boolean("is_demo").notNull().default(false),
  submitterIp: text("submitter_ip"),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export const insertWitnessRecordSchema = createInsertSchema(witnessRecordsTable).omit({
  id: true,
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
