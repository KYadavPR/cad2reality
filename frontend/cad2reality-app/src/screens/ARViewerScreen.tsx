import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  SafeAreaView,
  StatusBar,
  ActivityIndicator,
  Linking,
  Alert,
} from 'react-native';
import { WebView } from 'react-native-webview';
import { colors, spacing, borderRadius } from '../theme';

interface ARViewerScreenProps {
  arUrl: string;
  onBack: () => void;
}

export default function ARViewerScreen({ arUrl, onBack }: ARViewerScreenProps) {
  const [isLoading, setIsLoading] = useState(true);

  const handleOpenInBrowser = () => {
    Linking.openURL(arUrl);
  };

  const handleWebViewMessage = (event: any) => {
    try {
      const data = JSON.parse(event.nativeEvent.data);
      if (data.type === 'launch_ar' && data.modelUrl) {
        // Construct Scene Viewer HTTPS URL and open it natively
        const sceneViewerUrl = `https://arvr.google.com/scene-viewer/1.0?file=${encodeURIComponent(data.modelUrl)}&mode=ar_preferred`;
        console.log('Opening Scene Viewer:', sceneViewerUrl);
        Linking.openURL(sceneViewerUrl).catch(err => {
          console.log('Scene Viewer open failed:', err);
          Alert.alert(
            'AR Not Available',
            'Could not launch AR viewer. Make sure Google Play Services for AR (ARCore) is installed on your device.',
            [{ text: 'OK' }]
          );
        });
      }
    } catch (e) {
      console.log('WebView message parse error:', e);
    }
  };

  return (
    <SafeAreaView style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor={colors.bgDark} />

      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={onBack} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <View style={styles.headerCenter}>
          <Text style={styles.headerTitle}>3D & AR Viewer</Text>
          <Text style={styles.headerSubtitle}>Rotate • Zoom • View in AR</Text>
        </View>
        <TouchableOpacity onPress={handleOpenInBrowser} style={styles.browserButton}>
          <Text style={styles.browserIcon}>🌐</Text>
        </TouchableOpacity>
      </View>

      {/* WebView with model-viewer */}
      <View style={styles.webViewContainer}>
        {isLoading && (
          <View style={styles.loadingOverlay}>
            <ActivityIndicator size="large" color={colors.primary} />
            <Text style={styles.loadingText}>Loading 3D Model...</Text>
          </View>
        )}
        <WebView
          source={{ uri: arUrl }}
          style={styles.webView}
          onLoadEnd={() => setIsLoading(false)}
          javaScriptEnabled={true}
          domStorageEnabled={true}
          allowsInlineMediaPlayback={true}
          mediaPlaybackRequiresUserAction={false}
          originWhitelist={['*']}
          mixedContentMode="always"
          onMessage={handleWebViewMessage}
          onShouldStartLoadWithRequest={(request) => {
            const url = request.url;
            // Intercept Android AR intents and open them externally (safety net)
            if (url.startsWith('intent://') || url.startsWith('intent:') || url.startsWith('arcore:')) {
              let targetUrl = url;
              if (url.includes('arvr.google.com/scene-viewer')) {
                const cleanUrl = url.replace(/^intent:\/\//, 'https://').split('#Intent;')[0];
                targetUrl = cleanUrl;
              }
              
              Linking.openURL(targetUrl).catch(err => {
                console.log('Error opening parsed AR intent, trying original:', err);
                Linking.openURL(url).catch(e => console.log('Error opening original AR intent:', e));
              });
              return false;
            }
            return true;
          }}
        />
      </View>

      {/* Bottom Actions */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={styles.openBrowserButton}
          onPress={handleOpenInBrowser}
          activeOpacity={0.8}
        >
          <Text style={styles.openBrowserIcon}>🔗</Text>
          <Text style={styles.openBrowserText}>Open in Browser for AR</Text>
        </TouchableOpacity>
        <Text style={styles.hint}>
          Tip: Open in Chrome on your phone for the best AR experience
        </Text>
      </View>
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
  browserButton: {
    width: 40,
    height: 40,
    borderRadius: borderRadius.md,
    backgroundColor: colors.bgCard,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  browserIcon: {
    fontSize: 18,
  },
  webViewContainer: {
    flex: 1,
    position: 'relative',
  },
  webView: {
    flex: 1,
    backgroundColor: colors.bgDark,
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: colors.bgDark,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  loadingText: {
    marginTop: spacing.md,
    fontSize: 14,
    color: colors.textSecondary,
  },
  bottomBar: {
    padding: spacing.md,
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    alignItems: 'center',
  },
  openBrowserButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    width: '100%',
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderRadius: borderRadius.lg,
    backgroundColor: colors.bgCard,
    borderWidth: 1,
    borderColor: colors.border,
    justifyContent: 'center',
  },
  openBrowserIcon: {
    fontSize: 18,
  },
  openBrowserText: {
    fontSize: 15,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  hint: {
    marginTop: spacing.sm,
    fontSize: 11,
    color: colors.textMuted,
    textAlign: 'center',
  },
});
