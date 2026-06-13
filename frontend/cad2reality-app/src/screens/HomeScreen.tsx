import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  StatusBar,
  SafeAreaView,
  Alert,
  ActivityIndicator,
} from 'react-native';
import * as DocumentPicker from 'expo-document-picker';
import { colors, spacing, borderRadius, shadows } from '../theme';
import { API } from '../config';

interface HomeScreenProps {
  onFileSelected: (result: any) => void;
}

export default function HomeScreen({ onFileSelected }: HomeScreenProps) {
  const [isUploading, setIsUploading] = useState(false);
  const [serverStatus, setServerStatus] = useState<'checking' | 'online' | 'offline'>('checking');

  // Animations
  const logoScale = useRef(new Animated.Value(0)).current;
  const titleOpacity = useRef(new Animated.Value(0)).current;
  const cardsOpacity = useRef(new Animated.Value(0)).current;
  const buttonScale = useRef(new Animated.Value(0)).current;
  const floatAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    // Entry animations
    Animated.stagger(200, [
      Animated.spring(logoScale, { toValue: 1, friction: 4, useNativeDriver: true }),
      Animated.timing(titleOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.timing(cardsOpacity, { toValue: 1, duration: 600, useNativeDriver: true }),
      Animated.spring(buttonScale, { toValue: 1, friction: 5, useNativeDriver: true }),
    ]).start();

    // Floating animation for logo
    Animated.loop(
      Animated.sequence([
        Animated.timing(floatAnim, { toValue: -8, duration: 2000, useNativeDriver: true }),
        Animated.timing(floatAnim, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    ).start();

    // Check server
    checkServer();
  }, []);

  const checkServer = async () => {
    try {
      const response = await fetch(API.health);
      if (response.ok) {
        setServerStatus('online');
      } else {
        setServerStatus('offline');
      }
    } catch {
      setServerStatus('offline');
    }
  };

  const handlePickFile = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.canceled) return;

      const file = result.assets[0];
      if (!file.name.toLowerCase().endsWith('.dxf')) {
        Alert.alert('Invalid File', 'Please select a .dxf CAD file.');
        return;
      }

      setIsUploading(true);

      // Upload to backend
      const formData = new FormData();
      formData.append('file', {
        uri: file.uri,
        name: file.name,
        type: 'application/octet-stream',
      } as any);

      try {
        const response = await fetch(API.upload, {
          method: 'POST',
          body: formData,
          headers: {
            'Content-Type': 'multipart/form-data',
          },
        });

        const data = await response.json();

        if (response.ok && data.success) {
          onFileSelected({
            fileName: file.name,
            pipelineResult: data,
          });
        } else {
          Alert.alert('Pipeline Error', data.error || 'Something went wrong.');
        }
      } catch (error: any) {
        Alert.alert(
          'Connection Error',
          `Cannot reach backend server.\n\nMake sure:\n1. Django server is running\n2. API URL in config.ts matches your server\n\nCurrent URL: ${API.upload}\n\nError: ${error.message}`
        );
      } finally {
        setIsUploading(false);
      }
    } catch (error: any) {
      Alert.alert('Error', 'Failed to pick file: ' + error.message);
      setIsUploading(false);
    }
  };

  const pipelineSteps = [
    { icon: '📐', label: 'CAD Parse', desc: 'Read DXF file' },
    { icon: '🔍', label: 'Extract', desc: 'Get features' },
    { icon: '🧠', label: 'Gemma AI', desc: 'Classify object' },
    { icon: '🏗️', label: '3D Build', desc: 'Generate model' },
    { icon: '📦', label: 'Export', desc: 'Create GLB' },
    { icon: '📱', label: 'AR View', desc: 'Place in world' },
  ];

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />

      {/* Header */}
      <Animated.View style={[styles.logoSection, { transform: [{ scale: logoScale }, { translateY: floatAnim }] }]}>
        <View style={styles.logoContainer}>
          <Text style={styles.logoIcon}>🏗️</Text>
        </View>
      </Animated.View>

      <Animated.View style={[styles.titleSection, { opacity: titleOpacity }]}>
        <Text style={styles.appTitle}>CAD2Reality</Text>
        <Text style={styles.appSubtitle}>Transform 2D CAD drawings into 3D AR models</Text>
      </Animated.View>

      {/* Server Status */}
      <View style={styles.statusContainer}>
        <View style={[styles.statusDot, { backgroundColor: serverStatus === 'online' ? colors.success : serverStatus === 'offline' ? colors.error : colors.warning }]} />
        <Text style={styles.statusText}>
          {serverStatus === 'online' ? 'Server Online' : serverStatus === 'offline' ? 'Server Offline' : 'Checking...'}
        </Text>
        {serverStatus === 'offline' && (
          <TouchableOpacity onPress={checkServer} style={styles.retryButton}>
            <Text style={styles.retryText}>Retry</Text>
          </TouchableOpacity>
        )}
      </View>

      {/* Pipeline Overview */}
      <Animated.View style={[styles.pipelineSection, { opacity: cardsOpacity }]}>
        <Text style={styles.sectionTitle}>PIPELINE</Text>
        <View style={styles.pipelineGrid}>
          {pipelineSteps.map((step, i) => (
            <View key={i} style={styles.pipelineItem}>
              <Text style={styles.pipelineItemIcon}>{step.icon}</Text>
              <Text style={styles.pipelineItemLabel}>{step.label}</Text>
              <Text style={styles.pipelineItemDesc}>{step.desc}</Text>
              {i < pipelineSteps.length - 1 && (
                <Text style={styles.pipelineArrow}>→</Text>
              )}
            </View>
          ))}
        </View>
      </Animated.View>

      {/* Upload Button */}
      <Animated.View style={[styles.buttonSection, { transform: [{ scale: buttonScale }] }]}>
        <TouchableOpacity
          style={[styles.uploadButton, isUploading && styles.uploadButtonDisabled]}
          onPress={handlePickFile}
          disabled={isUploading}
          activeOpacity={0.8}
        >
          {isUploading ? (
            <View style={styles.uploadingRow}>
              <ActivityIndicator color="#fff" size="small" />
              <Text style={styles.uploadButtonText}>Processing Pipeline...</Text>
            </View>
          ) : (
            <>
              <Text style={styles.uploadIcon}>📂</Text>
              <Text style={styles.uploadButtonText}>Upload DXF File</Text>
              <Text style={styles.uploadHint}>Select a .dxf CAD drawing</Text>
            </>
          )}
        </TouchableOpacity>
      </Animated.View>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Powered by Gemma 3 AI • Trimesh • ARCore</Text>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bgDark,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  logoSection: {
    marginTop: spacing.xl,
    marginBottom: spacing.md,
  },
  logoContainer: {
    width: 80,
    height: 80,
    borderRadius: 24,
    backgroundColor: 'rgba(123, 47, 247, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(123, 47, 247, 0.3)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  logoIcon: {
    fontSize: 40,
  },
  titleSection: {
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  appTitle: {
    fontSize: 32,
    fontWeight: '800',
    color: colors.textPrimary,
    letterSpacing: -0.5,
  },
  appSubtitle: {
    fontSize: 14,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: spacing.xs,
    lineHeight: 20,
  },
  statusContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: borderRadius.full,
    borderWidth: 1,
    borderColor: colors.borderLight,
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  statusDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  statusText: {
    fontSize: 13,
    color: colors.textSecondary,
    fontWeight: '600',
  },
  retryButton: {
    marginLeft: spacing.xs,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
    borderRadius: borderRadius.sm,
    backgroundColor: 'rgba(123, 47, 247, 0.2)',
  },
  retryText: {
    fontSize: 11,
    color: colors.primaryLight,
    fontWeight: '700',
  },
  pipelineSection: {
    width: '100%',
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textMuted,
    letterSpacing: 2,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  pipelineGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: spacing.sm,
  },
  pipelineItem: {
    width: 95,
    alignItems: 'center',
    backgroundColor: colors.bgCard,
    borderRadius: borderRadius.md,
    borderWidth: 1,
    borderColor: colors.borderLight,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.xs,
    position: 'relative',
  },
  pipelineItemIcon: {
    fontSize: 22,
    marginBottom: 4,
  },
  pipelineItemLabel: {
    fontSize: 11,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  pipelineItemDesc: {
    fontSize: 9,
    color: colors.textMuted,
    marginTop: 2,
  },
  pipelineArrow: {
    position: 'absolute',
    right: -12,
    top: '42%',
    fontSize: 14,
    color: colors.textMuted,
  },
  buttonSection: {
    width: '100%',
    paddingHorizontal: spacing.md,
  },
  uploadButton: {
    width: '100%',
    paddingVertical: spacing.lg,
    borderRadius: borderRadius.xl,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.primary,
    ...shadows.glow,
  },
  uploadButtonDisabled: {
    backgroundColor: 'rgba(123, 47, 247, 0.5)',
  },
  uploadingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  uploadIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  uploadButtonText: {
    fontSize: 18,
    fontWeight: '800',
    color: '#ffffff',
    letterSpacing: 0.5,
  },
  uploadHint: {
    fontSize: 12,
    color: 'rgba(255, 255, 255, 0.6)',
    marginTop: 4,
  },
  footer: {
    position: 'absolute',
    bottom: spacing.lg,
  },
  footerText: {
    fontSize: 11,
    color: colors.textMuted,
  },
});
