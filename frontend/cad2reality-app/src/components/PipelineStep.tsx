import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
} from 'react-native';
import { colors, spacing, borderRadius } from '../theme';

export type StepStatus = 'pending' | 'running' | 'success' | 'error';

interface PipelineStepProps {
  stepNumber: number;
  title: string;
  subtitle?: string;
  status: StepStatus;
  color: string;
  icon: string;
  detail?: string;
  delay?: number;
}

export default function PipelineStep({
  stepNumber,
  title,
  subtitle,
  status,
  color,
  icon,
  detail,
  delay = 0,
}: PipelineStepProps) {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const pulseAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    if (status !== 'pending') {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: 0,
          duration: 500,
          delay,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [status]);

  useEffect(() => {
    if (status === 'running') {
      const pulse = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 0.6,
            duration: 800,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 800,
            useNativeDriver: true,
          }),
        ])
      );
      pulse.start();
      return () => pulse.stop();
    }
  }, [status]);

  const statusIcon = status === 'success' ? '✅' : status === 'error' ? '❌' : status === 'running' ? '⏳' : '⬜';
  const bgColor = status === 'success' ? 'rgba(34, 197, 94, 0.08)' : status === 'error' ? 'rgba(239, 68, 68, 0.08)' : status === 'running' ? 'rgba(123, 47, 247, 0.08)' : colors.bgCard;
  const borderColor = status === 'success' ? 'rgba(34, 197, 94, 0.3)' : status === 'error' ? 'rgba(239, 68, 68, 0.3)' : status === 'running' ? 'rgba(123, 47, 247, 0.3)' : colors.borderLight;

  return (
    <Animated.View
      style={[
        styles.container,
        {
          backgroundColor: bgColor,
          borderColor: borderColor,
          opacity: status === 'pending' ? 0.4 : fadeAnim,
          transform: [{ translateY: status === 'pending' ? 0 : slideAnim }],
        },
      ]}
    >
      <Animated.View
        style={[
          styles.iconContainer,
          { backgroundColor: color + '20', opacity: status === 'running' ? pulseAnim : 1 },
        ]}
      >
        <Text style={styles.iconText}>{icon}</Text>
      </Animated.View>

      <View style={styles.content}>
        <View style={styles.titleRow}>
          <Text style={styles.stepLabel}>STEP {stepNumber}</Text>
          <Text style={styles.statusIcon}>{statusIcon}</Text>
        </View>
        <Text style={styles.title}>{title}</Text>
        {subtitle && <Text style={styles.subtitle}>{subtitle}</Text>}
        {detail && status === 'success' && (
          <View style={styles.detailBox}>
            <Text style={styles.detailText}>{detail}</Text>
          </View>
        )}
      </View>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    padding: spacing.md,
    borderRadius: borderRadius.lg,
    borderWidth: 1,
    marginBottom: spacing.sm,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: borderRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.md,
  },
  iconText: {
    fontSize: 22,
  },
  content: {
    flex: 1,
  },
  titleRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  stepLabel: {
    fontSize: 10,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 1.5,
  },
  statusIcon: {
    fontSize: 16,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: colors.textPrimary,
    marginBottom: 2,
  },
  subtitle: {
    fontSize: 13,
    color: colors.textSecondary,
  },
  detailBox: {
    marginTop: spacing.sm,
    padding: spacing.sm,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderRadius: borderRadius.sm,
  },
  detailText: {
    fontSize: 12,
    fontFamily: 'monospace',
    color: colors.secondary,
  },
});
