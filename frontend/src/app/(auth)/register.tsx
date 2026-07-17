import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, TextInput, ActivityIndicator } from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../../components/Layout';
import { Colors, Spacing, Border, Shadows } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';

export default function RegisterScreen() {
  const { register, isLoading, error, clearError } = useAuthStore();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<'tenant' | 'landlord'>('tenant');
  const [agreeTerms, setAgreeTerms] = useState(false);
  const [formError, setFormError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const handleRegister = async () => {
    if (!fullName || !email || !phone || !password || !confirmPassword) {
      setFormError('Vui lòng điền đầy đủ tất cả các thông tin');
      return;
    }

    const emailRegex = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;
    if (!emailRegex.test(email)) {
      setFormError('Email không đúng định dạng');
      return;
    }

    const phoneRegex = /^[0-9]{9,11}$/;
    if (!phoneRegex.test(phone)) {
      setFormError('Số điện thoại không hợp lệ (phải từ 9-11 số)');
      return;
    }

    if (password.length < 6) {
      setFormError('Mật khẩu phải từ 6 ký tự trở lên');
      return;
    }

    if (password !== confirmPassword) {
      setFormError('Mật khẩu xác nhận không trùng khớp');
      return;
    }

    if (!agreeTerms) {
      setFormError('Bạn cần đồng ý với điều khoản sử dụng của RoomHub');
      return;
    }

    setFormError('');
    clearError();

    try {
      const msg = await register({
        fullName,
        email,
        phone,
        password,
        confirmPassword,
        role,
      });
      setSuccessMessage(msg || 'Đăng ký thành công! Vui lòng xác thực tài khoản qua email của bạn.');
    } catch (err: any) {
      // Store sets error
    }
  };

  return (
    <Layout>
      <View style={styles.container}>
        <View style={[styles.card, Shadows.md]}>
          <Text style={styles.title}>Đăng ký RoomHub</Text>
          <Text style={styles.subtitle}>Tạo tài khoản mới và bắt đầu hành trình của bạn</Text>

          {successMessage ? (
            <View style={styles.successBox}>
              <Ionicons name="checkmark-circle-outline" size={48} color={Colors.success} />
              <Text style={styles.successTitle}>Đăng ký thành công!</Text>
              <Text style={styles.successText}>{successMessage}</Text>
              <Link href="/login" asChild>
                <Pressable style={styles.loginBtn}>
                  <Text style={styles.loginBtnText}>Đi tới đăng nhập</Text>
                </Pressable>
              </Link>
            </View>
          ) : (
            <View style={styles.form}>
              {/* Form errors */}
              {(formError || error) ? (
                <View style={styles.errorBox}>
                  <Ionicons name="alert-circle-outline" size={20} color={Colors.danger} />
                  <Text style={styles.errorText}>{formError || error}</Text>
                </View>
              ) : null}

              {/* Full Name */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Họ và tên *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="person-outline" size={18} color="#94a3b8" />
                  <TextInput
                    placeholder="Nguyễn Văn A"
                    value={fullName}
                    onChangeText={(val) => { setFullName(val); setFormError(''); }}
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Địa chỉ Email *</Text>
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

              {/* Phone */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Số điện thoại *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="call-outline" size={18} color="#94a3b8" />
                  <TextInput
                    placeholder="0912345678"
                    value={phone}
                    onChangeText={(val) => { setPhone(val); setFormError(''); }}
                    keyboardType="phone-pad"
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Mật khẩu *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                  <TextInput
                    placeholder="Tối thiểu 6 ký tự"
                    value={password}
                    onChangeText={(val) => { setPassword(val); setFormError(''); }}
                    secureTextEntry
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Confirm Password */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Xác nhận mật khẩu *</Text>
                <View style={styles.inputWrapper}>
                  <Ionicons name="lock-closed-outline" size={18} color="#94a3b8" />
                  <TextInput
                    placeholder="Nhập lại mật khẩu"
                    value={confirmPassword}
                    onChangeText={(val) => { setConfirmPassword(val); setFormError(''); }}
                    secureTextEntry
                    autoCapitalize="none"
                    style={styles.input}
                  />
                </View>
              </View>

              {/* Role Select */}
              <View style={styles.inputGroup}>
                <Text style={styles.label}>Vai trò tài khoản</Text>
                <View style={styles.roleGrid}>
                  <Pressable
                    onPress={() => setRole('tenant')}
                    style={[styles.roleCard, role === 'tenant' && styles.roleCardActive]}>
                    <Ionicons
                      name="people-outline"
                      size={20}
                      color={role === 'tenant' ? Colors.primary : '#475569'}
                    />
                    <Text style={[styles.roleText, role === 'tenant' && styles.roleTextActive]}>
                      Người thuê phòng
                    </Text>
                  </Pressable>

                  <Pressable
                    onPress={() => setRole('landlord')}
                    style={[styles.roleCard, role === 'landlord' && styles.roleCardActive]}>
                    <Ionicons
                      name="business-outline"
                      size={20}
                      color={role === 'landlord' ? Colors.primary : '#475569'}
                    />
                    <Text style={[styles.roleText, role === 'landlord' && styles.roleTextActive]}>
                      Chủ phòng trọ
                    </Text>
                  </Pressable>
                </View>
              </View>

              {/* Agree terms */}
              <Pressable
                onPress={() => setAgreeTerms(!agreeTerms)}
                style={styles.rememberRow}>
                <Ionicons
                  name={agreeTerms ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={agreeTerms ? Colors.primary : '#94a3b8'}
                />
                <Text style={styles.rememberText}>Tôi đồng ý với điều khoản sử dụng và bảo mật</Text>
              </Pressable>

              {/* Register Submit button */}
              <Pressable onPress={handleRegister} disabled={isLoading} style={styles.registerBtnSubmit}>
                {isLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.registerBtnTextSubmit}>Đăng ký ngay</Text>
                )}
              </Pressable>

              <View style={styles.loginRow}>
                <Text style={styles.loginLabel}>Đã có tài khoản?</Text>
                <Link href="/login" asChild>
                  <Pressable><Text style={styles.loginLink}>Đăng nhập</Text></Pressable>
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
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    backgroundColor: '#f8fafc',
    flex: 1,
  },
  card: {
    backgroundColor: 'white',
    padding: Spacing.xxl,
    borderRadius: Border.radius.lg,
    width: '100%',
    maxWidth: 450,
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
    marginBottom: Spacing.sm,
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
    paddingVertical: Spacing.xl,
  },
  successTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: Colors.success,
  },
  successText: {
    fontSize: 15,
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
    gap: Spacing.md,
  },
  inputGroup: {
    gap: 4,
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
    height: 40,
    gap: Spacing.xs,
    backgroundColor: '#f8fafc',
  },
  input: {
    flex: 1,
    fontSize: 14,
    color: '#0f172a',
    outlineStyle: 'none',
  } as any,
  roleGrid: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: 4,
  },
  roleCard: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Border.radius.md,
    padding: Spacing.md,
    alignItems: 'center',
    flexDirection: 'row',
    gap: Spacing.xs,
    backgroundColor: '#f8fafc',
  },
  roleCardActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.secondary,
  },
  roleText: {
    fontSize: 13,
    color: '#475569',
    fontWeight: '500',
  },
  roleTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  rememberRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    marginVertical: 4,
  },
  rememberText: {
    fontSize: 13,
    color: '#475569',
    flex: 1,
  },
  registerBtnSubmit: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: Border.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.xs,
  },
  registerBtnTextSubmit: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  loginRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  loginLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  loginLink: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: 'bold',
  },
});
