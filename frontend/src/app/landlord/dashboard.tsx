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

// Sidebar Landlord Menu
const MENU_ITEMS = [
  { id: 'overview', label: 'Tổng quan', icon: 'bar-chart-outline' },
  { id: 'rooms', label: 'Quản lý phòng', icon: 'business-outline' },
  { id: 'create', label: 'Đăng phòng mới', icon: 'add-circle-outline' },
  { id: 'requests', label: 'Yêu cầu thuê nhận', icon: 'incoming-outline' },
];

export default function LandlordDashboardScreen() {
  const { user, isAuthenticated } = useAuthStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const { tab } = useLocalSearchParams<{ tab?: string }>();
  const [activeTab, setActiveTab] = useState('overview');

  useEffect(() => {
    if (tab && MENU_ITEMS.some(item => item.id === tab)) {
      setActiveTab(tab);
    }
  }, [tab]);

  // Loaded Data
  const [rooms, setRooms] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);
  const [stats, setStats] = useState<any>({
    totalRooms: 0,
    availableRooms: 0,
    rentedRooms: 0,
    pendingApproval: 0,
    totalViews: 0,
    totalFavorites: 0,
    totalRequests: 0,
    newRequests: 0,
  });
  const [roomTypes, setRoomTypes] = useState<any[]>([]);
  const [amenities, setAmenities] = useState<any[]>([]);
  const [loadingData, setLoadingData] = useState(false);

  // CREATE ROOM MULTI-STEP STATE
  const [createStep, setCreateStep] = useState(1);
  const [newRoomTitle, setNewRoomTitle] = useState('');
  const [newRoomDesc, setNewRoomDesc] = useState('');
  const [newRoomType, setNewRoomType] = useState('');
  const [newRoomPrice, setNewRoomPrice] = useState('');
  const [newRoomDeposit, setNewRoomDeposit] = useState('');
  const [newRoomElectric, setNewRoomElectric] = useState('');
  const [newRoomWater, setNewRoomWater] = useState('');
  const [newRoomInternet, setNewRoomInternet] = useState('');
  const [newRoomService, setNewRoomService] = useState('');
  const [newRoomArea, setNewRoomArea] = useState('');
  const [newRoomMaxOccupants, setNewRoomMaxOccupants] = useState('');
  const [newRoomProvince, setNewRoomProvince] = useState('Bình Dương');
  const [newRoomDistrict, setNewRoomDistrict] = useState('Dĩ An');
  const [newRoomWard, setNewRoomWard] = useState('Đông Hòa');
  const [newRoomDetail, setNewRoomDetail] = useState('');
  const [newRoomAmenities, setNewRoomAmenities] = useState<string[]>([]);
  const [newRoomAllowPets, setNewRoomAllowPets] = useState(false);
  const [newRoomFreeHours, setNewRoomFreeHours] = useState(false);
  
  // Custom image url input for testing
  const [newRoomImageUrl, setNewRoomImageUrl] = useState('');
  const [newRoomImages, setNewRoomImages] = useState<string[]>([
    'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80'
  ]);

  const [createLoading, setCreateLoading] = useState(false);
  const [createSuccess, setCreateSuccess] = useState('');
  const [createError, setCreateError] = useState('');

  // Reject Request State (Modal input)
  const [rejectingRequestId, setRejectingRequestId] = useState<string | null>(null);
  const [rejectNote, setRejectNote] = useState('');

  // Guard routing
  useEffect(() => {
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthenticated]);

  // Load Data
  const loadLandlordData = async () => {
    if (!isAuthenticated) return;
    setLoadingData(true);
    try {
      // Fetch Room Types & Amenities for creator dropdowns
      if (roomTypes.length === 0) {
        const [typesRes, amenitiesRes] = await Promise.all([
          api.get('/admin/room-types').catch(() => ({ data: { types: [] } })),
          api.get('/admin/amenities').catch(() => ({ data: { amenities: [] } })),
        ]);
        setRoomTypes(typesRes.data.types || []);
        setAmenities(amenitiesRes.data.amenities || []);
      }

      // Fetch Stats
      const statsRes = await api.get('/rooms/stats');
      setStats(statsRes.data.stats || {});

      // Fetch Rooms list
      const roomsRes = await api.get('/rooms/my');
      setRooms(roomsRes.data.rooms || []);

      // Fetch Requests received
      const requestsRes = await api.get('/requests/landlord');
      setRequests(requestsRes.data.requests || []);
    } catch (err) {
      console.warn('Failed to fetch landlord data, using fallback mocks:', err);
      // Fallback mocks
      setRooms([
        {
          _id: 'room1',
          title: 'Phòng trọ dịch vụ cao cấp Làng Đại học Quốc gia',
          price: 2800000,
          status: 'available',
          moderationStatus: 'approved',
          views: 145,
          favoriteCount: 22,
          images: [{ url: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=150&q=80' }],
        },
      ]);
      setRequests([
        {
          _id: 'req1',
          room: { title: 'Phòng trọ dịch vụ cao cấp Làng Đại học Quốc gia' },
          tenant: { fullName: 'Trần Thị Hoa', phone: '0987654321', email: 'hoa@gmail.com' },
          viewingDate: new Date().toISOString(),
          status: 'pending',
          message: 'Chào chủ nhà, tôi muốn xem phòng.',
        },
      ]);
      setStats({
        totalRooms: 1,
        availableRooms: 1,
        rentedRooms: 0,
        pendingApproval: 0,
        totalViews: 145,
        totalFavorites: 22,
        totalRequests: 1,
        newRequests: 1,
      });
    } finally {
      setLoadingData(false);
    }
  };

  useEffect(() => {
    loadLandlordData();
  }, [activeTab]);

  const handleToggleRoomStatus = async (id: string) => {
    try {
      await api.patch(`/rooms/${id}/toggle`);
      loadLandlordData();
    } catch (err) {
      // Toggle locally
      setRooms(rooms.map((r) => r._id === id ? { ...r, status: r.status === 'available' ? 'hidden' : 'available' } : r));
    }
  };

  const handleDeleteRoom = async (id: string) => {
    try {
      await api.delete(`/rooms/${id}`);
      loadLandlordData();
    } catch (err) {
      setRooms(rooms.filter((r) => r._id !== id));
    }
  };

  // Submit Rent Requests Actions
  const handleAcceptRequest = async (id: string) => {
    try {
      await api.patch(`/requests/${id}/accept`);
      loadLandlordData();
    } catch (err) {
      setRequests(requests.map((r) => r._id === id ? { ...r, status: 'accepted' } : r));
    }
  };

  const handleRejectRequest = async () => {
    if (!rejectingRequestId) return;
    try {
      await api.patch(`/requests/${rejectingRequestId}/reject`, { landlordNote: rejectNote });
      setRejectingRequestId(null);
      setRejectNote('');
      loadLandlordData();
    } catch (err) {
      setRequests(requests.map((r) => r._id === rejectingRequestId ? { ...r, status: 'rejected', landlordNote: rejectNote } : r));
      setRejectingRequestId(null);
      setRejectNote('');
    }
  };

  const handleCompleteRequest = async (id: string) => {
    try {
      await api.patch(`/requests/${id}/complete`);
      loadLandlordData();
    } catch (err) {
      setRequests(requests.map((r) => r._id === id ? { ...r, status: 'completed' } : r));
    }
  };

  // MULTI-STEP CREATION HANDLER
  const handleAddImage = () => {
    if (!newRoomImageUrl) return;
    setNewRoomImages([...newRoomImages, newRoomImageUrl]);
    setNewRoomImageUrl('');
  };

  const handleCreateRoomSubmit = async () => {
    setCreateLoading(true);
    setCreateError('');
    setCreateSuccess('');

    // Prepare data
    const matchedType = roomTypes.find((t) => t.name === newRoomType) || { _id: '507f1f087c5011de0b71837f' }; // fallback
    const matchedAmenitiesIds = amenities
      .filter((a) => newRoomAmenities.includes(a.name))
      .map((a) => a._id);

    const roomData = {
      title: newRoomTitle,
      description: newRoomDesc,
      type: matchedType._id,
      price: Number(newRoomPrice),
      deposit: Number(newRoomDeposit),
      electricityFee: Number(newRoomElectric) || 0,
      waterFee: Number(newRoomWater) || 0,
      internetFee: Number(newRoomInternet) || 0,
      serviceFee: Number(newRoomService) || 0,
      area: Number(newRoomArea),
      maxOccupants: Number(newRoomMaxOccupants),
      address: {
        province: newRoomProvince,
        district: newRoomDistrict,
        ward: newRoomWard,
        detail: newRoomDetail,
      },
      amenities: matchedAmenitiesIds,
      images: newRoomImages.map((url, i) => ({ url, isMain: i === 0, order: i })),
      allowPets: newRoomAllowPets,
      freeHours: newRoomFreeHours,
    };

    try {
      await api.post('/rooms', roomData);
      setCreateSuccess('Đăng tin phòng mới thành công! Bài viết đang chờ admin kiểm duyệt.');
      // Reset form fields
      setTimeout(() => {
        setActiveTab('rooms');
        setCreateStep(1);
        setNewRoomTitle('');
        setNewRoomDesc('');
        setNewRoomPrice('');
        setNewRoomDeposit('');
        setNewRoomArea('');
        setNewRoomMaxOccupants('');
        setNewRoomDetail('');
        setNewRoomAmenities([]);
      }, 2000);
    } catch (err: any) {
      setCreateError(err.response?.data?.message || 'Đăng tin phòng trọ thất bại. Vui lòng kiểm tra lại.');
    } finally {
      setCreateLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price ? (price / 1000000).toFixed(1) + ' triệu' : '0';
  };

  const getRequestStatusLabel = (status: string) => {
    if (status === 'accepted') return 'Đã chấp nhận';
    if (status === 'rejected') return 'Bị từ chối';
    if (status === 'cancelled') return 'Đã hủy';
    if (status === 'completed') return 'Đã hoàn thành';
    return 'Chờ xử lý';
  };

  const getRequestStatusStyle = (status: string) => {
    if (status === 'accepted') return styles.statusAccepted;
    if (status === 'rejected') return styles.statusRejected;
    if (status === 'cancelled') return styles.statusCancelled;
    if (status === 'completed') return styles.statusCompleted;
    return styles.statusPending;
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
            <Text style={styles.panelTitle}>Tổng quan hoạt động</Text>
            <Text style={styles.panelSubtitle}>Tóm tắt về hiệu năng các bài đăng phòng cho thuê của bạn.</Text>

            <View style={styles.statsCards}>
              <View style={[styles.statCard, Shadows.sm]}>
                <Ionicons name="business" size={24} color={Colors.primary} />
                <Text style={styles.statVal}>{stats.totalRooms || 0}</Text>
                <Text style={styles.statLbl}>Tổng bài đăng</Text>
              </View>
              <View style={[styles.statCard, Shadows.sm]}>
                <Ionicons name="checkmark-circle" size={24} color={Colors.success} />
                <Text style={styles.statVal}>{stats.rentedRooms || 0}</Text>
                <Text style={styles.statLbl}>Đã cho thuê</Text>
              </View>
              <View style={[styles.statCard, Shadows.sm]}>
                <Ionicons name="eye" size={24} color="#6366f1" />
                <Text style={styles.statVal}>{stats.totalViews || 0}</Text>
                <Text style={styles.statLbl}>Lượt xem tin</Text>
              </View>
              <View style={[styles.statCard, Shadows.sm]}>
                <Ionicons name="mail" size={24} color={Colors.warning} />
                <Text style={styles.statVal}>{stats.newRequests || 0}</Text>
                <Text style={styles.statLbl}>Yêu cầu mới</Text>
              </View>
            </View>

            {/* Recent rooms or active requests received */}
            <View style={[styles.activitySection, Shadows.sm]}>
              <Text style={styles.sectionHeading}>Danh sách yêu cầu mới nhất</Text>
              {requests.filter((r) => r.status === 'pending').length === 0 ? (
                <Text style={styles.noInfoText}>Không có yêu cầu thuê phòng mới nào đang chờ duyệt.</Text>
              ) : (
                requests
                  .filter((r) => r.status === 'pending')
                  .slice(0, 3)
                  .map((req) => (
                    <View key={req._id} style={styles.activityRow}>
                      <View style={styles.activityLeft}>
                        <Text style={styles.activityTitle}>{req.room?.title || 'Phòng'}</Text>
                        <Text style={styles.activitySubtitle}>
                          Người gửi: {req.tenant?.fullName} | SĐT: {req.tenant?.phone}
                        </Text>
                      </View>
                      <Pressable
                        onPress={() => setActiveTab('requests')}
                        style={styles.actionLinkBtn}>
                        <Text style={styles.actionLinkText}>Xử lý ngay</Text>
                      </Pressable>
                    </View>
                  ))
              )}
            </View>
          </View>
        );

      case 'rooms':
        return (
          <View style={styles.tabPanel}>
            <View style={styles.panelHeaderRow}>
              <View>
                <Text style={styles.panelTitle}>Quản lý phòng cho thuê</Text>
                <Text style={styles.panelSubtitle}>Danh sách các bài viết phòng trọ của bạn trên RoomHub.</Text>
              </View>
              <Pressable onPress={() => setActiveTab('create')} style={styles.panelHeaderBtn}>
                <Ionicons name="add" size={18} color="white" />
                <Text style={styles.panelHeaderBtnText}>Đăng phòng mới</Text>
              </Pressable>
            </View>

            {rooms.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <Ionicons name="business-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTabText}>Bạn chưa đăng bài phòng trọ nào.</Text>
              </View>
            ) : (
              <View style={styles.roomsList}>
                {rooms.map((room) => (
                  <View key={room._id} style={[styles.roomCardRow, Shadows.sm]}>
                    <Image source={{ uri: room.images?.[0]?.url }} style={styles.roomRowImg} />
                    <View style={styles.roomRowInfo}>
                      <Text style={styles.roomRowTitle} numberOfLines={1}>{room.title}</Text>
                      <Text style={styles.roomRowPrice}>{formatPrice(room.price)} / tháng</Text>
                      
                      <View style={styles.roomBadges}>
                        {/* Moderation Status */}
                        <View style={[
                          styles.statusBadge,
                          room.moderationStatus === 'approved' ? styles.statusApprovedBadge :
                          room.moderationStatus === 'rejected' ? styles.statusRejectedBadge :
                          styles.statusPendingBadge
                        ]}>
                          <Text style={styles.statusBadgeText}>
                            {room.moderationStatus === 'approved' ? 'Đã duyệt' :
                             room.moderationStatus === 'rejected' ? 'Bị từ chối' : 'Chờ duyệt'}
                          </Text>
                        </View>

                        {/* Visibility Status */}
                        <View style={[
                          styles.statusBadge,
                          room.status === 'available' ? styles.statusAvailableBadge : styles.statusHiddenBadge
                        ]}>
                          <Text style={styles.statusBadgeText}>
                            {room.status === 'available' ? 'Đang hiển thị' : 'Đã ẩn'}
                          </Text>
                        </View>
                      </View>
                    </View>

                    <View style={styles.roomRowActions}>
                      <Pressable
                        onPress={() => handleToggleRoomStatus(room._id)}
                        style={styles.actionIconBtn}
                        title={room.status === 'available' ? 'Ẩn bài đăng' : 'Hiện bài đăng'}>
                        <Ionicons
                          name={room.status === 'available' ? 'eye-off-outline' : 'eye-outline'}
                          size={18}
                          color={Colors.primary}
                        />
                      </Pressable>

                      <Pressable
                        onPress={() => handleDeleteRoom(room._id)}
                        style={styles.actionIconBtn}>
                        <Ionicons name="trash-outline" size={18} color={Colors.danger} />
                      </Pressable>
                    </View>
                  </View>
                ))}
              </View>
            )}
          </View>
        );

      case 'create':
        return (
          <View style={styles.tabPanel}>
            <Text style={styles.panelTitle}>Đăng tin cho thuê phòng mới</Text>
            <Text style={styles.panelSubtitle}>Thực hiện theo biểu mẫu {createStep}/5 bước dưới đây.</Text>

            {createSuccess ? <Text style={styles.successAlert}>{createSuccess}</Text> : null}
            {createError ? <Text style={styles.errorAlert}>{createError}</Text> : null}

            {/* STEP 1: Basic details */}
            {createStep === 1 && (
              <View style={styles.stepForm}>
                <Text style={styles.stepTitle}>Bước 1: Thông tin cơ bản</Text>
                
                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tiêu đề bài đăng *</Text>
                  <TextInput
                    placeholder="Ví dụ: Phòng trọ cao cấp gác lửng gần Làng Đại Học"
                    value={newRoomTitle}
                    onChangeText={setNewRoomTitle}
                    style={styles.formInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Loại hình phòng *</Text>
                  <TextInput
                    placeholder="Phòng trọ / Căn hộ mini / Chung cư"
                    value={newRoomType}
                    onChangeText={setNewRoomType}
                    style={styles.formInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Mô tả chi tiết phòng *</Text>
                  <TextInput
                    placeholder="Mô tả các ưu điểm phòng trọ, lối đi riêng..."
                    multiline
                    numberOfLines={6}
                    value={newRoomDesc}
                    onChangeText={setNewRoomDesc}
                    style={[styles.formInput, { height: 120, textAlignVertical: 'top' }]}
                  />
                </View>

                <View style={styles.rangeRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Diện tích (m²) *</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={newRoomArea}
                      onChangeText={setNewRoomArea}
                      style={styles.formInput}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Số người tối đa *</Text>
                    <TextInput
                      keyboardType="numeric"
                      value={newRoomMaxOccupants}
                      onChangeText={setNewRoomMaxOccupants}
                      style={styles.formInput}
                    />
                  </View>
                </View>

                <Pressable onPress={() => setCreateStep(2)} style={styles.nextStepBtn}>
                  <Text style={styles.nextStepBtnText}>Tiếp tục</Text>
                </Pressable>
              </View>
            )}

            {/* STEP 2: Prices */}
            {createStep === 2 && (
              <View style={styles.stepForm}>
                <Text style={styles.stepTitle}>Bước 2: Giá và chi phí dịch vụ</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Giá thuê hàng tháng (VNĐ) *</Text>
                  <TextInput
                    placeholder="Ví dụ: 2500000"
                    keyboardType="numeric"
                    value={newRoomPrice}
                    onChangeText={setNewRoomPrice}
                    style={styles.formInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tiền đặt cọc (VNĐ) *</Text>
                  <TextInput
                    placeholder="Ví dụ: 2000000"
                    keyboardType="numeric"
                    value={newRoomDeposit}
                    onChangeText={setNewRoomDeposit}
                    style={styles.formInput}
                  />
                </View>

                <View style={styles.rangeRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Tiền điện (đ/kWh)</Text>
                    <TextInput
                      placeholder="3500"
                      keyboardType="numeric"
                      value={newRoomElectric}
                      onChangeText={setNewRoomElectric}
                      style={styles.formInput}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Tiền nước (đ/m3 hoặc đ/người)</Text>
                    <TextInput
                      placeholder="100000"
                      keyboardType="numeric"
                      value={newRoomWater}
                      onChangeText={setNewRoomWater}
                      style={styles.formInput}
                    />
                  </View>
                </View>

                <View style={styles.rangeRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Phí internet (đ/tháng)</Text>
                    <TextInput
                      placeholder="50000"
                      keyboardType="numeric"
                      value={newRoomInternet}
                      onChangeText={setNewRoomInternet}
                      style={styles.formInput}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Phí dịch vụ khác (đ/tháng)</Text>
                    <TextInput
                      placeholder="50000"
                      keyboardType="numeric"
                      value={newRoomService}
                      onChangeText={setNewRoomService}
                      style={styles.formInput}
                    />
                  </View>
                </View>

                <View style={styles.navigationButtons}>
                  <Pressable onPress={() => setCreateStep(1)} style={styles.backStepBtn}>
                    <Text style={styles.backStepBtnText}>Quay lại</Text>
                  </Pressable>
                  <Pressable onPress={() => setCreateStep(3)} style={[styles.nextStepBtn, { flex: 1 }]}>
                    <Text style={styles.nextStepBtnText}>Tiếp tục</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* STEP 3: Address */}
            {createStep === 3 && (
              <View style={styles.stepForm}>
                <Text style={styles.stepTitle}>Bước 3: Địa chỉ bài đăng</Text>

                <View style={styles.rangeRow}>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Tỉnh / Thành phố *</Text>
                    <TextInput
                      value={newRoomProvince}
                      onChangeText={setNewRoomProvince}
                      style={styles.formInput}
                    />
                  </View>
                  <View style={[styles.inputGroup, { flex: 1 }]}>
                    <Text style={styles.inputLabel}>Quận / Huyện *</Text>
                    <TextInput
                      value={newRoomDistrict}
                      onChangeText={setNewRoomDistrict}
                      style={styles.formInput}
                    />
                  </View>
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Phường / Xã *</Text>
                  <TextInput
                    value={newRoomWard}
                    onChangeText={setNewRoomWard}
                    style={styles.formInput}
                  />
                </View>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Địa chỉ chi tiết (Số nhà, tên đường...) *</Text>
                  <TextInput
                    placeholder="Ví dụ: Số 20, Đường Kha Vạn Cân"
                    value={newRoomDetail}
                    onChangeText={setNewRoomDetail}
                    style={styles.formInput}
                  />
                </View>

                <View style={styles.navigationButtons}>
                  <Pressable onPress={() => setCreateStep(2)} style={styles.backStepBtn}>
                    <Text style={styles.backStepBtnText}>Quay lại</Text>
                  </Pressable>
                  <Pressable onPress={() => setCreateStep(4)} style={[styles.nextStepBtn, { flex: 1 }]}>
                    <Text style={styles.nextStepBtnText}>Tiếp tục</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* STEP 4: Amenities */}
            {createStep === 4 && (
              <View style={styles.stepForm}>
                <Text style={styles.stepTitle}>Bước 4: Tiện ích và quy định</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Chọn các tiện ích sẵn có</Text>
                  <View style={styles.amenitiesChecklist}>
                    {['Wi-Fi', 'Điều hòa', 'Tủ lạnh', 'Chỗ để xe', 'Camera', 'Thang máy'].map((name) => {
                      const isChecked = newRoomAmenities.includes(name);
                      return (
                        <Pressable
                          key={name}
                          onPress={() => {
                            if (isChecked) {
                              setNewRoomAmenities(newRoomAmenities.filter((a) => a !== name));
                            } else {
                              setNewRoomAmenities([...newRoomAmenities, name]);
                            }
                          }}
                          style={styles.checkboxRow}>
                          <Ionicons
                            name={isChecked ? 'checkbox' : 'square-outline'}
                            size={20}
                            color={isChecked ? Colors.primary : '#94a3b8'}
                          />
                          <Text style={styles.checkboxLabel}>{name}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Additional Rules */}
                <View style={styles.checkboxRow}>
                  <Pressable onPress={() => setNewRoomAllowPets(!newRoomAllowPets)}>
                    <Ionicons
                      name={newRoomAllowPets ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={newRoomAllowPets ? Colors.primary : '#94a3b8'}
                    />
                  </Pressable>
                  <Text style={styles.checkboxLabel}>Cho phép nuôi thú cưng</Text>
                </View>

                <View style={styles.checkboxRow}>
                  <Pressable onPress={() => setNewRoomFreeHours(!newRoomFreeHours)}>
                    <Ionicons
                      name={newRoomFreeHours ? 'checkbox' : 'square-outline'}
                      size={20}
                      color={newRoomFreeHours ? Colors.primary : '#94a3b8'}
                    />
                  </Pressable>
                  <Text style={styles.checkboxLabel}>Giờ giấc tự do (Khóa vân tay, không chung chủ)</Text>
                </View>

                <View style={styles.navigationButtons}>
                  <Pressable onPress={() => setCreateStep(3)} style={styles.backStepBtn}>
                    <Text style={styles.backStepBtnText}>Quay lại</Text>
                  </Pressable>
                  <Pressable onPress={() => setCreateStep(5)} style={[styles.nextStepBtn, { flex: 1 }]}>
                    <Text style={styles.nextStepBtnText}>Tiếp tục</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {/* STEP 5: Images & Confirmation */}
            {createStep === 5 && (
              <View style={styles.stepForm}>
                <Text style={styles.stepTitle}>Bước 5: Hình ảnh & Hoàn tất</Text>

                <View style={styles.inputGroup}>
                  <Text style={styles.inputLabel}>Tải ảnh lên (Hoặc nhập URL hình ảnh minh họa)</Text>
                  <View style={styles.imageInputRow}>
                    <TextInput
                      placeholder="Dán link ảnh (Unsplash/Imgur...) hoặc tải lên"
                      value={newRoomImageUrl}
                      onChangeText={setNewRoomImageUrl}
                      style={[styles.formInput, { flex: 1 }]}
                    />
                    <Pressable onPress={handleAddImage} style={styles.addImageBtn}>
                      <Text style={styles.addImageBtnText}>Thêm</Text>
                    </Pressable>
                  </View>
                </View>

                {/* Display current selected images */}
                <View style={styles.imagesPreviewList}>
                  {newRoomImages.map((url, index) => (
                    <View key={index} style={styles.previewImageCard}>
                      <Image source={{ uri: url }} style={styles.previewImage} />
                      <Pressable
                        onPress={() => setNewRoomImages(newRoomImages.filter((_, idx) => idx !== index))}
                        style={styles.deletePreviewImageBtn}>
                        <Ionicons name="close-circle" size={20} color={Colors.danger} />
                      </Pressable>
                    </View>
                  ))}
                </View>

                <View style={styles.divider} />

                <View style={styles.navigationButtons}>
                  <Pressable onPress={() => setCreateStep(4)} style={styles.backStepBtn}>
                    <Text style={styles.backStepBtnText}>Quay lại</Text>
                  </Pressable>
                  <Pressable
                    disabled={createLoading}
                    onPress={handleCreateRoomSubmit}
                    style={[styles.nextStepBtn, { flex: 1, backgroundColor: Colors.success }]}>
                    {createLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.nextStepBtnText}>Hoàn tất & Đăng tin</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </View>
        );

      case 'requests':
        return (
          <View style={styles.tabPanel}>
            <Text style={styles.panelTitle}>Yêu cầu thuê phòng nhận được</Text>
            <Text style={styles.panelSubtitle}>Xem thông tin người có nhu cầu xem hoặc thuê phòng trọ của bạn.</Text>

            {requests.length === 0 ? (
              <View style={styles.emptyTabBox}>
                <Ionicons name="mail-unread-outline" size={48} color="#cbd5e1" />
                <Text style={styles.emptyTabText}>Bạn chưa nhận được yêu cầu nào.</Text>
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
                        <Text style={{ fontWeight: 'bold' }}>Người gửi: </Text>
                        {req.tenant?.fullName} ({req.tenant?.phone} | {req.tenant?.email})
                      </Text>
                      <Text style={styles.reqInfoText}>
                        <Text style={{ fontWeight: 'bold' }}>Lịch hẹn xem: </Text>
                        {new Date(req.viewingDate).toLocaleString('vi-VN')}
                      </Text>
                      {req.message ? (
                        <Text style={styles.reqInfoText}>
                          <Text style={{ fontWeight: 'bold' }}>Lời nhắn: </Text>"{req.message}"
                        </Text>
                      ) : null}
                    </View>

                    {/* Landlord Decision Buttons */}
                    {req.status === 'pending' && (
                      <View style={styles.decisionButtons}>
                        <Pressable
                          onPress={() => handleAcceptRequest(req._id)}
                          style={[styles.decisionBtn, { backgroundColor: Colors.success }]}>
                          <Text style={styles.decisionBtnText}>Chấp nhận hẹn</Text>
                        </Pressable>
                        <Pressable
                          onPress={() => setRejectingRequestId(req._id)}
                          style={[styles.decisionBtn, { backgroundColor: Colors.danger }]}>
                          <Text style={styles.decisionBtnText}>Từ chối</Text>
                        </Pressable>
                      </View>
                    )}

                    {req.status === 'accepted' && (
                      <Pressable
                        onPress={() => handleCompleteRequest(req._id)}
                        style={styles.completeRequestBtn}>
                        <Ionicons name="checkmark-circle-outline" size={16} color="white" />
                        <Text style={styles.completeRequestBtnText}>Đánh dấu đã dọn vào / Hoàn thành giao dịch</Text>
                      </Pressable>
                    )}
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

  return (
    <Layout>
      <View style={styles.container}>
        <View style={styles.content}>
          <View style={[styles.dashboardGrid, { flexDirection: Platform.OS === 'web' && width > 768 ? 'row' : 'column' }]}>
            
            {/* Sidebar Column */}
            <View style={[styles.sidebarCard, Shadows.sm, { width: Platform.OS === 'web' && width > 768 ? 260 : '100%' }]}>
              <View style={styles.userSummary}>
                <View style={styles.avatarLarge}>
                  <Text style={styles.avatarLargeText}>
                    {user?.fullName.charAt(0).toUpperCase()}
                  </Text>
                </View>
                <Text style={styles.summaryName}>{user?.fullName}</Text>
                <View style={[styles.roleBadge, { backgroundColor: '#e0f2fe' }]}>
                  <Text style={[styles.roleBadgeText, { color: Colors.primary }]}>Chủ phòng cho thuê</Text>
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

      {/* REJECT REQUEST DIALOG BOX MODAL */}
      {rejectingRequestId && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Từ chối lịch xem phòng</Text>
              <Pressable onPress={() => setRejectingRequestId(null)}>
                <Ionicons name="close" size={24} />
              </Pressable>
            </View>
            <View style={styles.modalBody}>
              <View style={styles.inputGroup}>
                <Text style={styles.inputLabel}>Lý do từ chối *</Text>
                <TextInput
                  placeholder="Lịch hẹn không phù hợp / Phòng đã có người cọc..."
                  value={rejectNote}
                  onChangeText={setRejectNote}
                  style={styles.formInput}
                />
              </View>
              <Pressable onPress={handleRejectRequest} style={[styles.saveProfileBtn, { backgroundColor: Colors.danger }]}>
                <Text style={styles.saveProfileBtnText}>Từ chối yêu cầu</Text>
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
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
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
  },
  panelHeaderBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: Border.radius.md,
    gap: 4,
  },
  panelHeaderBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
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
    fontWeight: 'bold',
    color: '#334155',
  },
  activitySubtitle: {
    fontSize: 12,
    color: '#64748b',
  },
  actionLinkBtn: {
    paddingVertical: 4,
    paddingHorizontal: 8,
    backgroundColor: Colors.secondary,
    borderRadius: Border.radius.sm,
  },
  actionLinkText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  noInfoText: {
    color: '#64748b',
    fontSize: 13,
  },
  roomsList: {
    gap: Spacing.md,
  },
  roomCardRow: {
    flexDirection: 'row',
    backgroundColor: '#f8fafc',
    borderRadius: Border.radius.md,
    padding: Spacing.md,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    gap: Spacing.md,
  },
  roomRowImg: {
    width: 60,
    height: 60,
    borderRadius: Border.radius.md,
  },
  roomRowInfo: {
    flex: 1,
    gap: 2,
  },
  roomRowTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  roomRowPrice: {
    fontSize: 13,
    color: Colors.primary,
    fontWeight: '600',
  },
  roomBadges: {
    flexDirection: 'row',
    gap: Spacing.xs,
    marginTop: 2,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: Border.radius.sm,
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: 'bold',
  },
  statusApprovedBadge: {
    backgroundColor: '#ecfdf5',
  },
  statusRejectedBadge: {
    backgroundColor: '#fee2e2',
  },
  statusPendingBadge: {
    backgroundColor: '#fffbeb',
  },
  statusAvailableBadge: {
    backgroundColor: '#f0f9ff',
  },
  statusHiddenBadge: {
    backgroundColor: '#f1f5f9',
  },
  roomRowActions: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  actionIconBtn: {
    padding: 6,
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
  stepForm: {
    gap: Spacing.md,
    maxWidth: 600,
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    paddingBottom: Spacing.sm,
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
  rangeRow: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  nextStepBtn: {
    backgroundColor: Colors.primary,
    height: 40,
    borderRadius: Border.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  nextStepBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  navigationButtons: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  backStepBtn: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Border.radius.md,
    width: 100,
    height: 40,
    alignItems: 'center',
    justifyContent: 'center',
  },
  backStepBtnText: {
    color: '#475569',
    fontWeight: 'bold',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  checkboxLabel: {
    fontSize: 13,
    color: '#334155',
  },
  amenitiesChecklist: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
    marginTop: 4,
  },
  imageInputRow: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  addImageBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    borderRadius: Border.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  addImageBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  imagesPreviewList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.sm,
    marginTop: Spacing.sm,
  },
  previewImageCard: {
    width: 100,
    height: 80,
    borderRadius: Border.radius.md,
    overflow: 'hidden',
    position: 'relative',
  },
  previewImage: {
    width: '100%',
    height: '100%',
  },
  deletePreviewImageBtn: {
    position: 'absolute',
    top: 2,
    right: 2,
    zIndex: 10,
  },
  successAlert: {
    color: Colors.success,
    backgroundColor: '#ecfdf5',
    padding: Spacing.md,
    borderRadius: Border.radius.md,
    marginBottom: Spacing.md,
    fontWeight: 'bold',
  },
  errorAlert: {
    color: Colors.danger,
    backgroundColor: '#fff1f2',
    padding: Spacing.md,
    borderRadius: Border.radius.md,
    marginBottom: Spacing.md,
    fontWeight: 'bold',
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
  decisionButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
    marginTop: Spacing.xs,
  },
  decisionBtn: {
    flex: 1,
    height: 36,
    borderRadius: Border.radius.sm,
    alignItems: 'center',
    justifyContent: 'center',
  },
  decisionBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 13,
  },
  completeRequestBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    borderRadius: Border.radius.sm,
    gap: 4,
    marginTop: 4,
  },
  completeRequestBtnText: {
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
});
