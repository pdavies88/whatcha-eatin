import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hero } from '@/components/brand/hero';
import { Button } from '@/components/button';
import { KeyboardAwareScrollView } from '@/components/keyboard-aware-scroll-view';
import { NutritionDetails } from '@/components/nutrition-details';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { APP_NAME, APP_TAGLINE } from '@/constants/brand';
import { BottomTabInset, DisplayFont, MaxContentWidth, Spacing } from '@/constants/theme';
import { useMealHistory } from '@/context/meal-history-context';
import { useSettings } from '@/context/settings-context';
import { useFoodAnalysis, type PickedPhoto } from '@/hooks/use-food-analysis';
import { useTheme } from '@/hooks/use-theme';
import { PROVIDERS } from '@/lib/ai/providers';
import { persistMealPhoto } from '@/lib/image';

const PICKER_OPTIONS: ImagePicker.ImagePickerOptions = {
  mediaTypes: ['images'],
  quality: 0.9,
};

export default function ScanScreen() {
  const theme = useTheme();
  const insets = useSafeAreaInsets();
  const { activeModel, keysLoaded } = useSettings();
  const { addMeal } = useMealHistory();
  const { state, analyze, reset } = useFoodAnalysis();
  const [context, setContext] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Set by the barcode screen when a product isn't in Open Food Facts, so the user can photograph its label.
  const { labelFor } = useLocalSearchParams<{ labelFor?: string }>();

  const analysisContext = () =>
    [
      labelFor
        ? `This is a photo of the Nutrition Facts label for ${labelFor}. Use the label's values for one serving.`
        : '',
      context,
    ]
      .filter(Boolean)
      .join(' ');

  const handlePicked = (result: ImagePicker.ImagePickerResult) => {
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    const photo: PickedPhoto = { uri: asset.uri, width: asset.width, height: asset.height };
    void analyze(photo, analysisContext());
  };

  const clearLabelPrompt = () => router.setParams({ labelFor: undefined });

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Allow camera access in Settings to photograph your food.');
      return;
    }
    try {
      handlePicked(await ImagePicker.launchCameraAsync(PICKER_OPTIONS));
    } catch {
      // The iOS Simulator has no camera.
      Alert.alert('Camera unavailable', 'Choose a photo from your library instead.');
    }
  };

  const choosePhoto = async () => {
    handlePicked(await ImagePicker.launchImageLibraryAsync(PICKER_OPTIONS));
  };

  const saveMeal = async () => {
    if (state.status !== 'success') return;
    setIsSaving(true);
    try {
      const id = `${Date.now()}`;
      const photoFile = await persistMealPhoto(state.photo.uri, id);
      addMeal({
        id,
        createdAt: Date.now(),
        photoFile,
        providerName: state.providerName,
        model: state.model,
        analysis: state.analysis,
      });
      setContext('');
      clearLabelPrompt();
      reset();
    } catch {
      Alert.alert('Could not save meal', 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const provider = activeModel ? PROVIDERS[activeModel.providerId] : null;
  const modelLabel =
    provider && activeModel
      ? (provider.suggestedModels.find((option) => option.id === activeModel.model)?.label ?? activeModel.model)
      : '';

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollView
        contentInsetAdjustmentBehavior="never"
        contentContainerStyle={styles.scroll}>
        {state.status === 'idle' ? (
          <>
            <Hero />
            <View style={styles.content}>
              <View style={styles.intro}>
                <ThemedText style={styles.appName}>{APP_NAME}</ThemedText>
                <ThemedText themeColor="textSecondary" style={styles.tagline}>
                  {APP_TAGLINE}
                </ThemedText>
              </View>

              {keysLoaded && !activeModel ? (
                <>
                  <SetupCard />
                  <Button title="Scan a barcode (no key needed)" variant="secondary" onPress={openBarcodeScanner} />
                </>
              ) : null}

              {labelFor && activeModel ? (
                <ThemedView type="backgroundElement" style={styles.setupCard}>
                  <ThemedText type="smallBold">Photograph the label for {labelFor}</ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Take a clear photo of the Nutrition Facts panel. The AI will read the calories and macros from it.
                  </ThemedText>
                  <Pressable accessibilityRole="button" onPress={clearLabelPrompt}>
                    <ThemedText type="small" style={{ color: theme.tint }}>
                      Cancel
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              ) : null}

              {activeModel && provider ? (
                <>
                  <Link href="/settings" asChild>
                    <Pressable accessibilityRole="button" accessibilityHint="Opens AI model settings">
                      <ThemedView type="backgroundElement" style={styles.modelChip}>
                        <ThemedText type="small" themeColor="textSecondary">
                          Model
                        </ThemedText>
                        <ThemedText type="smallBold" numberOfLines={1} style={styles.modelName}>
                          {provider.name} · {modelLabel}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.tint }}>
                          Change
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  </Link>

                  <TextInput
                    value={context}
                    onChangeText={setContext}
                    placeholder="Optional notes, e.g. “cooked in olive oil, large bowl”"
                    placeholderTextColor={theme.textSecondary}
                    maxLength={300}
                    multiline
                    style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
                    accessibilityLabel="Notes about the meal"
                  />

                  <View style={styles.actions}>
                    <Button title="Take photo" onPress={takePhoto} />
                    <Button title="Choose from library" variant="secondary" onPress={choosePhoto} />
                    <Button title="Scan a barcode" variant="secondary" onPress={openBarcodeScanner} />
                  </View>
                </>
              ) : null}
            </View>
          </>
        ) : (
          <View style={[styles.content, { paddingTop: insets.top + Spacing.three }]}>
            <Image
              source={{ uri: state.photo.uri }}
              style={styles.photo}
              contentFit="cover"
              accessibilityLabel="Photo of your meal"
            />

            {state.status === 'analyzing' ? (
              <View style={styles.status}>
                <ActivityIndicator color={theme.tint} />
                <ThemedText themeColor="textSecondary" style={styles.centerText}>
                  Analyzing with {provider?.name ?? 'AI'}…
                </ThemedText>
                <Button title="Cancel" variant="secondary" onPress={reset} />
              </View>
            ) : null}

            {state.status === 'error' ? (
              <View style={styles.status}>
                <ThemedText style={{ color: theme.danger }}>{state.message}</ThemedText>
                <Button title="Try again" onPress={() => analyze(state.photo, analysisContext())} />
                <Button title="Start over" variant="secondary" onPress={reset} />
              </View>
            ) : null}

            {state.status === 'success' ? (
              <>
                <NutritionDetails analysis={state.analysis} />
                <View style={styles.actions}>
                  {state.analysis.is_food ? (
                    <Button title="Save to this week" onPress={saveMeal} loading={isSaving} />
                  ) : null}
                  <Button title="Discard" variant="secondary" onPress={reset} disabled={isSaving} />
                </View>
              </>
            ) : null}
          </View>
        )}
      </KeyboardAwareScrollView>
    </ThemedView>
  );
}

