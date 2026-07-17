import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../../components/Layout';
import { Colors, Spacing, Border, Shadows } from '../../constants/theme';
import api from '../../services/api';

export default function ResetPasswordScreen() {
  const { token } = useLocalSearchParams();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  const handleResetPassword = async () => {
    if (!token) {
      setError('Token không hợp lệ hoặc đã hết hạn.');
      return;
    }

    if (!password || !confirmPassword) {
      setError('Vui lòng nhập mật khẩu mới và xác nhận mật khẩu');
      return;
    }

    if (password.length < 6) {
      setError('Mật khẩu mới phải từ 6 ký tự trở lên');
      return;
    }

    if (password !== confirmPassword) {
      setError('Mật khẩu xác nhận không khớp');
      return;
    }

    setLoading(true);
    setError('');
    setSuccess('');

    try {
      const res = await api.post('/auth/reset-password', {
        token: String(token),
        password,
        confirmPassword,
      });

      setSuccess(res.data.message || 'Mật khẩu của bạn đã được cập nhật thành công.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Không thể đặt lại mật khẩu. Có thể liên kết đã hết hạn.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <View style={styles.container}>
        <View style={[styles.card, Shadows.md]}>
          <Text style={styles.title}>Đặt lại mật khẩu</Text>
          <Text style={styles.subtitle}>Nhập mật khẩu mới cho tài khoản của bạn</Text>

          {success ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle-outline" size={48} color={Colors.success} />
              <Text style={styles.successText}>{success}</Text>
              <Link href="/login" asChild>
                <Pressable style={styles.loginBtn}>
                  <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            <View style={styles.form}>
              {error ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={20} color={Colors.danger} />
                  <Text style={styles.errorText}>{error}</Text>
                </View>
              ) : null}

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mật khẩu mới *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                  <TextInput
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChangeText={(val) => { setPassword(val); setError(''); }}
                    secureTextEntry
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
              </View>

              <View style={styles.inputGroup}>
                <Text style={styles.label}>Xác nhận mật khẩu mới *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                  <TextInput
                    placeholder="Nhập lại mật khẩu mới"
                    value={confirmPassword}
                    onChangeText={(val) => { setConfirmPassword(val); setError(''); }}
                    secureTextEntry
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
              </View>

              <Pressable onPress={handleResetPassword} disabled={loading} style={styles.submitBtn}>
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitBtnText}>Đặt lại mật khẩu</Text>
                )}
              </Pressable>
            </View>
          )}
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
    fontSize: 22,
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
  successBox: {
    alignItems: 'center',
    gap: Spacing.md,
  },
  successText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
  },
  loginBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Border.radius.md,
    width: '100%',
    alignItems: 'center',
    marginTop: Spacing.md,
  },
  loginBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  form: {
    gap: Spacing.lg,
  },
  inputGroup: {
    gap: 6,
  },
  label: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
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
  submitBtn: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: Border.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
});
