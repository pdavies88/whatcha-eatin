import { Link } from 'expo-router';
import { Pressable, StyleSheet, View } from 'react-native';

import { Button } from '@/components/button';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DisplayFont, Spacing } from '@/constants/theme';
import { useProfile } from '@/context/profile-context';
import { useTheme } from '@/hooks/use-theme';
import { computeTargets, MIN_ADULT_AGE, type DailyPlan, type Goal, type UnitSystem } from '@/lib/targets';

const GOAL_LABEL: Record<Goal, string> = { lose: 'Lose weight', maintain: 'Maintain', gain: 'Gain weight' };

const GOAL_PACE: Record<Goal, Record<UnitSystem, string>> = {
  lose: { us: 'About 1 lb a week', metric: 'About 0.5 kg a week' },
  maintain: { us: 'Stay at your current weight', metric: 'Stay at your current weight' },
  gain: { us: 'About ½ lb a week', metric: 'About 0.25 kg a week' },
};

/** Daily calorie and macro targets at the top of the Week tab, compared with the selected day. */
export function TargetsCard({ dayCalories, dayLabel }: { dayCalories: number; dayLabel: string }) {
  const theme = useTheme();
  const { profile } = useProfile();

  if (!profile) {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <ThemedText type="smallBold">Know your daily targets</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          Add your age, height, weight and activity to see how many calories and macros you need each day to lose,
          maintain or gain weight.
        </ThemedText>
        <Link href="/profile" asChild>
          <Button title="Add your details" />
        </Link>
      </ThemedView>
    );
  }

  const result = computeTargets(profile);

  if (result.kind === 'minor') {
    return (
      <ThemedView type="backgroundElement" style={styles.card}>
        <Header />
        <ThemedText type="small" themeColor="textSecondary">
          Daily targets are for adults {MIN_ADULT_AGE} and over. Teens need enough energy to grow, so a doctor or
          registered dietitian is the best guide.
        </ThemedText>
      </ThemedView>
    );
  }

  const plans = [result.plans.lose, result.plans.maintain, result.plans.gain].filter(
    (plan): plan is DailyPlan => plan !== undefined,
  );
  // An underweight person who chose "lose" sees maintenance as their comparison instead.
  const chosen = result.plans[profile.goal] ?? result.plans.maintain;
  const progress = Math.min(1, dayCalories / chosen.calories);

  return (
    <ThemedView type="backgroundElement" style={styles.card}>
      <Header />

      <View style={styles.progress}>
        <ThemedText type="small" themeColor="textSecondary">
          {dayLabel}: <ThemedText type="smallBold">{Math.round(dayCalories)}</ThemedText> of {chosen.calories} kcal
          to {GOAL_LABEL[chosen.goal].toLowerCase()}
        </ThemedText>
        <View style={[styles.track, { backgroundColor: theme.backgroundSelected }]}>
          <View style={[styles.fill, { width: `${progress * 100}%`, backgroundColor: theme.tint }]} />
        </View>
      </View>

      {plans.map((plan) => (
        <PlanRow key={plan.goal} plan={plan} units={profile.units} selected={plan.goal === chosen.goal} />
      ))}

      {result.plans.lose?.atCalorieFloor ? (
        <ThemedText type="small" themeColor="textSecondary">
          The weight-loss target is raised to the safe minimum of {result.plans.lose.calories} kcal a day.
        </ThemedText>
      ) : null}
      {result.underweight ? (
        <ThemedText type="small" themeColor="textSecondary">
          Your BMI is under 18.5, so there’s no weight-loss target. If you want to lose weight, talk to a doctor first.
        </ThemedText>
      ) : null}

      <ThemedText type="small" themeColor="textSecondary">
        Estimates from the Mifflin-St Jeor equation. They don’t apply during pregnancy or breastfeeding, or with
        conditions such as diabetes or kidney disease. A doctor or registered dietitian can tailor them to you.
      </ThemedText>
    </ThemedView>
  );
}

function Header() {
  const theme = useTheme();
  return (
    <View style={styles.header}>
      <ThemedText style={styles.title}>Daily targets</ThemedText>
      <Link href="/profile" asChild>
        <Pressable accessibilityRole="button" accessibilityLabel="Edit your details" hitSlop={8}>
          <ThemedText type="small" style={{ color: theme.tint }}>
            Edit details
          </ThemedText>
        </Pressable>
      </Link>
    </View>
  );
}

function PlanRow({ plan, units, selected }: { plan: DailyPlan; units: UnitSystem; selected: boolean }) {
  const theme = useTheme();
  return (
    <View
      style={[styles.plan, { backgroundColor: theme.background, borderColor: selected ? theme.tint : 'transparent' }]}
      accessible
      accessibilityLabel={`${GOAL_LABEL[plan.goal]}: ${plan.calories} calories, ${plan.protein_g} grams protein, ${plan.carbs_g} grams carbs, ${plan.fat_g} grams fat${selected ? ', your goal' : ''}`}>
      <View style={styles.planText}>
        <ThemedText type="smallBold">
          {GOAL_LABEL[plan.goal]}
          {selected ? <ThemedText type="small" style={{ color: theme.tint }}>  · your goal</ThemedText> : null}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          {GOAL_PACE[plan.goal][units]}
        </ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          P {plan.protein_g}g · C {plan.carbs_g}g · F {plan.fat_g}g · Fiber {plan.fiber_g}g
        </ThemedText>
      </View>
      <View style={styles.planCalories}>
        <ThemedText style={styles.calories}>{plan.calories}</ThemedText>
        <ThemedText type="small" themeColor="textSecondary">
          kcal/day
        </ThemedText>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  title: {
    fontSize: 22,
    lineHeight: 28,
    fontFamily: DisplayFont.semiBold,
    fontWeight: 'normal',
  },
  progress: {
    gap: Spacing.two,
  },
  track: {
    height: 10,
    borderRadius: 5,
    overflow: 'hidden',
  },
  fill: {
    height: '100%',
    borderRadius: 5,
  },
  plan: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    borderRadius: Spacing.three,
    borderWidth: 2,
    padding: Spacing.three,
  },
  planText: {
    flex: 1,
    gap: Spacing.half,
  },
  planCalories: {
    alignItems: 'flex-end',
  },
  calories: {
    fontSize: 24,
    lineHeight: 30,
    fontFamily: DisplayFont.semiBold,
    fontWeight: 'normal',
    fontVariant: ['tabular-nums'],
  },
});
