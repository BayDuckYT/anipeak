import React, { useState } from 'react';
import { View, Text, StyleSheet, TextInput, TouchableOpacity, KeyboardAvoidingView, Platform, ImageBackground } from 'react-native';
import { theme } from '../../constants/theme';
import { useAuth } from '../../context/AuthContext';
import { Shield, Mail, Lock, ArrowRight } from 'lucide-react-native';

export default function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const { signIn } = useAuth();
  const [loading, setLoading] = useState(false);

  const handleLogin = async () => {
    if (!email || !password) return;
    setLoading(true);
    try {
      await signIn(email, password);
    } catch (error) {
      alert('Siber Erişim Reddedildi: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <KeyboardAvoidingView 
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      style={styles.container}
    >
      <View style={styles.overlay}>
        <View style={styles.header}>
          <View style={styles.logoContainer}>
            <Shield size={48} color={theme.colors.primary} />
          </View>
          <Text style={styles.title}>ANIPEAK</Text>
          <Text style={styles.subtitle}>Siber Manga İmparatorluğu</Text>
        </View>

        <View style={styles.form}>
          <View style={styles.inputGroup}>
            <Mail size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="E-posta"
              placeholderTextColor={theme.colors.textMuted}
              value={email}
              onChangeText={setEmail}
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Lock size={20} color={theme.colors.textMuted} style={styles.inputIcon} />
            <TextInput
              style={styles.input}
              placeholder="Şifre"
              placeholderTextColor={theme.colors.textMuted}
              value={password}
              onChangeText={setPassword}
              secureTextEntry
            />
          </View>

          <TouchableOpacity 
            style={[styles.loginButton, loading && { opacity: 0.7 }]} 
            onPress={handleLogin}
            disabled={loading}
          >
            <Text style={styles.loginButtonText}>{loading ? 'SİBER ERİŞİM...' : 'GİRİŞ YAP'}</Text>
            <ArrowRight size={20} color="#fff" />
          </TouchableOpacity>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: theme.colors.background,
  },
  overlay: {
    flex: 1,
    padding: theme.spacing.xl,
    justifyContent: 'center',
  },
  header: {
    alignItems: 'center',
    marginBottom: 40,
  },
  logoContainer: {
    width: 100,
    height: 100,
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    borderRadius: 50,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
    borderWidth: 1,
    borderColor: 'rgba(239, 68, 68, 0.3)',
  },
  title: {
    color: theme.colors.text,
    fontSize: 32,
    fontWeight: '900',
    letterSpacing: 2,
  },
  subtitle: {
    color: theme.colors.primary,
    fontSize: 14,
    fontWeight: '600',
    marginTop: 4,
    opacity: 0.8,
  },
  form: {
    marginTop: 20,
  },
  inputGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: theme.colors.surface,
    borderRadius: theme.roundness.md,
    marginBottom: 16,
    paddingHorizontal: 16,
    height: 56,
    borderWidth: 1,
    borderColor: theme.colors.border,
  },
  inputIcon: {
    marginRight: 12,
  },
  input: {
    flex: 1,
    color: theme.colors.text,
    fontSize: 16,
  },
  loginButton: {
    backgroundColor: theme.colors.primary,
    height: 56,
    borderRadius: theme.roundness.md,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 24,
    shadowColor: theme.colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  loginButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
    marginRight: 8,
  }
});
