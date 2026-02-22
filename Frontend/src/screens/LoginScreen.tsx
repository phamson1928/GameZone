import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { NativeStackScreenProps } from '@react-navigation/native-stack';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import { LinearGradient } from 'expo-linear-gradient';
import { Gamepad2, Zap } from 'lucide-react-native';
import { Svg, Path, G } from 'react-native-svg';
import { Container } from '../components/Container';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { STRINGS } from '../constants/strings';
import { RootStackParamList } from '../navigation';

WebBrowser.maybeCompleteAuthSession();

// Simple Google Icon SVG
const GoogleIcon = () => (
  <Svg width={20} height={20} viewBox="0 0 24 24">
    <G>
      <Path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <Path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <Path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
        fill="#FBBC05"
      />
      <Path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </G>
  </Svg>
);

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: Props) => {
  console.log('LoginScreen: Rendering...');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(state => state.setAuth);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '946383947788-mc938c7idvv3opb987p0fr1cbug97qs1.apps.googleusercontent.com',
    androidClientId: '946383947788-n388v43pc27qrafm49ltkao1er3h770n.apps.googleusercontent.com',
  });





  // Cleanup: Removed Google Redirect URI logging


  useEffect(() => {
    const handleGoogleLogin = async (idToken: string) => {
      setLoading(true);
      try {
        const googleResponse = await apiClient.post('/auth/google', { idToken });
        const { data } = googleResponse.data;
        const { tokens } = data;

        const userResponse = await apiClient.get('/users/me', {
          headers: { Authorization: `Bearer ${tokens.accessToken}` },
        });

        setAuth(userResponse.data.data, tokens.accessToken, tokens.refreshToken);
      } catch (error: any) {
        const message = error.response?.data?.message || STRINGS.LOGIN_FAILED;
        Alert.alert(STRINGS.LOGIN_FAILED, Array.isArray(message) ? message[0] : message);
      } finally {
        setLoading(false);
      }
    };

    if (response?.type === 'success') {
      const idToken = response.authentication?.idToken;
      if (idToken) handleGoogleLogin(idToken);
    }
  }, [response, setAuth]);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(STRINGS.ERROR_TITLE, STRINGS.REQUIRED_FIELD);
      return;
    }

    setLoading(true);
    try {
      const loginResponse = await apiClient.post('/auth/login', { email, password });
      const { data } = loginResponse.data;
      const { tokens } = data;

      const userResponse = await apiClient.get('/users/me', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });

      setAuth(userResponse.data.data, tokens.accessToken, tokens.refreshToken);
    } catch (error: any) {
      const message = error.response?.data?.message || STRINGS.LOGIN_FAILED;
      Alert.alert(STRINGS.LOGIN_FAILED, Array.isArray(message) ? message[0] : message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Container>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={{ flex: 1 }}
      >
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Hero Section */}
          <View style={styles.hero}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#2563FF', '#7C3AED']}
                style={styles.logoIconBg}
              >
                <Gamepad2 size={28} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.logoText}>TeamZoneVN</Text>
            <View style={styles.taglineRow}>
              <Text style={styles.tagline}>TÌM BẠN - CHIẾN GAME</Text>
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            <Text style={styles.title}>{STRINGS.LOGIN_TITLE}</Text>
            <Text style={styles.subtitle}>Chào mừng trở lại, gamer</Text>

            <Input
              label={STRINGS.EMAIL_LABEL}
              placeholder={STRINGS.EMAIL_PLACEHOLDER}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
              style={styles.input}
            />

            <Input
              label={STRINGS.PASSWORD_LABEL}
              placeholder={STRINGS.PASSWORD_PLACEHOLDER}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
              style={styles.input}
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>{STRINGS.FORGOT_PASSWORD}</Text>
            </TouchableOpacity>

            <Button
              title={STRINGS.LOGIN_BUTTON}
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
              size="md"
            />

            <View style={styles.divider}>
              <View style={styles.dividerLine} />
              <Text style={styles.dividerText}>HOẶC</Text>
              <View style={styles.dividerLine} />
            </View>

            <Button
              title={STRINGS.GOOGLE_LOGIN_BUTTON}
              onPress={() => promptAsync()}
              disabled={!request}
              variant="outline"
              icon={<GoogleIcon />}
              style={styles.googleButton}
              size="md"
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{STRINGS.NO_ACCOUNT}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signUpText}> {STRINGS.REGISTER_TITLE}</Text>
              </TouchableOpacity>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Container>
  );
};

const styles = StyleSheet.create({
  scrollContent: {
    flexGrow: 1,
    padding: 24,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoContainer: {
    marginBottom: 12,
  },
  logoIconBg: {
    width: 60,
    height: 60,
    borderRadius: 18,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 28,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 1,
    marginBottom: 4,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  tagline: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 2,
    fontWeight: '600',
  },
  formCard: {
    backgroundColor: 'rgba(30, 41, 59, 0.7)',
    padding: 24,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.05)',
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: theme.colors.text,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: 24,
  },
  input: {
    marginBottom: 16,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: 20,
    marginTop: -8,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: 13,
    fontWeight: '500',
  },
  loginButton: {
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: 20,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.05)',
  },
  dividerText: {
    marginHorizontal: 12,
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '600',
  },
  googleButton: {
    marginTop: 0,
    backgroundColor: 'rgba(255,255,255,0.03)',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: 24,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  signUpText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});

