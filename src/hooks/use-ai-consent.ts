import { Alert } from 'react-native';

import { useSettings } from '@/context/settings-context';
import { PROVIDERS } from '@/lib/ai/providers';

/**
 * Asks once per provider before any meal photo or description is sent to it, as App Store
 * guideline 5.1.2(i) requires for third-party AI. Resolves true when sharing is allowed.
 */
export function useAiConsent() {
  const { settings, activeModel, setAiConsent } = useSettings();

  return (): Promise<boolean> => {
    if (!activeModel) return Promise.resolve(false);
    const { providerId } = activeModel;
    if (settings.aiConsent[providerId]) return Promise.resolve(true);

    const name = PROVIDERS[providerId].name;
    return new Promise((resolve) => {
      Alert.alert(
        `Send meals to ${name}?`,
        `To estimate calories and macros, this app sends the photo or description you choose, and any notes, ` +
          `from this phone to ${name} with your API key. ${name}'s privacy policy covers what it does with them. ` +
          `Nothing is sent unless you allow it, and you can change this in Settings.`,
        [
          { text: "Don't Allow", style: 'cancel', onPress: () => resolve(false) },
          {
            text: 'Allow',
            onPress: () => {
              setAiConsent(providerId, true);
              resolve(true);
            },
          },
        ],
        { cancelable: true, onDismiss: () => resolve(false) },
      );
    });
  };
}
