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
import { useLocalSearchParams, router } from 'expo-router';
import Layout from '../../components/Layout';
import { Colors, Spacing, Shadows, Border, MaxContentWidth } from '../../constants/theme';
import { useAuthStore } from '../../store/useAuthStore';
import api from '../../services/api';

// Local Property Images
import bhomeGs25 from '../../../assets/images/bhome_gs25.jpg';
import bconsCityPark from '../../../assets/images/bcons_city_park.jpg';
import bconsPool from '../../../assets/images/bcons_pool.jpg';
import bconsApartments from '../../../assets/images/bcons_apartments.jpg';

// Helper to resolve string URLs or local required assets
const resolveImageSource = (imageObj: any) => {
  if (!imageObj) return { uri: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=600&q=80' };
  if (typeof imageObj.url === 'string' && imageObj.url.startsWith('http')) {
    return { uri: imageObj.url };
  }
  return imageObj.url;
};

// Dynamic Map Component using CDN Leaflet for Web
function RoomMap({ lat, lng, address }: { lat: number; lng: number; address: string }) {
  useEffect(() => {
    if (Platform.OS !== 'web') return;

    const loadLeaflet = () => {
      // Check if Leaflet is already loaded
      if ((window as any).L) {
        initializeMap();
        return;
      }

      // Add Leaflet CSS
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      // Add Leaflet JS
      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => initializeMap();
      document.head.appendChild(script);
    };

    const initializeMap = () => {
      const L = (window as any).L;
      if (!L) return;

      const mapContainer = document.getElementById('room-map');
      if (!mapContainer) return;

      // Clear previous map instance if existed (to avoid container already initialized error)
      if ((mapContainer as any)._leaflet_id) {
        return; 
      }

      const map = L.map('room-map').setView([lat, lng], 15);
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '© OpenStreetMap contributors',
      }).addTo(map);

      L.marker([lat, lng])
        .addTo(map)
        .bindPopup(address || 'Vị trí phòng cho thuê')
        .openPopup();
    };

    loadLeaflet();
  }, [lat, lng, address]);

  if (Platform.OS === 'web') {
    return (
      <View style={styles.mapWrapper}>
        <div id="room-map" style={{ height: '300px', width: '100%', borderRadius: '8px' }}></div>
      </View>
    );
  }

  // Fallback view on native
  return (
    <View style={styles.mapFallback}>
      <Ionicons name="map-outline" size={32} color={Colors.light.textSecondary} />
      <Text style={styles.mapFallbackText}>Xem vị trí trên bản đồ (Hỗ trợ trên Web)</Text>
      <Text style={styles.mapFallbackCoords}>Tọa độ: {lat.toFixed(5)}, {lng.toFixed(5)}</Text>
    </View>
  );
}

