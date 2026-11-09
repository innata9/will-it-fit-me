import { router } from 'expo-router';
import type { ReactNode } from 'react';
import {
  ActivityIndicator,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
  type StyleProp,
  type TextInputProps,
  type TextProps,
  type ViewStyle,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors, radius, type } from '../theme';
import { Icon } from './Icon';

export function Screen({
  children,
  scroll = true,
  dark = false,
  edges = ['top'],
  contentStyle,
}: {
  children: ReactNode;
  scroll?: boolean;
  dark?: boolean;
  edges?: ('top' | 'bottom')[];
  contentStyle?: StyleProp<ViewStyle>;
}) {
  const bg = dark ? '#141318' : colors.bg;
  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: bg }} edges={edges}>
      {scroll ? (
        <ScrollView contentContainerStyle={[styles.content, contentStyle]} keyboardShouldPersistTaps="handled">
          {children}
        </ScrollView>
      ) : (
        <View style={[styles.content, { flex: 1 }, contentStyle]}>{children}</View>
      )}
    </SafeAreaView>
  );
}

export function TopBar({ title, dark = false, right }: { title?: string; dark?: boolean; right?: ReactNode }) {
  return (
    <View style={styles.topBar}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Back"
        onPress={() => (router.canGoBack() ? router.back() : router.replace('/'))}
        style={[styles.iconBtn, dark && { backgroundColor: '#2A2830' }]}
      >
        <Icon name="back" size={20} strokeWidth={2} color={dark ? '#F4F3F6' : colors.ink} />
      </Pressable>
      {title ? <Text style={[styles.topTitle, dark && { color: '#F4F3F6' }]}>{title}</Text> : null}
      <View style={{ flex: 1 }} />
      {right}
    </View>
  );
}

export function IconButton({ icon, label, onPress, color }: { icon: Parameters<typeof Icon>[0]['name']; label: string; onPress: () => void; color?: string }) {
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={label} onPress={onPress} style={styles.iconBtn}>
      <Icon name={icon} size={20} color={color ?? colors.ink} />
    </Pressable>
  );
}

export function H1({ style, ...p }: TextProps) {
  return <Text accessibilityRole="header" {...p} style={[type.display, style]} />;
}
export function H2({ style, ...p }: TextProps) {
  return <Text accessibilityRole="header" {...p} style={[type.h2, style]} />;
}
export function Body({ style, ...p }: TextProps) {
  return <Text {...p} style={[type.body, style]} />;
}
export function Small({ style, ...p }: TextProps) {
  return <Text {...p} style={[type.small, style]} />;
}
export function Caption({ style, ...p }: TextProps) {
  return <Text {...p} style={[type.caption, style]} />;
}

export function Card({ children, style, tone }: { children: ReactNode; style?: StyleProp<ViewStyle>; tone?: 'accent' | 'warn' | 'good' }) {
  const bg = tone === 'accent' ? colors.accentSoft : tone === 'warn' ? colors.warnBg : tone === 'good' ? colors.goodBg : colors.surface;
  return <View style={[styles.card, { backgroundColor: bg }, style]}>{children}</View>;
}

export function Button({
  label,
  onPress,
  variant = 'primary',
  icon,
  disabled,
  loading,
  style,
}: {
  label: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'soft' | 'dark';
  icon?: Parameters<typeof Icon>[0]['name'];
  disabled?: boolean;
  loading?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const v = {
    primary: { bg: colors.accent, fg: '#FFFFFF', border: colors.accent },
    secondary: { bg: colors.surface, fg: colors.ink, border: colors.field },
    soft: { bg: colors.accentSoft, fg: colors.accentDark, border: colors.accentSoft },
    dark: { bg: colors.ink, fg: '#FFFFFF', border: colors.ink },
  }[variant];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: disabled || loading }}
      disabled={disabled || loading}
      onPress={onPress}
      style={({ pressed }) => [
        styles.button,
        { backgroundColor: v.bg, borderColor: v.border, opacity: disabled ? 0.5 : pressed ? 0.85 : 1 },
        style,
      ]}
    >
      {loading ? <ActivityIndicator color={v.fg} /> : icon ? <Icon name={icon} size={18} color={v.fg} /> : null}
      <Text style={{ color: v.fg, fontSize: 16, fontWeight: '700' }}>{label}</Text>
    </Pressable>
  );
}

