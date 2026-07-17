import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  TextInput,
  useWindowDimensions,
  Image,
  Platform,
  ActivityIndicator,
  ScrollView,
  Animated,
} from 'react-native';
import { Link, router } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import Layout from '../components/Layout';
import { Colors, Spacing, Shadows, Border, MaxContentWidth } from '../constants/theme';
import api from '../services/api';
import { useAuthStore } from '../store/useAuthStore';

// Local Property Images
import bhomeGs25 from '../../assets/images/bhome_gs25.jpg';
import bconsCityPark from '../../assets/images/bcons_city_park.jpg';
import bconsPool from '../../assets/images/bcons_pool.jpg';
import bconsApartments from '../../assets/images/bcons_apartments.jpg';
import roomInterior1 from '../../assets/images/room_interior_1.jpg';
import roomInterior2 from '../../assets/images/room_interior_2.jpg';
import bconsCityExterior from '../../assets/images/bcons_city_exterior.png';
import phucDatExterior from '../../assets/images/phuc_dat_exterior.png';
import bconsInteriorCommunity from '../../assets/images/bcons_interior_community.png';
import bconsEducationCenter from '../../assets/images/bcons_education_center.png';

// Advertising Banners Data
const BANNERS = [
  {
    image: bconsCityExterior,
    title: 'Căn hộ mẫu Bcons City hiện đại',
    desc: 'Thiết kế sang trọng, tối ưu diện tích, phù hợp cho học sinh, sinh viên và gia đình trẻ.',
  },
  {
    image: phucDatExterior,
    title: 'Phúc Đạt Tower lộng lẫy',
    desc: 'Tòa tháp căn hộ cao cấp ngay mặt tiền quốc lộ, kết nối vùng nhanh chóng.',
  },
  {
    image: bconsInteriorCommunity,
    title: 'Không gian sinh hoạt chung ấm cúng',
    desc: 'Khu sảnh lounge, công viên vui chơi giải trí đầy đủ tiện ích thư giãn sau giờ học tập.',
  },
  {
    image: bconsEducationCenter,
    title: 'Trường mầm non & trung tâm ngoại ngữ',
    desc: 'Hệ thống giáo dục chất lượng cao ngay trong khuôn viên tòa nhà vô cùng an toàn và tiện nghi.',
  },
];

