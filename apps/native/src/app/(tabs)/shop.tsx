import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { BottomTabInset, BrandColors, MaxContentWidth, Spacing } from '../../constants/theme';

const CATEGORIES = [
  { label: 'SPF 50+ Sunscreen', emoji: '🌞', desc: 'Broad-spectrum UVA/UVB protection' },
  { label: 'Vitamin C Serums', emoji: '🍊', desc: 'Antioxidant defence & brightening' },
  { label: 'After-Sun Care', emoji: '🧊', desc: 'Repair & soothe UV-stressed skin' },
  { label: 'Antioxidants', emoji: '🫐', desc: 'Free radical & photoageing defence' },
];

const FEATURED = [
  {
    brand: 'La Roche-Posay',
    name: 'Anthelios UV Mune 400',
    spf: 'SPF 50+',
    price: '€28',
    desc: 'Invisible fluid, extra water-resistant',
    variant: 'content' as const,
  },
  {
    brand: 'Eucerin',
    name: 'Sun Fluid Anti-Age',
    spf: 'SPF 50',
    price: '€22',
    desc: 'With licochalcone A for photo protection',
    variant: 'sage' as const,
  },
];

export default function ShopScreen() {
  const { top } = useSafeAreaInsets();

  return (
    <ScrollView
      style={styles.scrollView}
      contentContainerStyle={styles.contentOuter}
      contentInsetAdjustmentBehavior="never">
      <View style={styles.safeArea}>
        <View style={[styles.header, { paddingTop: top + Spacing.lg }]}>
          <Text style={styles.headerTitle}>Shop</Text>
          <Text style={styles.headerSubtext}>UV protection & skin longevity</Text>
        </View>

        <View style={styles.content}>
          {/* Coming soon banner */}
          <Card variant="dark" style={styles.heroBanner}>
            <Text style={styles.bannerEyebrow}>Coming in Phase 4</Text>
            <Text style={styles.bannerTitle}>Matched to{'\n'}your UV profile.</Text>
            <Text style={styles.bannerBody}>
              After your first Dermetrics scan, we'll recommend products tailored to your UV
              damage score, melanin type, and dermatologist notes.
            </Text>
            <Button variant="primary" style={styles.bannerButton} disabled onPress={() => {}}>
              Browse products
            </Button>
          </Card>

          {/* Categories */}
          <Text style={styles.sectionTitle}>Categories</Text>
          <View style={styles.categoryGrid}>
            {CATEGORIES.map((cat) => (
              <Card key={cat.label} variant="content" style={styles.categoryCard}>
                <Text style={styles.categoryEmoji}>{cat.emoji}</Text>
                <Text style={styles.categoryLabel}>{cat.label}</Text>
                <Text style={styles.categoryDesc}>{cat.desc}</Text>
              </Card>
            ))}
          </View>

          {/* Featured */}
          <Text style={styles.sectionTitle}>Dermatologist picks</Text>
          {FEATURED.map((p) => (
            <Card key={p.name} variant={p.variant} style={styles.productCard}>
              <View style={styles.productTop}>
                <View style={styles.productMeta}>
                  <Text style={styles.productBrand}>{p.brand}</Text>
                  <Text style={styles.productName}>{p.name}</Text>
                  <Text style={styles.productDesc}>{p.desc}</Text>
                </View>
                <View style={styles.productRight}>
                  <View style={styles.spfBadge}>
                    <Text style={styles.spfText}>{p.spf}</Text>
                  </View>
                  <Text style={styles.productPrice}>{p.price}</Text>
                </View>
              </View>
            </Card>
          ))}

          {/* Privacy note */}
          <Card variant="green" style={styles.noticeCard}>
            <Text style={styles.noticeTitle}>Your data, your choice</Text>
            <Text style={styles.noticeBody}>
              Recommendations are powered by an anonymised skin profile — no diagnosis data, no
              scan images leave your device. You control this in Settings at any time.
            </Text>
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

  heroBanner: { gap: Spacing.lg },
  bannerEyebrow: {
    fontSize: 11, fontWeight: '600', color: BrandColors.mute,
    textTransform: 'uppercase', letterSpacing: 0.8,
  },
  bannerTitle: { fontSize: 32, fontWeight: '700', color: BrandColors.primary, letterSpacing: -0.8, lineHeight: 36 },
  bannerBody: { fontSize: 14, lineHeight: 21, color: BrandColors.canvasSoft },
  bannerButton: { alignSelf: 'flex-start' },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.md },
  categoryCard: { width: '47%', gap: Spacing.sm, padding: Spacing.lg },
  categoryEmoji: { fontSize: 28 },
  categoryLabel: { fontSize: 15, fontWeight: '700', color: BrandColors.ink },
  categoryDesc: { fontSize: 12, lineHeight: 17, color: BrandColors.mute },

  productCard: { gap: Spacing.md },
  productTop: { flexDirection: 'row', justifyContent: 'space-between', gap: Spacing.md },
  productMeta: { flex: 1, gap: 2 },
  productBrand: { fontSize: 11, fontWeight: '600', color: BrandColors.mute, textTransform: 'uppercase', letterSpacing: 0.5 },
  productName: { fontSize: 16, fontWeight: '700', color: BrandColors.ink },
  productDesc: { fontSize: 13, color: BrandColors.body, marginTop: 2 },
  productRight: { alignItems: 'flex-end', gap: Spacing.sm },
  spfBadge: {
    backgroundColor: BrandColors.accentOrange,
    borderRadius: 9999,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 3,
  },
  spfText: { fontSize: 11, fontWeight: '700', color: '#6b2a00' },
  productPrice: { fontSize: 18, fontWeight: '800', color: BrandColors.ink },

  noticeCard: { gap: Spacing.sm },
  noticeTitle: { fontSize: 14, fontWeight: '700', color: BrandColors.positiveDeep },
  noticeBody: { fontSize: 13, lineHeight: 19, color: BrandColors.body },
});
