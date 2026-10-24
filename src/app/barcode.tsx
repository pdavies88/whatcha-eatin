import { CameraView, useCameraPermissions, type BarcodeScanningResult } from 'expo-camera';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useEffect, useRef, useState } from 'react';
import { ActivityIndicator, Alert, Pressable, ScrollView, StyleSheet, TextInput, View } from 'react-native';

import { Button } from '@/components/button';
import { KeyboardAwareScrollView } from '@/components/keyboard-aware-scroll-view';
import { MacroSummary } from '@/components/macro-summary';
import { ThemedText } from '@/components/themed-text';
import { ThemedView } from '@/components/themed-view';
import { DisplayFont, MaxContentWidth, Spacing } from '@/constants/theme';
import { useMealHistory } from '@/context/meal-history-context';
import { useTheme } from '@/hooks/use-theme';
import { lookupBarcode } from '@/lib/barcode/lookup';
import {
  OPEN_FOOD_FACTS_CREDIT,
  OPEN_FOOD_FACTS_NAME,
  portionBasis,
  productToAnalysis,
  type Product,
} from '@/lib/barcode/open-food-facts';
import { downloadMealPhoto } from '@/lib/image';

type ScanState =
  | { status: 'scanning' }
  | { status: 'looking_up'; barcode: string }
  | { status: 'found'; product: Product }
  | { status: 'missing'; barcode: string; name?: string; reason: 'not_found' | 'no_nutrition' }
  | { status: 'error'; barcode: string; message: string };

const AMOUNT_STEP = 0.5;
const MAX_AMOUNT = 20;

export default function BarcodeScreen() {
  const [permission, requestPermission] = useCameraPermissions();
  const [state, setState] = useState<ScanState>({ status: 'scanning' });
  const abortRef = useRef<AbortController | null>(null);

  useEffect(() => () => abortRef.current?.abort(), []);

  const lookUp = async (barcode: string) => {
    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;
    setState({ status: 'looking_up', barcode });
    try {
      const result = await lookupBarcode(barcode, controller.signal);
      if (controller.signal.aborted) return;
      if (result.status === 'found') {
        setState({ status: 'found', product: result.product });
      } else {
        setState({
          status: 'missing',
          barcode,
          reason: result.status,
          name: result.status === 'no_nutrition' ? result.name : undefined,
        });
      }
    } catch (error) {
      if (controller.signal.aborted) return;
      setState({ status: 'error', barcode, message: error instanceof Error ? error.message : 'Lookup failed.' });
    }
  };

  const onScanned = (result: BarcodeScanningResult) => {
    // The camera reports the same code many times a second. Only act on the first while scanning.
    if (state.status !== 'scanning') return;
    void lookUp(result.data);
  };

  const scanAgain = () => {
    abortRef.current?.abort();
    setState({ status: 'scanning' });
  };

  return (
    <ThemedView style={styles.container}>
      {state.status === 'scanning' ? (
        <Scanner permission={permission} requestPermission={requestPermission} onScanned={onScanned} onManual={lookUp} />
      ) : (
        <ScrollView contentContainerStyle={styles.content} contentInsetAdjustmentBehavior="automatic">
          {state.status === 'looking_up' ? (
            <View style={styles.center}>
              <ActivityIndicator />
              <ThemedText themeColor="textSecondary">Looking up {state.barcode}…</ThemedText>
            </View>
          ) : null}

          {state.status === 'found' ? <ProductResult product={state.product} onScanAgain={scanAgain} /> : null}

          {state.status === 'missing' ? (
            <MissingProduct barcode={state.barcode} name={state.name} reason={state.reason} onScanAgain={scanAgain} />
          ) : null}

          {state.status === 'error' ? (
            <View style={styles.section}>
              <ThemedText>{state.message}</ThemedText>
              <Button title="Try again" onPress={() => lookUp(state.barcode)} />
              <Button title="Scan another" variant="secondary" onPress={scanAgain} />
            </View>
          ) : null}
        </ScrollView>
      )}
    </ThemedView>
  );
}

