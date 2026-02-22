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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.logoText}>TEAMZONEVN</Text>
            <Text style={styles.tagline}>{STRINGS.TAGLINE}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>{STRINGS.REGISTER_TITLE}</Text>

            <Input
              label={STRINGS.USERNAME_LABEL}
              placeholder={STRINGS.USERNAME_PLACEHOLDER}
              value={username}
              onChangeText={(text) => { setUsername(text); setErrors({ ...errors, username: '' }); }}
              autoCapitalize="none"
              error={errors.username}
            />

            <Input
              label={STRINGS.EMAIL_LABEL}
              placeholder={STRINGS.EMAIL_PLACEHOLDER}
              value={email}
              onChangeText={(text) => { setEmail(text); setErrors({ ...errors, email: '' }); }}
              keyboardType="email-address"
              autoCapitalize="none"
              error={errors.email}
            />

            <Input
              label={STRINGS.PASSWORD_LABEL}
              placeholder={STRINGS.PASSWORD_MIN_HINT}
              value={password}
              onChangeText={(text) => { setPassword(text); setErrors({ ...errors, password: '' }); }}
              secureTextEntry
              error={errors.password}
            />

            <Input
              label={STRINGS.CONFIRM_PASSWORD_LABEL}
              placeholder={STRINGS.CONFIRM_PASSWORD_PLACEHOLDER}
              value={confirmPassword}
              onChangeText={(text) => { setConfirmPassword(text); setErrors({ ...errors, confirmPassword: '' }); }}
              secureTextEntry
              error={errors.confirmPassword}
            />

            <Button
              title={STRINGS.REGISTER_BUTTON}
              onPress={handleRegister}
              loading={loading}
              style={styles.registerButton}
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{STRINGS.HAVE_ACCOUNT}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Login')}>
                <Text style={styles.signInText}>{STRINGS.LOGIN_TITLE}</Text>
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
  header: {
    alignItems: 'center',
    marginBottom: 32,
  },
  logoText: {
    fontSize: 36,
    fontWeight: '900',
    color: theme.colors.text,
    letterSpacing: 6,
    textTransform: 'uppercase',
  },
  tagline: {
    fontSize: 11,
    color: '#F59E0B',
    textTransform: 'uppercase',
    letterSpacing: 3,
    marginTop: 6,
    fontWeight: '700',
  },
  form: {
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
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  registerButton: {
    marginTop: theme.spacing.md,
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
  signInText: {
    color: theme.colors.primary,
    fontWeight: '700',
    fontSize: 14,
  },
});
