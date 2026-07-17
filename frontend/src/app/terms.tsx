import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Layout from '../components/Layout';
import { Colors, Spacing, Border } from '../constants/theme';

export default function TermsScreen() {
  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Điều khoản sử dụng</Text>
          <Text style={styles.subtitle}>Cập nhật lần cuối: Tháng 7, 2026</Text>

          <View style={styles.section}>
            <Text style={styles.paragraph}>
              Chào mừng bạn đến với iSinhvien. Khi truy cập và sử dụng dịch vụ trên nền tảng của chúng tôi, bạn đồng ý tuân thủ các điều khoản sử dụng dưới đây.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Tài khoản người dùng</Text>
            <Text style={styles.paragraph}>
              Bạn cần cung cấp thông tin chính xác khi đăng ký tài khoản. Bạn chịu trách nhiệm bảo mật mật khẩu cá nhân và chịu trách nhiệm cho mọi hoạt động dưới tài khoản của mình.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Đăng tin cho thuê</Text>
            <Text style={styles.paragraph}>
              Chủ phòng cam kết thông tin bài đăng (giá cả, tiện ích, hình ảnh thực tế) là hoàn toàn đúng sự thật. Nghiêm cấm các bài đăng lừa đảo, giả danh hoặc treo giá sai lệch.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Miễn trừ trách nhiệm</Text>
            <Text style={styles.paragraph}>
              iSinhvien là nền tảng kết nối thông tin trung gian giữa chủ phòng và người thuê. Chúng tôi không chịu trách nhiệm pháp lý đối với bất kỳ tranh chấp dân sự hoặc tài chính nào xảy ra giữa hai bên trong quá trình ký kết hợp đồng ngoài đời thực.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
  },
  content: {
    maxWidth: 800,
    width: '100%',
    backgroundColor: 'white',
    padding: Spacing.xxl,
    borderRadius: Border.radius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: Spacing.md,
  },
  title: {
    fontSize: 28,
    fontWeight: '800',
    color: '#0f172a',
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: 4,
  },
  paragraph: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
  },
});
