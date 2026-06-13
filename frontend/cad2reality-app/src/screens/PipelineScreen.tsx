import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  SafeAreaView,
  StatusBar,
} from 'react-native';
import PipelineStep, { StepStatus } from '../components/PipelineStep';
import { colors, spacing, borderRadius } from '../theme';

interface PipelineScreenProps {
  fileName: string;
  pipelineResult: any;
  onViewAR: (arUrl: string) => void;
  onBack: () => void;
}

export default function PipelineScreen({
  fileName,
  pipelineResult,
  onViewAR,
  onBack,
}: PipelineScreenProps) {
  const [stepStatuses, setStepStatuses] = useState<StepStatus[]>([
    'pending', 'pending', 'pending', 'pending',
  ]);

  const pipeline = pipelineResult.pipeline;
  const result = pipelineResult.result;

  useEffect(() => {
    // Animate steps appearing one by one
    const timers: NodeJS.Timeout[] = [];

    timers.push(setTimeout(() => {
      setStepStatuses(prev => ['success', ...prev.slice(1)]);
    }, 500));

    timers.push(setTimeout(() => {
      setStepStatuses(prev => [prev[0], 'success', ...prev.slice(2)]);
    }, 1200));

    timers.push(setTimeout(() => {
      setStepStatuses(prev => [prev[0], prev[1], 'success', ...prev.slice(3)]);
    }, 2000));

    timers.push(setTimeout(() => {
      setStepStatuses(prev => [
        prev[0], prev[1], prev[2],
        result.model_generated ? 'success' : 'error',
      ]);
    }, 2800));

    return () => timers.forEach(clearTimeout);
  }, []);

  const features = result.features;

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>Pipeline Results</Text>
          <Text style={styles.headerSubtitle}>{fileName}</Text>
        </View>
        <View style={{ width: 40 }} />
      </View>

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Pipeline Steps */}
        <PipelineStep
          stepNumber={1}
          title="DXF Parsed"
          subtitle={pipeline.step1_parse.message}
          status={stepStatuses[0]}
          color={colors.stepParse}
          icon="📐"
          delay={0}
        />

        <PipelineStep
          stepNumber={2}
          title="Features Extracted"
          subtitle="Dimensions and structure analyzed"
          status={stepStatuses[1]}
          color={colors.stepFeatures}
          icon="🔍"
          detail={`Width: ${features.width} mm\nHeight: ${features.height} mm\nVertical Bars: ${features.bars}`}
          delay={200}
        />

        <PipelineStep
          stepNumber={3}
          title="AI Classification"
          subtitle={`Gemma identified: ${result.object_type}`}
          status={stepStatuses[2]}
          color={colors.stepAI}
          icon="🧠"
          detail={`Object Type: ${result.object_type.toUpperCase()}`}
          delay={400}
        />

        <PipelineStep
          stepNumber={4}
          title="3D Model Generated"
          subtitle={pipeline.step4_model.message}
          status={stepStatuses[3]}
          color={colors.stepModel}
          icon="🏗️"
          detail={result.model_generated ? `GLB file ready for AR viewing` : 'Model generation failed'}
          delay={600}
        />

        {/* Result Card */}
        {stepStatuses[3] === 'success' && (
          <View style={styles.resultCard}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultEmoji}>🎉</Text>
              <Text style={styles.resultTitle}>Pipeline Complete!</Text>
            </View>
            <Text style={styles.resultSubtitle}>
              Your {result.object_type} model is ready for AR viewing.
            </Text>

            {/* Feature Summary */}
            <View style={styles.featureGrid}>
              <View style={styles.featureItem}>
                <Text style={styles.featureValue}>{features.width}</Text>
                <Text style={styles.featureLabel}>Width (mm)</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureValue}>{features.height}</Text>
                <Text style={styles.featureLabel}>Height (mm)</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureValue}>{features.bars}</Text>
                <Text style={styles.featureLabel}>Bars</Text>
              </View>
              <View style={styles.featureItem}>
                <Text style={styles.featureValue}>{result.object_type}</Text>
                <Text style={styles.featureLabel}>Type</Text>
              </View>
            </View>

            {/* AR Button */}
            <TouchableOpacity
              style={styles.arButton}
              onPress={() => onViewAR(result.ar_url)}
              activeOpacity={0.8}
            >
              <Text style={styles.arButtonIcon}>📱</Text>
              <View>
                <Text style={styles.arButtonText}>View in AR</Text>
                <Text style={styles.arButtonHint}>Place model in your real world</Text>
              </View>
            </TouchableOpacity>

            {/* 3D Preview Button */}
            <TouchableOpacity
              style={styles.previewButton}
              onPress={() => onViewAR(result.ar_url)}
              activeOpacity={0.8}
            >
              <Text style={styles.previewButtonIcon}>🔮</Text>
              <Text style={styles.previewButtonText}>3D Preview</Text>
            </TouchableOpacity>
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  backIcon: {
    fontSize: 20,
    color: colors.textPrimary,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: colors.textMuted,
    marginTop: 2,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.md,
    paddingBottom: spacing.xxl,
  },
  resultCard: {
    marginTop: spacing.md,
    padding: spacing.lg,
    backgroundColor: 'rgba(34, 197, 94, 0.06)',
    borderRadius: borderRadius.xl,
    borderWidth: 1,
    borderColor: 'rgba(34, 197, 94, 0.2)',
  },
  resultHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  resultEmoji: {
    fontSize: 28,
  },
  resultTitle: {
    fontSize: 22,
    fontWeight: '800',
    color: colors.textPrimary,
  },
  resultSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    marginBottom: spacing.lg,
  },
  featureGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  featureItem: {
    flex: 1,
    minWidth: '40%',
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    padding: spacing.md,
    borderRadius: borderRadius.md,
    alignItems: 'center',
  },
  featureValue: {
    fontSize: 20,
    fontWeight: '800',
    color: colors.secondary,
  },
  featureLabel: {
    fontSize: 11,
    color: colors.textMuted,
    marginTop: 4,
    textTransform: 'uppercase',
    letterSpacing: 1,
  },
  arButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    width: '100%',
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.primary,
    marginBottom: spacing.sm,
  },
  arButtonIcon: {
    fontSize: 28,
  },
  arButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
  },
  arButtonHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 2,
  },
  previewButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    width: '100%',
    paddingVertical: spacing.md,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
  },
  previewButtonIcon: {
    fontSize: 18,
  },
  previewButtonText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textSecondary,
  },
});