function Scanner({
  permission,
  requestPermission,
  onScanned,
  onManual,
}: {
  permission: ReturnType<typeof useCameraPermissions>[0];
  requestPermission: ReturnType<typeof useCameraPermissions>[1];
  onScanned: (result: BarcodeScanningResult) => void;
  onManual: (barcode: string) => void;
}) {
  const theme = useTheme();
  const [manual, setManual] = useState('');
  const manualCode = manual.replace(/\D/g, '');
  const submitManual = () => {
    if (manualCode.length >= 8) onManual(manualCode);
  };

  return (
    <KeyboardAwareScrollView
      contentContainerStyle={styles.content}
      contentInsetAdjustmentBehavior="automatic">
      <View style={[styles.cameraFrame, { backgroundColor: theme.backgroundElement }]}>
        {permission?.granted ? (
          <>
            <CameraView
              style={StyleSheet.absoluteFill}
              facing="back"
              barcodeScannerSettings={{ barcodeTypes: ['ean13', 'ean8', 'upc_a', 'upc_e'] }}
              onBarcodeScanned={onScanned}
            />
            <View style={styles.reticle} pointerEvents="none" />
          </>
        ) : (
          <View style={styles.permission}>
            <ThemedText themeColor="textSecondary" style={styles.centerText}>
              {permission && !permission.canAskAgain
                ? 'Camera access is off. Turn it on in the Settings app, or type the barcode below.'
                : 'Allow camera access to scan barcodes.'}
            </ThemedText>
            {permission?.canAskAgain !== false ? <Button title="Allow camera" onPress={requestPermission} /> : null}
          </View>
        )}
      </View>

      <ThemedText themeColor="textSecondary" style={styles.centerText}>
        Point the camera at the barcode on the package. No AI key is needed for barcodes.
      </ThemedText>

      <View style={styles.section}>
        <ThemedText type="smallBold" themeColor="textSecondary">
          OR TYPE THE NUMBER UNDER THE BARCODE
        </ThemedText>
        <View style={styles.row}>
          <TextInput
            value={manual}
            onChangeText={setManual}
            onSubmitEditing={submitManual}
            placeholder="e.g. 028400090858"
            placeholderTextColor={theme.textSecondary}
            keyboardType="number-pad"
            returnKeyType="search"
            maxLength={14}
            style={[styles.input, { color: theme.text, backgroundColor: theme.backgroundElement }]}
            accessibilityLabel="Barcode number"
          />
          <Button title="Look up" variant="secondary" disabled={manualCode.length < 8} onPress={submitManual} />
        </View>
      </View>
    </KeyboardAwareScrollView>
  );
}

function ProductResult({ product, onScanAgain }: { product: Product; onScanAgain: () => void }) {
  const theme = useTheme();
  const { addMeal } = useMealHistory();
  const [amount, setAmount] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const basis = portionBasis(product);
  const analysis = productToAnalysis(product, amount);

  const save = async () => {
    setIsSaving(true);
    const id = `${Date.now()}`;
    // The product photo is nice to have. If the download fails, log the item without it.
    const photoFile = product.imageUrl ? await downloadMealPhoto(product.imageUrl, id).catch(() => undefined) : undefined;
    try {
      addMeal({
        id,
        createdAt: Date.now(),
        photoFile,
        source: 'barcode',
        barcode: product.barcode,
        providerName: OPEN_FOOD_FACTS_NAME,
        model: 'barcode',
        analysis,
      });
      router.back();
      router.navigate('/week');
    } catch {
      setIsSaving(false);
      Alert.alert('Could not save', 'Please try again.');
    }
  };

  return (
    <View style={styles.section}>
      <View style={[styles.productImageFrame, { backgroundColor: '#FFFFFF' }]}>
        {product.imageUrl ? (
          <Image
            source={{ uri: product.imageUrl }}
            style={StyleSheet.absoluteFill}
            contentFit="contain"
            accessibilityLabel={`Photo of ${product.name}`}
          />
        ) : (
          <ThemedText themeColor="textSecondary">No product photo</ThemedText>
        )}
      </View>

      <View>
        {product.brand ? (
          <ThemedText type="small" themeColor="textSecondary">
            {product.brand}
          </ThemedText>
        ) : null}
        <ThemedText style={styles.productName}>{product.name}</ThemedText>
      </View>

      <ThemedView type="backgroundElement" style={styles.stepperCard}>
        <View style={styles.flex}>
          <ThemedText type="smallBold">How much did you have?</ThemedText>
          <ThemedText type="small" themeColor="textSecondary">
            {amount === 1 ? basis.label : `${amount} × ${basis.label}`}
          </ThemedText>
        </View>
        <StepButton
          label="−"
          accessibilityLabel="Less"
          disabled={amount <= AMOUNT_STEP}
          onPress={() => setAmount((value) => Math.max(AMOUNT_STEP, value - AMOUNT_STEP))}
        />
        <ThemedText style={styles.amount}>{amount}</ThemedText>
        <StepButton
          label="+"
          accessibilityLabel="More"
          disabled={amount >= MAX_AMOUNT}
          onPress={() => setAmount((value) => Math.min(MAX_AMOUNT, value + AMOUNT_STEP))}
        />
      </ThemedView>

      <MacroSummary macros={analysis.totals} />

      <Button title="Save to this week" loading={isSaving} onPress={save} />
      <Button title="Scan another" variant="secondary" disabled={isSaving} onPress={onScanAgain} />

      <ThemedText type="small" style={{ color: theme.textSecondary }}>
        {OPEN_FOOD_FACTS_CREDIT}. Values come from the package label, as entered by Open Food Facts contributors.
      </ThemedText>
    </View>
  );
}

