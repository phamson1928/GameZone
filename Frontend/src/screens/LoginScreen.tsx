import React, { useState } from 'react';
import { 
  StyleSheet, 
  Text, 
  View, 
  TouchableOpacity, 
  KeyboardAvoidingView, 
  Platform,
  ScrollView,
  Alert
} from 'react-native';
import { Container } from '../components/Container';
import { Input } from '../components/Input';
import { Button } from '../components/Button';
import { theme } from '../theme';
import { apiClient } from '../api/client';
import { useAuthStore } from '../store/useAuthStore';
import { STRINGS } from '../constants/strings';

export const LoginScreen = ({ navigation }: any) => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const setAuth = useAuthStore((state) => state.setAuth);

  const handleLogin = async () => {
    if (!email || !password) {
      Alert.alert(STRINGS.ERROR_TITLE, STRINGS.REQUIRED_FIELD);
      return;
    }

    setLoading(true);
    try {
      const response = await apiClient.post('/auth/login', {
        email,
        password,
      });

      const { data } = response.data;
      const { userId, username, tokens } = data;
      
      const userResponse = await apiClient.get('/users/me', {
        headers: { Authorization: `Bearer ${tokens.accessToken}` }
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
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.header}>
            <Text style={styles.logoText}>GAMEZONE</Text>
            <Text style={styles.tagline}>{STRINGS.TAGLINE}</Text>
          </View>

          <View style={styles.form}>
            <Text style={styles.title}>{STRINGS.LOGIN_TITLE}</Text>
            
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
            />

            <View style={styles.footer}>
              <Text style={styles.footerText}>{STRINGS.NO_ACCOUNT}</Text>
              <TouchableOpacity onPress={() => navigation.navigate('Register')}>
                <Text style={styles.signUpText}>{STRINGS.REGISTER_TITLE}</Text>
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
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 50,
  },
  logoText: {
    fontSize: 40,
    fontWeight: 'bold',
    color: theme.colors.primary,
    letterSpacing: 4,
    textShadowColor: theme.colors.primary,
    textShadowOffset: { width: 0, height: 0 },
    textShadowRadius: 10,
  },
  tagline: {
    fontSize: 14,
    color: theme.colors.accent,
    textTransform: 'uppercase',
    letterSpacing: 2,
    marginTop: 5,
  },
  form: {
    backgroundColor: theme.colors.surface,
    padding: theme.spacing.lg,
    borderRadius: theme.borderRadius.lg,
    borderWidth: 1,
    borderColor: theme.colors.border,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
    color: theme.colors.text,
    marginBottom: theme.spacing.lg,
  },
  forgotPassword: {
    alignSelf: 'flex-end',
    marginBottom: theme.spacing.lg,
  },
  forgotPasswordText: {
    color: theme.colors.textSecondary,
    fontSize: 12,
  },
  loginButton: {
    marginTop: theme.spacing.md,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: theme.spacing.xl,
  },
  footerText: {
    color: theme.colors.textSecondary,
  },
  signUpText: {
    color: theme.colors.accent,
    fontWeight: 'bold',
  },
});
