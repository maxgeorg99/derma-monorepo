import { router } from 'expo-router';
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { BottomTabInset, BrandColors, MaxContentWidth, Spacing } from '../../constants/theme';
import { useUVExposure } from '../../hooks/useUVExposure';
import { useUVData } from '../../hooks/useUVData';

function formatMinutes(min: number): string {
  if (min < 60) return `${min} min`;
  const h = Math.floor(min / 60);
  const m = min % 60;
  return m > 0 ? `${h}h ${m}min` : `${h}h`;
}

function getDayColor(uv: number): string {
  if (uv <= 2) return BrandColors.positive;
  if (uv <= 5) return BrandColors.warning;
  if (uv <= 7) return BrandColors.accentOrange;
  if (uv <= 10) return BrandColors.negative;
  return '#a855f7';
}

function getUVBg(label: string): string {
  switch (label) {
    case 'Low': return BrandColors.primaryPale;
    case 'Moderate': return '#fff9e0';
    case 'High': return '#fff0e0';
    case 'Very High': return '#ffe5e5';
    case 'Extreme': return '#f5e5ff';
    default: return BrandColors.primaryPale;
  }
}

function getUVTextColor(label: string): string {
  switch (label) {
    case 'Low': return BrandColors.positiveDeep;
    case 'Moderate': return BrandColors.warningContent;
    case 'High': return '#8a4a00';
    case 'Very High': return BrandColors.negativeDeep;
    case 'Extreme': return '#5a0080';
    default: return BrandColors.ink;
  }
}

