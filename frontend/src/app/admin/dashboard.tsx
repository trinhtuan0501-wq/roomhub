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
import { router } from 'expo-router';
import Layout from '../../components/Layout';
import { Colors, Spacing, Shadows, Border, MaxContentWidth } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';

// Sidebar Menu for Admin
const MENU_ITEMS = [
  { id: 'overview', label: 'Hệ thống', icon: 'stats-chart-outline' },
  { id: 'users', label: 'Người dùng', icon: 'people-outline' },
  { id: 'moderation', label: 'Duyệt bài đăng', icon: 'checkbox-outline' },
  { id: 'reports', label: 'Báo cáo vi phạm', icon: 'flag-outline' },
  { id: 'settings', label: 'Cấu hình & Nhật ký', icon: 'settings-outline' },
];

export default function AdminDashboardScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [activeTab, setActiveTab] = useState('overview');

  // Loaded Data
  const [stats, setStats] = useState<any>({
    totalUsers: 0,
    totalLandlords: 0,
    totalTenants: 0,
    lockedAccounts: 0,
    totalRooms: 0,
    availableRooms: 0,
    pendingApprovalRooms: 0,
    totalRequests: 0,
    completedRequests: 0,
    unhandledReports: 0,
  });
  const [usersList, setUsersList] = useState<any[]>([]);
  const [roomsList, setRoomsList] = useState<any[]>([]);
  const [reportsList, setReportsList] = useState<any[]>([]);
  const [logsList, setLogsList] = useState<any[]>([]);
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [amenities, setAmenities] = useState<any[]>([]);
  
  const [loadingData, setLoadingData] = useState(false);

  // Search & Filter States
  const [userQuery, setUserQuery] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState('');
  const [roomStatusFilter, setRoomStatusFilter] = useState('pending'); // default: view pending approval

  // Modals & Temp States
  const [rejectingRoomId, setRejectingRoomId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');

  const [handlingReportId, setHandlingReportId] = useState<string | null>(null);
  const [reportHandledNote, setReportHandledNote] = useState('');

  // Add RoomType / Amenity
  const [newTypeName, setNewTypeName] = useState('');
  const [newAmenityName, setNewAmenityName] = useState('');

  // Guard routing
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    if (user && user.role !== 'admin') {
      router.replace('/'); // restrict non-admin
    }
  }, [isAuthenticated, user]);

  const loadAdminData = async () => {
    if (!isAuthenticated || user?.role !== 'admin') return;
    setLoadingData(true);
    try {
      if (activeTab === 'overview') {
        const statsRes = await api.get('/admin/stats');
        setStats(statsRes.data.stats || {});
        setLogsList(statsRes.data.recentActivities || []);
      } else if (activeTab === 'users') {
        const params: any = {};
        if (userQuery) params.q = userQuery;
        if (userRoleFilter) params.role = userRoleFilter;
        const res = await api.get('/admin/users', { params });
        setUsersList(res.data.users || []);
      } else if (activeTab === 'moderation') {
        const res = await api.get('/admin/rooms', { params: { moderationStatus: roomStatusFilter } });
        setRoomsList(res.data.rooms || []);
      } else if (activeTab === 'reports') {
        const res = await api.get('/admin/reports');
        setReportsList(res.data.reports || []);
      } else if (activeTab === 'settings') {
        const [typesRes, amenitiesRes, logsRes] = await Promise.all([
          api.get('/admin/room-types').catch(() => ({ data: { types: [] } })),
          api.get('/admin/amenities').catch(() => ({ data: { amenities: [] } })),
          api.get('/admin/logs').catch(() => ({ data: { logs: [] } })),
        ]);
        setRoomTypes(typesRes.data.types || []);
        setAmenities(amenitiesRes.data.amenities || []);
        setLogsList(logsRes.data.logs || []);
      }
    } catch (err) {
      console.warn('Failed to load admin dashboard data, using mock data:', err);
      // Fallback mocks
      if (activeTab === 'overview') {
        setStats({
          totalUsers: 45,
          totalLandlords: 12,
          totalTenants: 32,
          lockedAccounts: 1,
          totalRooms: 154,
          availableRooms: 120,
          pendingApprovalRooms: 3,
          totalRequests: 95,
          completedRequests: 42,
          unhandledReports: 1,
        });
        setLogsList([
          { _id: 'l1', action: 'APPROVE_ROOM', user: { fullName: 'Admin' }, createdAt: new Date().toISOString() },
        ]);
      } else if (activeTab === 'users') {
        setUsersList([
          { _id: 'u1', fullName: 'Nguyễn Văn Hùng', email: 'hung@gmail.com', phone: '0912345678', role: 'landlord', status: 'active' },
          { _id: 'u2', fullName: 'Trần Thị Hoa', email: 'hoa@gmail.com', phone: '0987654321', role: 'tenant', status: 'active' },
          { _id: 'u3', fullName: 'Lê Văn Bảy (Spammer)', email: 'spammer@gmail.com', phone: '0933445566', role: 'tenant', status: 'locked' },
        ]);
      } else if (activeTab === 'moderation') {
        setRoomsList([
          {
            _id: 'room1',
            title: 'Phòng trọ giá rẻ cho sinh viên ĐHQG',
            price: 2200000,
            area: 20,
            address: { province: 'Bình Dương', district: 'Dĩ An', ward: 'Đông Hòa', detail: 'Tân Lập' },
            landlord: { fullName: 'Nguyễn Văn Hùng', email: 'hung@gmail.com' },
          },
        ]);
      } else if (activeTab === 'reports') {
        setReportsList([
          {
            _id: 'rep1',
            reporter: { fullName: 'Trần Thị Hoa', email: 'hoa@gmail.com' },
            room: { title: 'Căn hộ Studio mini full nội thất Kha Vạn Cân' },
            reason: 'wrong_price',
            description: 'Chủ nhà báo giá trên tin 4 triệu nhưng gọi điện lại đòi 5 triệu rưỡi.',
            status: 'pending',
          },
        ]);
      } else if (activeTab === 'settings') {
        setRoomTypes([
          { _id: 't1', name: 'Phòng trọ', isActive: true },
          { _id: 't2', name: 'Căn hộ mini', isActive: true },
        ]);
        setAmenities([
          { _id: 'a1', name: 'Wi-Fi', category: 'basic', isActive: true },
          { _id: 'a2', name: 'Điều hòa', category: 'basic', isActive: true },
        ]);
      }
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadAdminData();
  }, [activeTab, roomStatusFilter, userRoleFilter]);

  // ACTION HANDLERS
  const handleLockUnlockUser = async (id: string, currentStatus: string) => {
    // Admin cannot lock themselves
    if (id === user?.id) {
      alert('Bạn không thể tự khóa chính mình!');
      return;
    }
    const newStatus = currentStatus === 'locked' ? 'active' : 'locked';
    try {
      await api.patch(`/admin/users/${id}/status`, { status: newStatus });
      loadAdminData();
    } catch (err) {
      setUsersList(usersList.map((u) => u._id === id ? { ...u, status: newStatus } : u));
    }
  };

  const handleChangeUserRole = async (id: string, currentRole: string) => {
    if (id === user?.id) return;
    const newRole = currentRole === 'landlord' ? 'tenant' : 'landlord';
    try {
      await api.patch(`/admin/users/${id}/role`, { role: newRole });
      loadAdminData();
    } catch (err) {
      setUsersList(usersList.map((u) => u._id === id ? { ...u, role: newRole } : u));
    }
  };

  const handleApproveRoom = async (roomId: string) => {
    try {
      await api.patch(`/admin/rooms/${roomId}/approve`);
      loadAdminData();
    } catch (err) {
      setRoomsList(roomsList.filter((r) => r._id !== roomId));
    }
  };

  const handleRejectRoom = async () => {
    if (!rejectingRoomId || !rejectReason) return;
    try {
      await api.patch(`/admin/rooms/${rejectingRoomId}/reject`, { reason: rejectReason });
      setRejectingRoomId(null);
      setRejectReason('');
      loadAdminData();
    } catch (err) {
      setRoomsList(roomsList.filter((r) => r._id !== rejectingRoomId));
      setRejectingRoomId(null);
      setRejectReason('');
    }
  };

  const handleResolveReport = async () => {
    if (!handlingReportId) return;
    try {
      await api.patch(`/admin/reports/${handlingReportId}`, { status: 'resolved', handledNote: reportHandledNote });
      setHandlingReportId(null);
      setReportHandledNote('');
      loadAdminData();
    } catch (err) {
      setReportsList(reportsList.map((r) => r._id === handlingReportId ? { ...r, status: 'resolved', handledNote: reportHandledNote } : r));
      setHandlingReportId(null);
      setReportHandledNote('');
    }
  };

  const handleCreateRoomType = async () => {
    if (!newTypeName) return;
    try {
      await api.post('/admin/room-types', { name: newTypeName });
      setNewTypeName('');
      loadAdminData();
    } catch (err) {
      // fallback mock add
      setRoomTypes([...roomTypes, { _id: Date.now().toString(), name: newTypeName, isActive: true }]);
      setNewTypeName('');
    }
  };

  const handleCreateAmenity = async () => {
    if (!newAmenityName) return;
    try {
      await api.post('/admin/amenities', { name: newAmenityName });
      setNewAmenityName('');
      loadAdminData();
    } catch (err) {
      setAmenities([...amenities, { _id: Date.now().toString(), name: newAmenityName, category: 'basic', isActive: true }]);
      setNewAmenityName('');
    }
  };

  const getReportReasonLabel = (reason: string) => {
    if (reason === 'wrong_price') return 'Giá không chính xác';
    if (reason === 'inappropriate_images') return 'Ảnh không phù hợp';
    if (reason === 'scam') return 'Dấu hiệu lừa đảo';
    if (reason === 'not_exist') return 'Phòng không tồn tại';
    return 'Thông tin sai sự thật';
  };

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
            <Text style={styles.panelTitle}>Hệ thống RoomHub</Text>
            <Text style={styles.panelSubtitle}>Tóm tắt trạng thái và các số liệu thống kê toàn sàn RoomHub.</Text>

            <View style={styles.statsCards}>
              <View style={[styles.statCard, Shadows.sm]}>
                <Ionicons name="people" size={24} color={Colors.primary} />
                <Text style={styles.statVal}>{stats.totalUsers || 0}</Text>
                <Text style={styles.statLbl}>Tổng người dùng</Text>
              </View>
              <View style={[styles.statCard, Shadows.sm]}>
                <Ionicons name="business" size={24} color="#6366f1" />
                <Text style={styles.statVal}>{stats.totalRooms || 0}</Text>
                <Text style={styles.statLbl}>Tổng phòng trọ</Text>
              </View>
              <View style={[styles.statCard, Shadows.sm]}>
                <Ionicons name="hourglass" size={24} color={Colors.warning} />
                <Text style={styles.statVal}>{stats.pendingApprovalRooms || 0}</Text>
                <Text style={styles.statLbl}>Chờ duyệt phê duyệt</Text>
              </View>
              <View style={[styles.statCard, Shadows.sm]}>
                <Ionicons name="flag" size={24} color={Colors.danger} />
                <Text style={styles.statVal}>{stats.unhandledReports || 0}</Text>
                <Text style={styles.statLbl}>Báo cáo chưa xử lý</Text>
              </View>
            </View>

            {/* Quick logs list */}
            <View style={[styles.activitySection, Shadows.sm]}>
              <Text style={styles.sectionHeading}>Nhật ký hoạt động admin gần đây</Text>
              {logsList.length === 0 ? (
                <Text style={styles.noInfoText}>Không có nhật ký hoạt động gần đây.</Text>
              ) : (
                logsList.slice(0, 5).map((log) => (
                  <View key={log._id} style={styles.activityRow}>
                    <View style={styles.activityLeft}>
                      <Text style={styles.activityTitle}>
                        Action: <Text style={{ fontWeight: 'bold' }}>{log.action}</Text>
                      </Text>
                      <Text style={styles.activitySubtitle}>
                        Thực hiện bởi: {log.user?.fullName} | Lúc: {new Date(log.createdAt).toLocaleString('vi-VN')}
                      </Text>
                    </View>
                  </View>
                ))
              )}
            </View>
          </View>
        );

      case 'users':
        return (
          <View style={styles.tabPanel}>
            <Text style={styles.panelTitle}>Quản lý người dùng</Text>
            <Text style={styles.panelSubtitle}>Tìm kiếm, khóa tài khoản và phân quyền người dùng sàn.</Text>

            {/* Search filter row */}
            <View style={styles.filterRow}>
              <View style={styles.searchBox}>
                <Ionicons name="search" size={16} color="#64748b" />
                <TextInput
                  placeholder="Tìm theo tên, email, SĐT..."
                  value={userQuery}
                  onChangeText={setUserQuery}
                  onSubmitEditing={loadAdminData}
                  style={styles.filterInput}
                />
              </View>
              
              <View style={styles.roleFilterRow}>
                {['', 'tenant', 'landlord', 'admin'].map((role) => (
                  <Pressable
                    key={role}
                    onPress={() => setUserRoleFilter(role)}
                    style={[
                      styles.roleChip,
                      userRoleFilter === role && styles.roleChipActive,
                    ]}>
                    <Text style={[styles.roleChipText, userRoleFilter === role && styles.roleChipTextActive]}>
                      {role === '' ? 'Tất cả' : role === 'tenant' ? 'Người thuê' : role === 'landlord' ? 'Chủ phòng' : 'Admin'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {/* Users grid list */}
            <View style={styles.usersList}>
              {usersList.map((usr) => (
                <View key={usr._id} style={[styles.userRowCard, Shadows.sm, { flexDirection: Platform.OS === 'web' && width > 768 ? 'row' : 'column', alignItems: Platform.OS === 'web' && width > 768 ? 'center' : 'stretch' }]}>
                  <View style={styles.userInfo}>
                    <Text style={styles.userName}>{usr.fullName}</Text>
                    <Text style={styles.userEmail}>{usr.email} | SĐT: {usr.phone}</Text>
                    
                    <View style={styles.badgesRow}>
                      <View style={[styles.roleBadge, usr.role === 'admin' ? styles.badgeAdmin : usr.role === 'landlord' ? styles.badgeLandlord : styles.badgeTenant]}>
                        <Text style={styles.badgeText}>
                          {usr.role === 'admin' ? 'Admin' : usr.role === 'landlord' ? 'Chủ phòng' : 'Người thuê'}
                        </Text>
                      </View>
                      <View style={[styles.statusBadge, usr.status === 'locked' ? styles.badgeLocked : styles.badgeActive]}>
                        <Text style={styles.badgeText}>
                          {usr.status === 'locked' ? 'Bị khóa' : 'Hoạt động'}
                        </Text>
                      </View>
                    </View>
                  </View>

                  <View style={styles.userActions}>
                    <Pressable
                      onPress={() => handleLockUnlockUser(usr._id, usr.status)}
                      style={[styles.userActionBtn, usr.status === 'locked' ? styles.unlockBtn : styles.lockBtn]}
                      disabled={usr._id === user?.id}>
                      <Text style={styles.userActionBtnText}>
                        {usr.status === 'locked' ? 'Mở khóa' : 'Khóa'}
                      </Text>
                    </Pressable>

                    <Pressable
                      onPress={() => handleChangeUserRole(usr._id, usr.role)}
                      style={[styles.userActionBtn, styles.roleBtn]}
                      disabled={usr._id === user?.id}>
                      <Text style={styles.userActionBtnText}>
                        {usr.role === 'landlord' ? 'Làm Người thuê' : 'Làm Chủ phòng'}
                      </Text>
                    </Pressable>
                  </View>
                </View>
              ))}
            </View>
          </View>
        );

      case 'moderation':
        return (
          <View style={styles.tabPanel}>
            <View style={styles.panelHeaderRow}>
              <View>
                <Text style={styles.panelTitle}>Kiểm duyệt bài đăng</Text>
                <Text style={styles.panelSubtitle}>Xem xét và duyệt/từ chối các tin đăng phòng trọ mới.</Text>
              </View>
              <View style={styles.roleFilterRow}>
                {['pending', 'approved', 'rejected'].map((status) => (
                  <Pressable
                    key={status}
                    onPress={() => setRoomStatusFilter(status)}
                    style={[
                      styles.roleChip,
                      roomStatusFilter === status && styles.roleChipActive,
                    ]}>
                    <Text style={[styles.roleChipText, roomStatusFilter === status && styles.roleChipTextActive]}>
                      {status === 'pending' ? 'Chờ duyệt' : status === 'approved' ? 'Đã duyệt' : 'Bị từ chối'}
                    </Text>
                  </Pressable>
                ))}
              </View>
            </View>

            {roomsList.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <Ionicons name="checkbox-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTabText}>Không có phòng nào trong danh sách bộ lọc này.</Text>
              </View>
            ) : (
              <View style={styles.moderationList}>
                {roomsList.map((room) => (
                  <View key={room._id} style={[styles.moderationCard, Shadows.sm, { flexDirection: Platform.OS === 'web' && width > 768 ? 'row' : 'column', alignItems: Platform.OS === 'web' && width > 768 ? 'center' : 'stretch' }]}>
                    <View style={styles.modInfo}>
                      <Text style={styles.modTitle}>{room.title}</Text>
                      <Text style={styles.modMeta}>
                        Chủ phòng: {room.landlord?.fullName} | Giá: {formatPrice(room.price)} | Diện tích: {room.area}m²
                      </Text>
                      <Text style={styles.modAddress}>
                        Địa chỉ: {room.address?.detail}, {room.address?.district}, {room.address?.province}
                      </Text>
                      {room.moderationNote && (
                        <Text style={styles.modRejectNote}>Lý do từ chối trước đó: "{room.moderationNote}"</Text>
                      )}
                    </View>

                    {roomStatusFilter === 'pending' && (
                      <View style={styles.modActions}>
                        <Pressable
                          onPress={() => handleApproveRoom(room._id)}
                          style={[styles.modActionBtn, { backgroundColor: Colors.success }]}>
                          <Text style={styles.modActionBtnText}>Duyệt bài</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setRejectingRoomId(room._id)}
                          style={[styles.modActionBtn, { backgroundColor: Colors.danger }]}>
                          <Text style={styles.modActionBtnText}>Từ chối</Text>
                        </Pressable>
                      </View>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      case 'reports':
        return (
          <View style={styles.tabPanel}>
            <Text style={styles.panelTitle}>Báo cáo vi phạm</Text>
            <Text style={styles.panelSubtitle}>Xem xét và giải quyết các khiếu nại báo cáo từ người dùng.</Text>

            {reportsList.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <Ionicons name="flag-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTabText}>Chưa nhận được báo cáo vi phạm nào.</Text>
              </View>
            ) : (
              <View style={styles.reportsList}>
                {reportsList.map((report) => (
                  <View key={report._id} style={[styles.reportCard, Shadows.sm]}>
                    <View style={styles.reportHeader}>
                      <View style={[styles.reportBadge, report.status === 'resolved' ? styles.reportResolved : styles.reportPending]}>
                        <Text style={styles.reportBadgeText}>
                          {report.status === 'resolved' ? 'Đã xử lý' : 'Chờ xử lý'}
                        </Text>
                      </View>
                      <Text style={styles.reportTime}>Người gửi: {report.reporter?.fullName}</Text>
                    </View>

                    <Text style={styles.reportReason}>
                      Lý do: <Text style={{ color: Colors.danger, fontWeight: 'bold' }}>{getReportReasonLabel(report.reason)}</Text>
                    </Text>

                    <Text style={styles.reportRoomTitle}>Bài đăng bị báo cáo: {report.room?.title}</Text>
                    <Text style={styles.reportDesc}>Nội dung tố cáo: "{report.description}"</Text>

                    {report.status === 'pending' && (
                      <Pressable
                        onPress={() => setHandlingReportId(report._id)}
                        style={styles.handleReportBtn}>
                        <Text style={styles.handleReportBtnText}>Xử lý & Đóng báo cáo</Text>
                      </Pressable>
                    )}
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      case 'settings':
        return (
          <View style={styles.tabPanel}>
            <Text style={styles.panelTitle}>Cấu hình hệ thống & Nhật ký</Text>
            <Text style={styles.panelSubtitle}>Thêm loại phòng mới, thêm tiện ích mới và xem toàn bộ nhật ký hệ thống.</Text>

            <View style={styles.settingsGrid}>
              
              {/* Box 1: Room Types creator */}
              <View style={[styles.settingsCardBox, Shadows.sm]}>
                <Text style={styles.settingsBoxHeading}>Quản lý loại phòng</Text>
                <View style={styles.addSettingRow}>
                  <TextInput
                    placeholder="Tên loại phòng trọ..."
                    value={newTypeName}
                    onChangeText={setNewTypeName}
                    style={styles.settingInput}
                  />
                  <Pressable onPress={handleCreateRoomType} style={styles.settingAddBtn}>
                    <Text style={styles.settingAddBtnText}>Thêm</Text>
                  </Pressable>
                </View>
                <View style={styles.settingsListRow}>
                  {roomTypes.map((t) => (
                    <View key={t._id} style={styles.settingItemRow}>
                      <Text style={styles.settingItemName}>{t.name}</Text>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    </View>
                  ))}
                </View>
              </View>

              {/* Box 2: Amenities creator */}
              <View style={[styles.settingsCardBox, Shadows.sm]}>
                <Text style={styles.settingsBoxHeading}>Quản lý tiện ích</Text>
                <View style={styles.addSettingRow}>
                  <TextInput
                    placeholder="Tên tiện ích trọ..."
                    value={newAmenityName}
                    onChangeText={setNewAmenityName}
                    style={styles.settingInput}
                  />
                  <Pressable onPress={handleCreateAmenity} style={styles.settingAddBtn}>
                    <Text style={styles.settingAddBtnText}>Thêm</Text>
                  </Pressable>
                </View>
                <View style={styles.settingsListRow}>
                  {amenities.map((a) => (
                    <View key={a._id} style={styles.settingItemRow}>
                      <Text style={styles.settingItemName}>{a.name}</Text>
                      <Ionicons name="checkmark-circle" size={16} color={Colors.success} />
                    </View>
                  ))}
                </View>
              </View>

            </View>
          </View>
        );

      default:
        return null;
    }
  };

  return (
    <Layout>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.dashboardGrid, { flexDirection: Platform.OS === 'web' && width > 768 ? 'row' : 'column' }]}>
            
            {/* Sidebar Column */}
            <View style={[styles.sidebarCard, Shadows.sm, { width: Platform.OS === 'web' && width > 768 ? 260 : '100%' }]}>
              <View style={styles.userSummary}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarLargeText}>A</Text>
                </View>
                <Text style={styles.summaryName}>Administrator</Text>
                <View style={[styles.roleBadge, { backgroundColor: '#fee2e2' }]}>
                  <Text style={[styles.roleBadgeText, { color: Colors.danger }]}>Hệ thống Admin</Text>
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

            {/* Panel Column */}
            <View style={[styles.mainPanelCard, Shadows.sm]}>
              {renderTabContent()}
            </View>

          </View>
        </View>
      </View>

      {/* REJECT MODERATION INPUT DIALOG BOX */}
      {rejectingRoomId && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Từ chối phê duyệt bài đăng</Text>
              <Pressable onPress={() => setRejectingRoomId(null)}>
                <Ionicons name="close" size={24} />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Lý do từ chối *</Text>
                <TextInput
                  placeholder="Thông tin sai lệch / Hình ảnh không đúng thực tế..."
                  value={rejectReason}
                  onChangeText={setRejectReason}
                  style={styles.formInput}
                />
              </View>
              <Pressable onPress={handleRejectRoom} style={styles.modalSubmitBtn}>
                <Text style={styles.modalSubmitBtnText}>Từ chối phê duyệt</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}

      {/* RESOLVE REPORT DIALOG BOX */}
      {handlingReportId && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Giải quyết báo cáo vi phạm</Text>
              <Pressable onPress={() => setHandlingReportId(null)}>
                <Ionicons name="close" size={24} />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Ghi chú giải quyết *</Text>
                <TextInput
                  placeholder="Đã nhắc nhở chủ nhà / Đã ẩn bài viết vi phạm..."
                  value={reportHandledNote}
                  onChangeText={setReportHandledNote}
                  style={styles.formInput}
                />
              </View>
              <Pressable onPress={handleResolveReport} style={[styles.modalSubmitBtn, { backgroundColor: Colors.success }]}>
                <Text style={styles.modalSubmitBtnText}>Đóng & Giải quyết báo cáo</Text>
              </Pressable>
            </View>
          </View>
        </View>
      )}
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
    backgroundColor: Colors.danger,
    alignItems: 'center',
    justifyContent: 'center',
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
    paddingHorizontal: 12,
    paddingVertical: 4,
    borderRadius: Border.radius.full,
  },
  roleBadgeText: {
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
    minHeight: 500,
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
  panelHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xl,
    flexWrap: 'wrap',
    gap: Spacing.sm,
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
    minWidth: '22%',
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
  filterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
    marginBottom: Spacing.xl,
    backgroundColor: '#f8fafc',
    padding: Spacing.md,
    borderRadius: Border.radius.md,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Border.radius.md,
    paddingHorizontal: Spacing.sm,
    height: 38,
    gap: Spacing.xs,
    flex: 1,
    minWidth: 200,
    backgroundColor: 'white',
  },
  filterInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    outlineStyle: 'none',
  } as any,
  roleFilterRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  roleChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: Border.radius.sm,
    borderWidth: 1,
    borderColor: '#cbd5e1',
  },
  roleChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  roleChipText: {
    fontSize: 12,
    color: '#475569',
  },
  roleChipTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  usersList: {
    gap: Spacing.md,
  },
  userRowCard: {
    justifyContent: 'space-between',
    padding: Spacing.md,
    backgroundColor: '#f8fafc',
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: Spacing.md,
  },
  userInfo: {
    gap: 4,
    flex: 1,
  },
  userName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  userEmail: {
    fontSize: 13,
    color: '#64748b',
  },
  badgesRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 2,
  },
  roleBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Border.radius.sm,
  },
  badgeAdmin: {
    backgroundColor: '#fee2e2',
  },
  badgeLandlord: {
    backgroundColor: '#e0f2fe',
  },
  badgeTenant: {
    backgroundColor: '#f1f5f9',
  },
  badgeActive: {
    backgroundColor: '#ecfdf5',
  },
  badgeLocked: {
    backgroundColor: '#f1f5f9',
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Border.radius.sm,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#334155',
  },
  userActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  userActionBtn: {
    paddingHorizontal: 12,
    height: 32,
    borderRadius: Border.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  lockBtn: {
    borderWidth: 1,
    borderColor: Colors.danger,
  },
  unlockBtn: {
    backgroundColor: Colors.success,
  },
  roleBtn: {
    backgroundColor: Colors.primary,
  },
  userActionBtnText: {
    fontSize: 12,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  moderationList: {
    gap: Spacing.md,
  },
  moderationCard: {
    backgroundColor: '#f8fafc',
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: Spacing.md,
    gap: Spacing.md,
    justifyContent: 'space-between',
  },
  modInfo: {
    gap: 4,
    flex: 1,
  },
  modTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  modMeta: {
    fontSize: 13,
    color: '#475569',
  },
  modAddress: {
    fontSize: 13,
    color: '#64748b',
  },
  modRejectNote: {
    fontSize: 12,
    color: Colors.danger,
    fontStyle: 'italic',
  },
  modActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  modActionBtn: {
    paddingHorizontal: 14,
    height: 36,
    borderRadius: Border.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  modActionBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  modalOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    zIndex: 99999,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.xl,
  },
  modalCard: {
    backgroundColor: 'white',
    borderRadius: Border.radius.lg,
    width: Platform.OS === 'web' ? 400 : '100%',
    overflow: 'hidden',
  },
  modalHeader: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  modalTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  modalBody: {
    padding: Spacing.xl,
  },
  inputGroup: {
    gap: 4,
    width: '100%',
  },
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
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
  modalSubmitBtn: {
    backgroundColor: Colors.danger,
    height: 40,
    borderRadius: Border.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  modalSubmitBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  reportsList: {
    gap: Spacing.md,
  },
  reportCard: {
    backgroundColor: '#f8fafc',
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  reportHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  reportBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Border.radius.sm,
  },
  reportResolved: {
    backgroundColor: '#ecfdf5',
  },
  reportPending: {
    backgroundColor: '#fee2e2',
  },
  reportBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  reportTime: {
    fontSize: 12,
    color: '#64748b',
  },
  reportReason: {
    fontSize: 14,
    color: '#334155',
    marginVertical: 2,
  },
  reportRoomTitle: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  reportDesc: {
    fontSize: 13,
    color: '#475569',
    fontStyle: 'italic',
  },
  handleReportBtn: {
    borderWidth: 1,
    borderColor: Colors.primary,
    borderRadius: Border.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 8,
    marginTop: Spacing.xs,
  },
  handleReportBtnText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  settingsGrid: {
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: Spacing.lg,
  },
  settingsCardBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderRadius: Border.radius.md,
    padding: Spacing.lg,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    gap: Spacing.md,
  },
  settingsBoxHeading: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  addSettingRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  settingInput: {
    flex: 1,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Border.radius.md,
    paddingHorizontal: Spacing.sm,
    height: 36,
    fontSize: 13,
    backgroundColor: 'white',
    outlineStyle: 'none',
  } as any,
  settingAddBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 12,
    borderRadius: Border.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  settingAddBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  settingsListRow: {
    gap: Spacing.xs,
    marginTop: Spacing.xs,
  },
  settingItemRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 6,
    borderBottomWidth: 1,
    borderBottomColor: '#cbd5e1',
  },
  settingItemName: {
    fontSize: 13,
    color: '#334155',
  },
});
