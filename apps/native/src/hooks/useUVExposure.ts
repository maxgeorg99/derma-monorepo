import { useCallback, useEffect, useRef, useState } from 'react';
import { useMutation, useQuery } from 'convex/react';
import { api } from '@packages/backend/convex/_generated/api';

import { calcMaxSafeMinutes, getDeviceId, todayDateString } from '../stores/deviceId';
import {
  requestNotificationPermissions,
  sendDailyLimitNotification,
  sendSPFReminderNotification,
} from '../services/notificationService';

const MONTH_LABELS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const SPF_REAPPLY_MS = 2 * 60 * 60 * 1000;

export interface YearlySummary {
  totalMinutes: number;
  daysWithExposure: number;
  daysOverLimit: number;
  monthly: { label: string; minutes: number }[];
}

export function useUVExposure(uvIndex: number) {
  const [deviceId, setDeviceId] = useState<string | null>(null);
  const today = todayDateString();
  const year = new Date().getFullYear();
  const maxSafeMinutes = calcMaxSafeMinutes(uvIndex);

  // Load stable device ID once
  useEffect(() => {
    requestNotificationPermissions();
    getDeviceId().then(setDeviceId);
  }, []);

  // Convex reactive queries — skipped until deviceId is available
  const todayLog = useQuery(
    api.uvExposure.getTodayLog,
    deviceId ? { deviceId, date: today } : 'skip',
  );
  const yearlyLogs = useQuery(
    api.uvExposure.getYearlyLogs,
    deviceId ? { deviceId, year } : 'skip',
  );

  // Convex mutations
  const logMinutesMutation = useMutation(api.uvExposure.logMinutes);
  const markNotifiedMutation = useMutation(api.uvExposure.markNotifiedLimit);
  const markSPFMutation = useMutation(api.uvExposure.markSPFApplied);

  // SPF reapply reminder timer
  const spfTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const spfLastApplied = todayLog?.spfLastApplied ?? null;

  useEffect(() => {
    if (spfTimerRef.current) clearTimeout(spfTimerRef.current);
    if (!spfLastApplied) return;

    const remaining = SPF_REAPPLY_MS - (Date.now() - spfLastApplied);
    if (remaining > 0) {
      spfTimerRef.current = setTimeout(() => sendSPFReminderNotification(), remaining);
    }
    return () => { if (spfTimerRef.current) clearTimeout(spfTimerRef.current); };
  }, [spfLastApplied]);

  const logMinutes = useCallback(async (minutes: number) => {
    if (!deviceId) return;
    const newTotal = await logMinutesMutation({ deviceId, date: today, additionalMinutes: minutes });

    // Fire limit notification once per day
    if (!todayLog?.notifiedLimit && newTotal >= maxSafeMinutes) {
      await markNotifiedMutation({ deviceId, date: today });
      await sendDailyLimitNotification(newTotal, maxSafeMinutes, uvIndex);
    }
  }, [deviceId, today, maxSafeMinutes, uvIndex, todayLog?.notifiedLimit, logMinutesMutation, markNotifiedMutation]);

  const logSPFApplied = useCallback(async () => {
    if (!deviceId) return;
    await markSPFMutation({ deviceId, date: today, timestamp: Date.now() });
  }, [deviceId, today, markSPFMutation]);

  // Build yearly summary from the Convex query result
  const yearly: YearlySummary | null = yearlyLogs
    ? (() => {
        const byMonth: number[] = Array(12).fill(0);
        let totalMinutes = 0;
        let daysWithExposure = 0;
        let daysOverLimit = 0;

        for (const log of yearlyLogs) {
          const month = parseInt(log.date.split('-')[1], 10) - 1; // 0-indexed
          byMonth[month] += log.minutes;
          totalMinutes += log.minutes;
          if (log.minutes > 0) daysWithExposure++;
          if (log.minutes > 60) daysOverLimit++;
        }

        return {
          totalMinutes,
          daysWithExposure,
          daysOverLimit,
          monthly: byMonth.map((minutes, i) => ({ label: MONTH_LABELS[i], minutes })),
        };
      })()
    : null;

  const todayMinutes = todayLog?.minutes ?? 0;
  const spfMinutesAgo = spfLastApplied !== null
    ? Math.floor((Date.now() - spfLastApplied) / 60_000)
    : null;

  return {
    todayMinutes,
    maxSafeMinutes,
    spfLastApplied,
    spfMinutesAgo,
    yearly,
    ready: deviceId !== null,
    logMinutes,
    logSPFApplied,
  };
}
