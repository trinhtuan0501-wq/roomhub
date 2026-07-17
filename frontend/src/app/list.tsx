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
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useLocalSearchParams, router } from 'expo-router';
import Layout from '../components/Layout';
import { Colors, Spacing, Shadows, Border, MaxContentWidth } from '../constants/theme';
import api from '../services/api';

// Local Property Images
import bhomeGs25 from '../../assets/images/bhome_gs25.jpg';
import bconsCityPark from '../../assets/images/bcons_city_park.jpg';
import bconsPool from '../../assets/images/bcons_pool.jpg';
import bconsApartments from '../../assets/images/bcons_apartments.jpg';
import bconsCityExterior from '../../assets/images/bcons_city_exterior.png';
import phucDatExterior from '../../assets/images/phuc_dat_exterior.png';
import bconsInteriorCommunity from '../../assets/images/bcons_interior_community.png';
import bconsEducationCenter from '../../assets/images/bcons_education_center.png';

// Helper to resolve string URLs or local required assets
const resolveImageSource = (imageObj: any) => {
  if (!imageObj) return { uri: 'https://images.unsplash.com/photo-1522771739844-6a9f6d5f14af?auto=format&fit=crop&w=500&q=80' };
  if (typeof imageObj.url === 'string' && imageObj.url.startsWith('http')) {
    return { uri: imageObj.url };
  }
  return imageObj.url;
};

// Static Categories & Amenities list for filters
const ROOM_TYPES = ['Phòng trọ', 'Căn hộ mini', 'Chung cư', 'Nhà nguyên căn', 'Phòng ở ghép', 'Ký túc xá'];
const AMENITIES = [
  { id: 'wifi', name: 'Wi-Fi', icon: 'wifi-outline' },
  { id: 'ac', name: 'Điều hòa', icon: 'snow-outline' },
  { id: 'fridge', name: 'Tủ lạnh', icon: 'refresh-circle-outline' },
  { id: 'parking', name: 'Chỗ để xe', icon: 'car-outline' },
  { id: 'balcony', name: 'Ban công', icon: 'leaf-outline' },
  { id: 'elevator', name: 'Thang máy', icon: 'arrow-up-outline' },
];

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

