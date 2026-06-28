import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { BottomTabInset, BrandColors, MaxContentWidth, Spacing } from '../../constants/theme';

const MOCK_RESULTS = [
  { label: 'Skin type', value: 'Combination', status: 'neutral' as const },
  { label: 'Hydration', value: '62 %', status: 'ok' as const },
  { label: 'UV damage markers', value: 'Mild', status: 'warn' as const },
  { label: 'Melanin unevenness', value: 'Moderate', status: 'warn' as const },
  { label: 'Barrier integrity', value: 'Good', status: 'ok' as const },
];

const STATUS_COLORS: Record<'ok' | 'warn' | 'neutral', string> = {
  ok: BrandColors.positive,
  warn: BrandColors.warning,
  neutral: BrandColors.mute,
};

const STEPS = [
  { title: 'Photograph', desc: 'Take clear photos of your skin concern in natural light.' },
  { title: 'AI Analysis', desc: 'Our model identifies UV damage markers, pigmentation, and barrier health.' },
  { title: 'Doctor Review', desc: 'A certified dermatologist validates and annotates findings within 24h.' },
  { title: 'Your Dermetrics', desc: 'Receive your personal skin profile — exportable and shareable.' },
];

export default function ScanScreen() {
  const { top } = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentOuter}
      contentInsetAdjustmentBehavior="never">
      <View style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: top + Spacing.lg }]}>
          <Text style={styles.headerTitle}>Dermetrics</Text>
          <Text style={styles.headerSubtext}>AI-powered skin analysis</Text>
        </View>

        <View style={styles.content}>
          {/* Scan CTA */}
          <Card variant="dark" style={styles.ctaCard}>
            <Text style={styles.ctaEyebrow}>Phase 2</Text>
            <Text style={styles.ctaTitle}>Know your{'\n'}skin, precisely.</Text>
            <Text style={styles.ctaBody}>
              Photograph any area of concern and receive a detailed Dermetrics report — reviewed by
              a certified dermatologist within 24 hours.
            </Text>
            <Button variant="primary" style={styles.ctaButton} disabled onPress={() => {}}>
              Start first scan
            </Button>
          </Card>

          {/* Mock result preview */}
          <Text style={styles.sectionTitle}>Sample result</Text>
          <Card variant="content" style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <View>
                <Text style={styles.resultTitle}>Face · Full analysis</Text>
                <Text style={styles.resultDate}>Example report</Text>
              </View>
              <View style={styles.scoreBadge}>
                <Text style={styles.scoreText}>72</Text>
                <Text style={styles.scoreLabel}>/100</Text>
              </View>
            </View>
            <View style={styles.resultRows}>
              {MOCK_RESULTS.map((r) => (
                <View key={r.label} style={styles.resultRow}>
                  <Text style={styles.resultRowLabel}>{r.label}</Text>
                  <View style={styles.resultRowRight}>
                    <View style={[styles.statusDot, { backgroundColor: STATUS_COLORS[r.status] }]} />
                    <Text style={styles.resultRowValue}>{r.value}</Text>
                  </View>
                </View>
              ))}
            </View>
            <View style={styles.resultFooter}>
              <Text style={styles.resultFooterText}>
                Results are provided for informational purposes only and do not constitute a
                medical diagnosis.
              </Text>
            </View>
          </Card>

          {/* How it works */}
          <Card variant="sage" style={styles.howCard}>
            <Text style={styles.sectionTitle}>How it works</Text>
            <View style={styles.steps}>
              {STEPS.map((step, i) => (
                <View key={i} style={styles.step}>
                  <View style={styles.stepBadge}>
                    <Text style={styles.stepNumber}>{i + 1}</Text>
                  </View>
                  <View style={styles.stepText}>
                    <Text style={styles.stepTitle}>{step.title}</Text>
                    <Text style={styles.stepDesc}>{step.desc}</Text>
                  </View>
                </View>
              ))}
            </View>
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

  ctaCard: { gap: Spacing.lg },
  ctaEyebrow: {
    fontSize: 11, fontWeight: '600', color: BrandColors.mute,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  ctaTitle: { fontSize: 32, fontWeight: '700', color: BrandColors.primary, letterSpacing: -0.8, lineHeight: 36 },
  ctaBody: { fontSize: 14, lineHeight: 21, color: BrandColors.canvasSoft },
  ctaButton: { alignSelf: 'flex-start' },

  resultCard: { gap: Spacing.lg },
  resultHeader: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start' },
  resultTitle: { fontSize: 16, fontWeight: '700', color: BrandColors.ink },
  resultDate: { fontSize: 12, color: BrandColors.mute, marginTop: 2 },
  scoreBadge: {
    backgroundColor: BrandColors.primaryPale,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
    flexDirection: 'row',
    alignItems: 'baseline',
    gap: 2,
  },
  scoreText: { fontSize: 22, fontWeight: '900', color: BrandColors.positiveDeep },
  scoreLabel: { fontSize: 13, fontWeight: '600', color: BrandColors.positiveDeep },
  resultRows: { gap: Spacing.sm },
  resultRow: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingVertical: Spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: BrandColors.canvasSoft,
  },
  resultRowLabel: { fontSize: 14, color: BrandColors.body },
  resultRowRight: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  resultRowValue: { fontSize: 14, fontWeight: '600', color: BrandColors.ink },
  resultFooter: { borderTopWidth: 1, borderTopColor: BrandColors.canvasSoft, paddingTop: Spacing.md },
  resultFooterText: { fontSize: 11, color: BrandColors.mute, lineHeight: 16 },

  howCard: { gap: Spacing.lg },
  steps: { gap: Spacing.lg },
  step: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  stepBadge: {
    width: 28, height: 28, borderRadius: 14,
    backgroundColor: BrandColors.primary,
    alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 2,
  },
  stepNumber: { fontSize: 13, fontWeight: '700', color: BrandColors.onPrimary },
  stepText: { flex: 1, gap: 2 },
  stepTitle: { fontSize: 14, fontWeight: '600', color: BrandColors.ink },
  stepDesc: { fontSize: 13, lineHeight: 19, color: BrandColors.mute },
});