// Helper to resolve string URLs or local required assets
const resolveImageSource = (imageObj: any) => {
  if (!imageObj) return { uri: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80' };
  if (typeof imageObj.url === 'string' && imageObj.url.startsWith('http')) {
    return { uri: imageObj.url };
  }
  return imageObj.url;
};

// Categories List
const CATEGORIES = [
  { name: 'Phòng trọ', icon: 'home-outline', slug: 'phong-tro' },
  { name: 'Căn hộ mini', icon: 'business-outline', slug: 'can-ho-mini' },
  { name: 'Chung cư', icon: 'grid-outline', slug: 'chung-cu' },
  { name: 'Nhà nguyên căn', icon: 'storefront-outline', slug: 'nha-nguyen-can' },
  { name: 'Phòng ở ghép', icon: 'people-outline', slug: 'phong-o-ghep' },
  { name: 'Ký túc xá', icon: 'bed-outline', slug: 'ky-tuc-xa' },
];

export default function HomeScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const stackSearch = isMobile || width < 1150;

  const { user, isAuthenticated } = useAuthStore();

  // Search Inputs
  const [province, setProvince] = useState('');
  const [district, setDistrict] = useState('');
  const [areaQuery, setAreaQuery] = useState('');
  const [areaFocused, setAreaFocused] = useState(false);

  const POPULAR_SIZES = ['5x5', '8x4', '10x5', '6x4'];

  const getAreaSuggestions = () => {
    if (!areaQuery) return [];
    const queryLower = areaQuery.toLowerCase();
    
    // Parse length/width/area
    const dimMatch = queryLower.match(/(\d+(?:\.\d+)?)\s*(?:m)?\s*[xX*×]\s*(\d+(?:\.\d+)?)/);
    const numericVal = Number(queryLower.replace(/[^0-9.]/g, ''));
    
    let targetArea = 0;
    let targetLength = 0;
    let targetWidth = 0;
    
    if (dimMatch) {
      targetLength = Number(dimMatch[1]);
      targetWidth = Number(dimMatch[2]);
      targetArea = targetLength * targetWidth;
    } else if (numericVal) {
      targetArea = numericVal;
    }

    // Filter featured rooms whose area is close (within +/- 5m2) or whose length/width match
    const matched = featuredRooms.filter(room => {
      const roomArea = room.area || 25;
      
      if (targetArea > 0) {
        // Area match close
        return Math.abs(roomArea - targetArea) <= 15; // wide range for suggestions
      }
      
      return false;
    });

    const suggestionsList = matched.slice(0, 5).map(room => {
      const roomArea = room.area || 25;
      return {
        type: 'room',
        _id: room._id,
        title: room.title,
        area: roomArea,
        length: room.length || Math.round((roomArea / 4) * 10) / 10 || 5,
        width: room.width || 4,
        price: room.price,
      };
    });

    suggestionsList.push({
      type: 'text',
      text: areaQuery,
      title: `Tìm kiếm kích thước: "${areaQuery}"`,
    } as any);

    return suggestionsList;
  };

  // Active Banner State
  const [activeBanner, setActiveBanner] = useState(0);
  const [prevBanner, setPrevBanner] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  const fadeAnim = React.useRef(new Animated.Value(1)).current;
  const slideAnim = React.useRef(new Animated.Value(0)).current;
  const zoomAnim = React.useRef(new Animated.Value(1)).current;

  // Banner entrance transition + Ken Burns zoom
  useEffect(() => {
    fadeAnim.setValue(0);
    slideAnim.setValue(15);
    zoomAnim.setValue(1.0);

    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 900,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 900,
        useNativeDriver: true,
      }),
    ]).start();

    Animated.timing(zoomAnim, {
      toValue: 1.03,
      duration: 4500,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      setPrevBanner(activeBanner);
    }, 900);

    return () => clearTimeout(timeout);
  }, [activeBanner]);

  // Auto-play banners (paused on hover)
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % BANNERS.length);
    }, 4500);
    return () => clearInterval(timer);
  }, [activeBanner, isHovered]);

  // Loaded Data
  const [featuredRooms, setFeaturedRooms] = useState<any[]>([]);
  const [loadingRooms, setLoadingRooms] = useState(true);
  const [stats, setStats] = useState({
    totalRooms: 156,
    totalLandlords: 24,
    totalTenants: 112,
    completedRequests: 89,
  });

  // Fetch Featured Rooms and Stats on Mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch featured rooms
        const roomsRes = await api.get('/rooms/featured');
        if (roomsRes.data?.rooms) {
          setFeaturedRooms(roomsRes.data.rooms);
        }
      } catch (err) {
        console.warn('Failed to fetch featured rooms, using mock data:', err);
        // Premium Mock Data
        setFeaturedRooms([
          {
            _id: 'mock1',
            title: 'Phòng trọ dịch vụ cao cấp Làng Đại học Quốc gia',
            price: 2800000,
            area: 25,
            length: 5,
            width: 5,
            address: { province: 'Bình Dương', district: 'Dĩ An', ward: 'Đông Hòa', detail: 'Đường vành đai ĐHQG' },
            images: [{ url: roomInterior1 }],
            type: { name: 'Phòng trọ' },
            views: 245,
            favoriteCount: 42,
          },
          {
            _id: 'mock2',
            title: 'Căn hộ Studio mini Full nội thất, Dĩ An',
            price: 4500000,
            area: 32,
            length: 8,
            width: 4,
            address: { province: 'Bình Dương', district: 'Dĩ An', ward: 'Đông Hòa', detail: 'Gần hồ đá' },
            images: [{ url: roomInterior2 }],
            type: { name: 'Căn hộ mini' },
            views: 312,
            favoriteCount: 56,
          },
          {
            _id: 'mock3',
            title: 'Chung cư mini lầu cao ban công thoáng mát TP.HCM',
            price: 5500000,
            area: 40,
            length: 10,
            width: 4,
            address: { province: 'Hồ Chí Minh', district: 'Thủ Đức', ward: 'Linh Trung', detail: 'Kha Vạn Cân' },
            images: [{ url: bconsApartments }],
            type: { name: 'Chung cư' },
            views: 420,
            favoriteCount: 89,
          },
        ]);
      } finally {
        setLoadingRooms(false);
      }

      try {
        // Fetch stats
        const statsRes = await api.get('/admin/stats');
        if (statsRes.data?.stats) {
          setStats(statsRes.data.stats);
        }
      } catch (err) {
        // use default mock stats on failure
      }
    };

    fetchData();
  }, []);

  const handleSearch = () => {
    // Navigate to list page with query params
    const query: any = {};
    if (province) query.province = province;
    if (district) query.district = district;
    if (areaQuery) {
      query.q = areaQuery;
    }
    
    router.push({
      pathname: '/list',
      params: query,
    });
  };

  const formatPrice = (price: number) => {
    return (price / 1000000).toFixed(1) + ' triệu/tháng';
  };

  return (
    <Layout>
      <View style={styles.container}>
        {/* 1. HERO BANNER */}
        <View style={styles.heroSection}>
          <View style={styles.heroContent}>
            <View style={styles.heroLeft}>
              <Text style={styles.heroTitle}>Tìm kiếm căn phòng mơ ước của bạn</Text>
              <Text style={styles.heroSubtitle}>
                Hệ thống tìm phòng trọ, căn hộ mini, chung cư uy tín hàng đầu cho học sinh, sinh viên và người đi làm. Kết nối nhanh chóng.
              </Text>

              {/* Banner Slider for Mobile */}
              {isMobile && (
                <Pressable
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  onHoverIn={() => setIsHovered(true)}
                  onHoverOut={() => setIsHovered(false)}
                  style={[styles.bannerWrapper, { height: 220, marginBottom: Spacing.md }]}
                >
                  {/* Background Image (Previous Slide) */}
                  <Image 
                    source={BANNERS[prevBanner].image} 
                    pointerEvents="none"
                    style={[styles.bannerImage, { transform: [{ scale: 1.03 }] }]} 
                  />
                  {/* Foreground Animated Image (Current Slide with Fade + Zoom) */}
                  <Animated.Image
                    source={BANNERS[activeBanner].image}
                    pointerEvents="none"
                    style={[
                      styles.bannerImage,
                      {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: fadeAnim,
                        transform: [
                          { translateX: slideAnim },
                          { scale: zoomAnim }
                        ],
                      }
                    ]}
                  />
                  <View pointerEvents="none" style={styles.bannerGradient} />
                  <View pointerEvents="none" style={styles.bannerTextContainer}>
                    <Text key={`title-mob-${activeBanner}`} className="fade-in" style={[styles.bannerTextTitle, { fontSize: 15 }]}>
                      {BANNERS[activeBanner].title}
                    </Text>
                    <Text key={`desc-mob-${activeBanner}`} className="fade-in" style={[styles.bannerTextDesc, { fontSize: 12 }]}>
                      {BANNERS[activeBanner].desc}
                    </Text>
                  </View>
                  <View style={styles.dotsRow}>
                    {BANNERS.map((_, index) => (
                      <Pressable
                        key={index}
                        onPress={() => {
                          setPrevBanner(activeBanner);
                          setActiveBanner(index);
                        }}
                        style={[styles.dot, activeBanner === index ? styles.dotActive : null]}
                      />
                    ))}
                  </View>
                </Pressable>
              )}

              <View style={styles.heroActions}>
                {/* Show 'Tìm phòng ngay' for guests or logged-in tenants */}
                {(!isAuthenticated || user?.role === 'tenant') && (
                  <Link href="/list" asChild>
                    <Pressable style={styles.actionBtnPrimary} className="hover-button">
                      <Text style={styles.actionBtnText}>Tìm phòng ngay</Text>
                    </Pressable>
                  </Link>
                )}
                {/* Show 'Đăng tin cho thuê' for guests or logged-in landlords */}
                {(!isAuthenticated || user?.role === 'landlord') && (
                  <Link href={isAuthenticated ? '/landlord/dashboard' : '/login'} asChild>
                    <Pressable style={styles.actionBtnSecondary} className="hover-button">
                      <Text style={styles.actionBtnSecondaryText}>Đăng tin cho thuê</Text>
                    </Pressable>
                  </Link>
                )}
              </View>
            </View>

            {!isMobile && (
              <View style={styles.heroRight}>
                <Pressable
                  onMouseEnter={() => setIsHovered(true)}
                  onMouseLeave={() => setIsHovered(false)}
                  onHoverIn={() => setIsHovered(true)}
                  onHoverOut={() => setIsHovered(false)}
                  style={styles.bannerWrapper}
                >
                  {/* Background Image (Previous Slide) */}
                  <Image 
                    source={BANNERS[prevBanner].image} 
                    pointerEvents="none"
                    style={[styles.bannerImage, { transform: [{ scale: 1.03 }] }]} 
                  />
                  {/* Foreground Animated Image (Current Slide with Fade + Slide + Zoom) */}
                  <Animated.Image
                    source={BANNERS[activeBanner].image}
                    pointerEvents="none"
                    style={[
                      styles.bannerImage,
                      {
                        position: 'absolute',
                        top: 0,
                        left: 0,
                        right: 0,
                        bottom: 0,
                        opacity: fadeAnim,
                        transform: [
                          { translateX: slideAnim },
                          { scale: zoomAnim }
                        ],
                      }
                    ]}
                  />
                  <View pointerEvents="none" style={styles.bannerGradient} />
                  <View pointerEvents="none" style={styles.bannerTextContainer}>
                    <Text key={`title-web-${activeBanner}`} className="fade-in" style={styles.bannerTextTitle}>
                      {BANNERS[activeBanner].title}
                    </Text>
                    <Text key={`desc-web-${activeBanner}`} className="fade-in" style={styles.bannerTextDesc}>
                      {BANNERS[activeBanner].desc}
                    </Text>
                  </View>
                  <View style={styles.dotsRow}>
                    {BANNERS.map((_, index) => (
                      <Pressable
                        key={index}
                        onPress={() => {
                          setPrevBanner(activeBanner);
                          setActiveBanner(index);
                        }}
                        style={[styles.dot, activeBanner === index ? styles.dotActive : null]}
                      />
                    ))}
                  </View>
                </Pressable>
              </View>
            )}
          </View>
        </View>

        {/* 2. CATEGORIES */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Danh mục loại phòng</Text>
          <Text style={styles.sectionSubtitle}>Tìm kiếm nhanh theo các hình thức phòng cho thuê phổ biến nhất</Text>
          
          <View style={styles.categoriesGrid}>
            {CATEGORIES.map((cat) => (
              <Pressable
                key={cat.slug}
                className="hover-card"
                onPress={() => router.push({ pathname: '/list', params: { type: cat.name } })}
                style={[styles.categoryCard, Shadows.sm]}>
                <View style={styles.categoryIconBg}>
                  <Ionicons name={cat.icon as any} size={28} color={Colors.primary} />
                </View>
                <Text style={styles.categoryName}>{cat.name}</Text>
              </Pressable>
            ))}
          </View>
        </View>

        {/* 3. FEATURED ROOMS */}
        <View style={[styles.section, { backgroundColor: '#f1f5f9' }]}>
          <View style={styles.sectionHeader}>
            <View>
              <Text style={styles.sectionTitle}>Phòng nổi bật</Text>
              <Text style={styles.sectionSubtitle}>Các bài đăng nhận được nhiều sự quan tâm từ người thuê</Text>
            </View>
            <Link href="/list" asChild>
              <Pressable style={styles.viewAllBtn}>
                <Text style={styles.viewAllText}>Xem tất cả</Text>
                <Ionicons name="arrow-forward" size={16} color={Colors.primary} />
              </Pressable>
            </Link>
          </View>

          {loadingRooms ? (
            <ActivityIndicator size="large" color={Colors.primary} style={{ marginVertical: 40 }} />
          ) : (
            <View style={styles.roomsGrid}>
              {featuredRooms.map((room) => (
                <Pressable
                  key={room._id}
                  className="hover-card hover-image-parent"
                  onPress={() => router.push(`/room/${room._id}`)}
                  style={[styles.roomCard, Shadows.sm]}>
                  <Image source={resolveImageSource(room.images?.[0])} style={styles.roomImage} />
                  
                  <View style={styles.roomCardContent}>
                    <View style={styles.roomBadgeRow}>
                      <View style={styles.roomTypeBadge}>
                        <Text style={styles.roomTypeBadgeText}>{room.type?.name}</Text>
                      </View>
                      <View style={styles.roomViews}>
                        <Ionicons name="eye-outline" size={14} color={Colors.light.textSecondary} />
                        <Text style={styles.roomViewsText}>{room.views}</Text>
                      </View>
                    </View>

                    <Text style={styles.roomTitle} numberOfLines={2}>{room.title}</Text>
                    
                    <Text style={styles.roomPrice}>{formatPrice(room.price)}</Text>
                    
                    <View style={styles.roomSpecs}>
                      <Text style={styles.roomSpecText}>Diện tích: {room.area}m²</Text>
                      <Text style={styles.roomSpecText}>•</Text>
                      <Text style={styles.roomSpecText} numberOfLines={1}>
                        {room.address?.district}, {room.address?.province}
                      </Text>
                    </View>
                  </View>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* 4. STATISTICS */}
        <View style={styles.statsSection}>
          <View style={styles.statsContainer}>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.totalRooms}+</Text>
              <Text style={styles.statLabel}>Phòng cho thuê</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.totalLandlords}+</Text>
              <Text style={styles.statLabel}>Chủ phòng uy tín</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.totalTenants}+</Text>
              <Text style={styles.statLabel}>Người dùng</Text>
            </View>
            <View style={styles.statBox}>
              <Text style={styles.statNumber}>{stats.completedRequests}+</Text>
              <Text style={styles.statLabel}>Yêu cầu thuê thành công</Text>
            </View>
          </View>
        </View>

        {/* 5. HOW IT WORKS */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Quy trình thuê phòng đơn giản</Text>
          <Text style={styles.sectionSubtitle}>Kết nối nhanh chóng với 3 bước đơn giản cùng iSinhvien</Text>
          
          <View style={styles.stepsGrid}>
            <View style={styles.stepCard}>
              <View style={styles.stepIcon}>
                <Ionicons name="search-outline" size={24} color="white" />
              </View>
              <Text style={styles.stepTitle}>1. Tìm kiếm phòng</Text>
              <Text style={styles.stepDesc}>Sử dụng công cụ tìm kiếm và lọc để chọn căn phòng phù hợp nhất tại khu vực mong muốn.</Text>
            </View>
            <View style={styles.stepCard}>
              <View style={styles.stepIcon}>
                <Ionicons name="calendar-outline" size={24} color="white" />
              </View>
              <Text style={styles.stepTitle}>2. Đặt lịch xem phòng</Text>
              <Text style={styles.stepDesc}>Gửi tin nhắn hoặc lên lịch xem phòng trực tiếp để khảo sát không gian thực tế.</Text>
            </View>
            <View style={styles.stepCard}>
              <View style={styles.stepIcon}>
                <Ionicons name="checkmark-circle-outline" size={24} color="white" />
              </View>
              <Text style={styles.stepTitle}>3. Thuê phòng</Text>
              <Text style={styles.stepDesc}>Gửi yêu cầu thuê phòng và nhận xác nhận từ chủ phòng để hoàn tất thủ tục thuê phòng.</Text>
            </View>
          </View>
        </View>
      </View>
    </Layout>
  );
}

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  heroSection: {
    backgroundColor: '#e0f2fe', // sky-100
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  heroContent: {
    maxWidth: MaxContentWidth,
    width: '100%',
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: Spacing.xxl,
  },
  heroLeft: {
    flex: 1,
    gap: Spacing.lg,
  },
  heroTitle: {
    fontSize: Platform.OS === 'web' ? 44 : 32,
    fontWeight: '800',
    color: '#0f172a',
    lineHeight: Platform.OS === 'web' ? 52 : 38,
  },
  heroSubtitle: {
    fontSize: 16,
    color: '#475569',
    lineHeight: 24,
  },
  searchContainer: {
    backgroundColor: 'white',
    padding: Spacing.md,
    borderRadius: Border.radius.lg,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    alignItems: 'center',
    gap: Spacing.md,
    marginTop: Spacing.md,
    zIndex: 10,
    position: 'relative',
  },
  searchFields: {
    flex: 1,
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    gap: Spacing.md,
    width: '100%',
  },
  inputGroup: {
    flexGrow: 1,
    flexShrink: 1,
    flexBasis: '0%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Border.radius.md,
    paddingHorizontal: 8,
    height: 46,
    gap: Spacing.xs,
  },
  inputGroupLarge: {
    flexGrow: Platform.OS === 'web' ? 1.8 : 1,
    flexShrink: 1,
    flexBasis: '0%',
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Border.radius.md,
    paddingHorizontal: 8,
    height: 46,
    gap: Spacing.xs,
  },
  textInput: {
    flex: 1,
    width: '100%',
    minWidth: 0,
    fontSize: 12,
    color: '#0f172a',
    outlineStyle: 'none', // Remove web outline
    height: '100%',
    paddingVertical: 0,
    lineHeight: Platform.OS === 'web' ? 46 : undefined,
    textAlignVertical: 'center',
  } as any,
  searchBtn: {
    backgroundColor: Colors.primary,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: Spacing.xl,
    height: 46,
    borderRadius: Border.radius.md,
    gap: Spacing.xs,
    width: Platform.OS === 'web' ? 'auto' : '100%',
  },
  searchBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  heroActions: {
    flexDirection: 'row',
    gap: Spacing.md,
    marginTop: Spacing.sm,
  },
  actionBtnPrimary: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Border.radius.md,
  },
  actionBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 15,
  },
  actionBtnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: Border.width.sm,
    borderColor: Colors.primary,
    paddingVertical: 12,
    paddingHorizontal: 24,
    borderRadius: Border.radius.md,
  },
  actionBtnSecondaryText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  heroRight: {
    flex: 1,
    alignItems: 'center',
  },
  heroImage: {
    width: '100%',
    height: 350,
    borderRadius: Border.radius.xl,
  },
  section: {
    paddingVertical: Spacing.xxxl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  sectionHeader: {
    maxWidth: MaxContentWidth,
    width: '100%',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
    marginBottom: Spacing.xl,
  },
  sectionTitle: {
    fontSize: 26,
    fontWeight: '800',
    color: '#0f172a',
    marginBottom: 4,
    textAlign: 'center',
  },
  sectionSubtitle: {
    fontSize: 15,
    color: '#64748b',
    textAlign: 'center',
    marginBottom: Spacing.xl,
  },
  categoriesGrid: {
    maxWidth: MaxContentWidth,
    width: '100%',
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  categoryCard: {
    backgroundColor: 'white',
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    borderRadius: Border.radius.lg,
    alignItems: 'center',
    width: Platform.OS === 'web' ? 140 : '45%',
    gap: Spacing.sm,
  },
  categoryIconBg: {
    backgroundColor: Colors.secondary,
    padding: Spacing.md,
    borderRadius: Border.radius.full,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#1e293b',
    textAlign: 'center',
  },
  viewAllBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    color: Colors.primary,
    fontWeight: 'bold',
    fontSize: 15,
  },
  roomsGrid: {
    maxWidth: MaxContentWidth,
    width: '100%',
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.xl,
  },
  roomCard: {
    backgroundColor: 'white',
    borderRadius: Border.radius.lg,
    overflow: 'hidden',
    width: Platform.OS === 'web' ? '31%' : '100%',
  },
  roomImage: {
    width: '100%',
    height: 180,
  },
  roomCardContent: {
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  roomBadgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  roomTypeBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: Border.radius.sm,
  },
  roomTypeBadgeText: {
    color: Colors.primary,
    fontSize: 12,
    fontWeight: 'bold',
  },
  roomViews: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  roomViewsText: {
    color: Colors.light.textSecondary,
    fontSize: 12,
  },
  roomTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    lineHeight: 20,
    height: 40,
  },
  roomPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  roomSpecs: {
    flexDirection: 'row',
    gap: Spacing.xs,
    alignItems: 'center',
  },
  roomSpecText: {
    fontSize: 12,
    color: Colors.light.textSecondary,
  },
  statsSection: {
    backgroundColor: '#0f172a',
    paddingVertical: Spacing.xxl,
    paddingHorizontal: Spacing.xl,
    alignItems: 'center',
  },
  statsContainer: {
    maxWidth: MaxContentWidth,
    width: '100%',
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    gap: Spacing.xl,
  },
  statBox: {
    flex: 1,
    alignItems: 'center',
    gap: 4,
    minWidth: '40%',
  },
  statNumber: {
    fontSize: 36,
    fontWeight: '800',
    color: 'white',
  },
  statLabel: {
    color: '#94a3b8',
    fontSize: 14,
  },
  stepsGrid: {
    maxWidth: MaxContentWidth,
    width: '100%',
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
    justifyContent: 'space-between',
    gap: Spacing.xl,
    marginTop: Spacing.lg,
  },
  stepCard: {
    flex: 1,
    alignItems: 'center',
    padding: Spacing.lg,
    gap: Spacing.sm,
  },
  stepIcon: {
    width: 60,
    height: 60,
    borderRadius: 30,
    backgroundColor: Colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  stepTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  stepDesc: {
    fontSize: 14,
    color: Colors.light.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
  bannerWrapper: {
    width: '100%',
    height: 420,
    borderRadius: Border.radius.xl,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#cbd5e1',
  },
  bannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  bannerGradient: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    height: '60%',
    backgroundColor: 'rgba(0,0,0,0.6)',
  },
  bannerTextContainer: {
    position: 'absolute',
    bottom: Spacing.lg,
    left: Spacing.lg,
    right: Spacing.lg,
    gap: 4,
    zIndex: 10,
  },
  bannerTextTitle: {
    color: 'white',
    fontSize: 18,
    fontWeight: 'bold',
  },
  bannerTextDesc: {
    color: '#cbd5e1',
    fontSize: 13,
  },
  dotsRow: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
    gap: 6,
    zIndex: 20,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: 'rgba(255,255,255,0.4)',
  },
  dotActive: {
    width: 24,
    backgroundColor: 'white',
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 50,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    zIndex: 1000,
    paddingVertical: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  suggestionSectionTitle: {
    fontSize: 11,
    fontWeight: 'bold',
    color: '#94a3b8',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  suggestionItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f1f5f9',
  },
  suggestionText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  suggestionSubtext: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
});
