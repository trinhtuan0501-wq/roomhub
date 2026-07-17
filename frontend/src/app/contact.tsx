import React, { useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TextInput, Pressable, ActivityIndicator, Platform } from 'react-native';
import Layout from '../components/Layout';
import { Colors, Spacing, Border, Shadows } from '../constants/theme';
import { Ionicons } from '@expo/vector-icons';

export default function ContactScreen() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [message, setMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState('');

  const handleSubmit = () => {
    if (!name || !email || !message) return;
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      setSuccess('Cảm ơn ý kiến đóng góp của bạn. Chúng tôi sẽ phản hồi lại sớm nhất.');
      setName('');
      setEmail('');
      setMessage('');
    }, 1500);
  };

  return (
    <Layout>
      <ScrollView contentContainerStyle={styles.container}>
        <View style={styles.content}>
          <Text style={styles.title}>Liên hệ iSinhvien</Text>
          <Text style={styles.subtitle}>
            Chúng tôi luôn sẵn sàng lắng nghe và hỗ trợ bạn.
          </Text>

          <View style={styles.grid}>
            {/* Contact details */}
            <View style={styles.detailsCol}>
              <Text style={styles.heading}>Thông tin hỗ trợ</Text>
              
              <View style={styles.infoRow}>
                <Ionicons name="location-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoText}>Văn phòng iSinhvien (Tầng trệt Nhà khách ĐHQG - HCM)</Text>
              </View>
              
              <View style={styles.infoRow}>
                <Ionicons name="mail-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoText}>support@isinhvien.vn</Text>
              </View>

              <View style={styles.infoRow}>
                <Ionicons name="call-outline" size={20} color={Colors.primary} />
                <Text style={styles.infoText}>0877.876.877 (Mr. Huân)</Text>
              </View>
            </View>

            {/* Contact form */}
            <View style={styles.formCol}>
              <Text style={styles.heading}>Gửi phản hồi nhanh</Text>
              
              {success ? (
                <View style={styles.successBox}>
                  <Ionicons name="checkmark-circle-outline" size={24} color={Colors.success} />
                  <Text style={styles.successText}>{success}</Text>
                </View>
              ) : (
                <View style={{ gap: Spacing.md }}>
                  <TextInput
                    placeholder="Họ và tên"
                    value={name}
                    onChangeText={setName}
                    style={styles.inputBox}
                  />
                  <TextInput
                    placeholder="Email"
                    value={email}
                    onChangeText={setEmail}
                    style={styles.inputBox}
                  />
                  <TextInput
                    placeholder="Lời nhắn / Ý kiến đóng góp"
                    multiline
                    numberOfLines={4}
                    value={message}
                    onChangeText={setMessage}
                    style={[styles.inputBox, { height: 100, textAlignVertical: 'top' }]}
                  />
                  <Pressable onPress={handleSubmit} style={styles.submitBtn} disabled={loading}>
                    {loading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.submitBtnText}>Gửi đi</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
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
    maxWidth: 900,
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
  grid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: Spacing.xl,
    marginTop: Spacing.md,
  },
  detailsCol: {
    flex: 1,
    gap: Spacing.lg,
  },
  formCol: {
    flex: 1.2,
    backgroundColor: '#f8fafc',
    padding: Spacing.xl,
    borderRadius: Border.radius.md,
  },
  heading: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#1e293b',
    marginBottom: Spacing.sm,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  infoText: {
    fontSize: 14,
    color: '#475569',
    flex: 1,
    lineHeight: 20,
  },
  inputBox: {
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Border.radius.md,
    paddingHorizontal: Spacing.sm,
    height: 40,
    fontSize: 14,
    outlineStyle: 'none',
  } as any,
  submitBtn: {
    backgroundColor: Colors.primary,
    height: 42,
    borderRadius: Border.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  successBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#ecfdf5',
    padding: Spacing.md,
    borderRadius: Border.radius.md,
    gap: Spacing.xs,
  },
  successText: {
    color: '#065f46',
    fontWeight: '500',
    fontSize: 14,
    flex: 1,
  },
});
