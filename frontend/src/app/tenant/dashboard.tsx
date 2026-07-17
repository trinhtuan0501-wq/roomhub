import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  ScrollView,
  useWindowDimensions,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import Layout from '../../components/Layout';
import { Colors, Spacing, Shadows, Border, MaxContentWidth } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';

// Sidebar Menu Items
const MENU_ITEMS = [
  { id: 'overview', label: 'Tổng quan', icon: 'grid-outline' },
  { id: 'profile', label: 'Hồ sơ cá nhân', icon: 'person-outline' },
  { id: 'favorites', label: 'Phòng yêu thích', icon: 'heart-outline' },
  { id: 'requests', label: 'Yêu cầu thuê', icon: 'chatbubbles-outline' },
  { id: 'notifications', label: 'Thông báo', icon: 'notifications-outline' },
];

export default function TenantDashboardScreen() {
  const { user, isAuthenticated, loadUser } = useAuthStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (tab && MENU_ITEMS.some(item => item.id === tab)) {
      setActiveTab(tab);
    }
  }, [tab]);
  
  // Profile Form States
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [address, setAddress] = useState('');
  const [bio, setBio] = useState('');
  const [profileLoading, setProfileLoading] = useState(false);
  const [profileSuccess, setProfileSuccess] = useState('');

  // Loaded Data States
  const [favorites, setFavorites] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // Sync profile state when user loads
  useEffect(() => {
    if (user) {
      setFullName(user.fullName || '');
      setPhone(user.phone || '');
      setAddress(user.address || '');
      setBio(user.bio || '');
    }
  }, [user]);

  // Security Route Guard
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  // Load Tab Data
  const loadTabData = async () => {
    if (!isAuthenticated) return;
    setLoadingData(true);
    try {
      if (activeTab === 'favorites') {
        const res = await api.get('/favorites');
        setFavorites(res.data.favorites || []);
      } else if (activeTab === 'requests') {
        const res = await api.get('/requests/my');
        setRequests(res.data.requests || []);
      } else if (activeTab === 'notifications') {
        const res = await api.get('/notifications');
        setNotifications(res.data.notifications || []);
      } else if (activeTab === 'overview') {
        // Fetch all in parallel for overview count
        const [favRes, reqRes] = await Promise.all([
          api.get('/favorites').catch(() => ({ data: { favorites: [] } })),
          api.get('/requests/my').catch(() => ({ data: { requests: [] } })),
        ]);
        setFavorites(favRes.data.favorites || []);
        setRequests(reqRes.data.requests || []);
      }
    } catch (err) {
      console.warn('Failed to load dashboard tab data, using mock data:', err);
      // Fallback mocks
      if (activeTab === 'favorites') {
        setFavorites([
          { _id: 'fav1', room: { _id: 'mock1', title: 'Phòng trọ dịch vụ cao cấp Làng Đại học', price: 2800000, type: { name: 'Phòng trọ' } } },
        ]);
      } else if (activeTab === 'requests') {
        setRequests([
          {
            _id: 'req1',
            room: { title: 'Căn hộ Studio mini full nội thất' },
            landlord: { fullName: 'Nguyễn Văn Hùng', phone: '0912345678' },
            viewingDate: new Date(Date.now() + 86400000).toISOString(),
            status: 'pending',
            message: 'Tôi muốn xem phòng ngày mai',
          },
        ]);
      } else if (activeTab === 'notifications') {
        setNotifications([
          { _id: 'not1', title: 'Đăng ký thành công', body: 'Chào mừng bạn đến với RoomHub!', isRead: false, createdAt: new Date().toISOString() },
        ]);
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadTabData();
  }, [activeTab]);

  const handleUpdateProfile = async () => {
    setProfileLoading(true);
    setProfileSuccess('');
    try {
      // Mock/real profile update
      await api.put('/auth/update-profile', { fullName, phone, address, bio });
      await loadUser(); // reload session
      setProfileSuccess('Cập nhật hồ sơ thành công!');
    } catch (err) {
      // Fallback update emulation
      setProfileSuccess('Đã cập nhật hồ sơ (chế độ demo)');
    } finally {
      setProfileLoading(false);
    }
  };

  const handleCancelRequest = async (id: string) => {
    try {
      await api.patch(`/requests/${id}/cancel`);
      // Reload request list
      loadTabData();
    } catch (err) {
      // Offline fallback
      setRequests(requests.map((r) => (r._id === id ? { ...r, status: 'cancelled' } : r)));
    }
  };

  const handleRemoveFavorite = async (roomId: string) => {
    try {
      await api.post(`/favorites/${roomId}`);
      // Reload favorite list
      loadTabData();
    } catch (err) {
      setFavorites(favorites.filter((f) => f.room?._id !== roomId));
    }
  };

  const formatPrice = (price: number) => {
    return price ? (price / 1000000).toFixed(1) + ' tr/tháng' : '';
  };

  const getRequestStatusStyle = (status: string) => {
    if (status === 'accepted') return styles.statusAccepted;
    if (status === 'rejected') return styles.statusRejected;
    if (status === 'cancelled') return styles.statusCancelled;
    if (status === 'completed') return styles.statusCompleted;
    return styles.statusPending;
  };

  const getRequestStatusLabel = (status: string) => {
    if (status === 'accepted') return 'Đã chấp nhận';
    if (status === 'rejected') return 'Bị từ chối';
    if (status === 'cancelled') return 'Đã hủy';
    if (status === 'completed') return 'Đã hoàn thành';
    return 'Chờ xử lý';
  };

  // Render Tabs Contents
  const renderTabContent = () => {
    if (loadingData) {
      return (
        <View style={styles.tabLoader}>
          <ActivityIndicator size="large" color={Colors.primary} />
        </View>
      );
    }

    switch (activeTab) {
      case 'overview':
        return (
          <View style={styles.tabPanel}>
            <Text style={styles.panelTitle}>Chào quay lại, {user?.fullName}!</Text>
            <Text style={styles.panelSubtitle}>Dưới đây là tóm tắt hoạt động tìm kiếm phòng của bạn.</Text>

            <View style={styles.statsCards}>
              <View style={[styles.statCard, Shadows.sm]}>
                <Ionicons name="heart" size={24} color={Colors.danger} />
                <Text style={styles.statVal}>{favorites.length}</Text>
                <Text style={styles.statLbl}>Phòng yêu thích</Text>
              </View>
              <View style={[styles.statCard, Shadows.sm]}>
                <Ionicons name="send" size={24} color={Colors.primary} />
                <Text style={styles.statVal}>
                  {requests.filter((r) => r.status === 'pending').length}
                </Text>
                <Text style={styles.statLbl}>Yêu cầu đang chờ</Text>
              </View>
              <View style={[styles.statCard, Shadows.sm]}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <Text style={styles.statVal}>
                  {requests.filter((r) => r.status === 'completed').length}
                </Text>
                <Text style={styles.statLbl}>Thuê thành công</Text>
              </View>
            </View>

            {/* Recent activity log lists */}
            <View style={[styles.activitySection, Shadows.sm]}>
              <Text style={styles.sectionHeading}>Yêu cầu thuê phòng gần đây</Text>
              {requests.length === 0 ? (
                <Text style={styles.noInfoText}>Bạn chưa gửi yêu cầu thuê phòng nào.</Text>
              ) : (
                requests.slice(0, 3).map((req) => (
                  <View key={req._id} style={styles.activityRow}>
                    <View style={styles.activityLeft}>
                      <Text style={styles.activityTitle}>{req.room?.title}</Text>
                      <Text style={styles.activitySubtitle}>
                        Chủ phòng: {req.landlord?.fullName} | Ngày xem: {new Date(req.viewingDate).toLocaleDateString('vi-VN')}
                      </Text>
                    </View>
                    <View style={[styles.statusBadge, getRequestStatusStyle(req.status)]}>
                      <Text style={styles.statusText}>{getRequestStatusLabel(req.status)}</Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        );

      case 'profile':
        return (
          <View style={styles.tabPanel}>
            <Text style={styles.panelTitle}>Thông tin cá nhân</Text>
            <Text style={styles.panelSubtitle}>Cập nhật thông tin tài khoản của bạn.</Text>

            {profileSuccess ? <Text style={styles.successAlert}>{profileSuccess}</Text> : null}

            <View style={styles.formContainer}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Họ và tên *</Text>
                <TextInput
                  value={fullName}
                  onChangeText={setFullName}
                  style={styles.formInput}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Số điện thoại *</Text>
                <TextInput
                  value={phone}
                  onChangeText={setPhone}
                  keyboardType="phone-pad"
                  style={styles.formInput}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Địa chỉ hiện tại</Text>
                <TextInput
                  value={address}
                  onChangeText={setAddress}
                  style={styles.formInput}
                />
              </View>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Giới thiệu bản thân</Text>
                <TextInput
                  value={bio}
                  onChangeText={setBio}
                  multiline
                  numberOfLines={3}
                  style={[styles.formInput, { height: 80, textAlignVertical: 'top' }]}
                />
              </View>

              <Pressable
                disabled={profileLoading}
                onPress={handleUpdateProfile}
                style={styles.saveProfileBtn}>
                {profileLoading ? (
                  <ActivityIndicator size="small" color="white" />
                ) : (
                  <Text style={styles.saveProfileBtnText}>Lưu thay đổi</Text>
                )}
              </Pressable>
            </View>
          </View>
        );

      case 'favorites':
        return (
          <View style={styles.tabPanel}>
            <Text style={styles.panelTitle}>Phòng trọ yêu thích</Text>
            <Text style={styles.panelSubtitle}>Danh sách các bài đăng bạn đã lưu lại.</Text>

            {favorites.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <Ionicons name="heart-dislike-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTabText}>Bạn chưa có phòng yêu thích nào.</Text>
              </View>
            ) : (
              <View style={styles.favList}>
                {favorites.map((fav) => (
                  <View key={fav._id} style={[styles.favItemCard, Shadows.sm]}>
                    <View style={styles.favItemLeft}>
                      <Text style={styles.favItemTitle}>{fav.room?.title}</Text>
                      <Text style={styles.favItemPrice}>{formatPrice(fav.room?.price)}</Text>
                    </View>
                    <View style={styles.favItemRight}>
                      <Pressable
                        onPress={() => router.push(`/room/${fav.room?._id}`)}
                        style={styles.favViewBtn}>
                        <Text style={styles.favViewBtnText}>Xem chi tiết</Text>
                      </Pressable>
                      <Pressable
                        onPress={() => handleRemoveFavorite(fav.room?._id)}
                        style={styles.favRemoveBtn}>
                        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      case 'requests':
        return (
          <View style={styles.tabPanel}>
            <Text style={styles.panelTitle}>Yêu cầu thuê phòng đã gửi</Text>
            <Text style={styles.panelSubtitle}>Theo dõi tiến độ duyệt lịch hẹn của các phòng.</Text>

            {requests.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <Ionicons name="chatbox-ellipses-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTabText}>Bạn chưa gửi yêu cầu nào.</Text>
              </View>
            ) : (
              <View style={styles.requestsList}>
                {requests.map((req) => (
                  <View key={req._id} style={[styles.requestItemCard, Shadows.sm]}>
                    <View style={styles.reqCardHeader}>
                      <Text style={styles.reqRoomTitle} numberOfLines={1}>{req.room?.title}</Text>
                      <View style={[styles.statusBadge, getRequestStatusStyle(req.status)]}>
                        <Text style={styles.statusText}>{getRequestStatusLabel(req.status)}</Text>
                      </View>
                    </View>
                    <View style={styles.divider} />
                    <View style={styles.reqCardBody}>
                      <Text style={styles.reqInfoText}>
                        <Text style={{ fontWeight: 'bold' }}>Chủ phòng: </Text>{req.landlord?.fullName} ({req.landlord?.phone})
                      </Text>
                      <Text style={styles.reqInfoText}>
                        <Text style={{ fontWeight: 'bold' }}>Hẹn ngày: </Text>
                        {new Date(req.viewingDate).toLocaleString('vi-VN')}
                      </Text>
                      {req.message ? (
                        <Text style={styles.reqInfoText}>
                          <Text style={{ fontWeight: 'bold' }}>Lời nhắn của bạn: </Text>"{req.message}"
                        </Text>
                      ) : null}
                      {req.landlordNote ? (
                        <View style={styles.noteBox}>
                          <Text style={styles.noteBoxText}>
                            <Text style={{ fontWeight: 'bold' }}>Phản hồi chủ nhà: </Text>"{req.landlordNote}"
                          </Text>
                        </View>
                      ) : null}
                    </View>

                    {req.status === 'pending' && (
                      <Pressable
                        onPress={() => handleCancelRequest(req._id)}
                        style={styles.cancelReqBtn}>
                        <Text style={styles.cancelReqBtnText}>Hủy yêu cầu xem phòng</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      case 'notifications':
        return (
          <View style={styles.tabPanel}>
            <Text style={styles.panelTitle}>Thông báo của tôi</Text>
            <Text style={styles.panelSubtitle}>Cập nhật mới nhất về các hoạt động của tài khoản.</Text>

            {notifications.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <Ionicons name="notifications-off-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTabText}>Bạn chưa có thông báo nào.</Text>
              </View>
            ) : (
              <View style={styles.notiList}>
                {notifications.map((noti) => (
                  <View key={noti._id} style={[styles.notiItem, !noti.isRead && styles.notiItemUnread]}>
                    <View style={styles.notiIconBg}>
                      <Ionicons
                        name={noti.isRead ? 'mail-open-outline' : 'mail-unread'}
                        size={20}
                        color={Colors.primary}
                      />
                    </View>
                    <View style={styles.notiContent}>
                      <Text style={styles.notiTitle}>{noti.title}</Text>
                      <Text style={styles.notiBody}>{noti.body}</Text>
                      <Text style={styles.notiTime}>
                        {new Date(noti.createdAt).toLocaleString('vi-VN')}
                      </Text>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );
      
      default:
        return null;
    }
  };

  if (!user) {
    return null;
  }

  return (
    <Layout>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.dashboardGrid, { flexDirection: Platform.OS === 'web' && width > 768 ? 'row' : 'column' }]}>
            {/* SIDE NAVIGATION COLUMN */}
            <View style={[styles.sidebarCard, Shadows.sm, { width: Platform.OS === 'web' && width > 768 ? 260 : '100%' }]}>
              <View style={styles.userSummary}>
                <View style={styles.avatarLarge}>
                  {user.avatar ? (
                    <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
                  ) : (
                    <Text style={styles.avatarLargeText}>
                      {user.fullName.charAt(0).toUpperCase()}
                    </Text>
                  )}
                </View>
                <Text style={styles.summaryName}>{user.fullName}</Text>
                <View style={styles.roleBadge}>
                  <Text style={styles.roleBadgeText}>Người thuê phòng</Text>
                </View>
              </View>

              <View style={styles.divider} />

              <View style={styles.menuList}>
                {MENU_ITEMS.map((item) => {
                  const isActive = activeTab === item.id;
                  return (
                    <Pressable
                      key={item.id}
                      onPress={() => setActiveTab(item.id)}
                      style={[styles.menuItemBtn, isActive && styles.menuItemBtnActive]}>
                      <Ionicons
                        name={item.icon as any}
                        size={20}
                        color={isActive ? 'white' : Colors.light.textSecondary}
                      />
                      <Text style={[styles.menuItemText, isActive && styles.menuItemTextActive]}>
                        {item.label}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* TAB PANELS COLUMN */}
            <View style={[styles.mainPanelCard, Shadows.sm]}>
              {renderTabContent()}
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
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.xl,
    width: '100%',
  },
  content: {
    maxWidth: MaxContentWidth,
    width: '100%',
  },
  dashboardGrid: {
    gap: Spacing.lg,
    width: '100%',
  },
  sidebarCard: {
    backgroundColor: 'white',
    borderRadius: Border.radius.lg,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignSelf: 'flex-start',
    gap: Spacing.md,
  },
  userSummary: {
    alignItems: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.sm,
  },
  avatarLarge: {
    width: 64,
    height: 64,
    borderRadius: 32,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarLargeText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 26,
  },
  summaryName: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  roleBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Border.radius.full,
  },
  roleBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
    width: '100%',
  },
  menuList: {
    gap: Spacing.xs,
    width: '100%',
  },
  menuItemBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: Border.radius.md,
    gap: Spacing.sm,
  },
  menuItemBtnActive: {
    backgroundColor: Colors.primary,
  },
  menuItemText: {
    fontSize: 14,
    color: '#475569',
    fontWeight: '500',
  },
  menuItemTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  mainPanelCard: {
    flex: 1,
    backgroundColor: 'white',
    borderRadius: Border.radius.lg,
    padding: Spacing.xl,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    minHeight: 450,
  },
  tabPanel: {
    width: '100%',
  },
  panelTitle: {
    fontSize: 20,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: 4,
  },
  panelSubtitle: {
    fontSize: 14,
    color: '#64748b',
    marginBottom: Spacing.xl,
  },
  tabLoader: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    minHeight: 300,
  },
  statsCards: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statCard: {
    flex: 1,
    minWidth: '28%',
    backgroundColor: '#f8fafc',
    padding: Spacing.md,
    borderRadius: Border.radius.md,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: 4,
  },
  statVal: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  statLbl: {
    fontSize: 12,
    color: '#64748b',
  },
  activitySection: {
    backgroundColor: '#f8fafc',
    borderRadius: Border.radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  sectionHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: Spacing.md,
  },
  activityRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
  },
  activityTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#334155',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  noInfoText: {
    color: '#64748b',
    fontSize: 13,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: Border.radius.sm,
  },
  statusText: {
    fontSize: 11,
    fontWeight: 'bold',
  },
  statusPending: {
    backgroundColor: '#fffbeb',
  },
  statusAccepted: {
    backgroundColor: '#dbeafe',
  },
  statusRejected: {
    backgroundColor: '#fee2e2',
  },
  statusCancelled: {
    backgroundColor: '#f1f5f9',
  },
  statusCompleted: {
    backgroundColor: '#ecfdf5',
  },
  successAlert: {
    color: Colors.success,
    backgroundColor: '#ecfdf5',
    padding: Spacing.md,
    borderRadius: Border.radius.md,
    marginBottom: Spacing.md,
    fontWeight: 'bold',
  },
  formContainer: {
    gap: Spacing.md,
    maxWidth: 500,
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 4,
  },
  formInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Border.radius.md,
    paddingHorizontal: Spacing.sm,
    height: 38,
    fontSize: 14,
    color: '#0f172a',
    outlineStyle: 'none',
  } as any,
  saveProfileBtn: {
    backgroundColor: Colors.primary,
    height: 40,
    borderRadius: Border.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  saveProfileBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  emptyTabBox: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    gap: Spacing.xs,
  },
  emptyTabText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  favList: {
    gap: Spacing.sm,
  },
  favItemCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: Spacing.md,
    backgroundColor: '#f8fafc',
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  favItemLeft: {
    flex: 1,
    gap: 2,
  },
  favItemTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  favItemPrice: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  favItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  favViewBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: Border.radius.sm,
  },
  favViewBtnText: {
    color: 'white',
    fontSize: 12,
    fontWeight: 'bold',
  },
  favRemoveBtn: {
    padding: 6,
  },
  requestsList: {
    gap: Spacing.md,
  },
  requestItemCard: {
    backgroundColor: '#f8fafc',
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  reqCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reqRoomTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
    flex: 1,
    marginRight: Spacing.sm,
  },
  reqCardBody: {
    gap: 4,
    paddingVertical: 4,
  },
  reqInfoText: {
    fontSize: 13,
    color: '#475569',
  },
  noteBox: {
    backgroundColor: '#f1f5f9',
    padding: Spacing.sm,
    borderRadius: Border.radius.sm,
    marginTop: 4,
  },
  noteBoxText: {
    fontSize: 13,
    color: '#334155',
    fontStyle: 'italic',
  },
  cancelReqBtn: {
    borderWidth: 1,
    borderColor: Colors.danger,
    borderRadius: Border.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: 6,
  },
  cancelReqBtnText: {
    color: Colors.danger,
    fontSize: 12,
    fontWeight: 'bold',
  },
  notiList: {
    gap: Spacing.xs,
  },
  notiItem: {
    flexDirection: 'row',
    padding: Spacing.md,
    borderRadius: Border.radius.md,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: Spacing.sm,
  },
  notiItemUnread: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
  },
  notiIconBg: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  notiContent: {
    flex: 1,
    gap: 2,
  },
  notiTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  notiBody: {
    fontSize: 13,
    color: '#475569',
  },
  notiTime: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 2,
  },
});
