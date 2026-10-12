import { router } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { KeyboardAwareScrollView } from '@/components/keyboard-aware-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { APP_NAME } from '@/constants/brand';
import { MaxContentWidth, Spacing } from '@/constants/theme';
import { useSettings } from '@/context/settings-context';
import { useTheme } from '@/hooks/use-theme';
import { listProviderModels } from '@/lib/ai/analyze';
import { AnalysisError } from '@/lib/ai/errors';
import { PROVIDERS } from '@/lib/ai/providers';

const STEPS = [
  'Open Google AI Studio and sign in with any Google account.',
  'Tap “Create API key”. If Google asks for a project, let it create a new one.',
  'Copy the new key. Create a fresh key here instead of reusing an old Google Cloud key, because Google rejects older unrestricted keys.',
  'Paste the key below and tap Save.',
];

export default function GeminiKeyScreen() {
  const theme = useTheme();
  const { saveApiKey, selectProvider } = useSettings();
  const [key, setKey] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  const save = async () => {
    setIsSaving(true);
    try {
      await saveApiKey('gemini', key);
      // Listing models is a cheap call that confirms Google accepts the key.
      await listProviderModels('gemini');
      selectProvider('gemini');
      router.back();
    } catch (error) {
      if (error instanceof AnalysisError && (error.kind === 'auth' || error.kind === 'bad_request')) {
        await saveApiKey('gemini', '');
        Alert.alert('Google rejected this key', 'Check that you copied the whole key, or create a new one.');
      } else {
        // Offline or a temporary Google error: keep the key, since it may well be valid.
        selectProvider('gemini');
        router.back();
      }
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <KeyboardAwareScrollView
        contentContainerStyle={styles.content}>
        <ThemedText themeColor="textSecondary">
          {APP_NAME} has no servers and no accounts. You bring your own AI key. Google gives Gemini keys away
          for free, with daily limits that are plenty for logging meals. No credit card is needed.
        </ThemedText>

        <View style={styles.steps}>
          {STEPS.map((step, index) => (
            <View key={step} style={styles.step}>
              <View style={[styles.stepNumber, { backgroundColor: theme.tint }]}>
                <ThemedText type="smallBold" style={{ color: theme.onTint }}>
                  {index + 1}
                </ThemedText>
              </View>
              <ThemedText style={styles.stepText}>{step}</ThemedText>
            </View>
          ))}
        </View>

        <Button
          title="Open Google AI Studio"
          variant="secondary"
          onPress={() => WebBrowser.openBrowserAsync(PROVIDERS.gemini.keyUrl!)}
        />

        <TextInput
          value={key}
          onChangeText={setKey}
          placeholder="Paste your Gemini API key"
          placeholderTextColor={theme.textSecondary}
          secureTextEntry
          autoCapitalize="none"
          autoCorrect={false}
          textContentType="none"
          // The Save button can sit behind the keyboard, so Return saves too.
          returnKeyType="done"
          onSubmitEditing={() => {
            if (key.trim() && !isSaving) void save();
          }}
          style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
          accessibilityLabel="Gemini API key"
        />
        <Button title="Save" disabled={!key.trim()} loading={isSaving} onPress={save} />

        <ThemedText type="small" themeColor="textSecondary">
          Your key is stored in this phone&apos;s keychain. Photos go straight from your phone to Google. On the
          free tier, Google&apos;s terms let it use what you send to improve its products. If that matters to you,
          turn on billing for your Google project or use another provider in Settings.
        </ThemedText>
      </KeyboardAwareScrollView>
    </ThemedView>
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
  steps: {
    gap: Spacing.three,
  },
  step: {
    flexDirection: 'row',
    gap: Spacing.three,
    alignItems: 'flex-start',
  },
  stepNumber: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepText: {
    flex: 1,
  },
  input: {
    minHeight: 48,
    borderRadius: Spacing.three,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
});
