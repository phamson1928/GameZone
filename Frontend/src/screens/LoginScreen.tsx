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
import { Container } from '../components/Container';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { STRINGS } from '../constants/strings';
import { RootStackParamList } from '../navigation';

WebBrowser.maybeCompleteAuthSession();

type Props = NativeStackScreenProps<RootStackParamList, 'Login'>;

export const LoginScreen = ({ navigation }: Props) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore(state => state.setAuth);

  const [request, response, promptAsync] = Google.useAuthRequest({
    webClientId: '946383947788-mc938c7idvv3opb987p0fr1cbug97qs1.apps.googleusercontent.com',
    androidClientId: '946383947788-n388v43pc27qrafm49ltkao1er3h770n.apps.googleusercontent.com',
  });

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
                <Gamepad2 size={36} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.logoText}>TEAMZONEVN</Text>
            <View style={styles.taglineRow}>
              <Zap size={12} color="#F59E0B" fill="#F59E0B" />
              <Text style={styles.tagline}>FIND. PLAY. WIN.</Text>
              <Zap size={12} color="#F59E0B" fill="#F59E0B" />
            </View>
          </View>

          {/* Form Card */}
          <View style={styles.formCard}>
            {/* Thin gradient top border */}
            <LinearGradient
              colors={['#2563FF', '#7C3AED']}
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 0 }}
              style={styles.formTopBorder}
            />

            <Text style={styles.title}>{STRINGS.LOGIN_TITLE}</Text>
            <Text style={styles.subtitle}>Chào mừng trở lại, gamer 👋</Text>

            <Input
              label={STRINGS.EMAIL_LABEL}
              placeholder={STRINGS.EMAIL_PLACEHOLDER}
              value={email}
              onChangeText={setEmail}
              keyboardType="email-address"
              autoCapitalize="none"
            />

            <Input
              label={STRINGS.PASSWORD_LABEL}
              placeholder={STRINGS.PASSWORD_PLACEHOLDER}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />

            <TouchableOpacity style={styles.forgotPassword}>
              <Text style={styles.forgotPasswordText}>{STRINGS.FORGOT_PASSWORD}</Text>
            </TouchableOpacity>

            <Button
              title={STRINGS.LOGIN_BUTTON}
              onPress={handleLogin}
              loading={loading}
              style={styles.loginButton}
              size="lg"
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
              style={styles.googleButton}
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
    padding: theme.spacing.lg,
    justifyContent: 'center',
  },
  hero: {
    alignItems: 'center',
    marginBottom: 36,
  },
  logoContainer: {
    marginBottom: 16,
    shadowColor: '#2563FF',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  },
  logoIconBg: {
    width: 80,
    height: 80,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: 6,
    textTransform: 'uppercase',
    marginBottom: 8,
  },
  taglineRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  tagline: {
    fontSize: 11,
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 3,
    fontWeight: '700',
  },
  formCard: {
    backgroundColor: '#1E293B',
    padding: theme.spacing.lg,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.07)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.3,
    shadowRadius: 20,
    elevation: 8,
    overflow: 'hidden',
  },
  formTopBorder: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 2,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: 4,
    marginTop: 8,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  subtitle: {
    fontSize: 14,
    color: theme.colors.textMuted,
    marginBottom: theme.spacing.md,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.md,
    marginTop: -4,
  },
  forgotPasswordText: {
    color: theme.colors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  loginButton: {
    marginTop: 4,
  },
  divider: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: theme.spacing.lg,
  },
  dividerLine: {
    flex: 1,
    height: 1,
    backgroundColor: 'rgba(255,255,255,0.07)',
  },
  dividerText: {
    marginHorizontal: theme.spacing.md,
    color: theme.colors.textMuted,
    fontSize: 11,
    fontWeight: '700',
    letterSpacing: 1,
  },
  googleButton: {
    marginTop: 0,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.lg,
  },
  footerText: {
    color: theme.colors.textMuted,
    fontSize: 14,
  },
  signUpText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