const openBarcodeScanner = () => router.push('/barcode');

/** First-run prompt shown until the user adds an API key. */
function SetupCard() {
  return (
    <ThemedView type="backgroundElement" style={styles.setupCard}>
      <ThemedText type="smallBold">Add an AI key to get started</ThemedText>
      <ThemedText type="small" themeColor="textSecondary">
        {APP_NAME} uses your own AI key, so there are no accounts or subscriptions. A Gemini key from Google is
        free and takes about a minute to create.
      </ThemedText>
      <Link href="/gemini-key" asChild>
        <Button title="Get a free Gemini key" />
      </Link>
      <Link href="/settings" asChild>
        <Button title="Use another provider" variant="secondary" />
      </Link>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scroll: {
    paddingBottom: BottomTabInset + Spacing.four,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  intro: {
    gap: Spacing.one,
    alignItems: 'center',
    paddingBottom: Spacing.two,
  },
  appName: {
    fontSize: 40,
    lineHeight: 48,
    fontFamily: DisplayFont.bold,
    fontWeight: 'normal',
  },
  tagline: {
    textAlign: 'center',
  },
  setupCard: {
    borderRadius: Spacing.four,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  modelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  modelName: {
    flex: 1,
  },
  input: {
    minHeight: 80,
    borderRadius: Spacing.three,
    padding: Spacing.three,
    fontSize: 16,
    textAlignVertical: 'top',
  },
  actions: {
    gap: Spacing.two,
  },
  photo: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: Spacing.four,
  },
  status: {
    gap: Spacing.three,
    alignItems: 'stretch',
  },
  centerText: {
    textAlign: 'center',
  },
});