export default function HomeScreen() {
  const { top } = useSafeAreaInsets();
  const { current, forecast, loading, refreshing, error, permissionDenied, refetch } = useUVData();

  const uvIndex = current?.uv ?? 0;
  const uvLabel = current?.label ?? 'Low';

  const {
    todayMinutes,
    maxSafeMinutes,
    spfMinutesAgo,
    yearly,
    ready: exposureReady,
    logMinutes,
    logSPFApplied,
  } = useUVExposure(uvIndex);

  const spfReapplyDue = spfMinutesAgo !== null && spfMinutesAgo >= 120;
  const reapplyIn = spfMinutesAgo !== null ? Math.max(0, 120 - spfMinutesAgo) : null;
  const exposurePercent = Math.min(1, maxSafeMinutes > 0 ? todayMinutes / maxSafeMinutes : 0);
  const overLimit = todayMinutes >= maxSafeMinutes && maxSafeMinutes > 0;

  const uvAdvice = current?.advice ?? 'No data';
  const uvLocation = current?.locationName ?? '–';
  const uvBg = getUVBg(uvLabel);
  const uvText = getUVTextColor(uvLabel);

  // Yearly insight helpers
  const ytdMinutes = yearly?.totalMinutes ?? 0;
  const ytdDays = yearly?.daysWithExposure ?? 0;
  const avgMinutes = ytdDays > 0 ? Math.round(ytdMinutes / ytdDays) : 0;
  const maxMonthly = yearly ? Math.max(...yearly.monthly.map((m) => m.minutes), 1) : 1;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentOuter}
      contentInsetAdjustmentBehavior="never"
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={refetch} tintColor={BrandColors.primary} />}>
      <View style={styles.safeArea}>
        <View style={[styles.navBar, { paddingTop: top + Spacing.md }]}>
          <Text style={styles.brandName}>DermaDoc</Text>
          <Button variant="secondary" style={styles.navButton} onPress={() => router.push('/sign-in')}>
            Sign in
          </Button>
        </View>

        <View style={styles.content}>
          {/* Loading state */}
          {loading && (
            <Card variant="content" style={styles.loadingCard}>
              <ActivityIndicator size="large" color={BrandColors.primary} />
              <Text style={styles.loadingText}>Getting your UV data...</Text>
            </Card>
          )}

          {/* Error state */}
          {!loading && error && !permissionDenied && (
            <Card variant="content" style={styles.errorCard}>
              <Text style={styles.errorTitle}>Could not load UV data</Text>
              <Text style={styles.errorBody}>{error}</Text>
              <Button variant="primary" onPress={refetch}>Retry</Button>
            </Card>
          )}

          {/* Permission denied */}
          {!loading && permissionDenied && (
            <Card variant="content" style={styles.errorCard}>
              <Text style={styles.errorTitle}>Location access needed</Text>
              <Text style={styles.errorBody}>
                Enable location permissions in Settings to see your local UV index.
              </Text>
            </Card>
          )}

          {/* UV Index card */}
          <Card variant="content" style={[styles.uvCard, { backgroundColor: uvBg }]} onTouchEnd={refetch}>
            <View style={styles.uvTop}>
              <View>
                <Text style={styles.uvLocation}>{uvLocation}</Text>
                <Text style={styles.uvLabel}>UV Index Today</Text>
              </View>
              <View style={[styles.uvBadge, { backgroundColor: uvText }]}>
                <Text style={styles.uvBadgeText}>{uvIndex}</Text>
              </View>
            </View>
            <View style={styles.uvBottom}>
              <Text style={[styles.uvLevel, { color: uvText }]}>{uvLabel}</Text>
              <Text style={[styles.uvAdvice, { color: uvText }]}>{uvAdvice}</Text>
            </View>
          </Card>

          {/* Sun exposure tracker */}
          <Card variant="content" style={styles.exposureCard}>
            <View style={styles.exposureHeader}>
              <Text style={styles.cardTitle}>Sun Exposure</Text>
              <Text style={[styles.exposureTime, overLimit && { color: BrandColors.negative }]}>
                {formatMinutes(todayMinutes)}
              </Text>
            </View>
            <View style={styles.progressTrack}>
              <View
                style={[
                  styles.progressFill,
                  {
                    width: `${exposurePercent * 100}%`,
                    backgroundColor: overLimit ? BrandColors.negative : BrandColors.accentOrange,
                  },
                ]}
              />
            </View>
            <View style={styles.exposureFooter}>
              <Text style={styles.exposureFooterLeft}>
                {overLimit ? '⚠ Limit exceeded' : 'Today'}
              </Text>
              <Text style={styles.exposureFooterRight}>
                Max {formatMinutes(maxSafeMinutes)} at UV {uvIndex}
              </Text>
            </View>

            {/* Quick log buttons */}
            <View style={styles.logRow}>
              <Text style={styles.logLabel}>Log time outside:</Text>
              <View style={styles.logButtons}>
                {[15, 30, 60].map((min) => (
                  <TouchableOpacity
                    key={min}
                    style={styles.logChip}
                    onPress={() => logMinutes(min)}
                    activeOpacity={0.7}>
                    <Text style={styles.logChipText}>+{min} min</Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </Card>

          {/* Sunscreen reminder */}
          <Card
            variant={spfReapplyDue ? 'content' : 'sage'}
            style={[styles.spfCard, spfReapplyDue && styles.spfCardDue]}>
            <View style={styles.spfRow}>
              <View style={styles.spfInfo}>
                <Text style={[styles.spfTitle, spfReapplyDue && { color: BrandColors.negativeDeep }]}>
                  {spfReapplyDue ? '⚠️  Reapply Sunscreen' : '🧴  Sunscreen'}
                </Text>
                <Text style={styles.spfSub}>
                  {spfMinutesAgo === null
                    ? 'Not applied yet today'
                    : spfReapplyDue
                    ? `Last applied ${formatMinutes(spfMinutesAgo)} ago`
                    : `Reapply in ${formatMinutes(reapplyIn!)}`}
                </Text>
              </View>
              <Button
                variant="primary"
                style={styles.spfButton}
                onPress={logSPFApplied}>
                Applied now
              </Button>
            </View>
          </Card>

          {/* Quick actions */}
          <Text style={styles.sectionTitle}>Your Skin</Text>
          <View style={styles.quickRow}>
            <Card variant="dark" style={styles.quickCard} onTouchEnd={() => router.push('/scan')}>
              <Text style={styles.quickCardIcon}>📷</Text>
              <Text style={styles.quickCardTitle}>Dermetrics</Text>
              <Text style={styles.quickCardSub}>Analyse your skin</Text>
            </Card>
            <Card variant="green" style={styles.quickCard} onTouchEnd={() => router.push('/appointments')}>
              <Text style={styles.quickCardIcon}>✨</Text>
              <Text style={styles.quickCardTitle}>Longevity</Text>
              <Text style={styles.quickCardSub}>Your skin score</Text>
            </Card>
          </View>

          {/* Weekly UV forecast */}
          <Card variant="sage" style={styles.forecastCard}>
            <Text style={styles.cardTitle}>This Week</Text>
            <View style={styles.forecastRow}>
              {forecast.length > 0
                ? forecast.map((day) => (
                    <View key={day.day} style={styles.forecastDay}>
                      <Text style={styles.forecastDayLabel}>{day.day}</Text>
                      <View
                        style={[
                          styles.forecastBar,
                          { height: (day.uv / 12) * 40 + 4, backgroundColor: getDayColor(day.uv) },
                        ]}
                      />
                      <Text style={styles.forecastUv}>{day.uv}</Text>
                    </View>
                  ))
                : !loading && (
                    <Text style={styles.forecastEmpty}>Forecast unavailable</Text>
                  )}
            </View>
          </Card>

          {/* Yearly UV insights */}
          {exposureReady && yearly && (
            <Card variant="content" style={styles.insightsCard}>
              <Text style={styles.cardTitle}>UV Insights {new Date().getFullYear()}</Text>

              {/* Stats row */}
              <View style={styles.statsRow}>
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{formatMinutes(ytdMinutes)}</Text>
                  <Text style={styles.statLabel}>Year to date</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={styles.statValue}>{ytdDays}d</Text>
                  <Text style={styles.statLabel}>Days with sun</Text>
                </View>
                <View style={styles.statDivider} />
                <View style={styles.statBox}>
                  <Text style={[styles.statValue, avgMinutes > 60 && { color: BrandColors.negative }]}>
                    {avgMinutes > 0 ? `${avgMinutes} min` : '–'}
                  </Text>
                  <Text style={styles.statLabel}>Avg / day</Text>
                </View>
              </View>

              {/* Monthly bar chart */}
              <View style={styles.monthlyChart}>
                {yearly.monthly.map((m) => (
                  <View key={m.label} style={styles.monthCol}>
                    <View style={styles.monthBarTrack}>
                      <View
                        style={[
                          styles.monthBar,
                          {
                            height: `${(m.minutes / maxMonthly) * 100}%`,
                            backgroundColor:
                              m.minutes === 0
                                ? BrandColors.canvasSoft
                                : m.minutes / 60 > 40
                                ? BrandColors.negative
                                : BrandColors.primary,
                          },
                        ]}
                      />
                    </View>
                    <Text style={styles.monthLabel}>{m.label}</Text>
                  </View>
                ))}
              </View>

              {yearly.daysOverLimit > 0 && (
                <Text style={styles.insightWarning}>
                  {yearly.daysOverLimit} {yearly.daysOverLimit === 1 ? 'day' : 'days'} with
                  {' '}high exposure this year. Consider protective clothing and SPF on sunny days.
                </Text>
              )}
            </Card>
          )}
        </View>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  scrollView: { flex: 1, backgroundColor: BrandColors.canvasSoft },
  contentOuter: {
    flexDirection: 'row',
    justifyContent: 'center',
    paddingBottom: BottomTabInset + Spacing.xl,
  },
  safeArea: { flex: 1, maxWidth: MaxContentWidth, width: '100%' },

  navBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    paddingBottom: Spacing.md,
    backgroundColor: BrandColors.canvas,
  },
  brandName: { fontSize: 16, fontWeight: '700', color: BrandColors.ink, letterSpacing: -0.3 },
  navButton: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md },

  content: { padding: Spacing.xl, gap: Spacing.md },

  loadingCard: { alignItems: 'center', gap: Spacing.md, paddingVertical: Spacing.xl3 },
  loadingText: { fontSize: 14, color: BrandColors.mute },

  errorCard: { gap: Spacing.md, paddingVertical: Spacing.xl2 },
  errorTitle: { fontSize: 16, fontWeight: '700', color: BrandColors.ink, textAlign: 'center' },
  errorBody: { fontSize: 13, color: BrandColors.mute, textAlign: 'center', lineHeight: 19 },

  uvCard: { gap: Spacing.md },
  uvTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  uvLocation: { fontSize: 12, fontWeight: '500', color: BrandColors.mute, marginBottom: 2 },
  uvLabel: { fontSize: 16, fontWeight: '700', color: BrandColors.ink },
  uvBadge: { width: 52, height: 52, borderRadius: 26, alignItems: 'center', justifyContent: 'center' },
  uvBadgeText: { fontSize: 22, fontWeight: '900', color: '#fff' },
  uvBottom: { gap: 2 },
  uvLevel: { fontSize: 20, fontWeight: '800', letterSpacing: -0.5 },
  uvAdvice: { fontSize: 13, fontWeight: '400' },

  exposureCard: { gap: Spacing.sm },
  exposureHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'baseline' },
  cardTitle: { fontSize: 15, fontWeight: '700', color: BrandColors.ink },
  exposureTime: { fontSize: 22, fontWeight: '800', color: BrandColors.ink, letterSpacing: -0.5 },
  progressTrack: { height: 10, backgroundColor: BrandColors.canvasSoft, borderRadius: 5, overflow: 'hidden' },
  progressFill: { height: '100%', borderRadius: 5 },
  exposureFooter: { flexDirection: 'row', justifyContent: 'space-between' },
  exposureFooterLeft: { fontSize: 12, color: BrandColors.mute },
  exposureFooterRight: { fontSize: 12, color: BrandColors.mute },
  logRow: { borderTopWidth: 1, borderTopColor: BrandColors.canvasSoft, paddingTop: Spacing.sm, gap: Spacing.xs },
  logLabel: { fontSize: 12, color: BrandColors.mute },
  logButtons: { flexDirection: 'row', gap: Spacing.sm },
  logChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    backgroundColor: BrandColors.primaryPale,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: BrandColors.primaryNeutral,
  },
  logChipText: { fontSize: 13, fontWeight: '600', color: BrandColors.positiveDeep },

  spfCard: {},
  spfCardDue: { backgroundColor: '#fff5f5', borderWidth: 1, borderColor: '#ffd0d0' },
  spfRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: Spacing.md },
  spfInfo: { flex: 1, gap: 2 },
  spfTitle: { fontSize: 14, fontWeight: '700', color: BrandColors.ink },
  spfSub: { fontSize: 12, color: BrandColors.mute },
  spfButton: { paddingVertical: Spacing.xs, paddingHorizontal: Spacing.md },

  sectionTitle: { fontSize: 18, fontWeight: '700', color: BrandColors.ink, letterSpacing: -0.3 },
  quickRow: { flexDirection: 'row', gap: Spacing.md },
  quickCard: { flex: 1, gap: Spacing.sm },
  quickCardIcon: { fontSize: 24 },
  quickCardTitle: { fontSize: 15, fontWeight: '700', color: BrandColors.canvas },
  quickCardSub: { fontSize: 12, color: BrandColors.mute },

  forecastCard: { gap: Spacing.lg },
  forecastRow: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-end' },
  forecastDay: { alignItems: 'center', gap: 4 },
  forecastDayLabel: { fontSize: 11, color: BrandColors.mute, fontWeight: '500' },
  forecastBar: { width: 20, borderRadius: 4, minHeight: 4 },
  forecastUv: { fontSize: 12, fontWeight: '700', color: BrandColors.ink },
  forecastEmpty: { fontSize: 13, color: BrandColors.mute, textAlign: 'center', flex: 1 },

  insightsCard: { gap: Spacing.lg },
  statsRow: { flexDirection: 'row', alignItems: 'center' },
  statBox: { flex: 1, alignItems: 'center', gap: 2 },
  statDivider: { width: 1, height: 32, backgroundColor: BrandColors.canvasSoft },
  statValue: { fontSize: 18, fontWeight: '800', color: BrandColors.ink, letterSpacing: -0.5 },
  statLabel: { fontSize: 11, color: BrandColors.mute },
  monthlyChart: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 64,
    gap: 2,
  },
  monthCol: { flex: 1, alignItems: 'center', gap: 3 },
  monthBarTrack: { flex: 1, width: '100%', justifyContent: 'flex-end' },
  monthBar: { width: '100%', borderRadius: 3, minHeight: 3 },
  monthLabel: { fontSize: 9, color: BrandColors.mute, fontWeight: '500' },
  insightWarning: {
    fontSize: 12,
    color: BrandColors.negativeDeep,
    backgroundColor: '#fff5f5',
    padding: Spacing.sm,
    borderRadius: 8,
    lineHeight: 17,
  },
});
