import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  ActivityIndicator,
  Alert,
  Keyboard,
  Pressable,
  StyleSheet,
  TextInput,
  useWindowDimensions,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Hero } from '@/components/brand/hero';
import { Button } from '@/components/button';
import { KeyboardAwareScrollView } from '@/components/keyboard-aware-scroll-view';
import { NutritionDetails } from '@/components/nutrition-details';
import { SegmentedControl } from '@/components/segmented-control';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { APP_NAME } from '@/constants/brand';
import { BottomTabInset, DisplayFont, MaxContentWidth, MaxPhotoShare, Spacing } from '@/constants/theme';
import { useMealHistory } from '@/context/meal-history-context';
import { useSettings } from '@/context/settings-context';
import { useFoodAnalysis, type FoodInput, type PickedPhoto } from '@/hooks/use-food-analysis';
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
  const window = useWindowDimensions();
  const { activeModel, keysLoaded } = useSettings();
  const { addMeal } = useMealHistory();
  const { state, analyze, reset } = useFoodAnalysis();
  const [mode, setMode] = useState<LogMode>('type');
  const [description, setDescription] = useState('');
  const [photoNotes, setPhotoNotes] = useState('');
  const [isSaving, setIsSaving] = useState(false);
  // Set by the barcode screen when a product isn't in Open Food Facts, so the user can photograph its label.
  const { labelFor } = useLocalSearchParams<{ labelFor?: string }>();
  // Photographing a label only makes sense with the camera.
  const activeMode: LogMode = labelFor ? 'snap' : mode;

  const analysisContext = () =>
    [
      labelFor
        ? `This is a photo of the Nutrition Facts label for ${labelFor}. Use the label's values for one serving.`
        : '',
      photoNotes,
    ]
      .filter(Boolean)
      .join(' ');

  const handlePicked = (result: ImagePicker.ImagePickerResult) => {
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    const photo: PickedPhoto = { uri: asset.uri, width: asset.width, height: asset.height };
    void analyze({ kind: 'photo', photo }, analysisContext());
  };

  const lookUpText = () => {
    const typed = description.trim();
    if (!typed) return;
    Keyboard.dismiss();
    void analyze({ kind: 'text', description: typed });
  };

  // Typed meals carry everything in the description, so only photos get the notes as extra context.
  const retry = (input: FoodInput) => analyze(input, input.kind === 'photo' ? analysisContext() : undefined);

  const clearLabelPrompt = () => router.setParams({ labelFor: undefined });

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert('Camera access needed', 'Allow camera access in Settings to photograph your food.');
      return;
    }
    Keyboard.dismiss();
    try {
      handlePicked(await ImagePicker.launchCameraAsync(PICKER_OPTIONS));
    } catch {
      // The iOS Simulator has no camera.
      Alert.alert('Camera unavailable', 'Type what you ate instead.');
    }
  };

  const saveMeal = async () => {
    if (state.status !== 'success') return;
    setIsSaving(true);
    try {
      const id = `${Date.now()}`;
      const photoFile = state.photo ? await persistMealPhoto(state.photo.uri, id) : undefined;
      addMeal({
        id,
        createdAt: Date.now(),
        photoFile,
        source: state.input.kind,
        description: state.input.kind === 'text' ? state.input.description : undefined,
        providerName: state.providerName,
        model: state.model,
        analysis: state.analysis,
      });
      if (state.input.kind === 'text') setDescription('');
      else setPhotoNotes('');
      clearLabelPrompt();
      reset();
    } catch {
      Alert.alert('Could not save meal', 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const provider = activeModel ? PROVIDERS[activeModel.providerId] : null;

  // VoiceOver and TalkBack users can't see the spinner or the result appear, so say what changed.
  const announcement =
    state.status === 'analyzing'
      ? `Analyzing with ${provider?.name ?? 'AI'}`
      : state.status === 'error'
        ? state.message
        : state.status === 'success'
          ? state.analysis.is_food
            ? `${state.analysis.meal_name}, about ${Math.round(state.analysis.totals.calories)} calories`
            : 'No food detected'
          : null;
  useEffect(() => {
    if (announcement) AccessibilityInfo.announceForAccessibility(announcement);
  }, [announcement]);

  // Keeps content clear of the Dynamic Island and home indicator in landscape. The hero handles its own.
  const sideInsets = { paddingLeft: Spacing.four + insets.left, paddingRight: Spacing.four + insets.right };

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
            <View style={[styles.content, sideInsets]}>
              {keysLoaded && !activeModel ? (
                <>
                  <SetupCard />
                  <Button title="Scan a barcode (no key needed)" variant="secondary" onPress={openBarcodeScanner} />
                </>
              ) : null}

              {labelFor && activeModel ? (
                <ThemedView type="backgroundElement" style={styles.setupCard}>
                  <ThemedText type="smallBold" accessibilityRole="header">
                    Photograph the label for {labelFor}
                  </ThemedText>
                  <ThemedText type="small" themeColor="textSecondary">
                    Take a clear photo of the Nutrition Facts panel. The AI will read the calories and macros from it.
                  </ThemedText>
                  <Pressable accessibilityRole="button" onPress={clearLabelPrompt} style={styles.textButton}>
                    <ThemedText type="small" style={{ color: theme.tint }}>
                      Cancel
                    </ThemedText>
                  </Pressable>
                </ThemedView>
              ) : null}

              {activeModel && provider ? (
                <>
                  <View style={styles.section}>
                    {labelFor ? null : (
                      <SegmentedControl
                        options={MODE_OPTIONS}
                        value={activeMode}
                        onChange={setMode}
                        accessibilityLabel="How to log your meal"
                      />
                    )}

                    {activeMode === 'type' ? (
                      <>
                        <Eyebrow>What’d you eat?</Eyebrow>
                        <TextInput
                          value={description}
                          onChangeText={setDescription}
                          placeholder="2 scrambled eggs, sourdough toast with butter, oat latte"
                          placeholderTextColor={theme.textSecondary}
                          maxLength={300}
                          multiline
                          style={[
                            styles.input,
                            { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.inputBorder },
                          ]}
                          accessibilityLabel="Describe what you ate"
                        />
                        <Button title="Look it up" onPress={lookUpText} disabled={!description.trim()} />
                      </>
                    ) : (
                      <>
                        <Eyebrow>Anything the photo won’t show?</Eyebrow>
                        <TextInput
                          value={photoNotes}
                          onChangeText={setPhotoNotes}
                          placeholder="Optional, e.g. “cooked in olive oil, large bowl, ate half”"
                          placeholderTextColor={theme.textSecondary}
                          maxLength={300}
                          multiline
                          style={[
                            styles.input,
                            { color: theme.text, backgroundColor: theme.backgroundElement, borderColor: theme.inputBorder },
                          ]}
                          accessibilityLabel="Notes to send with the photo"
                        />
                        <Button title="Take photo" onPress={takePhoto} />
                      </>
                    )}
                  </View>

                  <Button title="Scan a barcode" variant="secondary" onPress={openBarcodeScanner} />

                  <Link href="/settings" asChild>
                    <Pressable
                      accessibilityRole="button"
                      accessibilityLabel={`AI model: ${provider.name}, ${modelLabel}. Change`}
                      accessibilityHint="Opens AI model settings">
                      <ThemedView type="backgroundElement" style={styles.modelChip}>
                        <View style={[styles.liveDot, { backgroundColor: theme.tint }]} />
                        <ThemedText type="smallBold" numberOfLines={1} style={styles.modelName}>
                          {provider.name} · {modelLabel}
                        </ThemedText>
                        <ThemedText type="small" style={{ color: theme.tint }}>
                          Change
                        </ThemedText>
                      </ThemedView>
                    </Pressable>
                  </Link>
                </>
              ) : null}
            </View>
          </>
        ) : (
          <View style={[styles.content, sideInsets, { paddingTop: insets.top + Spacing.three }]}>
            {state.input.kind === 'photo' ? (
              <Image
                source={{ uri: state.input.photo.uri }}
                style={[styles.photo, { maxHeight: window.height * MaxPhotoShare }]}
                contentFit="cover"
                accessibilityLabel="Photo of your meal"
              />
            ) : (
              <View style={[styles.quote, { borderLeftColor: theme.tint }]}>
                <Eyebrow>You said</Eyebrow>
                <ThemedText style={styles.quoteText}>{state.input.description}</ThemedText>
              </View>
            )}

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
                <Button title="Try again" onPress={() => retry(state.input)} />
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

type LogMode = 'type' | 'snap';

const MODE_OPTIONS: { value: LogMode; label: string }[] = [
  { value: 'type', label: 'Type it' },
  { value: 'snap', label: 'Snap it' },
];

const openBarcodeScanner = () => router.push('/barcode');

/** A small uppercase label that opens a section. */
function Eyebrow({ children }: { children: string }) {
  return (
    <ThemedText themeColor="textSecondary" style={styles.eyebrow} accessibilityRole="header" accessibilityLabel={children}>
      {children.toUpperCase()}
    </ThemedText>
  );
}

/** First-run prompt shown until the user adds an API key. */
function SetupCard() {
  return (
    <ThemedView type="backgroundElement" style={styles.setupCard}>
      <ThemedText type="smallBold" accessibilityRole="header">
        Add an AI key to get started
      </ThemedText>
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
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  eyebrow: {
    fontSize: 12,
    lineHeight: 16,
    letterSpacing: 1.6,
    fontFamily: DisplayFont.semiBold,
    fontWeight: 'normal',
  },
  setupCard: {
    borderRadius: 16,
    padding: Spacing.four,
    gap: Spacing.three,
  },
  input: {
    minHeight: 96,
    borderRadius: 12,
    borderWidth: 1,
    padding: Spacing.three,
    fontSize: 17,
    lineHeight: 24,
    textAlignVertical: 'top',
  },
  textButton: {
    minHeight: 44,
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  modelChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
  },
  liveDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  modelName: {
    flex: 1,
  },
  actions: {
    gap: Spacing.two,
  },
  photo: {
    width: '100%',
    alignSelf: 'center',
    aspectRatio: 4 / 3,
    borderRadius: 16,
  },
  quote: {
    borderLeftWidth: 4,
    paddingLeft: Spacing.three,
    paddingVertical: Spacing.one,
    gap: Spacing.two,
  },
  quoteText: {
    fontSize: 22,
    lineHeight: 30,
    letterSpacing: -0.4,
    fontFamily: DisplayFont.medium,
    fontWeight: 'normal',
  },
  status: {
    gap: Spacing.three,
    alignItems: 'stretch',
  },
  centerText: {
    textAlign: 'center',
  },
});
