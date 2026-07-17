import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, Pressable, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Layout from '../components/Layout';
import { Colors, Spacing, Border, Shadows, MaxContentWidth } from '../constants/theme';

export default function GuideScreen() {
  const [activeTab, setActiveTab] = useState<'tenant' | 'landlord'>('tenant');

  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Hướng dẫn sử dụng iSinhvien</Text>
          <Text style={styles.subtitle}>
            Quy trình kết nối trực tiếp, tối giản và an toàn nhất dành cho học sinh, sinh viên và chủ nhà trọ.
          </Text>

          {/* Toggle Tab Bar */}
          <View style={[styles.tabBar, Shadows.sm]}>
            <Pressable
              onPress={() => setActiveTab('tenant')}
              style={[styles.tabBtn, activeTab === 'tenant' && styles.tabBtnActive]}
              className="hover-button">
              <Ionicons name="people" size={20} color={activeTab === 'tenant' ? 'white' : '#64748b'} />
              <Text style={[styles.tabBtnText, activeTab === 'tenant' && styles.tabBtnTextActive]}>
                Dành cho Người thuê / Mua
              </Text>
            </Pressable>
            
            <Pressable
              onPress={() => setActiveTab('landlord')}
              style={[styles.tabBtn, activeTab === 'landlord' && styles.tabBtnActive]}
              className="hover-button">
              <Ionicons name="business" size={20} color={activeTab === 'landlord' ? 'white' : '#64748b'} />
              <Text style={[styles.tabBtnText, activeTab === 'landlord' && styles.tabBtnTextActive]}>
                Dành cho Chủ phòng / Đăng tin
              </Text>
            </Pressable>
          </View>

          {/* Steps Section */}
          {activeTab === 'tenant' ? (
            <View style={styles.stepsContainer}>
              <View style={[styles.stepCard, Shadows.sm]} className="hover-card">
                <View style={[styles.stepIconBg, { backgroundColor: '#e0f2fe' }]}>
                  <Ionicons name="search" size={24} color="#0ea5e9" />
                </View>
                <View style={styles.stepTextContent}>
                  <Text style={styles.stepTitle}>Bước 1: Tìm phòng & căn hộ ưng ý</Text>
                  <Text style={styles.stepDesc}>
                    Truy cập trang danh sách phòng, sử dụng thanh tìm kiếm và bộ lọc nâng cao để chọn khu vực, khoảng giá thích hợp (từ 2 - 5 triệu) và các tiện ích mong muốn.
                  </Text>
                  <Pressable onPress={() => router.push('/list')} style={styles.actionLink} className="hover-button">
                    <Text style={styles.actionLinkText}>Khám phá phòng ngay</Text>
                    <Ionicons name="arrow-forward" size={14} color="#0ea5e9" />
                  </Pressable>
                </View>
              </View>

              <View style={[styles.stepCard, Shadows.sm]} className="hover-card">
                <View style={[styles.stepIconBg, { backgroundColor: '#fee2e2' }]}>
                  <Ionicons name="calendar-outline" size={24} color="#f43f5e" />
                </View>
                <View style={styles.stepTextContent}>
                  <Text style={styles.stepTitle}>Bước 2: Đặt lịch hẹn xem phòng trực tiếp</Text>
                  <Text style={styles.stepDesc}>
                    Sau khi chọn được phòng thích hợp, nhấp "Đặt lịch hẹn xem phòng". Điền lời nhắn của bạn và chọn thời gian bạn rảnh để xem phòng thực tế.
                  </Text>
                </View>
              </View>

              <View style={[styles.stepCard, Shadows.sm]} className="hover-card">
                <View style={[styles.stepIconBg, { backgroundColor: '#d1fae5' }]}>
                  <Ionicons name="document-text-outline" size={24} color="#10b981" />
                </View>
                <View style={styles.stepTextContent}>
                  <Text style={styles.stepTitle}>Bước 3: Xem phòng, ký hợp đồng trực tiếp</Text>
                  <Text style={styles.stepDesc}>
                    Gặp chủ nhà trực tiếp tại phòng trọ. Tiến hành kiểm tra điện nước, điều kiện vệ sinh, nội thất và thỏa thuận ký kết hợp đồng rõ ràng.
                  </Text>
                </View>
              </View>

              <View style={[styles.stepCard, Shadows.sm]} className="hover-card">
                <View style={[styles.stepIconBg, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="star-outline" size={24} color="#f59e0b" />
                </View>
                <View style={styles.stepTextContent}>
                  <Text style={styles.stepTitle}>Bước 4: Đánh giá chất lượng dịch vụ</Text>
                  <Text style={styles.stepDesc}>
                    Sau khi giao dịch hoàn tất thành công, bạn có thể gửi phản hồi và chấm điểm đánh giá để giúp cộng đồng học sinh, sinh viên khác tìm phòng tốt hơn.
                  </Text>
                </View>
              </View>

              {/* Safety Banner */}
              <View style={styles.safetyBanner}>
                <Ionicons name="shield-checkmark" size={28} color="#059669" />
                <View style={{ flex: 1, gap: 2 }}>
                  <Text style={styles.safetyTitle}>Mẹo thuê phòng an toàn từ iSinhvien</Text>
                  <Text style={styles.safetyDesc}>
                    Nên đi xem phòng thực tế vào ban ngày, xác nhận chủ quyền của chủ phòng trước khi đặt cọc tiền mặt và đọc kỹ các quy định về chi phí điện, nước trong hợp đồng!
                  </Text>
                </View>
              </View>
            </View>
          ) : (
            <View style={styles.stepsContainer}>
              <View style={[styles.stepCard, Shadows.sm]} className="hover-card">
                <View style={[styles.stepIconBg, { backgroundColor: '#e0f2fe' }]}>
                  <Ionicons name="person-add-outline" size={24} color="#0ea5e9" />
                </View>
                <View style={styles.stepTextContent}>
                  <Text style={styles.stepTitle}>Bước 1: Đăng ký vai trò "Chủ phòng"</Text>
                  <Text style={styles.stepDesc}>
                    Tạo tài khoản mới, chọn vai trò tài khoản là "Chủ phòng / Nhà". Kích hoạt email thông qua đường dẫn được gửi để bắt đầu đăng tin.
                  </Text>
                </View>
              </View>

              <View style={[styles.stepCard, Shadows.sm]} className="hover-card">
                <View style={[styles.stepIconBg, { backgroundColor: '#fee2e2' }]}>
                  <Ionicons name="cloud-upload-outline" size={24} color="#f43f5e" />
                </View>
                <View style={styles.stepTextContent}>
                  <Text style={styles.stepTitle}>Bước 2: Tạo tin đăng phòng với biểu mẫu 5 bước</Text>
                  <Text style={styles.stepDesc}>
                    Truy cập trang quản lý của bạn, nhấp "Đăng tin trọ mới". Nhập đầy đủ thông tin phòng trọ, bảng kê các chi phí dịch vụ, vị trí bản đồ, tiện ích và hình ảnh.
                  </Text>
                </View>
              </View>

              <View style={[styles.stepCard, Shadows.sm]} className="hover-card">
                <View style={[styles.stepIconBg, { backgroundColor: '#d1fae5' }]}>
                  <Ionicons name="shield-outline" size={24} color="#10b981" />
                </View>
                <View style={styles.stepTextContent}>
                  <Text style={styles.stepTitle}>Bước 3: Đợi kiểm duyệt tin đăng từ hệ thống</Text>
                  <Text style={styles.stepDesc}>
                    Quản trị viên sẽ tiến hành xác thực thông tin bài viết của bạn trong vòng tối đa 24 giờ. Tin đăng được phê duyệt sẽ hiển thị công khai trên thanh tìm kiếm.
                  </Text>
                </View>
              </View>

              <View style={[styles.stepCard, Shadows.sm]} className="hover-card">
                <View style={[styles.stepIconBg, { backgroundColor: '#fef3c7' }]}>
                  <Ionicons name="notifications-outline" size={24} color="#f59e0b" />
                </View>
                <View style={styles.stepTextContent}>
                  <Text style={styles.stepTitle}>Bước 4: Tiếp nhận lịch hẹn và chốt phòng</Text>
                  <Text style={styles.stepDesc}>
                    Hệ thống sẽ gửi thông báo cho bạn khi có khách thuê gửi yêu cầu đặt lịch hẹn xem phòng. Bạn có thể chấp nhận, từ chối và chốt hợp đồng trực tiếp trên ứng dụng.
                  </Text>
                </View>
              </View>
            </View>
          )}
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
    maxWidth: MaxContentWidth,
    width: '100%',
    backgroundColor: 'white',
    padding: Platform.OS === 'web' ? Spacing.xxl : Spacing.lg,
    borderRadius: Border.radius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: Spacing.lg,
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
    lineHeight: 24,
    marginBottom: Spacing.md,
  },
  tabBar: {
    flexDirection: 'row',
    alignSelf: 'center',
    backgroundColor: '#f1f5f9',
    borderRadius: Border.radius.md,
    padding: 4,
    marginBottom: Spacing.lg,
  },
  tabBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    paddingVertical: 10,
    paddingHorizontal: 20,
    borderRadius: Border.radius.sm,
  },
  tabBtnActive: {
    backgroundColor: Colors.primary,
  },
  tabBtnText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#64748b',
  },
  tabBtnTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  stepsContainer: {
    gap: Spacing.md,
    width: '100%',
  },
  stepCard: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: Border.radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: Spacing.md,
  },
  stepIconBg: {
    width: 48,
    height: 48,
    borderRadius: Border.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'flex-start',
  },
  stepTextContent: {
    flex: 1,
    gap: 6,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  stepDesc: {
    fontSize: 14,
    color: '#475569',
    lineHeight: 22,
  },
  actionLink: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    alignSelf: 'flex-start',
    marginTop: 4,
  },
  actionLinkText: {
    color: '#0ea5e9',
    fontSize: 13,
    fontWeight: 'bold',
  },
  safetyBanner: {
    flexDirection: 'row',
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
    borderWidth: 1,
    borderRadius: Border.radius.md,
    padding: Spacing.lg,
    gap: Spacing.md,
    marginTop: Spacing.md,
    alignItems: 'center',
  },
  safetyTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#065f46',
  },
  safetyDesc: {
    fontSize: 13,
    color: '#047857',
    lineHeight: 20,
  },
});
