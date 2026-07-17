import React from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import Layout from '../components/Layout';
import { Colors, Spacing, Border } from '../constants/theme';

export default function PrivacyScreen() {
  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Chính sách bảo mật</Text>
          <Text style={styles.subtitle}>Cập nhật lần cuối: Tháng 7, 2026</Text>

          <View style={styles.section}>
            <Text style={styles.paragraph}>
              iSinhvien cam kết bảo vệ thông tin cá nhân của người dùng. Chính sách bảo mật này mô tả cách chúng tôi thu thập, sử dụng và bảo vệ thông tin của bạn khi bạn sử dụng dịch vụ trên website iSinhvien.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>1. Thu thập thông tin</Text>
            <Text style={styles.paragraph}>
              Chúng tôi thu thập thông tin khi bạn đăng ký tài khoản (họ tên, email, số điện thoại, mật khẩu), gửi yêu cầu thuê phòng, hoặc đăng thông tin bài đăng cho thuê phòng.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>2. Sử dụng thông tin</Text>
            <Text style={styles.paragraph}>
              Thông tin thu thập được sử dụng để:
              {'\n'}• Kết nối trực tiếp giữa chủ phòng và người thuê phòng.
              {'\n'}• Gửi thông báo quan trọng về trạng thái phê duyệt bài đăng hoặc yêu cầu thuê.
              {'\n'}• Cải thiện chất lượng dịch vụ và bảo vệ an ninh hệ thống.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>3. Bảo mật thông tin</Text>
            <Text style={styles.paragraph}>
              Chúng tôi áp dụng các tiêu chuẩn mã hóa mật khẩu, tường lửa bảo vệ và các biện pháp bảo mật hiện đại nhằm ngăn chặn truy cập trái phép hoặc rò rỉ dữ liệu người dùng.
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
