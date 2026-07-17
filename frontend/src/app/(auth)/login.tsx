import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../../components/Layout';
import { Colors, Spacing, Border, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';

export default function LoginScreen() {
  const { login, isLoading, error, clearError } = useAuthStore();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formError, setFormError] = useState('');

  const handleLogin = async () => {
    if (!email || !password) {
      setFormError('Vui lòng nhập đầy đủ email và mật khẩu');
      return;
    }
    
    // Simple Email validation
    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setFormError('Email không đúng định dạng');
      return;
    }

    setFormError('');
    clearError();

    try {
      await login({ email, password });
      
      // Load user store state to fetch role
      const user = useAuthStore.getState().user;
      if (user) {
        if (user.role === 'admin') {
          router.replace('/admin/dashboard');
        } else if (user.role === 'landlord') {
          router.replace('/landlord/dashboard');
        } else {
          router.replace('/tenant/dashboard');
        }
      }
    } catch (err: any) {
      // Error handled by store
    }
  };

  return (
    <Layout>
      <View style={styles.container}>
        <View style={[styles.card, Shadows.md]}>
          <Text style={styles.title}>Đăng nhập RoomHub</Text>
          <Text style={styles.subtitle}>Chào mừng bạn quay trở lại!</Text>

          {/* Error Message */}
          {(formError || error) ? (
            <View style={styles.errorBox}>
              <Ionicons name="alert-circle-outline" size={20} color={Colors.danger} />
              <Text style={styles.errorText}>{formError || error}</Text>
            </View>
          ) : null}

          {/* Form */}
          <View style={styles.form}>
            <View style={styles.inputGroup}>
              <Text style={styles.label}>Địa chỉ Email</Text>
              <View style={styles.inputWrapper}>
                <Ionicons name="mail-outline" size={18} color="#94a3b8" />
                <TextInput
                  placeholder="name@example.com"
                  value={email}
                  onChangeText={(val) => { setEmail(val); setFormError(''); }}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  style={styles.input}
                />
              </View>
            </View>

            <View style={styles.inputGroup}>
              <View style={styles.labelRow}>
                <Text style={styles.label}>Mật khẩu</Text>
                <Link href="/forgot-password" asChild>
                  <Pressable><Text style={styles.forgotLink}>Quên mật khẩu?</Text></Pressable>
                </Link>
              </View>
              <View style={styles.inputWrapper}>
                <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                <TextInput
                  placeholder="••••••••"
                  value={password}
                  onChangeText={(val) => { setPassword(val); setFormError(''); }}
                  secureTextEntry={!showPassword}
                  autoCapitalize="none"
                  style={styles.input}
                />
                <Pressable onPress={() => setShowPassword(!showPassword)}>
                  <Ionicons
                    name={showPassword ? 'eye-off-outline' : 'eye-outline'}
                    size={18}
                    color="#94a3b8"
                  />
                </Pressable>
              </View>
            </View>

            {/* Remember Me */}
            <Pressable
              onPress={() => setRememberMe(!rememberMe)}
              style={styles.rememberRow}>
              <Ionicons
                name={rememberMe ? 'checkbox' : 'square-outline'}
                size={20}
                color={rememberMe ? Colors.primary : '#94a3b8'}
              />
              <Text style={styles.rememberText}>Ghi nhớ đăng nhập</Text>
            </Pressable>

            {/* Login button */}
            <Pressable onPress={handleLogin} disabled={isLoading} style={styles.loginBtn}>
              {isLoading ? (
                <ActivityIndicator size="small" color="white" />
              ) : (
                <Text style={styles.loginBtnText}>Đăng nhập</Text>
              )}
            </Pressable>

            <View style={styles.registerRow}>
              <Text style={styles.registerLabel}>Chưa có tài khoản?</Text>
              <Link href="/register" asChild>
                <Pressable><Text style={styles.registerLink}>Đăng ký ngay</Text></Pressable>
              </Link>
            </View>
          </View>
        </View>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    padding: Spacing.xxl,
    borderRadius: Border.radius.lg,
    width: '100%',
    maxWidth: 400,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  title: {
    fontSize: 24,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    padding: Spacing.md,
    borderRadius: Border.radius.md,
    gap: Spacing.xs,
    marginBottom: Spacing.md,
  },
  errorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '500',
    flex: 1,
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: 6,
  },
  labelRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
  },
  forgotLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '500',
  },
  inputWrapper: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Border.radius.md,
    paddingHorizontal: Spacing.sm,
    height: 42,
    gap: Spacing.xs,
    backgroundColor: '#f8fafc',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    outlineStyle: 'none',
  } as any,
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rememberText: {
    fontSize: 13,
    color: '#475569',
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: Border.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  loginBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  registerRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  registerLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  registerLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
