import React, { useState } from 'react';
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
import { LinearGradient } from 'expo-linear-gradient';
import { Gamepad2 } from 'lucide-react-native';
import { Container } from '../components/Container';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';

import { STRINGS } from '../constants/strings';

export const RegisterScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errors, setErrors] = useState<{ [key: string]: string }>({});
  const setAuth = useAuthStore(state => state.setAuth);

  const validate = () => {
    const newErrors: { [key: string]: string } = {};

    if (!username) newErrors.username = STRINGS.REQUIRED_FIELD;
    if (!email) newErrors.email = STRINGS.REQUIRED_FIELD;
    else if (!/\S+@\S+\.\S+/.test(email)) newErrors.email = STRINGS.INVALID_EMAIL;

    if (!password) newErrors.password = STRINGS.REQUIRED_FIELD;
    else if (password.length < 6) newErrors.password = STRINGS.SHORT_PASSWORD;

    if (password !== confirmPassword) newErrors.confirmPassword = STRINGS.PASSWORD_MISMATCH;

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleRegister = async () => {
    if (!validate()) return;

    setLoading(true);
    setErrors({});

    try {
      const response = await apiClient.post('/auth/register', {
        email,
        username,
        password,
      });

      const { data } = response.data;
      const { tokens } = data;

      const userResponse = await apiClient.get('/users/me', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` },
      });

      setAuth(userResponse.data.data, tokens.accessToken, tokens.refreshToken);
    } catch (error: any) {
      console.log('Registration Error Details:', error.response?.data);
      const message = error.response?.data?.message;

      if (Array.isArray(message)) {
        const backendErrors: { [key: string]: string } = {};
        message.forEach((msg: string) => {
          if (msg.toLowerCase().includes('email')) backendErrors.email = msg;
          else if (msg.toLowerCase().includes('username')) backendErrors.username = msg;
          else if (msg.toLowerCase().includes('password')) backendErrors.password = msg;
        });

        if (Object.keys(backendErrors).length > 0) {
          setErrors(backendErrors);
        } else {
          Alert.alert(STRINGS.REGISTRATION_FAILED, message[0]);
        }
      } else {
        Alert.alert(STRINGS.REGISTRATION_FAILED, message || STRINGS.ERROR_TITLE);
      }
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
          <View style={styles.header}>
            <View style={styles.logoContainer}>
              <LinearGradient
                colors={['#2563FF', '#7C3AED']}
                style={styles.logoIconBg}
              >
                <Gamepad2 size={24} color="#FFFFFF" />
              </LinearGradient>
            </View>
            <Text style={styles.logoText}>TeamZoneVN</Text>
            <Text style={styles.tagline}>MỜI BẠN - CHIẾN GAME</Text>
          </View>

          <View style={styles.formCard}>
            <Text style={styles.title}>{STRINGS.REGISTER_TITLE}</Text>
            <Text style={styles.subtitle}>Tạo tài khoản mới để bắt đầu ngay</Text>

            <Input
              label={STRINGS.USERNAME_LABEL}
              placeholder={STRINGS.USERNAME_PLACEHOLDER}
              value={username}
              onChangeText={(text) => { setUsername(text); setErrors({ ...errors, username: '' }); }}
              autoCapitalize="none"
              error={errors.username}
              style={styles.input}
            />

            <Input
              label={STRINGS.EMAIL_LABEL}
              placeholder={STRINGS.EMAIL_PLACEHOLDER}
              value={email}
              onChangeText={(text) => { setEmail(text); setErrors({ ...errors, email: '' }); }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
              style={styles.input}
            />

            <Input
              label={STRINGS.PASSWORD_LABEL}
              placeholder={STRINGS.PASSWORD_MIN_HINT}
              value={password}
              onChangeText={(text) => { setPassword(text); setErrors({ ...errors, password: '' }); }}
              secureTextEntry
              error={errors.password}
              style={styles.input}
            />

            <Input
              label={STRINGS.CONFIRM_PASSWORD_LABEL}
              placeholder={STRINGS.CONFIRM_PASSWORD_PLACEHOLDER}
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); setErrors({ ...errors, confirmPassword: '' }); }}
              secureTextEntry
              error={errors.confirmPassword}
              style={styles.input}
            />

            <Button
              title={STRINGS.REGISTER_BUTTON}
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
              size="md"
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{STRINGS.HAVE_ACCOUNT}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signInText}> {STRINGS.LOGIN_TITLE}</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 28,
  },
  logoContainer: {
    marginBottom: 8,
  },
  logoIconBg: {
    width: 50,
    height: 50,
    borderRadius: 16,
    justifyContent: 'center',
    alignItems: 'center',
  },
  logoText: {
    fontSize: 24,
    fontWeight: '800',
    color: theme.colors.text,
    letterSpacing: 1,
  },
  tagline: {
    fontSize: 10,
    color: '#94A3B8',
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 4,
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
    marginBottom: 20,
  },
  input: {
    marginBottom: 4, // Input component already has marginVertical
  },
  registerButton: {
    marginTop: 12,
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
  signInText: {
    color: theme.colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});