export default function RoomListScreen() {
  const { width } = useWindowDimensions();
  const isMobile = width < 992;
  const params = useLocalSearchParams();

  // View state: grid or list
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');

  // Filters State
  const [q, setQ] = useState(params.q ? String(params.q) : '');
  const [province, setProvince] = useState(params.province ? String(params.province) : '');
  const [district, setDistrict] = useState(params.district ? String(params.district) : '');
  const [roomType, setRoomType] = useState(params.type ? String(params.type) : '');
  const [minPrice, setMinPrice] = useState(params.minPrice ? String(params.minPrice) : '');
  const [maxPrice, setMaxPrice] = useState(params.maxPrice ? String(params.maxPrice) : '');
  const [minArea, setMinArea] = useState('');
  const [maxArea, setMaxArea] = useState('');
  const [selectedAmenities, setSelectedAmenities] = useState<string[]>([]);
  const [sort, setSort] = useState('newest');
  const [page, setPage] = useState(1);

  // Mobile Filter Overlay Visible State
  const [mobileFilterOpen, setMobileFilterOpen] = useState(false);
  const [searchFocused, setSearchFocused] = useState(false);

  // Advertising Banner Carousel State
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
      duration: 5000,
      useNativeDriver: true,
    }).start();

    const timeout = setTimeout(() => {
      setPrevBanner(activeBanner);
    }, 900);

    return () => clearTimeout(timeout);
  }, [activeBanner]);

  // Auto-play ad banners (paused on hover)
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setActiveBanner((prev) => (prev + 1) % BANNERS.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [activeBanner, isHovered]);

  // Popover State
  const [activePopover, setActivePopover] = useState<'location' | 'type' | 'price' | 'area' | 'details' | null>(null);
  const [listingType, setListingType] = useState<'rent' | 'buy'>('rent');

  const POPULAR_SUGGESTIONS = [
    'Phòng trọ giá rẻ',
    'Căn hộ mini 5x5',
    'Chung cư mini Bcons',
    'Nhà nguyên căn dài 18m',
    'Ký túc xá Linh Trung'
  ];

  const getFilteredSuggestions = () => {
    if (!q) return [];
    const queryLower = q.toLowerCase();
    
    // Parse length/width from query
    const dimMatch = queryLower.match(/(\d+(?:\.\d+)?)\s*(?:m)?\s*[xX*×]\s*(\d+(?:\.\d+)?)/);
    const lengthMatch = queryLower.match(/(?:dài|dai|d)\s*(\d+(?:\.\d+)?)/i);
    const widthMatch = queryLower.match(/(?:rộng|rong|r)\s*(\d+(?:\.\d+)?)/i);
    
    const matchedRooms = rooms.filter(room => {
      const titleMatch = room.title?.toLowerCase().includes(queryLower);
      const addressMatch = room.address?.detail?.toLowerCase().includes(queryLower) ||
                           room.address?.district?.toLowerCase().includes(queryLower);
      
      let dimensionMatch = false;
      if (dimMatch) {
        const dim1 = Number(dimMatch[1]);
        const dim2 = Number(dimMatch[2]);
        dimensionMatch = (room.length === dim1 && room.width === dim2) || 
                         (room.length === dim2 && room.width === dim1);
      }
      
      let specMatch = false;
      if (lengthMatch || widthMatch) {
        const lVal = lengthMatch ? Number(lengthMatch[1]) : null;
        const wVal = widthMatch ? Number(widthMatch[1]) : null;
        specMatch = (!lVal || room.length === lVal) && (!wVal || room.width === wVal);
      }
      
      return titleMatch || addressMatch || dimensionMatch || specMatch;
    });
    
    const suggestionsList = matchedRooms.slice(0, 5).map(room => ({
      type: 'room',
      _id: room._id,
      title: room.title,
      length: room.length || 5,
      width: room.width || 4,
      price: room.price,
    }));
    
    suggestionsList.push({
      type: 'text',
      text: q,
      title: `Tìm kiếm với: "${q}"`,
    } as any);
    
    return suggestionsList;
  };

  // Result state
  const [rooms, setRooms] = useState<any[]>([]);
  const [pagination, setPagination] = useState({ total: 0, pages: 1, limit: 9 });
  const [loading, setLoading] = useState(true);

  // Build filter request and fetch rooms
  const fetchRooms = async () => {
    setLoading(true);
    try {
      const queryParams: any = {
        page,
        sort,
      };

      if (q) queryParams.q = q;
      if (province) queryParams.province = province;
      if (district) queryParams.district = district;
      if (roomType) queryParams.type = roomType;
      if (minPrice) queryParams.minPrice = minPrice;
      if (maxPrice) queryParams.maxPrice = maxPrice;
      if (minArea) queryParams.minArea = minArea;
      if (maxArea) queryParams.maxArea = maxArea;
      if (selectedAmenities.length > 0) queryParams.amenities = selectedAmenities.join(',');

      const res = await api.get('/rooms', { params: queryParams, timeout: 4000 });
      
      if (res.data?.rooms) {
        setRooms(res.data.rooms);
        setPagination(res.data.pagination);
      }
    } catch (err) {
      console.warn('Failed to fetch rooms list, using mock data:', err);
      // Fallback premium mock rooms matching TP.HCM, Dĩ An Bình Dương
      const mockList = [
        {
          _id: 'mock1',
          title: 'Phòng trọ khép kín gần ĐHQG, Dĩ An Bình Dương',
          price: 2500000,
          deposit: 1500000,
          area: 25,
          length: 5,
          width: 5,
          address: { province: 'Bình Dương', district: 'Dĩ An', ward: 'Đông Hòa', detail: 'Tân Lập, Đông Hòa' },
          images: [{ url: bhomeGs25 }],
          type: { name: 'Phòng trọ' },
          createdAt: new Date().toISOString(),
          views: 120,
        },
        {
          _id: 'mock2',
          title: 'Căn hộ mini full tiện ích Dĩ An Bình Dương lầu cao ban công',
          price: 4200000,
          deposit: 3000000,
          area: 32,
          length: 8,
          width: 4,
          address: { province: 'Bình Dương', district: 'Dĩ An', ward: 'Đông Hòa', detail: 'Vành đai ĐHQG' },
          images: [{ url: bconsPool }],
          type: { name: 'Căn hộ mini' },
          createdAt: new Date().toISOString(),
          views: 95,
        },
        {
          _id: 'mock3',
          title: 'Ký túc xá sinh viên phòng máy lạnh giường tầng giá rẻ Thủ Đức',
          price: 900000,
          deposit: 900000,
          area: 50,
          length: 10,
          width: 5,
          address: { province: 'Hồ Chí Minh', district: 'Thủ Đức', ward: 'Linh Trung', detail: 'Đường số 6' },
          images: [{ url: bconsApartments }],
          type: { name: 'Ký túc xá' },
          createdAt: new Date().toISOString(),
          views: 340,
        },
        {
          _id: 'mock4',
          title: 'Nhà nguyên căn sạch sẽ 2 lầu gần ngã tư Dĩ An',
          price: 9000000,
          deposit: 10000000,
          area: 90,
          length: 18,
          width: 5,
          address: { province: 'Bình Dương', district: 'Dĩ An', ward: 'Dĩ An', detail: 'Lý Thường Kiệt' },
          images: [{ url: bconsCityPark }],
          type: { name: 'Nhà nguyên căn' },
          createdAt: new Date().toISOString(),
          views: 75,
        },
      ];
      setRooms(mockList);
      setPagination({ total: mockList.length, pages: 1, limit: 9 });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchRooms();
  }, [page, sort, roomType]); // auto refresh on pagination, sorting, or quick type updates

  const toggleAmenity = (id: string) => {
    if (selectedAmenities.includes(id)) {
      setSelectedAmenities(selectedAmenities.filter((a) => a !== id));
    } else {
      setSelectedAmenities([...selectedAmenities, id]);
    }
  };

  const handleClearFilters = () => {
    setQ('');
    setProvince('');
    setDistrict('');
    setRoomType('');
    setMinPrice('');
    setMaxPrice('');
    setMinArea('');
    setMaxArea('');
    setSelectedAmenities([]);
    setPage(1);
    // Directly fetch after clearing
    setTimeout(fetchRooms, 0);
  };

  const formatPrice = (price: number) => {
    return (price / 1000000).toFixed(1) + ' tr/tháng';
  };

  // Render Filter Form Content
  const renderFilterForm = () => (
    <View style={styles.filterForm}>
      <Text style={styles.filterTitle}>Bộ lọc tìm kiếm</Text>
      
      {/* Search keyword */}
      <View style={[styles.filterGroup, { zIndex: 100, position: 'relative' }]}>
        <Text style={styles.filterLabel}>Từ khóa</Text>
        <View style={styles.inputSearchBox}>
          <Ionicons name="search-outline" size={16} color={Colors.light.textSecondary} />
          <TextInput
            placeholder="Tìm theo tiêu đề, địa chỉ..."
            value={q}
            onChangeText={setQ}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
            style={styles.filterInput}
          />
        </View>

        {/* Suggestions Dropdown */}
        {searchFocused && (
          <View style={[styles.suggestionsDropdown, Shadows.md]}>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ maxHeight: 220 }}>
              {!q ? (
                <>
                  <Text style={styles.suggestionSectionTitle}>Tìm kiếm phổ biến</Text>
                  {POPULAR_SUGGESTIONS.map((item, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        setQ(item);
                        setSearchFocused(false);
                      }}
                      style={styles.suggestionItem}
                      className="hover-button"
                    >
                      <Ionicons name="trending-up-outline" size={14} color="#64748b" style={{ marginRight: 8 }} />
                      <Text style={styles.suggestionText}>{item}</Text>
                    </Pressable>
                  ))}
                </>
              ) : (
                <>
                  {getFilteredSuggestions().map((item, idx) => (
                    <Pressable
                      key={idx}
                      onPress={() => {
                        if (item.type === 'room') {
                          router.push(`/room/${item._id}`);
                        } else {
                          setQ(item.text);
                        }
                        setSearchFocused(false);
                      }}
                      style={styles.suggestionItem}
                      className="hover-button"
                    >
                      <Ionicons 
                        name={item.type === 'room' ? 'home-outline' : 'search-outline'} 
                        size={14} 
                        color={Colors.primary} 
                        style={{ marginRight: 8 }}
                      />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.suggestionText} numberOfLines={1}>
                          {item.title || item.text}
                        </Text>
                        {item.type === 'room' && (
                          <Text style={styles.suggestionSubtext}>
                            Kích thước: {item.length}m × {item.width}m | {formatPrice(item.price)}
                          </Text>
                        )}
                      </View>
                    </Pressable>
                  ))}
                </>
              )}
            </ScrollView>
          </View>
        )}
      </View>

      {/* Address */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Tỉnh / Thành phố</Text>
        <TextInput
          placeholder="Nhập Tỉnh / Thành phố"
          value={province}
          onChangeText={setProvince}
          style={styles.textInputBox}
        />
      </View>
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Quận / Huyện</Text>
        <TextInput
          placeholder="Nhập Quận / Huyện"
          value={district}
          onChangeText={setDistrict}
          style={styles.textInputBox}
        />
      </View>

      {/* Room Type */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Loại phòng</Text>
        <View style={styles.typesRow}>
          {ROOM_TYPES.map((type) => (
            <Pressable
              key={type}
              onPress={() => setRoomType(roomType === type ? '' : type)}
              style={[
                styles.typeChip,
                roomType === type && styles.typeChipActive,
              ]}>
              <Text style={[styles.typeChipText, roomType === type && styles.typeChipTextActive]}>
                {type}
              </Text>
            </Pressable>
          ))}
        </View>
      </View>

      {/* Price range */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Khoảng giá (VNĐ)</Text>
        <View style={styles.rangeRow}>
          <TextInput
            placeholder="Từ"
            keyboardType="numeric"
            value={minPrice}
            onChangeText={setMinPrice}
            style={[styles.textInputBox, { flex: 1 }]}
          />
          <Text style={styles.rangeSeparator}>-</Text>
          <TextInput
            placeholder="Đến"
            keyboardType="numeric"
            value={maxPrice}
            onChangeText={setMaxPrice}
            style={[styles.textInputBox, { flex: 1 }]}
          />
        </View>
      </View>

      {/* Area range */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Diện tích (m²)</Text>
        <View style={styles.rangeRow}>
          <TextInput
            placeholder="Từ"
            keyboardType="numeric"
            value={minArea}
            onChangeText={setMinArea}
            style={[styles.textInputBox, { flex: 1 }]}
          />
          <Text style={styles.rangeSeparator}>-</Text>
          <TextInput
            placeholder="Đến"
            keyboardType="numeric"
            value={maxArea}
            onChangeText={setMaxArea}
            style={[styles.textInputBox, { flex: 1 }]}
          />
        </View>
      </View>

      {/* Amenities checkboxes */}
      <View style={styles.filterGroup}>
        <Text style={styles.filterLabel}>Tiện ích</Text>
        <View style={styles.amenitiesChecklist}>
          {AMENITIES.map((amenity) => {
            const isChecked = selectedAmenities.includes(amenity.id);
            return (
              <Pressable
                key={amenity.id}
                onPress={() => toggleAmenity(amenity.id)}
                style={styles.checkboxRow}>
                <Ionicons
                  name={isChecked ? 'checkbox' : 'square-outline'}
                  size={20}
                  color={isChecked ? Colors.primary : Colors.light.textSecondary}
                />
                <Text style={styles.checkboxLabel}>{amenity.name}</Text>
              </Pressable>
            );
          })}
        </View>
      </View>

      {/* Filter actions */}
      <View style={styles.filterActions}>
        <Pressable onPress={fetchRooms} style={styles.applyBtn}>
          <Text style={styles.applyBtnText}>Áp dụng bộ lọc</Text>
        </Pressable>
        <Pressable onPress={handleClearFilters} style={styles.clearBtn}>
          <Text style={styles.clearBtnText}>Xóa tất cả bộ lọc</Text>
        </Pressable>
      </View>
    </View>
  );

  const renderHorizontalFilters = () => {
    return (
      <View style={styles.horizontalBarContainer}>
        {/* Toggle Rent/Buy */}
        <Pressable 
          style={[styles.hFilterBtn, styles.typeToggleBtn]}
          onPress={() => setListingType(listingType === 'rent' ? 'buy' : 'rent')}
        >
          <Ionicons name="funnel-outline" size={15} color="#475569" />
          <Text style={styles.hFilterBtnText}>
            {listingType === 'rent' ? 'Cho Thuê' : 'Cần Mua'}
          </Text>
        </Pressable>

        {/* Search Input Keyword */}
        <View style={styles.hSearchContainer}>
          <TextInput
            placeholder="Nhập từ khóa tìm kiếm..."
            value={q}
            onChangeText={setQ}
            style={styles.hSearchInput}
            onFocus={() => setSearchFocused(true)}
            onBlur={() => setTimeout(() => setSearchFocused(false), 200)}
          />
          <Ionicons name="search" size={16} color="#64748b" style={styles.hSearchIcon} />

          {/* Search suggestions */}
          {searchFocused && q.length > 0 && (
            <View style={[styles.hSearchSuggestions, Shadows.md]}>
              {getFilteredSuggestions().map((item, idx) => (
                <Pressable
                  key={idx}
                  onPress={() => {
                    if (item.type === 'room') {
                      router.push(`/room/${item._id}`);
                    } else {
                      setQ(item.text);
                      fetchRooms();
                    }
                  }}
                  style={styles.suggestionItem}
                >
                  <Ionicons 
                    name={item.type === 'room' ? 'home-outline' : 'search-outline'} 
                    size={14} 
                    color={Colors.primary} 
                    style={{ marginRight: 8 }}
                  />
                  <Text style={styles.suggestionText}>{item.title || item.text}</Text>
                </Pressable>
              ))}
            </View>
          )}
        </View>

        {/* Location Dropdown */}
        <View style={styles.hFilterItemWrapper}>
          <Pressable 
            style={[styles.hFilterBtn, activePopover === 'location' && styles.hFilterBtnActive]}
            onPress={() => setActivePopover(activePopover === 'location' ? null : 'location')}
          >
            <Ionicons name="location-outline" size={15} color={activePopover === 'location' ? Colors.primary : '#475569'} />
            <Text style={[styles.hFilterBtnText, activePopover === 'location' && styles.hFilterBtnTextActive]}>
              {province || district ? `${district || province}` : 'Lọc Khu Vực'}
            </Text>
            <Ionicons name="chevron-down" size={12} color={activePopover === 'location' ? Colors.primary : '#64748b'} />
          </Pressable>
          {activePopover === 'location' && (
            <View style={[styles.popoverDropdown, Shadows.md]}>
              <Text style={styles.popoverTitle}>Chọn Khu Vực</Text>
              <View style={styles.popoverInputRow}>
                <TextInput
                  placeholder="Tỉnh / Thành phố"
                  value={province}
                  onChangeText={setProvince}
                  style={styles.popoverInput}
                />
              </View>
              <View style={styles.popoverInputRow}>
                <TextInput
                  placeholder="Quận / Huyện"
                  value={district}
                  onChangeText={setDistrict}
                  style={styles.popoverInput}
                />
              </View>
              <View style={styles.popoverActions}>
                <Pressable onPress={() => { setProvince(''); setDistrict(''); }} style={styles.popoverResetBtn}>
                  <Text style={styles.popoverResetText}>Đặt lại</Text>
                </Pressable>
                <Pressable onPress={() => { fetchRooms(); setActivePopover(null); }} style={styles.popoverApplyBtn}>
                  <Text style={styles.popoverApplyText}>Áp dụng</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Type Dropdown */}
        <View style={styles.hFilterItemWrapper}>
          <Pressable 
            style={[styles.hFilterBtn, activePopover === 'type' && styles.hFilterBtnActive]}
            onPress={() => setActivePopover(activePopover === 'type' ? null : 'type')}
          >
            <Ionicons name="grid-outline" size={15} color={activePopover === 'type' ? Colors.primary : '#475569'} />
            <Text style={[styles.hFilterBtnText, activePopover === 'type' && styles.hFilterBtnTextActive]}>
              {roomType || 'Lọc loại hình'}
            </Text>
            <Ionicons name="chevron-down" size={12} color={activePopover === 'type' ? Colors.primary : '#64748b'} />
          </Pressable>
          {activePopover === 'type' && (
            <View style={[styles.popoverDropdown, Shadows.md, { width: 260 }]}>
              <Text style={styles.popoverTitle}>Loại phòng</Text>
              <View style={styles.popoverGrid}>
                {ROOM_TYPES.map((type) => (
                  <Pressable
                    key={type}
                    onPress={() => setRoomType(roomType === type ? '' : type)}
                    style={[styles.popoverChip, roomType === type && styles.popoverChipActive]}
                  >
                    <Text style={[styles.popoverChipText, roomType === type && styles.popoverChipTextActive]}>
                      {type}
                    </Text>
                  </Pressable>
                ))}
              </View>
              <View style={styles.popoverActions}>
                <Pressable onPress={() => setRoomType('')} style={styles.popoverResetBtn}>
                  <Text style={styles.popoverResetText}>Xóa</Text>
                </Pressable>
                <Pressable onPress={() => { fetchRooms(); setActivePopover(null); }} style={styles.popoverApplyBtn}>
                  <Text style={styles.popoverApplyText}>Áp dụng</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Price Dropdown */}
        <View style={styles.hFilterItemWrapper}>
          <Pressable 
            style={[styles.hFilterBtn, activePopover === 'price' && styles.hFilterBtnActive]}
            onPress={() => setActivePopover(activePopover === 'price' ? null : 'price')}
          >
            <Ionicons name="cash-outline" size={15} color={activePopover === 'price' ? Colors.primary : '#475569'} />
            <Text style={[styles.hFilterBtnText, activePopover === 'price' && styles.hFilterBtnTextActive]}>
              {minPrice || maxPrice ? 'Mức giá đã lọc' : 'Lọc mức giá'}
            </Text>
            <Ionicons name="chevron-down" size={12} color={activePopover === 'price' ? Colors.primary : '#64748b'} />
          </Pressable>
          {activePopover === 'price' && (
            <View style={[styles.popoverDropdown, Shadows.md, { width: 300 }]}>
              <Text style={styles.popoverTitle}>Lọc mức giá</Text>
              <View style={styles.popoverRangeInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rangeLabel}>Từ:</Text>
                  <TextInput
                    placeholder="0"
                    value={minPrice}
                    onChangeText={setMinPrice}
                    style={styles.rangeInput}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.rangeLabel}>Đến (VNĐ):</Text>
                  <TextInput
                    placeholder="10000000"
                    value={maxPrice}
                    onChangeText={setMaxPrice}
                    style={styles.rangeInput}
                    keyboardType="numeric"
                  />
                </View>
              </View>
              
              <View style={styles.popoverOptions}>
                {[
                  { label: 'Dưới 1.5 triệu', min: '', max: '1500000' },
                  { label: '1.5 - 3 triệu', min: '1500000', max: '3000000' },
                  { label: '3 - 5 triệu', min: '3000000', max: '5000000' },
                  { label: 'Trên 5 triệu', min: '5000000', max: '' },
                ].map((item, idx) => {
                  const isSelected = minPrice === item.min && maxPrice === item.max;
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => { setMinPrice(item.min); setMaxPrice(item.max); }}
                      style={styles.popoverRadioRow}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioInnerCircle} />}
                      </View>
                      <Text style={styles.radioLabel}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.popoverActions}>
                <Pressable onPress={() => { setMinPrice(''); setMaxPrice(''); }} style={styles.popoverResetBtn}>
                  <Text style={styles.popoverResetText}>Đặt lại</Text>
                </Pressable>
                <Pressable onPress={() => { fetchRooms(); setActivePopover(null); }} style={styles.popoverApplyBtn}>
                  <Text style={styles.popoverApplyText}>Áp dụng</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Area Dropdown */}
        <View style={styles.hFilterItemWrapper}>
          <Pressable 
            style={[styles.hFilterBtn, activePopover === 'area' && styles.hFilterBtnActive]}
            onPress={() => setActivePopover(activePopover === 'area' ? null : 'area')}
          >
            <Ionicons name="expand-outline" size={15} color={activePopover === 'area' ? Colors.primary : '#475569'} />
            <Text style={[styles.hFilterBtnText, activePopover === 'area' && styles.hFilterBtnTextActive]}>
              {minArea || maxArea ? 'Diện tích đã lọc' : 'Lọc diện tích'}
            </Text>
            <Ionicons name="chevron-down" size={12} color={activePopover === 'area' ? Colors.primary : '#64748b'} />
          </Pressable>
          {activePopover === 'area' && (
            <View style={[styles.popoverDropdown, Shadows.md, { width: 300 }]}>
              <Text style={styles.popoverTitle}>Lọc diện tích</Text>
              <View style={styles.popoverRangeInputs}>
                <View style={{ flex: 1 }}>
                  <Text style={styles.rangeLabel}>Từ:</Text>
                  <TextInput
                    placeholder="0"
                    value={minArea}
                    onChangeText={setMinArea}
                    style={styles.rangeInput}
                    keyboardType="numeric"
                  />
                </View>
                <View style={{ flex: 1, marginLeft: 12 }}>
                  <Text style={styles.rangeLabel}>Đến (m²):</Text>
                  <TextInput
                    placeholder="100"
                    value={maxArea}
                    onChangeText={setMaxArea}
                    style={styles.rangeInput}
                    keyboardType="numeric"
                  />
                </View>
              </View>

              <View style={styles.popoverOptions}>
                {[
                  { label: 'Dưới 20 m²', min: '', max: '20' },
                  { label: 'Từ 20 - 30 m²', min: '20', max: '30' },
                  { label: 'Từ 30 - 50 m²', min: '30', max: '50' },
                  { label: 'Trên 50 m²', min: '50', max: '' },
                ].map((item, idx) => {
                  const isSelected = minArea === item.min && maxArea === item.max;
                  return (
                    <Pressable
                      key={idx}
                      onPress={() => { setMinArea(item.min); setMaxArea(item.max); }}
                      style={styles.popoverRadioRow}
                    >
                      <View style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                        {isSelected && <View style={styles.radioInnerCircle} />}
                      </View>
                      <Text style={styles.radioLabel}>{item.label}</Text>
                    </Pressable>
                  );
                })}
              </View>

              <View style={styles.popoverActions}>
                <Pressable onPress={() => { setMinArea(''); setMaxArea(''); }} style={styles.popoverResetBtn}>
                  <Text style={styles.popoverResetText}>Đặt lại</Text>
                </Pressable>
                <Pressable onPress={() => { fetchRooms(); setActivePopover(null); }} style={styles.popoverApplyBtn}>
                  <Text style={styles.popoverApplyText}>Áp dụng</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Details Dropdown */}
        <View style={styles.hFilterItemWrapper}>
          <Pressable 
            style={[styles.hFilterBtn, activePopover === 'details' && styles.hFilterBtnActive]}
            onPress={() => setActivePopover(activePopover === 'details' ? null : 'details')}
          >
            <Ionicons name="options-outline" size={15} color={activePopover === 'details' ? Colors.primary : '#475569'} />
            <Text style={[styles.hFilterBtnText, activePopover === 'details' && styles.hFilterBtnTextActive]}>
              {selectedAmenities.length > 0 ? `Tiện ích (${selectedAmenities.length})` : 'Lọc chi tiết'}
            </Text>
            <Ionicons name="chevron-down" size={12} color={activePopover === 'details' ? Colors.primary : '#64748b'} />
          </Pressable>
          {activePopover === 'details' && (
            <View style={[styles.popoverDropdown, Shadows.md, { width: 320, right: 0, left: 'auto' }]}>
              <Text style={styles.popoverTitle}>Tiện ích phòng</Text>
              <View style={styles.popoverGrid}>
                {AMENITIES.map((amenity) => {
                  const isChecked = selectedAmenities.includes(amenity.id);
                  return (
                    <Pressable
                      key={amenity.id}
                      onPress={() => {
                        if (isChecked) {
                          setSelectedAmenities(selectedAmenities.filter(id => id !== amenity.id));
                        } else {
                          setSelectedAmenities([...selectedAmenities, amenity.id]);
                        }
                      }}
                      style={[styles.popoverChip, isChecked && styles.popoverChipActive, { width: '47%' }]}
                    >
                      <Ionicons name={amenity.icon as any} size={13} color={isChecked ? 'white' : '#64748b'} style={{ marginRight: 6 }} />
                      <Text style={[styles.popoverChipText, isChecked && styles.popoverChipTextActive]}>
                        {amenity.name}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
              <View style={styles.popoverActions}>
                <Pressable onPress={() => setSelectedAmenities([])} style={styles.popoverResetBtn}>
                  <Text style={styles.popoverResetText}>Xóa tất cả</Text>
                </Pressable>
                <Pressable onPress={() => { fetchRooms(); setActivePopover(null); }} style={styles.popoverApplyBtn}>
                  <Text style={styles.popoverApplyText}>Áp dụng</Text>
                </Pressable>
              </View>
            </View>
          )}
        </View>

        {/* Global Reset Button */}
        <Pressable onPress={handleClearFilters} style={[styles.hFilterBtn, styles.resetAllBtn]}>
          <Ionicons name="refresh" size={15} color="#e11d48" />
          <Text style={[styles.hFilterBtnText, { color: '#e11d48', fontWeight: 'bold' }]}>Đặt lại</Text>
        </Pressable>
      </View>
    );
  };

  return (
    <Layout>
      <View style={styles.container}>
        <View style={styles.contentWrapper}>
          {/* Banner Quảng Cáo */}
          {!isMobile && (
            <Pressable
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              onHoverIn={() => setIsHovered(true)}
              onHoverOut={() => setIsHovered(false)}
              style={styles.adBannerWrapper}
            >
              {/* Background Image (Previous Slide) */}
              <Image 
                source={BANNERS[prevBanner].image} 
                pointerEvents="none"
                style={[styles.adBannerImage, { transform: [{ scale: 1.03 }] }]} 
              />
              {/* Foreground Animated Image (Current active slide) */}
              <Animated.Image
                source={BANNERS[activeBanner].image}
                pointerEvents="none"
                style={[
                  styles.adBannerImage,
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
              <View pointerEvents="none" style={styles.adBannerOverlay} />
              <View pointerEvents="none" style={styles.adBannerTextContainer}>
                <Text key={`ad-title-${activeBanner}`} className="fade-in" style={styles.adBannerTitle}>
                  {BANNERS[activeBanner].title}
                </Text>
                <Text key={`ad-desc-${activeBanner}`} className="fade-in" style={styles.adBannerDesc}>
                  {BANNERS[activeBanner].desc}
                </Text>
              </View>
              {/* Carousel indicators */}
              <View style={styles.adBannerDots}>
                {BANNERS.map((_, idx) => (
                  <Pressable
                    key={idx}
                    onPress={() => {
                      setPrevBanner(activeBanner);
                      setActiveBanner(idx);
                    }}
                    style={[styles.adBannerDot, activeBanner === idx && styles.adBannerDotActive]}
                  />
                ))}
              </View>
            </Pressable>
          )}

          {/* Horizontal Filters Bar (Desktop) */}
          {!isMobile && renderHorizontalFilters()}

          <View style={styles.content}>
            {/* LEFT COLUMN: FILTERS (DESKTOP) */}
            {!isMobile && false && (
              <View style={[styles.sidebar, Shadows.sm]}>
                {renderFilterForm()}
              </View>
            )}

            {/* RIGHT COLUMN: LIST RESULTS */}
            <View style={styles.mainList}>
            {/* Top Toolbar */}
            <View style={[styles.toolbar, Shadows.sm]}>
              <Text style={styles.resultsCount}>
                Tìm thấy <Text style={{ fontWeight: 'bold' }}>{pagination.total}</Text> kết quả
              </Text>

              <View style={styles.toolbarControls}>
                {/* View switcher */}
                <View style={styles.viewModeContainer}>
                  <Pressable
                    onPress={() => setViewMode('grid')}
                    style={[styles.modeBtn, viewMode === 'grid' && styles.modeBtnActive]}>
                    <Ionicons name="grid-outline" size={18} color={viewMode === 'grid' ? 'white' : '#64748b'} />
                  </Pressable>
                  <Pressable
                    onPress={() => setViewMode('list')}
                    style={[styles.modeBtn, viewMode === 'list' && styles.modeBtnActive]}>
                    <Ionicons name="list-outline" size={18} color={viewMode === 'list' ? 'white' : '#64748b'} />
                  </Pressable>
                </View>

                {/* Sort selector */}
                <View style={styles.sortContainer}>
                  <Text style={styles.sortLabel}>Sắp xếp: </Text>
                  <Pressable
                    style={styles.sortDropdown}
                    onPress={() => {
                      const nextSort = sort === 'newest' ? 'price_asc' : sort === 'price_asc' ? 'price_desc' : 'newest';
                      setSort(nextSort);
                    }}>
                    <Text style={styles.sortValue}>
                      {sort === 'newest' && 'Mới nhất'}
                      {sort === 'price_asc' && 'Giá: Thấp -> Cao'}
                      {sort === 'price_desc' && 'Giá: Cao -> Thấp'}
                    </Text>
                    <Ionicons name="swap-vertical" size={14} color="#64748b" />
                  </Pressable>
                </View>

                {/* Mobile Filter Trigger Button */}
                {isMobile && (
                  <Pressable
                    onPress={() => setMobileFilterOpen(true)}
                    style={styles.mobileFilterBtn}>
                    <Ionicons name="filter-outline" size={18} color="white" />
                    <Text style={styles.mobileFilterBtnText}>Lọc</Text>
                  </Pressable>
                )}
              </View>
            </View>

            {/* List Contents */}
            {loading ? (
              <View style={styles.loaderContainer}>
                <ActivityIndicator size="large" color={Colors.primary} />
                <Text style={styles.loaderText}>Đang tải danh sách phòng...</Text>
              </View>
            ) : rooms.length === 0 ? (
              <View style={styles.emptyContainer}>
                <Ionicons name="search-circle-outline" size={64} color="#cbd5e1" />
                <Text style={styles.emptyTitle}>Không tìm thấy kết quả phù hợp</Text>
                <Text style={styles.emptySubtitle}>Hãy thử xóa bớt bộ lọc hoặc tìm kiếm với từ khóa khác.</Text>
                <Pressable onPress={handleClearFilters} style={styles.emptyBtn}>
                  <Text style={styles.emptyBtnText}>Xóa bộ lọc</Text>
                </Pressable>
              </View>
            ) : (
              <>
                <View style={viewMode === 'grid' ? styles.gridContainer : styles.listContainer}>
                  {rooms.map((room) => (
                    <Pressable
                      key={room._id}
                      className="hover-card hover-image-parent"
                      onPress={() => router.push(`/room/${room._id}`)}
                      style={[
                        viewMode === 'grid' ? styles.gridCard : styles.listCard,
                        Shadows.sm,
                      ]}>
                      <Image
                        source={resolveImageSource(room.images?.[0])}
                        style={viewMode === 'grid' ? styles.gridCardImg : styles.listCardImg}
                      />

                      <View style={styles.cardContent}>
                        <View style={styles.badgeRow}>
                          <View style={styles.typeBadge}>
                            <Text style={styles.typeBadgeText}>{room.type?.name}</Text>
                          </View>
                          <Text style={styles.viewsCount}>
                            <Ionicons name="eye-outline" size={12} /> {room.views || 0} lượt xem
                          </Text>
                        </View>

                        <Text style={styles.cardTitle} numberOfLines={2}>{room.title}</Text>
                        <Text style={styles.cardPrice}>{formatPrice(room.price)}</Text>
                        
                        <View style={styles.specsRow}>
                          <Text style={styles.specText}>Diện tích: {room.area}m²</Text>
                          <Text style={styles.specText}>•</Text>
                          <Text style={styles.specText} numberOfLines={1}>
                            {room.address?.district}, {room.address?.province}
                          </Text>
                        </View>
                      </View>
                    </Pressable>
                  ))}
                </View>

                {/* Pagination */}
                {pagination.pages > 1 && (
                  <View style={styles.pagination}>
                    <Pressable
                      disabled={page === 1}
                      onPress={() => setPage(page - 1)}
                      style={[styles.pageBtn, page === 1 && styles.pageBtnDisabled]}>
                      <Ionicons name="chevron-back" size={18} color={page === 1 ? '#cbd5e1' : Colors.primary} />
                    </Pressable>

                    {Array.from({ length: pagination.pages }).map((_, index) => {
                      const pageNum = index + 1;
                      const isCurrent = page === pageNum;
                      return (
                        <Pressable
                          key={pageNum}
                          onPress={() => setPage(pageNum)}
                          style={[styles.pageNumberBtn, isCurrent && styles.pageNumberBtnActive]}>
                          <Text style={[styles.pageNumberText, isCurrent && styles.pageNumberTextActive]}>
                            {pageNum}
                          </Text>
                        </Pressable>
                      );
                    })}

                    <Pressable
                      disabled={page === pagination.pages}
                      onPress={() => setPage(page + 1)}
                      style={[styles.pageBtn, page === pagination.pages && styles.pageBtnDisabled]}>
                      <Ionicons name="chevron-forward" size={18} color={page === pagination.pages ? '#cbd5e1' : Colors.primary} />
                    </Pressable>
                  </View>
                )}
              </>
            )}
            </View>
          </View>
        </View>
      </View>

      {/* MOBILE FILTERS SIDE DRAWER MODAL */}
      {isMobile && mobileFilterOpen && (
        <View style={styles.mobileFilterModal}>
          <View style={styles.mobileFilterHeader}>
            <Text style={styles.mobileFilterTitle}>Bộ lọc</Text>
            <Pressable onPress={() => setMobileFilterOpen(false)} style={styles.closeModalBtn}>
              <Ionicons name="close" size={24} color={Colors.light.text} />
            </Pressable>
          </View>
          <ScrollView contentContainerStyle={styles.mobileFilterBody}>
            {renderFilterForm()}
          </ScrollView>
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
    flexDirection: 'row',
    gap: Spacing.xl,
  },
  sidebar: {
    width: 280,
    backgroundColor: 'white',
    borderRadius: Border.radius.lg,
    padding: Spacing.lg,
    alignSelf: 'flex-start',
  },
  filterForm: {
    gap: Spacing.md,
  },
  filterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: Spacing.sm,
  },
  filterGroup: {
    gap: 6,
  },
  filterLabel: {
    fontSize: 13,
    fontWeight: 'bold',
    color: '#334155',
  },
  inputSearchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Border.radius.md,
    paddingHorizontal: Spacing.sm,
    height: 38,
    gap: Spacing.xs,
  },
  filterInput: {
    flex: 1,
    fontSize: 13,
    color: '#0f172a',
    outlineStyle: 'none',
    height: '100%',
    paddingVertical: 0,
    lineHeight: Platform.OS === 'web' ? 38 : undefined,
  } as any,
  textInputBox: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Border.radius.md,
    paddingHorizontal: Spacing.sm,
    height: 38,
    fontSize: 13,
    color: '#0f172a',
    outlineStyle: 'none',
    paddingVertical: 0,
    lineHeight: Platform.OS === 'web' ? 38 : undefined,
  } as any,
  typesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.xs,
  },
  typeChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: Border.radius.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
  },
  typeChipActive: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.primary,
  },
  typeChipText: {
    fontSize: 12,
    color: '#475569',
  },
  typeChipTextActive: {
    color: Colors.primary,
    fontWeight: 'bold',
  },
  rangeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  rangeSeparator: {
    color: '#64748b',
  },
  amenitiesChecklist: {
    gap: Spacing.xs,
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
  filterActions: {
    gap: Spacing.xs,
    marginTop: Spacing.sm,
  },
  applyBtn: {
    backgroundColor: Colors.primary,
    height: 40,
    borderRadius: Border.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  applyBtnText: {
    color: 'white',
    fontWeight: 'bold',
    fontSize: 14,
  },
  clearBtn: {
    backgroundColor: 'transparent',
    borderWidth: Border.width.sm,
    borderColor: '#cbd5e1',
    height: 40,
    borderRadius: Border.radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  } as any,
  clearBtnText: {
    color: '#64748b',
    fontWeight: 'bold',
    fontSize: 14,
  },
  mainList: {
    flex: 1,
    gap: Spacing.lg,
  },
  toolbar: {
    backgroundColor: 'white',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderRadius: Border.radius.lg,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    flexWrap: 'wrap',
    gap: Spacing.sm,
  },
  resultsCount: {
    fontSize: 14,
    color: '#475569',
  },
  toolbarControls: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  viewModeContainer: {
    flexDirection: 'row',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: Border.radius.md,
    overflow: 'hidden',
  },
  modeBtn: {
    padding: 6,
    backgroundColor: 'transparent',
  },
  modeBtnActive: {
    backgroundColor: Colors.primary,
  },
  sortContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  sortLabel: {
    fontSize: 13,
    color: '#64748b',
  },
  sortDropdown: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Border.radius.md,
    backgroundColor: '#f8fafc',
  },
  sortValue: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  mobileFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: Border.radius.md,
  },
  mobileFilterBtnText: {
    color: 'white',
    fontSize: 13,
    fontWeight: 'bold',
  },
  gridContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: Spacing.lg,
  },
  listContainer: {
    flexDirection: 'column',
    gap: Spacing.lg,
  },
  gridCard: {
    backgroundColor: 'white',
    borderRadius: Border.radius.lg,
    overflow: 'hidden',
    width: Platform.OS === 'web' ? '31%' : '100%',
  },
  listCard: {
    backgroundColor: 'white',
    borderRadius: Border.radius.lg,
    overflow: 'hidden',
    flexDirection: Platform.OS === 'web' ? 'row' : 'column',
  },
  gridCardImg: {
    width: '100%',
    height: 180,
  },
  listCardImg: {
    width: Platform.OS === 'web' ? 240 : '100%',
    height: Platform.OS === 'web' ? 'auto' : 180,
    minHeight: 160,
  },
  cardContent: {
    padding: Spacing.md,
    flex: 1,
    gap: Spacing.xs,
  },
  badgeRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  typeBadge: {
    backgroundColor: Colors.secondary,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: Border.radius.sm,
  },
  typeBadgeText: {
    color: Colors.primary,
    fontSize: 11,
    fontWeight: 'bold',
  },
  viewsCount: {
    fontSize: 12,
    color: '#64748b',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: 'bold',
    color: '#0f172a',
    lineHeight: 20,
  },
  cardPrice: {
    fontSize: 16,
    fontWeight: 'bold',
    color: Colors.primary,
  },
  specsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
  },
  specText: {
    fontSize: 12,
    color: '#64748b',
  },
  loaderContainer: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 80,
    gap: Spacing.sm,
  },
  loaderText: {
    color: '#64748b',
    fontSize: 14,
  },
  emptyContainer: {
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: Spacing.xl,
    borderRadius: Border.radius.lg,
    gap: Spacing.xs,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#334155',
    marginTop: Spacing.sm,
  },
  emptySubtitle: {
    fontSize: 14,
    color: '#64748b',
    textAlign: 'center',
  },
  emptyBtn: {
    marginTop: Spacing.md,
    backgroundColor: Colors.primary,
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: Border.radius.md,
  },
  emptyBtnText: {
    color: 'white',
    fontWeight: 'bold',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.xl,
  },
  pageBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageBtnDisabled: {
    borderColor: '#f1f5f9',
    backgroundColor: '#f8fafc',
  },
  pageNumberBtn: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    backgroundColor: 'white',
    alignItems: 'center',
    justifyContent: 'center',
  },
  pageNumberBtnActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  pageNumberText: {
    fontSize: 14,
    color: '#334155',
    fontWeight: '500',
  },
  pageNumberTextActive: {
    color: 'white',
    fontWeight: 'bold',
  },
  mobileFilterModal: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'white',
    zIndex: 10000,
  },
  mobileFilterHeader: {
    height: 60,
    borderBottomWidth: 1,
    borderBottomColor: '#e2e8f0',
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.xl,
  },
  mobileFilterTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0f172a',
  },
  closeModalBtn: {
    padding: 4,
  },
  mobileFilterBody: {
    padding: Spacing.xl,
  },
  suggestionsDropdown: {
    position: 'absolute',
    top: 68,
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
  noSuggestionBox: {
    paddingVertical: 16,
    alignItems: 'center',
  },
  noSuggestionText: {
    fontSize: 13,
    color: '#94a3b8',
  },
  contentWrapper: {
    maxWidth: MaxContentWidth,
    width: '100%',
    gap: Spacing.lg,
    zIndex: 100,
  },
  // Advertising Banner styles
  adBannerWrapper: {
    width: '100%',
    height: 260,
    borderRadius: Border.radius.lg,
    overflow: 'hidden',
    position: 'relative',
    backgroundColor: '#cbd5e1',
    marginBottom: Spacing.xs,
  },
  adBannerImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  adBannerOverlay: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: 0,
    top: 0,
    backgroundColor: 'rgba(15, 23, 42, 0.45)', // Sleek dark overlay
  },
  adBannerTextContainer: {
    position: 'absolute',
    bottom: Spacing.md,
    left: Spacing.lg,
    right: Spacing.lg,
    gap: 4,
    zIndex: 10,
  },
  adBannerTitle: {
    color: 'white',
    fontSize: 20,
    fontWeight: 'bold',
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 3,
  },
  adBannerDesc: {
    color: '#e2e8f0',
    fontSize: 13,
    textShadowColor: 'rgba(0, 0, 0, 0.5)',
    textShadowOffset: { width: 0, height: 1 },
    textShadowRadius: 2,
  },
  adBannerDots: {
    position: 'absolute',
    bottom: 12,
    right: 16,
    flexDirection: 'row',
    gap: 6,
    zIndex: 20,
  },
  adBannerDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: 'rgba(255, 255, 255, 0.4)',
  },
  adBannerDotActive: {
    width: 18,
    backgroundColor: 'white',
  },
  // Horizontal search filter bar styles
  horizontalBarContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'white',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: Border.radius.md,
    padding: 10,
    gap: Spacing.xs,
    zIndex: 150,
    flexWrap: 'wrap',
    position: 'relative',
    marginBottom: Spacing.sm,
  },
  hFilterBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    height: 38,
    paddingHorizontal: 12,
    borderRadius: Border.radius.md,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    gap: 6,
  },
  hFilterBtnActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.secondary,
  },
  hFilterBtnText: {
    fontSize: 13,
    color: '#334155',
    fontWeight: '500',
  },
  hFilterBtnTextActive: {
    color: Colors.primary,
    fontWeight: '600',
  },
  typeToggleBtn: {
    backgroundColor: Colors.secondary,
    borderColor: Colors.primary,
  },
  resetAllBtn: {
    borderColor: '#fecdd3',
    backgroundColor: '#fff1f2',
    marginLeft: 'auto',
  },
  hSearchContainer: {
    flex: 2,
    minWidth: 180,
    height: 38,
    position: 'relative',
    justifyContent: 'center',
  },
  hSearchInput: {
    height: '100%',
    width: '100%',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: Border.radius.md,
    paddingLeft: Spacing.md,
    paddingRight: 34,
    fontSize: 13,
    color: '#0f172a',
    backgroundColor: '#f8fafc',
    outlineStyle: 'none',
  } as any,
  hSearchIcon: {
    position: 'absolute',
    right: 10,
  },
  hSearchSuggestions: {
    position: 'absolute',
    top: 42,
    left: 0,
    right: 0,
    backgroundColor: 'white',
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    zIndex: 200,
    maxHeight: 200,
    overflow: 'hidden',
  },
  hFilterItemWrapper: {
    position: 'relative',
    zIndex: 160,
  },
  popoverDropdown: {
    position: 'absolute',
    top: 44,
    left: 0,
    backgroundColor: 'white',
    borderRadius: Border.radius.md,
    borderWidth: 1,
    borderColor: '#cbd5e1',
    padding: Spacing.md,
    width: 220,
    zIndex: 1000,
  },
  popoverTitle: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0f172a',
    marginBottom: Spacing.sm,
  },
  popoverInputRow: {
    marginBottom: Spacing.xs,
  },
  popoverInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Border.radius.md,
    paddingHorizontal: Spacing.sm,
    height: 36,
    fontSize: 13,
    color: '#0f172a',
    outlineStyle: 'none',
  } as any,
  popoverGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: Spacing.md,
  },
  popoverChip: {
    backgroundColor: '#f1f5f9',
    paddingHorizontal: 8,
    paddingVertical: 5,
    borderRadius: Border.radius.sm,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    alignItems: 'center',
    justifyContent: 'center',
    flexDirection: 'row',
  },
  popoverChipActive: {
    backgroundColor: Colors.primary,
    borderColor: Colors.primary,
  },
  popoverChipText: {
    fontSize: 11,
    color: '#475569',
  },
  popoverChipTextActive: {
    color: 'white',
    fontWeight: '600',
  },
  popoverRangeInputs: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  rangeLabel: {
    fontSize: 11,
    color: '#64748b',
    marginBottom: 4,
  },
  rangeInput: {
    borderWidth: 1,
    borderColor: '#cbd5e1',
    borderRadius: Border.radius.md,
    paddingHorizontal: 8,
    height: 36,
    fontSize: 12,
    color: '#0f172a',
    outlineStyle: 'none',
  } as any,
  popoverOptions: {
    gap: 8,
    marginBottom: Spacing.md,
  },
  popoverRadioRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  radioCircle: {
    width: 14,
    height: 14,
    borderRadius: 7,
    borderWidth: 1,
    borderColor: '#64748b',
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioCircleActive: {
    borderColor: Colors.primary,
  },
  radioInnerCircle: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: Colors.primary,
  },
  radioLabel: {
    fontSize: 12,
    color: '#334155',
  },
  popoverActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
    paddingTop: Spacing.sm,
    marginTop: Spacing.xs,
  },
  popoverResetBtn: {
    paddingVertical: 6,
    paddingHorizontal: 12,
  },
  popoverResetText: {
    fontSize: 12,
    color: '#64748b',
  },
  popoverApplyBtn: {
    backgroundColor: Colors.primary,
    paddingVertical: 6,
    paddingHorizontal: 16,
    borderRadius: Border.radius.sm,
  },
  popoverApplyText: {
    fontSize: 12,
    color: 'white',
    fontWeight: 'bold',
  },
});
