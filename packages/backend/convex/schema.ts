import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

export default defineSchema({
  notes: defineTable({
    userId: v.string(),
    title: v.string(),
    content: v.string(),
    summary: v.optional(v.string()),
  }).index("by_userId", ["userId"]),

  uvExposureLogs: defineTable({
    deviceId: v.string(),
    date: v.string(),           // "YYYY-MM-DD"
    minutes: v.number(),
    spfLastApplied: v.optional(v.number()), // unix ms
    notifiedLimit: v.boolean(),
  }).index("by_deviceId_and_date", ["deviceId", "date"]),
});