export default function RoomDetailScreen() {
  const { id } = useLocalSearchParams();
  const { user, isAuthenticated } = useAuthStore();
  const { width } = useWindowDimensions();
  const isMobile = width < 768;

  const [room, setRoom] = useState<any>(null);
  const [relatedRooms, setRelatedRooms] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Interaction States
  const [isFavorite, setIsFavorite] = useState(false);
  const [favCount, setFavCount] = useState(0);

  // Request Modal State
  const [requestModalOpen, setRequestModalOpen] = useState(false);
  const [viewingDate, setViewingDate] = useState('');
  const [requestMessage, setRequestMessage] = useState('');
  const [requestLoading, setRequestLoading] = useState(false);
  const [requestSuccess, setRequestSuccess] = useState('');
  const [requestError, setRequestError] = useState('');

  // Report Modal State
  const [reportModalOpen, setReportModalOpen] = useState(false);
  const [reportReason, setReportReason] = useState('wrong_info');
  const [reportDesc, setReportDesc] = useState('');
  const [reportLoading, setReportLoading] = useState(false);
  const [reportSuccess, setReportSuccess] = useState('');

  // Loaded Active Image in Carousel
  const [activeImageIndex, setActiveImageIndex] = useState(0);

  const fetchRoomDetails = async () => {
    setLoading(true);
    try {
      const roomRes = await api.get(`/rooms/${id}`);
      if (roomRes.data?.room) {
        const roomData = roomRes.data.room;
        setRoom(roomData);
        setFavCount(roomData.favoriteCount || 0);

        // Fetch related rooms
        const relatedRes = await api.get(`/rooms/${id}/related`);
        if (relatedRes.data?.rooms) {
          setRelatedRooms(relatedRes.data.rooms);
        }

        // Check if favorited by user
        if (isAuthenticated) {
          try {
            const favRes = await api.get('/favorites');
            const favorited = favRes.data.favorites.some((fav: any) => fav.room?._id === roomData._id);
            setIsFavorite(favorited);
          } catch (e) {
            // silent ignore
          }
        }
      }
    } catch (err) {
      console.warn('Failed to load room details, using premium mock:', err);
      // Fallback premium mock room details
      const mockDetail = {
        _id: id || 'mock_room_id',
        title: 'Phòng trọ dịch vụ cao cấp Làng Đại học Quốc gia',
        description: 'Căn phòng trọ mới xây đầy đủ tiện nghi thiết kế hiện đại, sạch sẽ và an ninh. Vị trí vô cùng đắc địa, ngay sát khu đô thị Đại học Quốc gia TP.HCM, thuận tiện di chuyển đến các trường đại học thành viên Bách Khoa, Tự Nhiên, Nhân Văn, CNTT.\n\nPhòng trang bị đầy đủ kệ bếp, bồn rửa chén, nhà vệ sinh riêng rộng rãi sạch đẹp. Giờ giấc tự do không chung chủ, ra vào khóa vân tay vân chân an toàn bảo mật tuyệt đối, có camera giám sát 24/7 và bãi xe rộng rãi lầu trệt.',
        rules: 'Giữ vệ sinh chung. Không làm ồn sau 22h. Giới hạn tối đa 3 người ở.',
        price: 2800000,
        deposit: 2000000,
        electricityFee: 3500,
        waterFee: 100000,
        internetFee: 50000,
        serviceFee: 50000,
        area: 25,
        maxOccupants: 3,
        address: {
          province: 'Bình Dương',
          district: 'Dĩ An',
          ward: 'Đông Hòa',
          detail: 'Số 20, Đường vành đai Làng Đại Học, Kp Tân Lập, Đông Hòa',
          lat: 10.8781,
          lng: 106.8063,
        },
        amenities: [
          { name: 'Wi-Fi', icon: 'wifi-outline' },
          { name: 'Điều hòa', icon: 'snow-outline' },
          { name: 'Tủ lạnh', icon: 'cube-outline' },
          { name: 'Chỗ để xe', icon: 'car-outline' },
          { name: 'Camera', icon: 'videocam-outline' },
        ],
        images: [
          { url: bhomeGs25 },
          { url: bconsPool },
          { url: bconsApartments },
          { url: bconsCityPark },
        ],
        status: 'available',
        views: 245,
        createdAt: new Date().toISOString(),
        landlord: {
          fullName: 'Nguyễn Văn Hùng',
          avatar: '',
          phone: '0912345678',
          createdAt: new Date().toISOString(),
        },
      };
      setRoom(mockDetail);
      setFavCount(mockDetail.favoriteCount || 42);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRoomDetails();
  }, [id, isAuthenticated]);

  const handleFavoriteToggle = async () => {
    if (!isAuthenticated) {
      router.push('/login');
      return;
    }
    try {
      const res = await api.post(`/favorites/${room._id}`);
      setIsFavorite(res.data.isFavorite);
      setFavCount(res.data.favoriteCount);
    } catch (err: any) {
      console.warn('Failed to toggle favorite:', err);
    }
  };

  const handleSendRequest = async () => {
    if (!viewingDate) {
      setRequestError('Vui lòng chọn lịch xem phòng dự kiến');
      return;
    }
    
    setRequestLoading(true);
    setRequestError('');
    setRequestSuccess('');

    try {
      const res = await api.post('/requests', {
        room: room._id,
        viewingDate,
        message: requestMessage,
      });

      setRequestSuccess(res.data.message || 'Gửi yêu cầu thuê thành công!');
      setViewingDate('');
      setRequestMessage('');
      setTimeout(() => setRequestModalOpen(false), 2000);
    } catch (err: any) {
      const msg = err.response?.data?.message || 'Gửi yêu cầu thất bại. Vui lòng thử lại.';
      setRequestError(msg);
    } finally {
      setRequestLoading(false);
    }
  };

  const handleSendReport = async () => {
    if (!reportDesc) return;

    setReportLoading(true);
    setReportSuccess('');
    try {
      await api.post(`/reports/room/${room._id}`, {
        reason: reportReason,
        description: reportDesc,
      });
      setReportSuccess('Gửi báo cáo thành công! Admin sẽ sớm xem xét.');
      setReportDesc('');
      setTimeout(() => setReportModalOpen(false), 2000);
    } catch (err) {
      console.warn(err);
    } finally {
      setReportLoading(false);
    }
  };

  const formatPrice = (price: number) => {
    return price ? (price / 1000000).toFixed(1) + ' triệu/tháng' : '';
  };

  if (loading) {
    return (
      <Layout>
        <View style={styles.loaderContainer}>
          <ActivityIndicator size="large" color={Colors.primary} />
          <Text style={styles.loaderText}>Đang tải chi tiết phòng...</Text>
        </View>
      </Layout>
    );
  }

  if (!room) {
    return (
      <Layout>
        <View style={styles.emptyContainer}>
          <Ionicons name="alert-circle-outline" size={64} color={Colors.danger} />
          <Text style={styles.emptyTitle}>Không tìm thấy bài đăng phòng</Text>
          <Pressable onPress={() => router.push('/')} style={styles.emptyBtn}>
            <Text style={styles.emptyBtnText}>Quay lại trang chủ</Text>
          </Pressable>
        </View>
      </Layout>
    );
  }

  const isOwner = user && room.landlord?._id === user.id;

  return (
    <Layout>
      <View style={styles.container}>
        <View style={styles.content}>
          {/* HEADER SECTION: Title & Quick Stats */}
          <View style={styles.headerSection}>
            <Text style={styles.titleText}>{room.title}</Text>
            
            <View style={[styles.headerMeta, { flexDirection: Platform.OS === 'web' && width > 768 ? 'row' : 'column', alignItems: Platform.OS === 'web' && width > 768 ? 'center' : 'flex-start' }]}>
              <View style={styles.metaLeft}>
                <Ionicons name="location-outline" size={16} color={Colors.light.textSecondary} />
                <Text style={styles.addressText} numberOfLines={2}>
                  {room.address?.detail}, {room.address?.ward}, {room.address?.district}, {room.address?.province}
                </Text>
              </View>
              <View style={styles.metaRight}>
                <Text style={styles.metaText}><Ionicons name="eye-outline" /> {room.views} lượt xem</Text>
                <Text style={styles.metaText}>•</Text>
                <Text style={styles.metaText}>Mã bài đăng: #{room._id.slice(-6).toUpperCase()}</Text>
              </View>
            </View>
          </View>

          {/* TWO COLUMN CONTENT LAYOUT */}
          <View style={[styles.bodyGrid, { flexDirection: Platform.OS === 'web' && width > 992 ? 'row' : 'column' }]}>
            
            {/* COLUMN 1: IMAGE GALLERY & ROOM DESCRIPTION */}
            <View style={styles.bodyLeft}>
              {/* Image Gallery */}
              <View style={styles.gallery}>
                <Image
                  source={resolveImageSource(room.images?.[activeImageIndex])}
                  style={[styles.mainImage, Shadows.sm]}
                />
                
                {room.images && room.images.length > 1 && (
                  <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.thumbnails}>
                    {room.images.map((img: any, idx: number) => (
                      <Pressable
                        key={idx}
                        onPress={() => setActiveImageIndex(idx)}
                        style={[
                          styles.thumbBtn,
                          activeImageIndex === idx && styles.thumbBtnActive,
                        ]}>
                        <Image source={resolveImageSource(img)} style={styles.thumbImage} />
                      </Pressable>
                    ))}
                  </ScrollView>
                )}
              </View>

              {/* Basic Quick Info Row */}
              <View style={[styles.card, styles.quickSpecs]}>
                <View style={styles.specBox}>
                  <Text style={styles.specLabel}>Giá thuê</Text>
                  <Text style={styles.specValue}>{formatPrice(room.price)}</Text>
                </View>
                <View style={styles.specBox}>
                  <Text style={styles.specLabel}>Tiền đặt cọc</Text>
                  <Text style={styles.specValue}>{formatPrice(room.deposit)}</Text>
                </View>
                <View style={styles.specBox}>
                  <Text style={styles.specLabel}>Diện tích</Text>
                  <Text style={styles.specValue}>{room.area} m²</Text>
                </View>
                <View style={styles.specBox}>
                  <Text style={styles.specLabel}>Số người tối đa</Text>
                  <Text style={styles.specValue}>{room.maxOccupants} người</Text>
                </View>
              </View>

              {/* Description */}
              <View style={styles.card}>
                <Text style={styles.cardHeading}>Mô tả chi tiết</Text>
                <Text style={styles.descText}>{room.description}</Text>
              </View>

              {/* Extra Utilities Costs */}
              <View style={styles.card}>
                <Text style={styles.cardHeading}>Chi phí dịch vụ khác</Text>
                <View style={styles.costsTable}>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Tiền điện</Text>
                    <Text style={styles.costVal}>
                      {room.electricityFee ? `${room.electricityFee.toLocaleString()} đ/kWh` : 'Theo giá nhà nước'}
                    </Text>
                  </View>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Tiền nước</Text>
                    <Text style={styles.costVal}>
                      {room.waterFee ? `${room.waterFee.toLocaleString()} đ/người (hoặc m³)` : 'Theo giá nhà nước'}
                    </Text>
                  </View>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Phí internet</Text>
                    <Text style={styles.costVal}>
                      {room.internetFee ? `${room.internetFee.toLocaleString()} đ/tháng` : 'Miễn phí'}
                    </Text>
                  </View>
                  <View style={styles.costRow}>
                    <Text style={styles.costLabel}>Phí dịch vụ khác</Text>
                    <Text style={styles.costVal}>
                      {room.serviceFee ? `${room.serviceFee.toLocaleString()} đ/tháng` : 'Không có'}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Amenities */}
              <View style={styles.card}>
                <Text style={styles.cardHeading}>Tiện ích có sẵn</Text>
                <View style={styles.amenitiesGrid}>
                  {room.amenities && room.amenities.length > 0 ? (
                    room.amenities.map((amenity: any, idx: number) => (
                      <View key={idx} style={styles.amenityItem}>
                        <Ionicons name={(amenity.icon || 'checkmark-circle-outline') as any} size={20} color={Colors.primary} />
                        <Text style={styles.amenityText}>{amenity.name}</Text>
                      </View>
                    ))
                  ) : (
                    <Text style={styles.noInfoText}>Không có thông tin tiện ích</Text>
                  )}
                </View>
              </View>

              {/* Map */}
              <View style={styles.card}>
                <Text style={styles.cardHeading}>Vị trí địa lý</Text>
                <RoomMap
                  lat={room.address?.lat || 10.8781}
                  lng={room.address?.lng || 106.8063}
                  address={room.address?.detail}
                />
              </View>
            </View>

            {/* COLUMN 2: LANDLORD CONTACT & TRANSACTION ACTION SIDEBAR */}
            <View style={styles.bodyRight}>
              
              {/* Action and Contact Sidebar */}
              <View style={[styles.card, styles.actionSidebar, Shadows.md]}>
                <Text style={styles.sidebarHeading}>Thông tin chủ phòng</Text>
                
                {/* Landlord profile preview */}
                <View style={styles.landlordRow}>
                  <View style={styles.landlordAvatar}>
                    {room.landlord?.avatar ? (
                      <Image source={{ uri: room.landlord.avatar }} style={styles.avatarImg} />
                    ) : (
                      <Text style={styles.avatarText}>
                        {room.landlord?.fullName?.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  <View style={styles.landlordInfo}>
                    <Text style={styles.landlordName}>{room.landlord?.fullName}</Text>
                    <Text style={styles.landlordSub}>Tham gia: {new Date(room.landlord?.createdAt || '').toLocaleDateString('vi-VN')}</Text>
                  </View>
                </View>

                <View style={styles.divider} />

                {/* Main rent actions */}
                {isOwner ? (
                  <View style={styles.ownerNotice}>
                    <Text style={styles.ownerNoticeText}>Đây là bài viết của bạn</Text>
                    <Pressable onPress={() => router.push(`/landlord/edit-room/${room._id}`)} style={styles.editBtn}>
                      <Text style={styles.editBtnText}>Chỉnh sửa bài đăng</Text>
                    </Pressable>
                  </View>
                ) : (
                  <View style={styles.actionBtnGrid}>
                    <Pressable
                      onPress={() => {
                        if (!isAuthenticated) router.push('/login');
                        else setRequestModalOpen(true);
                      }}
                      style={styles.requestRentBtn}>
                      <Ionicons name="chatbubble-ellipses" size={20} color="white" />
                      <Text style={styles.requestRentBtnText}>Gửi yêu cầu thuê / Xem phòng</Text>
                    </Pressable>

                    <Pressable onPress={handleFavoriteToggle} style={[styles.favBtn, isFavorite && styles.favBtnActive]}>
                      <Ionicons
                        name={isFavorite ? 'heart' : 'heart-outline'}
                        size={20}
                        color={isFavorite ? Colors.danger : Colors.light.textSecondary}
                      />
                      <Text style={[styles.favBtnText, isFavorite && styles.favBtnTextActive]}>
                        Yêu thích ({favCount})
                      </Text>
                    </Pressable>

                    <Pressable onPress={() => setReportModalOpen(true)} style={styles.reportBtn}>
                      <Ionicons name="flag-outline" size={16} color={Colors.danger} />
                      <Text style={styles.reportBtnText}>Báo cáo bài đăng vi phạm</Text>
                    </Pressable>
                  </View>
                )}
              </View>
            </View>

          </View>
        </View>
      </View>

      {/* RENTAL REQUEST MODAL */}
      {requestModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Gửi yêu cầu xem / thuê phòng</Text>
              <Pressable onPress={() => setRequestModalOpen(false)}>
                <Ionicons name="close" size={24} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              {requestSuccess ? (
                <View style={styles.successMessage}>
                  <Ionicons name="checkmark-circle" size={36} color={Colors.success} />
                  <Text style={styles.successText}>{requestSuccess}</Text>
                </View>
              ) : (
                <View style={{ gap: Spacing.md }}>
                  {requestError ? <Text style={styles.errorText}>{requestError}</Text> : null}
                  
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Lịch xem phòng dự kiến *</Text>
                    <TextInput
                      type="datetime-local" // works on Web
                      placeholder="YYYY-MM-DD"
                      value={viewingDate}
                      onChangeText={setViewingDate}
                      style={styles.modalInput}
                    />
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Lời nhắn gửi chủ phòng</Text>
                    <TextInput
                      placeholder="Tôi muốn đến xem phòng vào thời gian này..."
                      multiline
                      numberOfLines={4}
                      value={requestMessage}
                      onChangeText={setRequestMessage}
                      style={[styles.modalInput, { height: 100, textAlignVertical: 'top' }]}
                    />
                  </View>

                  <Pressable
                    disabled={requestLoading}
                    onPress={handleSendRequest}
                    style={styles.modalSubmitBtn}>
                    {requestLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.modalSubmitBtnText}>Gửi yêu cầu ngay</Text>
                    )}
                  </Pressable>
                </View>
              )}
            </View>
          </View>
        </View>
      )}

      {/* VIOLATION REPORT MODAL */}
      {reportModalOpen && (
        <View style={styles.modalOverlay}>
          <View style={[styles.modalCard, Shadows.lg]}>
            <View style={styles.modalHeader}>
              <Text style={styles.modalTitle}>Báo cáo vi phạm</Text>
              <Pressable onPress={() => setReportModalOpen(false)}>
                <Ionicons name="close" size={24} />
              </Pressable>
            </View>

            <View style={styles.modalBody}>
              {reportSuccess ? (
                <View style={styles.successMessage}>
                  <Ionicons name="checkmark-circle" size={36} color={Colors.success} />
                  <Text style={styles.successText}>{reportSuccess}</Text>
                </View>
              ) : (
                <View style={{ gap: Spacing.md }}>
                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Lý do báo cáo</Text>
                    <View style={styles.radioList}>
                      {[
                        { val: 'wrong_info', label: 'Thông tin sai sự thật' },
                        { val: 'wrong_price', label: 'Giá không chính xác' },
                        { val: 'inappropriate_images', label: 'Hình ảnh không phù hợp' },
                        { val: 'scam', label: 'Dấu hiệu lừa đảo' },
                        { val: 'other', label: 'Lý do khác' },
                      ].map((item) => (
                        <Pressable
                          key={item.val}
                          onPress={() => setReportReason(item.val)}
                          style={styles.radioRow}>
                          <Ionicons
                            name={reportReason === item.val ? 'radio-button-on' : 'radio-button-off'}
                            size={18}
                            color={Colors.primary}
                          />
                          <Text style={styles.radioLabel}>{item.label}</Text>
                        </Pressable>
                      ))}
                    </View>
                  </View>

                  <View style={styles.inputGroup}>
                    <Text style={styles.inputLabel}>Mô tả chi tiết vi phạm *</Text>
                    <TextInput
                      placeholder="Mô tả cụ thể sự việc..."
                      multiline
                      numberOfLines={3}
                      value={reportDesc}
                      onChangeText={setReportDesc}
                      style={[styles.modalInput, { height: 80, textAlignVertical: 'top' }]}
                    />
                  </View>

                  <Pressable
                    disabled={reportLoading}
                    onPress={handleSendReport}
                    style={[styles.modalSubmitBtn, { backgroundColor: Colors.danger }]}>
                    {reportLoading ? (
                      <ActivityIndicator size="small" color="white" />
                    ) : (
                      <Text style={styles.modalSubmitBtnText}>Gửi báo cáo</Text>
                    )}
                  </Pressable>
                </View>
              )}
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
    gap: Spacing.lg,
  },
  headerSection: {
    backgroundColor: 'white',
    padding: Spacing.xl,
    borderRadius: Border.radius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: Spacing.sm,
  },
  titleText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  headerMeta: {
    justifyContent: 'space-between',
    gap: Spacing.sm,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    flex: 1,
  },
  addressText: {
    fontSize: 14,
    color: '#334155',
  },
  metaRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  metaText: {
    fontSize: 13,
    color: '#64748b',
  },
  bodyGrid: {
    gap: Spacing.lg,
    width: '100%',
  },
  bodyLeft: {
    flex: 1.8,
    gap: Spacing.lg,
  },
  bodyRight: {
    flex: 0.9,
    gap: Spacing.lg,
  },
  gallery: {
    gap: Spacing.sm,
  },
  mainImage: {
    width: '100%',
    height: Platform.OS === 'web' ? 400 : 250,
    borderRadius: Border.radius.lg,
  },
  thumbnails: {
    flexDirection: 'row',
    gap: Spacing.xs,
  },
  thumbBtn: {
    width: 80,
    height: 60,
    borderRadius: Border.radius.sm,
    overflow: 'hidden',
    borderWidth: 2,
    borderColor: 'transparent',
  },
  thumbBtnActive: {
    borderColor: Colors.primary,
  },
  thumbImage: {
    width: '100%',
    height: '100%',
  },
  card: {
    backgroundColor: 'white',
    padding: Spacing.xl,
    borderRadius: Border.radius.lg,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  cardHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: Spacing.md,
  },
  quickSpecs: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingVertical: Spacing.lg,
    gap: Spacing.md,
  },
  specBox: {
    flex: 1,
    minWidth: '40%',
    alignItems: 'center',
    gap: 4,
  },
  specLabel: {
    fontSize: 12,
    color: '#64748b',
  },
  specValue: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  descText: {
    fontSize: 14,
    color: '#334155',
    lineHeight: 22,
  },
  costsTable: {
    gap: Spacing.sm,
  },
  costRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  costLabel: {
    fontSize: 14,
    color: '#475569',
  },
  costVal: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  amenitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.md,
  },
  amenityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    width: '45%',
    paddingVertical: 4,
  },
  amenityText: {
    fontSize: 14,
    color: '#334155',
  },
  noInfoText: {
    color: '#64748b',
    fontSize: 14,
  },
  mapWrapper: {
    height: 300,
    width: '100%',
    borderRadius: Border.radius.md,
    overflow: 'hidden',
  },
  mapFallback: {
    height: 200,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: Border.radius.md,
    gap: 4,
  },
  mapFallbackText: {
    color: '#475569',
    fontWeight: 'bold',
  },
  mapFallbackCoords: {
    fontSize: 12,
    color: '#94a3b8',
  },
  actionSidebar: {
    gap: Spacing.md,
    position: Platform.OS === 'web' ? 'sticky' : 'relative',
    top: 90,
  } as any,
  sidebarHeading: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  landlordRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  landlordAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
  },
  avatarImg: {
    width: '100%',
    height: '100%',
  },
  avatarText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 18,
  },
  landlordInfo: {
    gap: 2,
  },
  landlordName: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#1e293b',
  },
  landlordSub: {
    fontSize: 12,
    color: '#64748b',
  },
  divider: {
    height: 1,
    backgroundColor: '#e2e8f0',
  },
  ownerNotice: {
    padding: Spacing.md,
    backgroundColor: '#fffbeb',
    borderRadius: Border.radius.md,
    gap: Spacing.sm,
    alignItems: 'center',
  },
  ownerNoticeText: {
    color: '#b45309',
    fontWeight: '500',
    fontSize: 13,
  },
  editBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 10,
    width: '100%',
    borderRadius: Border.radius.md,
    alignItems: 'center',
  },
  editBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  actionBtnGrid: {
    gap: Spacing.sm,
  },
  requestRentBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Border.radius.md,
    gap: Spacing.xs,
  },
  requestRentBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  favBtn: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    borderRadius: Border.radius.md,
    gap: Spacing.xs,
  },
  favBtnActive: {
    borderColor: Colors.danger,
    backgroundColor: '#fff1f2',
  },
  favBtnText: {
    color: '#475569',
    fontWeight: 'bold',
  },
  favBtnTextActive: {
    color: Colors.danger,
  },
  reportBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 10,
    gap: Spacing.xs,
  },
  reportBtnText: {
    color: Colors.danger,
    fontSize: 13,
    fontWeight: '500',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: Spacing.sm,
  },
  loaderText: {
    color: '#64748b',
  },
  emptyContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 100,
    gap: Spacing.md,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#475569',
  },
  emptyBtn: {
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Border.radius.md,
  },
  emptyBtnText: {
    color: 'white',
    fontWeight: 'bold',
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
    width: Platform.OS === 'web' ? 450 : '100%',
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
  inputLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
    marginBottom: 6,
  },
  modalInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Border.radius.md,
    paddingHorizontal: Spacing.sm,
    height: 38,
    fontSize: 13,
    outlineStyle: 'none',
  } as any,
  modalSubmitBtn: {
    backgroundColor: Colors.primary,
    height: 44,
    borderRadius: Border.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: Spacing.sm,
  },
  modalSubmitBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  successMessage: {
    alignItems: 'center',
    paddingVertical: 20,
    gap: Spacing.sm,
  },
  successText: {
    color: Colors.success,
    fontWeight: 'bold',
    textAlign: 'center',
  },
  errorText: {
    color: Colors.danger,
    fontWeight: '500',
    fontSize: 13,
    textAlign: 'center',
  },
  radioList: {
    gap: Spacing.sm,
  },
  radioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 4,
  },
  radioLabel: {
    fontSize: 14,
    color: '#1e293b',
  },
});
