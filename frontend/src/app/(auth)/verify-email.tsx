import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { useLocalSearchParams, Link } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../../components/Layout';
import { Colors, Spacing, Border, Shadows } from '../../constants/theme';
import api from '../../services/api';

export default function VerifyEmailScreen() {
  const { token } = useLocalSearchParams();

  const [verifying, setVerifying] = useState(true);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Resend State
  const [resendEmail, setResendEmail] = useState('');
  const [resendLoading, setResendLoading] = useState(false);
  const [resendSuccess, setResendSuccess] = useState('');
  const [resendError, setResendError] = useState('');

  const triggerVerification = async () => {
    if (!token) {
      setErrorMessage('Token xác thực không hợp lệ hoặc bị thiếu.');
      setVerifying(false);
      return;
    }

    setVerifying(true);
    setErrorMessage('');

    try {
      await api.post('/auth/verify-email', { token: String(token) });
      setSuccess(true);
    } catch (err: any) {
      setErrorMessage(
        err.response?.data?.message || 'Token xác thực đã hết hạn hoặc không tồn tại.'
      );
    } finally {
      setVerifying(false);
    }
  };

  useEffect(() => {
    if (token) {
      triggerVerification();
    } else {
      setVerifying(false);
    }
  }, [token]);

  const handleResend = async () => {
    if (!resendEmail) {
      setResendError('Vui lòng nhập địa chỉ email để gửi lại');
      return;
    }

    setResendLoading(true);
    setResendError('');
    setResendSuccess('');

    try {
      const res = await api.post('/auth/resend-verification', { email: resendEmail });
      setResendSuccess(res.data.message || 'Đã gửi lại email xác thực thành công!');
    } catch (err: any) {
      setResendError(err.response?.data?.message || 'Không thể gửi lại. Vui lòng kiểm tra lại email.');
    } finally {
      setResendLoading(false);
    }
  };

  return (
    <Layout>
      <View style={styles.container}>
        <View style={[styles.card, Shadows.md]}>
          <Text style={styles.title}>Xác thực Email</Text>

          {verifying ? (
            <View style={styles.loadingBox}>
              <ActivityIndicator size="large" color={Colors.primary} />
              <Text style={styles.infoText}>Đang tiến hành xác thực tài khoản của bạn...</Text>
            </View>
          ) : success ? (
            <View style={styles.messageBox}>
              <Ionicons name="checkmark-circle-outline" size={54} color={Colors.success} />
              <Text style={styles.successTitle}>Xác thực thành công!</Text>
              <Text style={styles.infoText}>
                Email của bạn đã được xác minh. Bây giờ bạn có thể trải nghiệm đầy đủ tất cả các tính năng của RoomHub.
              </Text>
              <Link href="/login" asChild>
                <Pressable style={styles.loginBtn}>
                  <Text style={styles.loginBtnText}>Đăng nhập ngay</Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            <View style={styles.messageBox}>
              <Ionicons name="alert-circle-outline" size={54} color={Colors.danger} />
              <Text style={styles.errorTitle}>Xác thực thất bại</Text>
              <Text style={styles.errorText}>{errorMessage || 'Liên kết xác thực đã hết hạn.'}</Text>
              
              <View style={styles.divider} />

              {/* Resend verification panel */}
              <View style={styles.resendPanel}>
                <Text style={styles.resendHeading}>Gửi lại email xác thực tài khoản</Text>
                
                {resendSuccess ? (
                  <Text style={styles.resendSuccessText}>{resendSuccess}</Text>
                ) : (
                  <View style={{ gap: Spacing.sm, width: '100%' }}>
                    {resendError ? <Text style={styles.resendErrorText}>{resendError}</Text> : null}
                    <TextInput
                      placeholder="Nhập email tài khoản của bạn"
                      value={resendEmail}
                      onChangeText={(val) => { setResendEmail(val); setResendError(''); }}
                      keyboardType="email-address"
                      autoCapitalize="none"
                      style={styles.inputBox}
                    />
                    <Pressable onPress={handleResend} disabled={resendLoading} style={styles.resendBtn}>
                      {resendLoading ? (
                        <ActivityIndicator size="small" color="white" />
                      ) : (
                        <Text style={styles.resendBtnText}>Gửi lại email</Text>
                      )}
                    </Pressable>
                  </View>
                )}
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
    marginBottom: Spacing.xl,
  },
  loadingBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 20,
    gap: Spacing.md,
  },
  messageBox: {
    alignItems: 'center',
    gap: Spacing.md,
    paddingVertical: 10,
  },
  successTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.success,
  },
  errorTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: Colors.danger,
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
    textAlign: 'center',
    lineHeight: 22,
  },
  errorText: {
    fontSize: 14,
    color: Colors.danger,
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
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    width: '100%',
    marginVertical: Spacing.sm,
  },
  resendPanel: {
    width: '100%',
    gap: Spacing.sm,
    alignItems: 'center',
  },
  resendHeading: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    alignSelf: 'flex-start',
  },
  inputBox: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Border.radius.md,
    paddingHorizontal: Spacing.sm,
    height: 38,
    fontSize: 13,
    color: '#0f172a',
    outlineStyle: 'none',
    width: '100%',
  } as any,
  resendBtn: {
    backgroundColor: Colors.primary,
    height: 38,
    borderRadius: Border.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    width: '100%',
  },
  resendBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  resendSuccessText: {
    color: Colors.success,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
  resendErrorText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '500',
    textAlign: 'center',
  },
});
