import Constants from 'expo-constants';
import { Link } from 'expo-router';
import * as WebBrowser from 'expo-web-browser';
import { useState } from 'react';
import { Alert, Linking, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/button';
import { KeyboardAwareScrollView } from '@/components/keyboard-aware-scroll-view';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { APP_NAME, PRIVACY_POLICY_URL, SUPPORT_EMAIL, SUPPORT_URL } from '@/constants/brand';
import { BottomTabInset, MaxContentWidth, Spacing } from '@/constants/theme';
import { modelFor, useSettings } from '@/context/settings-context';
import { useTheme } from '@/hooks/use-theme';
import { listProviderModels } from '@/lib/ai/analyze';
import { PROVIDER_IDS, PROVIDERS, type ModelOption, type ProviderId } from '@/lib/ai/providers';

export default function SettingsScreen() {
  const { settings, hasApiKey, selectProvider } = useSettings();

  return (
    <ThemedView style={styles.container}>
      <SafeAreaView edges={['top']} style={styles.container}>
        <KeyboardAwareScrollView
          contentContainerStyle={styles.content}>
          <ThemedText type="subtitle">Settings</ThemedText>

          <Section title="AI provider">
            {PROVIDER_IDS.map((id) => (
              <OptionRow
                key={id}
                title={PROVIDERS[id].name}
                subtitle={[PROVIDERS[id].hasFreeTier ? 'Free tier' : null, hasApiKey[id] ? 'Key saved' : 'No key']
                  .filter(Boolean)
                  .join(' · ')}
                selected={settings.providerId === id}
                onPress={() => selectProvider(id)}
              />
            ))}
          </Section>

          {/* Keyed by provider so local form state resets when switching. */}
          <ProviderSettings key={settings.providerId} providerId={settings.providerId} />

          <ThemedText type="small" themeColor="textSecondary">
            Everything stays on this phone. API keys are stored in the device keychain and are only sent to
            the provider you choose. Photos go straight from this phone to that provider for analysis.
          </ThemedText>

          <AboutSection />
        </KeyboardAwareScrollView>
      </SafeAreaView>
    </ThemedView>
  );
}

function ProviderSettings({ providerId }: { providerId: ProviderId }) {
  const theme = useTheme();
  const { settings, hasApiKey, selectModel, saveApiKey } = useSettings();
  const provider = PROVIDERS[providerId];
  const selectedModel = modelFor(settings, providerId);

  const [keyDraft, setKeyDraft] = useState('');
  const [isSavingKey, setIsSavingKey] = useState(false);
  const [liveModels, setLiveModels] = useState<ModelOption[] | null>(null);
  const [isLoadingModels, setIsLoadingModels] = useState(false);
  const [customModel, setCustomModel] = useState('');

  const handleSaveKey = async (key: string) => {
    setIsSavingKey(true);
    try {
      await saveApiKey(providerId, key);
      setKeyDraft('');
      setLiveModels(null);
    } catch {
      Alert.alert('Could not save key', 'Please try again.');
    } finally {
      setIsSavingKey(false);
    }
  };

  const loadModels = async () => {
    setIsLoadingModels(true);
    try {
      setLiveModels(await listProviderModels(providerId));
    } catch (error) {
      Alert.alert('Could not load models', error instanceof Error ? error.message : undefined);
    } finally {
      setIsLoadingModels(false);
    }
  };

  const applyCustomModel = () => {
    const trimmed = customModel.trim();
    if (!trimmed) return;
    selectModel(providerId, trimmed);
    setCustomModel('');
  };

  const models = liveModels ?? provider.suggestedModels;
  // Always show the current selection, even if it came from a custom ID or an earlier live list.
  const visibleModels = models.some((m) => m.id === selectedModel)
    ? models
    : [{ id: selectedModel, label: selectedModel }, ...models];

  const inputStyle = [styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }];

  return (
    <>
      <ThemedText themeColor="textSecondary">{provider.description}</ThemedText>

      <Section title={`${provider.name} API key`}>
          <TextInput
            value={keyDraft}
            onChangeText={setKeyDraft}
            placeholder={hasApiKey[providerId] ? '•••••••• saved. Paste to replace' : 'Paste your API key'}
            placeholderTextColor={theme.textSecondary}
            secureTextEntry
            autoCapitalize="none"
            autoCorrect={false}
            textContentType="none"
            // The Save button can sit behind the keyboard, so Return saves too.
            returnKeyType="done"
            onSubmitEditing={() => {
              if (keyDraft.trim() && !isSavingKey) void handleSaveKey(keyDraft);
            }}
            style={inputStyle}
            accessibilityLabel={`${provider.name} API key`}
          />
          <View style={styles.buttonRow}>
            <Button
              title="Save key"
              style={styles.flex}
              disabled={!keyDraft.trim()}
              loading={isSavingKey}
              onPress={() => handleSaveKey(keyDraft)}
            />
            {hasApiKey[providerId] ? (
              <Button
                title="Remove"
                variant="destructive"
                style={styles.flex}
                disabled={isSavingKey}
                onPress={() => handleSaveKey('')}
              />
            ) : null}
          </View>
          {providerId === 'gemini' ? (
            <Link href="/gemini-key" asChild>
              <Pressable accessibilityRole="link">
                <ThemedText type="small" style={{ color: theme.tint }}>
                  How to get a free Gemini key →
                </ThemedText>
              </Pressable>
            </Link>
          ) : provider.keyUrl ? (
            <Pressable accessibilityRole="link" onPress={() => WebBrowser.openBrowserAsync(provider.keyUrl!)}>
              <ThemedText type="small" style={{ color: theme.tint }}>
                Get a {provider.name} API key →
              </ThemedText>
            </Pressable>
          ) : null}
        </Section>

      <Section title="Model">
        {visibleModels.map((model) => (
          <OptionRow
            key={model.id}
            title={model.label}
            subtitle={model.label === model.id ? undefined : model.id}
            selected={model.id === selectedModel}
            onPress={() => selectModel(providerId, model.id)}
          />
        ))}

        <>
            <Button
              title={liveModels ? 'Reload models from provider' : 'Load all models from provider'}
              variant="secondary"
              disabled={!hasApiKey[providerId]}
              loading={isLoadingModels}
              onPress={loadModels}
            />
            <View style={styles.buttonRow}>
              <TextInput
                value={customModel}
                onChangeText={setCustomModel}
                onSubmitEditing={applyCustomModel}
                placeholder="Or enter a model ID"
                placeholderTextColor={theme.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="done"
                style={[inputStyle, styles.flex]}
                accessibilityLabel="Custom model ID"
              />
              <Button title="Use" variant="secondary" disabled={!customModel.trim()} onPress={applyCustomModel} />
            </View>
        </>
      </Section>
    </>
  );
}

function AboutSection() {
  const version = Constants.expoConfig?.version ?? '';
  return (
    <Section title="About">
      <LinkRow title="Privacy policy" onPress={() => WebBrowser.openBrowserAsync(PRIVACY_POLICY_URL)} />
      <LinkRow title="Help and support" onPress={() => WebBrowser.openBrowserAsync(SUPPORT_URL)} />
      <LinkRow title="Contact" subtitle={SUPPORT_EMAIL} onPress={() => Linking.openURL(`mailto:${SUPPORT_EMAIL}`)} />
      <ThemedText type="small" themeColor="textSecondary">
        {APP_NAME} {version}. Calorie and macro numbers are AI estimates and can be wrong by 20% or more. They are
        not medical advice.
      </ThemedText>
    </Section>
  );
}

function LinkRow({ title, subtitle, onPress }: { title: string; subtitle?: string; onPress: () => void }) {
  return (
    <Pressable accessibilityRole="link" onPress={onPress}>
      {({ pressed }) => (
        <ThemedView type="backgroundElement" style={[styles.option, { borderColor: 'transparent', opacity: pressed ? 0.7 : 1 }]}>
          <View style={styles.flex}>
            <ThemedText type="smallBold">{title}</ThemedText>
            {subtitle ? (
              <ThemedText type="small" themeColor="textSecondary">
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
          <ThemedText themeColor="textSecondary">›</ThemedText>
        </ThemedView>
      )}
    </Pressable>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View style={styles.section}>
      <ThemedText type="smallBold" themeColor="textSecondary" style={styles.sectionTitle}>
        {title}
      </ThemedText>
      {children}
    </View>
  );
}

function OptionRow({
  title,
  subtitle,
  selected,
  onPress,
}: {
  title: string;
  subtitle?: string;
  selected: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable accessibilityRole="radio" accessibilityState={{ selected }} onPress={onPress}>
      {({ pressed }) => (
        <ThemedView
          type="backgroundElement"
          style={[
            styles.option,
            { borderColor: selected ? theme.tint : 'transparent', opacity: pressed ? 0.7 : 1 },
          ]}>
          <View style={styles.flex}>
            <ThemedText type="smallBold">{title}</ThemedText>
            {subtitle ? (
              <ThemedText type="small" themeColor="textSecondary" numberOfLines={1}>
                {subtitle}
              </ThemedText>
            ) : null}
          </View>
          <View style={[styles.radio, { borderColor: selected ? theme.tint : theme.textSecondary }]}>
            {selected ? <View style={[styles.radioDot, { backgroundColor: theme.tint }]} /> : null}
          </View>
        </ThemedView>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    paddingBottom: BottomTabInset + Spacing.four,
    gap: Spacing.four,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  section: {
    gap: Spacing.two,
  },
  sectionTitle: {
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  option: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.three,
    paddingHorizontal: Spacing.three,
    paddingVertical: Spacing.three,
    borderRadius: 12,
    borderWidth: 2,
  },
  radio: {
    width: 22,
    height: 22,
    borderRadius: 11,
    borderWidth: 2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioDot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  input: {
    minHeight: 48,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 16,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  flex: {
    flex: 1,
  },
});
