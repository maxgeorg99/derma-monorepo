import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { BottomTabInset, BrandColors, MaxContentWidth, Spacing } from '../../constants/theme';

const LONGEVITY_SCORE = 72;
const SKIN_AGE = 34;
const CHRONO_AGE = 31;

const METRICS = [
  { label: 'UV Damage Index', value: '3.2 / 10', trend: 'down', color: BrandColors.positive },
  { label: 'Hydration Level', value: '62 %', trend: 'up', color: BrandColors.accentCyan },
  { label: 'Elasticity Index', value: '0.78', trend: 'stable', color: BrandColors.warning },
  { label: 'Pigmentation Score', value: 'Mild', trend: 'stable', color: BrandColors.accentOrange },
];

const TREND_ICONS: Record<string, string> = { up: '↑', down: '↓', stable: '→' };

const PLAN_INCLUDES = [
  'Monthly low-level laser therapy sessions',
  'Personalized UV exposure protocol',
  'Quarterly Dermetrics skin analysis',
  'Priority dermatologist video consultations',
  'Exclusive anti-aging serum subscription box',
];

export default function LongevityScreen() {
  const { top } = useSafeAreaInsets();
  const skinAgeDiff = SKIN_AGE - CHRONO_AGE;

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentOuter}
      contentInsetAdjustmentBehavior="never">
      <View style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: top + Spacing.lg }]}>
          <Text style={styles.headerTitle}>Longevity</Text>
          <Text style={styles.headerSubtext}>Skin health over time</Text>
        </View>

        <View style={styles.content}>
          {/* Longevity score */}
          <Card variant="dark" style={styles.scoreCard}>
            <Text style={styles.scoreEyebrow}>Your Skin Longevity Score</Text>
            <View style={styles.scoreRow}>
              <View style={styles.scoreBig}>
                <Text style={styles.scoreNumber}>{LONGEVITY_SCORE}</Text>
                <Text style={styles.scoreMax}>/100</Text>
              </View>
              <View style={styles.ageBlock}>
                <Text style={styles.ageLabel}>Skin age</Text>
                <Text style={styles.ageValue}>{SKIN_AGE}</Text>
                <Text style={styles.ageSubtext}>
                  {skinAgeDiff > 0
                    ? `+${skinAgeDiff}y above chrono`
                    : skinAgeDiff < 0
                      ? `${Math.abs(skinAgeDiff)}y below chrono`
                      : 'On par with chrono'}
                </Text>
              </View>
            </View>
            <View style={styles.scoreBarTrack}>
              <View style={[styles.scoreBarFill, { width: `${LONGEVITY_SCORE}%` }]} />
            </View>
            <Text style={styles.scoreNote}>
              Score based on UV exposure history, Dermetrics analysis, and lifestyle inputs.
            </Text>
          </Card>

          {/* Key metrics */}
          <Text style={styles.sectionTitle}>Key Metrics</Text>
          <View style={styles.metricsGrid}>
            {METRICS.map((m) => (
              <Card key={m.label} variant="content" style={styles.metricCard}>
                <Text style={[styles.metricTrend, { color: m.color }]}>
                  {TREND_ICONS[m.trend]}
                </Text>
                <Text style={styles.metricValue}>{m.value}</Text>
                <Text style={styles.metricLabel}>{m.label}</Text>
              </Card>
            ))}
          </View>

          {/* Laser Prevention Plan */}
          <Text style={styles.sectionTitle}>Laser Prevention Plan</Text>
          <Card variant="green" style={styles.planCard}>
            <View style={styles.planHeader}>
              <Text style={styles.planTitle}>Laser Prevention Plan</Text>
              <View style={styles.planBadge}>
                <Text style={styles.planBadgeText}>Phase 3</Text>
              </View>
            </View>
            <Text style={styles.planDesc}>
              Slow intrinsic ageing with monthly low-level laser therapy, guided by your Dermetrics
              profile and supervised by your personal dermatologist.
            </Text>
            <View style={styles.planPricing}>
              <View style={styles.priceOption}>
                <Text style={styles.priceAmount}>€29</Text>
                <Text style={styles.pricePer}>/month</Text>
              </View>
              <View style={styles.priceDivider} />
              <View style={styles.priceOption}>
                <Text style={styles.priceAmount}>€279</Text>
                <Text style={styles.pricePer}>/year</Text>
                <View style={styles.savingsBadge}>
                  <Text style={styles.savingsText}>Save €69</Text>
                </View>
              </View>
            </View>
            <View style={styles.includesList}>
              {PLAN_INCLUDES.map((item) => (
                <View key={item} style={styles.includesRow}>
                  <Text style={styles.includesCheck}>✓</Text>
                  <Text style={styles.includesText}>{item}</Text>
                </View>
              ))}
            </View>
            <Button variant="primary" style={styles.planButton} disabled onPress={() => {}}>
              Join waitlist
            </Button>
          </Card>
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
  header: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.xl,
    backgroundColor: BrandColors.canvas,
    gap: Spacing.xs,
  },
  headerTitle: { fontSize: 32, fontWeight: '700', color: BrandColors.ink, letterSpacing: -0.8 },
  headerSubtext: { fontSize: 14, color: BrandColors.mute },

  content: { padding: Spacing.xl, gap: Spacing.md },
  sectionTitle: { fontSize: 18, fontWeight: '700', color: BrandColors.ink, letterSpacing: -0.3 },

  scoreCard: { gap: Spacing.lg },
  scoreEyebrow: {
    fontSize: 11, fontWeight: '600', color: BrandColors.mute,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  scoreRow: { flexDirection: 'row', alignItems: 'flex-end', gap: Spacing.xl },
  scoreBig: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  scoreNumber: { fontSize: 64, fontWeight: '900', color: BrandColors.primary, lineHeight: 68, letterSpacing: -2 },
  scoreMax: { fontSize: 20, fontWeight: '700', color: BrandColors.mute, paddingBottom: 6 },
  ageBlock: { gap: 2 },
  ageLabel: { fontSize: 11, color: BrandColors.mute, textTransform: 'uppercase', letterSpacing: 0.5 },
  ageValue: { fontSize: 32, fontWeight: '800', color: BrandColors.canvas, letterSpacing: -1 },
  ageSubtext: { fontSize: 12, color: BrandColors.mute },
  scoreBarTrack: { height: 8, backgroundColor: '#1a2a00', borderRadius: 4, overflow: 'hidden' },
  scoreBarFill: { height: '100%', backgroundColor: BrandColors.primary, borderRadius: 4 },
  scoreNote: { fontSize: 12, color: BrandColors.mute, lineHeight: 17 },

  metricsGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  metricCard: { width: '47%', gap: Spacing.xs },
  metricTrend: { fontSize: 18, fontWeight: '700' },
  metricValue: { fontSize: 20, fontWeight: '800', color: BrandColors.ink, letterSpacing: -0.5 },
  metricLabel: { fontSize: 12, color: BrandColors.mute, lineHeight: 17 },

  planCard: { gap: Spacing.lg },
  planHeader: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  planTitle: { fontSize: 18, fontWeight: '800', color: BrandColors.inkDeep, letterSpacing: -0.4 },
  planBadge: {
    backgroundColor: BrandColors.primaryNeutral,
    borderRadius: 9999,
    paddingHorizontal: Spacing.md,
    paddingVertical: 3,
  },
  planBadgeText: { fontSize: 11, fontWeight: '600', color: BrandColors.positiveDeep },
  planDesc: { fontSize: 14, lineHeight: 21, color: BrandColors.body },
  planPricing: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: BrandColors.primaryNeutral,
    borderRadius: 16,
    padding: Spacing.lg,
    gap: Spacing.lg,
  },
  priceOption: { flex: 1, alignItems: 'center', gap: 2 },
  priceAmount: { fontSize: 28, fontWeight: '900', color: BrandColors.inkDeep, letterSpacing: -1 },
  pricePer: { fontSize: 13, color: BrandColors.body },
  priceDivider: { width: 1, height: 40, backgroundColor: BrandColors.primary },
  savingsBadge: {
    backgroundColor: BrandColors.positive,
    borderRadius: 9999,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 2,
    marginTop: 4,
  },
  savingsText: { fontSize: 11, fontWeight: '700', color: '#fff' },
  includesList: { gap: Spacing.sm },
  includesRow: { flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start' },
  includesCheck: { fontSize: 14, fontWeight: '700', color: BrandColors.positiveDeep, width: 18 },
  includesText: { flex: 1, fontSize: 14, lineHeight: 20, color: BrandColors.body },
  planButton: { alignSelf: 'flex-start' },
});
