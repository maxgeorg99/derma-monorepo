import { mutation, query, MutationCtx } from "./_generated/server";
import { v } from "convex/values";

// ── Helpers ───────────────────────────────────────────────────────────────────

async function upsertDay(
  ctx: MutationCtx,
  deviceId: string,
  date: string,
  patch: {
    minutes?: number;
    spfLastApplied?: number;
    notifiedLimit?: boolean;
  },
) {
  const existing = await ctx.db
    .query("uvExposureLogs")
    .withIndex("by_deviceId_and_date", (q) =>
      q.eq("deviceId", deviceId).eq("date", date),
    )
    .unique();

  if (existing) {
    await ctx.db.patch(existing._id, patch);
  } else {
    await ctx.db.insert("uvExposureLogs", {
      deviceId,
      date,
      minutes: patch.minutes ?? 0,
      spfLastApplied: patch.spfLastApplied,
      notifiedLimit: patch.notifiedLimit ?? false,
    });
  }
}

// ── Queries ───────────────────────────────────────────────────────────────────

export const getTodayLog = query({
  args: {
    deviceId: v.string(),
    date: v.string(),
  },
  handler: async (ctx, { deviceId, date }) => {
    return await ctx.db
      .query("uvExposureLogs")
      .withIndex("by_deviceId_and_date", (q) =>
        q.eq("deviceId", deviceId).eq("date", date),
      )
      .unique();
  },
});

export const getYearlyLogs = query({
  args: {
    deviceId: v.string(),
    year: v.number(),
  },
  handler: async (ctx, { deviceId, year }) => {
    const startDate = `${year}-01-01`;
    const endDate = `${year}-12-31`;
    return await ctx.db
      .query("uvExposureLogs")
      .withIndex("by_deviceId_and_date", (q) =>
        q.eq("deviceId", deviceId).gte("date", startDate).lte("date", endDate),
      )
      .take(366);
  },
});

// ── Mutations ─────────────────────────────────────────────────────────────────

export const logMinutes = mutation({
  args: {
    deviceId: v.string(),
    date: v.string(),
    additionalMinutes: v.number(),
  },
  handler: async (ctx, { deviceId, date, additionalMinutes }) => {
    const existing = await ctx.db
      .query("uvExposureLogs")
      .withIndex("by_deviceId_and_date", (q) =>
        q.eq("deviceId", deviceId).eq("date", date),
      )
      .unique();

    const newMinutes = (existing?.minutes ?? 0) + additionalMinutes;

    if (existing) {
      await ctx.db.patch(existing._id, { minutes: newMinutes });
    } else {
      await ctx.db.insert("uvExposureLogs", {
        deviceId,
        date,
        minutes: newMinutes,
        notifiedLimit: false,
      });
    }

    return newMinutes;
  },
});

export const markNotifiedLimit = mutation({
  args: {
    deviceId: v.string(),
    date: v.string(),
  },
  handler: async (ctx, { deviceId, date }) => {
    await upsertDay(ctx, deviceId, date, { notifiedLimit: true });
  },
});

export const markSPFApplied = mutation({
  args: {
    deviceId: v.string(),
    date: v.string(),
    timestamp: v.number(),
  },
  handler: async (ctx, { deviceId, date, timestamp }) => {
    await upsertDay(ctx, deviceId, date, { spfLastApplied: timestamp });
  },
});
