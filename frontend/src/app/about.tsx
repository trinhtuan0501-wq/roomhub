import React from 'react';
import { View, Text, StyleSheet, ScrollView, Platform } from 'react-native';
import Layout from '../components/Layout';
import { Colors, Spacing, Border } from '../constants/theme';

export default function AboutScreen() {
  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Về chúng tôi — iSinhvien</Text>
          <Text style={styles.subtitle}>
            Kết nối tin cậy giữa chủ nhà và người thuê phòng.
          </Text>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Sứ mệnh của chúng tôi</Text>
            <Text style={styles.paragraph}>
              iSinhvien ra đời với mục tiêu giải quyết khó khăn trong việc tìm kiếm nhà trọ, phòng trọ cho học sinh, sinh viên và người đi làm tại Việt Nam. Chúng tôi xây dựng một nền tảng mở, minh bạch và an toàn để kết nối trực tiếp chủ phòng và người có nhu cầu thuê mà không qua các khâu trung gian phiền phức.
            </Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Giá trị cốt lõi</Text>
            <Text style={styles.bullet}>• **Xác thực thông tin**: Tất cả các bài đăng được kiểm duyệt chặt chẽ để đảm bảo tính xác thực về giá cả, diện tích và hình ảnh.</Text>
            <Text style={styles.bullet}>• **Kết nối trực tiếp**: Khách thuê phòng liên hệ trực tiếp với chủ nhà thông qua số điện thoại hoặc đặt lịch xem phòng trực tiếp trên hệ thống.</Text>
            <Text style={styles.bullet}>• **Hiện đại & Dễ dùng**: Giao diện thiết kế tối ưu trên cả thiết bị di động và máy tính, giúp bạn tìm thấy phòng phù hợp chỉ trong vài phút.</Text>
          </View>

          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Khu vực hoạt động</Text>
            <Text style={styles.paragraph}>
              Hiện nay, iSinhvien đang tập trung cung cấp nguồn thông tin phòng chất lượng cao tại các khu vực trọng điểm của thành phố Hồ Chí Minh, Dĩ An Bình Dương và khu đô thị Đại học Quốc gia TP.HCM.
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
    fontSize: 16,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  section: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    borderBottomWidth: 2,
    borderBottomColor: Colors.primary,
    paddingBottom: 4,
    alignSelf: 'flex-start',
  },
  paragraph: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 24,
  },
  bullet: {
    fontSize: 15,
    color: '#334155',
    lineHeight: 22,
    paddingLeft: Spacing.sm,
  },
});
