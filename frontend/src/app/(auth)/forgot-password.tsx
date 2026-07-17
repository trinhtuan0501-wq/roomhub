import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../../components/Layout';
import { Colors, Spacing, Border, Shadows } from '../../constants/theme';
import api from '../../services/api';

export default function ForgotPasswordScreen() {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [error, setError] = useState('');

  const handleForgotPassword = async () => {
    if (!email) {
      setError('Vui lòng nhập địa chỉ email');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setError('Email không đúng định dạng');
      return;
    }

    setLoading(true);
    setError('');
    setSuccessMessage('');

    try {
      const res = await api.post('/auth/forgot-password', { email });
      setSuccessMessage(res.data.message || 'Yêu cầu gửi thành công. Vui lòng kiểm tra hộp thư.');
    } catch (err: any) {
      setError(err.response?.data?.message || 'Đã xảy ra lỗi. Vui lòng thử lại sau.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Layout>
      <View style={styles.container}>
        <View style={[styles.card, Shadows.md]}>
          <Text style={styles.title}>Quên mật khẩu</Text>
          <Text style={styles.subtitle}>Nhập email của bạn để nhận liên kết đặt lại mật khẩu</Text>

          {successMessage ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle-outline" size={48} color={Colors.success} />
              <Text style={styles.successText}>{successMessage}</Text>
              <Link href="/login" asChild>
                <Pressable style={styles.loginBtn}>
                  <Text style={styles.loginBtnText}>Quay lại đăng nhập</Text>
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
                <Text style={styles.label}>Địa chỉ Email</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="mail-outline" size={18} color="#94a3b8" />
                  <TextInput
                    placeholder="name@example.com"
                    value={email}
                    onChangeText={(val) => { setEmail(val); setError(''); }}
                    keyboardType="email-address"
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
              </View>

              <Pressable onPress={handleForgotPassword} disabled={loading} style={styles.submitBtn}>
                {loading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.submitBtnText}>Gửi liên kết đặt lại</Text>
                )}
              </Pressable>

              <View style={styles.loginRow}>
                <Link href="/login" asChild>
                  <Pressable style={styles.backBtn}>
                    <Ionicons name="arrow-back-outline" size={16} color={Colors.primary} />
                    <Text style={styles.backText}>Quay lại đăng nhập</Text>
                  </Pressable>
                </Link>
              </View>
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
  loginRow: {
    alignItems: 'center',
    marginTop: Spacing.xs,
  },
  backBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  backText: {
    color: Colors.primary,
    fontSize: 13,
    fontWeight: 'bold',
  },
});