function StepButton({
  label,
  accessibilityLabel,
  disabled,
  onPress,
}: {
  label: string;
  accessibilityLabel: string;
  disabled: boolean;
  onPress: () => void;
}) {
  const theme = useTheme();
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      style={({ pressed }) => [
        styles.stepButton,
        { backgroundColor: theme.background, opacity: disabled ? 0.4 : pressed ? 0.7 : 1 },
      ]}>
      <ThemedText style={styles.stepLabel}>{label}</ThemedText>
    </Pressable>
  );
}

function MissingProduct({
  barcode,
  name,
  reason,
  onScanAgain,
}: {
  barcode: string;
  name?: string;
  reason: 'not_found' | 'no_nutrition';
  onScanAgain: () => void;
}) {
  const subject = name ? `“${name}”` : `barcode ${barcode}`;
  const message =
    reason === 'not_found'
      ? `${OPEN_FOOD_FACTS_NAME} doesn’t know ${subject} yet.`
      : `${OPEN_FOOD_FACTS_NAME} has ${subject}, but without nutrition facts.`;

  const photographLabel = () => {
    router.back();
    // The Scan tab shows a prompt to photograph the nutrition label, with this product as context.
    router.navigate({ pathname: '/', params: { labelFor: name ?? `barcode ${barcode}` } });
  };

  return (
    <View style={styles.section}>
      <ThemedText style={styles.productName}>Product not found</ThemedText>
      <ThemedText themeColor="textSecondary">
        {message} Take a photo of the Nutrition Facts label instead, and the AI will read it.
      </ThemedText>
      <Button title="Photograph the label" onPress={photographLabel} />
      <Button title="Scan another" variant="secondary" onPress={onScanAgain} />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  content: {
    padding: Spacing.four,
    gap: Spacing.three,
    width: '100%',
    maxWidth: MaxContentWidth,
    alignSelf: 'center',
  },
  center: {
    alignItems: 'center',
    gap: Spacing.three,
    paddingVertical: Spacing.six,
  },
  centerText: {
    textAlign: 'center',
  },
  section: {
    gap: Spacing.three,
  },
  cameraFrame: {
    width: '100%',
    aspectRatio: 1,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  reticle: {
    width: '75%',
    height: '35%',
    borderRadius: 12,
    borderWidth: 3,
    borderColor: '#FFFFFF',
  },
  permission: {
    padding: Spacing.four,
    gap: Spacing.three,
    alignItems: 'stretch',
  },
  row: {
    flexDirection: 'row',
    gap: Spacing.two,
  },
  input: {
    flex: 1,
    minHeight: 52,
    borderRadius: 12,
    paddingHorizontal: Spacing.three,
    fontSize: 17,
    fontVariant: ['tabular-nums'],
  },
  productImageFrame: {
    width: '100%',
    aspectRatio: 4 / 3,
    borderRadius: 16,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  productName: {
    fontSize: 26,
    lineHeight: 32,
    fontFamily: DisplayFont.semiBold,
    fontWeight: 'normal',
  },
  stepperCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.two,
    borderRadius: 12,
    padding: Spacing.three,
  },
  flex: {
    flex: 1,
  },
  amount: {
    minWidth: 40,
    textAlign: 'center',
    fontFamily: DisplayFont.semiBold,
    fontWeight: 'normal',
    fontSize: 20,
    fontVariant: ['tabular-nums'],
  },
  stepButton: {
    width: 44,
    height: 44,
    borderRadius: 22,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepLabel: {
    fontSize: 24,
    lineHeight: 28,
    fontFamily: DisplayFont.semiBold,
    fontWeight: 'normal',
  },
});
