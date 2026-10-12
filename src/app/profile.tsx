import { router } from 'expo-router';
import { useRef, useState } from 'react';
import { Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { KeyboardAwareScrollView } from '@/components/keyboard-aware-scroll-view';
import { KeyboardDoneBar } from '@/components/keyboard-done-bar';
import { SegmentedControl } from '@/components/segmented-control';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useProfile } from '@/context/profile-context';
import { useTheme } from '@/hooks/use-theme';
import { ProfileSchema } from '@/lib/storage/profile';
import {
  ACTIVITY_LEVELS,
  cmToFeetInches,
  feetInchesToCm,
  kgToLb,
  lbToKg,
  type ActivityLevel,
  type Goal,
  type Profile,
  type Sex,
  type UnitSystem,
} from '@/lib/targets';

const parseNumber = (text: string) => Number.parseFloat(text.replace(',', '.'));
const formatNumber = (value: number | undefined, digits = 0) =>
  value === undefined || !Number.isFinite(value) ? '' : String(Number(value.toFixed(digits)));

export default function ProfileScreen() {
  const theme = useTheme();
  const { profile, setProfile } = useProfile();
  const initialFeetInches = profile ? cmToFeetInches(profile.heightCm) : undefined;

  const [units, setUnits] = useState<UnitSystem>(profile?.units ?? 'us');
  const [age, setAge] = useState(formatNumber(profile?.age));
  const [sex, setSex] = useState<Sex | undefined>(profile?.sex);
  const [heightCm, setHeightCm] = useState(formatNumber(profile?.heightCm));
  const [feet, setFeet] = useState(formatNumber(initialFeetInches?.feet));
  const [inches, setInches] = useState(formatNumber(initialFeetInches?.inches));
  const [weight, setWeight] = useState(
    formatNumber(profile ? (profile.units === 'us' ? kgToLb(profile.weightKg) : profile.weightKg) : undefined, 1),
  );
  const [activity, setActivity] = useState<ActivityLevel>(profile?.activity ?? 'light');
  const [goal, setGoal] = useState<Goal>(profile?.goal ?? 'maintain');
  const inchesRef = useRef<TextInput>(null);

  // Feet is a single digit, so move straight on to inches once it's typed.
  const changeFeet = (text: string) => {
    setFeet(text);
    if (/^\d$/.test(text)) inchesRef.current?.focus();
  };

  // Convert what's typed when switching units, so nobody has to re-enter their numbers.
  const switchUnits = (next: UnitSystem) => {
    if (next === units) return;
    const weightValue = parseNumber(weight);
    if (next === 'metric') {
      const cm = feetInchesToCm(parseNumber(feet) || 0, parseNumber(inches) || 0);
      setHeightCm(cm > 0 ? formatNumber(cm) : '');
      setWeight(Number.isFinite(weightValue) ? formatNumber(lbToKg(weightValue), 1) : '');
    } else {
      const cm = parseNumber(heightCm);
      const converted = Number.isFinite(cm) ? cmToFeetInches(cm) : undefined;
      setFeet(formatNumber(converted?.feet));
      setInches(formatNumber(converted?.inches));
      setWeight(Number.isFinite(weightValue) ? formatNumber(kgToLb(weightValue), 1) : '');
    }
    setUnits(next);
  };

  const save = () => {
    const weightValue = parseNumber(weight);
    const candidate = {
      age: Math.round(parseNumber(age)),
      sex,
      heightCm:
        units === 'us' ? feetInchesToCm(parseNumber(feet) || 0, parseNumber(inches) || 0) : parseNumber(heightCm),
      weightKg: units === 'us' ? lbToKg(weightValue) : weightValue,
      activity,
      goal,
      units,
    };
    const parsed = ProfileSchema.safeParse(candidate);
    if (!parsed.success) {
      Alert.alert('Check your details', 'Enter your age, sex, height and weight to see your targets.');
      return;
    }
    setProfile(parsed.data as Profile);
    router.back();
  };

  const clear = () => {
    Alert.alert('Clear your details?', 'Your age, height, weight and targets will be removed from this phone.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Clear',
        style: 'destructive',
        onPress: () => {
          setProfile(null);
          router.back();
        },
      },
    ]);
  };

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}
        contentInsetAdjustmentBehavior="automatic">
        <ThemedText themeColor="textSecondary">
          Your details stay on this phone. They’re used only to estimate how many calories and macros you need each
          day, and they’re never sent to an AI provider.
        </ThemedText>

        <Field label="Units">
          <SegmentedControl
            accessibilityLabel="Units"
            value={units}
            onChange={switchUnits}
            options={[
              { value: 'us', label: 'lb, ft/in' },
              { value: 'metric', label: 'kg, cm' },
            ]}
          />
        </Field>

        <Field label="Age">
          <TextInput
            value={age}
            onChangeText={setAge}
            placeholder="Years"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            inputAccessoryViewID="done-age"
            maxLength={3}
            style={inputStyle}
            accessibilityLabel="Age in years"
          />
        </Field>

        <Field label="Sex" hint="The calorie formula differs slightly by sex. If you’d rather not say, it uses the average.">
          <SegmentedControl
            accessibilityLabel="Sex"
            value={sex ?? ('' as Sex)}
            onChange={setSex}
            options={[
              { value: 'female', label: 'Female' },
              { value: 'male', label: 'Male' },
              { value: 'unspecified', label: 'Rather not say' },
            ]}
          />
        </Field>

        <Field label="Height">
          {units === 'us' ? (
            <View style={styles.row}>
              <TextInput
                value={feet}
                onChangeText={changeFeet}
                placeholder="ft"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
            inputAccessoryViewID="done-feet"
                maxLength={1}
                style={[inputStyle, styles.flex]}
                accessibilityLabel="Height, feet"
              />
              <TextInput
                ref={inchesRef}
                value={inches}
                onChangeText={setInches}
                placeholder="in"
                placeholderTextColor={theme.textSecondary}
                keyboardType="number-pad"
            inputAccessoryViewID="done-inches"
                maxLength={2}
                style={[inputStyle, styles.flex]}
                accessibilityLabel="Height, inches"
              />
            </View>
          ) : (
            <TextInput
              value={heightCm}
              onChangeText={setHeightCm}
              placeholder="cm"
              placeholderTextColor={theme.textSecondary}
              keyboardType="number-pad"
            inputAccessoryViewID="done-cm"
              maxLength={3}
              style={inputStyle}
              accessibilityLabel="Height in centimeters"
            />
          )}
        </Field>

        <Field label="Weight">
          <TextInput
            value={weight}
            onChangeText={setWeight}
            placeholder={units === 'us' ? 'lb' : 'kg'}
            placeholderTextColor={theme.textSecondary}
            keyboardType="decimal-pad"
            inputAccessoryViewID="done-weight"
            maxLength={5}
            style={inputStyle}
            accessibilityLabel={units === 'us' ? 'Weight in pounds' : 'Weight in kilograms'}
          />
        </Field>

        <Field label="Activity" hint="Pick the closest match for a typical week.">
          {(Object.keys(ACTIVITY_LEVELS) as ActivityLevel[]).map((level) => (
            <ChoiceRow
              key={level}
              title={ACTIVITY_LEVELS[level].label}
              subtitle={ACTIVITY_LEVELS[level].description}
              selected={activity === level}
              onPress={() => setActivity(level)}
            />
          ))}
        </Field>

        <Field label="Your goal" hint="The Week tab compares each day with this target. You’ll still see all three.">
          <SegmentedControl
            accessibilityLabel="Goal"
            value={goal}
            onChange={setGoal}
            options={[
              { value: 'lose', label: 'Lose' },
              { value: 'maintain', label: 'Maintain' },
              { value: 'gain', label: 'Gain' },
            ]}
          />
        </Field>

        <Button title="Save" onPress={save} />
        {profile ? <Button title="Clear my details" variant="destructive" onPress={clear} /> : null}
      </KeyboardAwareScrollView>
      {['done-age', 'done-feet', 'done-inches', 'done-cm', 'done-weight'].map((id) => (
        <KeyboardDoneBar key={id} id={id} />
      ))}
    </ThemedView>
  );
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <View style={styles.field}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.label}>
        {label}
      </ThemedText>
      {children}
      {hint ? (
        <ThemedText type="small" themeColor="textSecondary">
          {hint}
        </ThemedText>
      ) : null}
    </View>
  );
}

function ChoiceRow({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress}>
      <ThemedView
        type="backgroundElement"
        style={[styles.choice, { borderColor: selected ? theme.tint : 'transparent' }]}>
        <ThemedText type="smallBold">{title}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {subtitle}
        </ThemedText>
      </ThemedView>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  field: {
    gap: Spacing.two,
  },
  label: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
  input: {
    minHeight: 48,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 17,
  },
  choice: {
    borderRadius: Spacing.three,
    borderWidth: 2,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.two,
    gap: Spacing.half,
  },
});