export function Badge({ label, ink, bg }: { label: string; ink: string; bg: string }) {
  return (
    <View style={{ backgroundColor: bg, borderRadius: radius.pill, paddingHorizontal: 10, paddingVertical: 4, alignSelf: 'flex-start' }}>
      <Text style={{ color: ink, fontSize: 12, fontWeight: '700' }}>{label}</Text>
    </View>
  );
}

export function Chip({ label, selected, onPress }: { label: string; selected?: boolean; onPress?: () => void }) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected: !!selected }}
      onPress={onPress}
      style={[
        styles.chip,
        selected ? { backgroundColor: colors.accentSoft, borderColor: colors.accent, borderWidth: 2 } : null,
      ]}
    >
      <Text style={{ fontSize: 14, fontWeight: selected ? '700' : '600', color: selected ? colors.accentDark : colors.ink }}>{label}</Text>
    </Pressable>
  );
}

export function Segmented<T extends string>({ options, value, onChange }: { options: { value: T; label: string }[]; value: T; onChange: (v: T) => void }) {
  return (
    <View style={styles.segment} accessibilityRole="tablist">
      {options.map((o) => {
        const on = o.value === value;
        return (
          <Pressable
            key={o.value}
            accessibilityRole="tab"
            accessibilityState={{ selected: on }}
            onPress={() => onChange(o.value)}
            style={[styles.segmentItem, on && { backgroundColor: colors.surface }]}
          >
            <Text style={{ fontSize: 14, fontWeight: on ? '700' : '600', color: on ? colors.ink : colors.muted }}>{o.label}</Text>
          </Pressable>
        );
      })}
    </View>
  );
}

export function Swatch({ hex, size = 22, rounded = 6, bordered }: { hex: string; size?: number | `${number}%`; rounded?: number; bordered?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: typeof size === 'number' ? size : 40,
        borderRadius: rounded,
        backgroundColor: hex,
        borderWidth: bordered ? 1 : 0,
        borderColor: colors.line,
      }}
    />
  );
}

export function Field({ label, suffix, ...input }: TextInputProps & { label: string; suffix?: string }) {
  return (
    <View style={{ gap: 8 }}>
      <Text style={{ fontSize: 14, fontWeight: '700', color: colors.ink }}>{label}</Text>
      <View style={styles.field}>
        <TextInput
          accessibilityLabel={label}
          placeholderTextColor="#8A8794"
          style={{ flex: 1, fontSize: 17, color: colors.ink, paddingVertical: 12 }}
          {...input}
        />
        {suffix ? <Text style={{ fontSize: 15, fontWeight: '600', color: colors.subtle }}>{suffix}</Text> : null}
      </View>
    </View>
  );
}

export function Row({ children, gap = 10, style }: { children: ReactNode; gap?: number; style?: StyleProp<ViewStyle> }) {
  return <View style={[{ flexDirection: 'row', alignItems: 'center', gap }, style]}>{children}</View>;
}

export function Notice({ text, tone = 'warn' }: { text: string; tone?: 'warn' | 'good' | 'bad' }) {
  const t = tone === 'good' ? { bg: colors.goodBg, fg: '#165A34' } : tone === 'bad' ? { bg: colors.badBg, fg: colors.bad } : { bg: colors.warnBg, fg: '#4A3200' };
  return (
    <View accessibilityRole="alert" style={{ backgroundColor: t.bg, borderRadius: radius.md, padding: 14 }}>
      <Text style={{ color: t.fg, fontSize: 14, lineHeight: 20 }}>{text}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  content: { padding: 20, gap: 16, paddingBottom: 32 },
  topBar: { flexDirection: 'row', alignItems: 'center', gap: 12 },
  topTitle: { fontSize: 14, fontWeight: '700', color: colors.ink },
  iconBtn: { width: 44, height: 44, borderRadius: 12, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  card: { borderRadius: radius.lg, padding: 18, gap: 12 },
  button: { minHeight: 52, borderRadius: radius.md, borderWidth: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingHorizontal: 16 },
  chip: { minHeight: 44, paddingHorizontal: 14, borderRadius: 12, borderWidth: 1, borderColor: colors.field, backgroundColor: colors.surface, alignItems: 'center', justifyContent: 'center' },
  segment: { flexDirection: 'row', backgroundColor: colors.line, borderRadius: 12, padding: 4, gap: 6 },
  segmentItem: { flex: 1, minHeight: 40, borderRadius: 9, alignItems: 'center', justifyContent: 'center' },
  field: { flexDirection: 'row', alignItems: 'center', borderWidth: 1, borderColor: colors.field, borderRadius: radius.md, backgroundColor: colors.surface, paddingHorizontal: 14 },
});
