import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { Link } from 'expo-router';
import { useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { NutritionDetails } from '@/components/nutrition-details';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
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
  const { activeModel } = useSettings();
  const { addMeal } = useMealHistory();
  const { state, analyze, reset } = useFoodAnalysis();
  const [context, setContext] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const handlePicked = (result: ImagePicker.ImagePickerResult) => {
    const asset = result.canceled ? undefined : result.assets[0];
    if (!asset) return;
    const photo: PickedPhoto = { uri: asset.uri, width: asset.width, height: asset.height };
    void analyze(photo, context);
  };

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
      const photoUri = await persistMealPhoto(state.photo.uri, id);
      addMeal({
        id,
        createdAt: Date.now(),
        photoUri,
        providerName: state.providerName,
        model: state.model,
        analysis: state.analysis,
      });
      setContext('');
      reset();
    } catch {
      Alert.alert('Could not save meal', 'Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const provider = PROVIDERS[activeModel.providerId];
  const modelLabel =
    provider.suggestedModels.find((option) => option.id === activeModel.model)?.label ?? activeModel.model;

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.safeArea}>
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardDismissMode="interactive"
          keyboardShouldPersistTaps="handled">
          {state.status === 'idle' ? (
            <>
              <View style={styles.hero}>
                <ThemedText type="subtitle">What are you eating?</ThemedText>
                <ThemedText themeColor="textSecondary">
                  Snap a photo and AI will estimate the calories and macros.
                </ThemedText>
              </View>

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
              {activeModel.isFallback ? (
                <ThemedText type="small" themeColor="textSecondary">
                  Your selected provider has no API key, so the free model will be used.
                </ThemedText>
              ) : null}

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
              </View>
            </>
          ) : (
            <>
              <Image
                source={{ uri: state.photo.uri }}
                style={styles.photo}
                contentFit="cover"
                accessibilityLabel="Photo of your meal"
              />

              {state.status === 'analyzing' ? (
                <View style={styles.status}>
                  <ActivityIndicator color={theme.tint} />
                  <ThemedText themeColor="textSecondary">Analyzing with {provider.name}…</ThemedText>
                  <Button title="Cancel" variant="secondary" onPress={reset} />
                </View>
              ) : null}

              {state.status === 'error' ? (
                <View style={styles.status}>
                  <ThemedText style={{ color: theme.danger }}>{state.message}</ThemedText>
                  <Button title="Try again" onPress={() => analyze(state.photo, context)} />
                  <Button title="Start over" variant="secondary" onPress={reset} />
                </View>
              ) : null}

              {state.status === 'success' ? (
                <>
                  <NutritionDetails analysis={state.analysis} />
                  <View style={styles.actions}>
                    {state.analysis.is_food ? (
                      <Button title="Save to history" onPress={saveMeal} loading={isSaving} />
                    ) : null}
                    <Button title="Discard" variant="secondary" onPress={reset} disabled={isSaving} />
                  </View>
                </>
              ) : null}
            </>
          )}
        </ScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  hero: {
    gap: Spacing.two,
    paddingVertical: Spacing.four,
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
});
