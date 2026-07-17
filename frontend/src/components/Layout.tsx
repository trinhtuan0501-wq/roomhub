import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Pressable,
  useWindowDimensions,
  ScrollView,
  Image,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { Link, router, usePathname } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { useAuthStore } from '../store/useAuthStore';
import { Colors, Spacing, Shadows, Border, MaxContentWidth } from '../constants/theme';
import api from '../services/api';
import BrandLogo from './BrandLogo';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const { width } = useWindowDimensions();
  const isMobile = width < 768;
  const pathname = usePathname();
  const { user, isAuthenticated, logout, loadUser, isLoading } = useAuthStore();
  
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [notificationCount, setNotificationCount] = useState(0);

  // Sync auth state on mount
  useEffect(() => {
    loadUser();
  }, []);

  // Fetch notifications count if authenticated
  useEffect(() => {
    if (isAuthenticated) {
      const fetchNotifications = async () => {
        try {
          const res = await api.get('/notifications');
          const unread = res.data.notifications.filter((n: any) => !n.isRead).length;
          setNotificationCount(unread);
        } catch (err) {
          console.warn('Failed to fetch notifications:', err);
        }
      };
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 60000); // refresh every minute
      return () => clearInterval(interval);
    } else {
      setNotificationCount(0);
    }
  }, [isAuthenticated]);

  const handleLogout = async () => {
    setUserMenuOpen(false);
    setMobileMenuOpen(false);
    await logout();
    router.replace('/');
  };

  // Close menus on path changes
  useEffect(() => {
    setMobileMenuOpen(false);
    setUserMenuOpen(false);
  }, [pathname]);

  // Main Nav Links
  const navLinks = [
    { label: 'Trang chủ', href: '/' },
    { label: 'Danh sách phòng', href: '/list' },
    { label: 'Hướng dẫn', href: '/guide' },
    { label: 'Liên hệ', href: '/contact' },
  ];

  // Dashboard Nav links based on Role
  const getDashboardHref = () => {
    if (!user) return '/';
    if (user.role === 'admin') return '/admin/dashboard';
    if (user.role === 'landlord') return '/landlord/dashboard';
    return '/tenant/dashboard';
  };

  return (
    <View style={styles.container}>
      {/* 1. NAVBAR */}
      <View style={[styles.navbar, Shadows.sm]}>
        <View style={styles.navContent}>
          {/* Logo */}
          <Pressable onPress={() => router.push('/')} style={styles.logoContainer}>
            <BrandLogo size="medium" showSubtext={true} />
          </Pressable>

          {/* Desktop Nav Links */}
          {!isMobile && (
            <View style={styles.desktopLinks}>
              {navLinks.map((link) => {
                const isActive = pathname === link.href;
                return (
                  <Link key={link.href} href={link.href as any} asChild>
                    <Pressable>
                      <Text style={[styles.navLinkText, isActive && styles.navLinkActive]}>
                        {link.label}
                      </Text>
                    </Pressable>
                  </Link>
                );
              })}
              {isAuthenticated && (
                <Link href={getDashboardHref() as any} asChild>
                  <Pressable>
                    <Text style={[styles.navLinkText, pathname.includes('dashboard') && styles.navLinkActive]}>
                      {user?.role === 'landlord' ? 'My Home' : 'Dashboard'}
                    </Text>
                  </Pressable>
                </Link>
              )}
            </View>
          )}

          {/* Right Action buttons */}
          <View style={styles.navRight}>
            {isLoading ? (
              <ActivityIndicator size="small" color={Colors.primary} />
            ) : isAuthenticated && user ? (
              // Authenticated User Section
              <View style={styles.userSection}>
                {/* Favorites icon (Tenant only) */}
                {user.role === 'tenant' && (
                  <Pressable onPress={() => router.push('/tenant/dashboard?tab=favorites')} style={styles.iconButton}>
                    <Ionicons name="heart-outline" size={22} color={Colors.light.text} />
                  </Pressable>
                )}

                {/* Message icon */}
                <Pressable onPress={() => alert('Chức năng tin nhắn đang được phát triển')} style={styles.iconButton}>
                  <Ionicons name="chatbubble-ellipses-outline" size={22} color={Colors.light.text} />
                </Pressable>

                {/* Notifications icon */}
                <Pressable onPress={() => router.push('/notifications')} style={styles.iconButton}>
                  <Ionicons name="notifications-outline" size={22} color={Colors.light.text} />
                  {notificationCount > 0 && (
                    <View style={styles.badge}>
                      <Text style={styles.badgeText}>{notificationCount}</Text>
                    </View>
                  )}
                </Pressable>

                {/* Settings icon */}
                <Pressable onPress={() => {
                  if (user.role === 'tenant') {
                    router.push('/tenant/dashboard?tab=profile');
                  } else {
                    alert('Chức năng cài đặt tài khoản chủ nhà đang được phát triển');
                  }
                }} style={styles.iconButton}>
                  <Ionicons name="settings-outline" size={22} color={Colors.light.text} />
                </Pressable>

                {/* Profile dropdown toggle */}
                <Pressable onPress={() => setUserMenuOpen(!userMenuOpen)} style={styles.profileToggle}>
                  <View style={styles.avatarPlaceholder}>
                    {user.avatar ? (
                      <Image source={{ uri: user.avatar }} style={styles.avatarImg} />
                    ) : (
                      <Text style={styles.avatarText}>
                        {user.fullName.charAt(0).toUpperCase()}
                      </Text>
                    )}
                  </View>
                  {!isMobile && (
                    <Text style={styles.username} numberOfLines={1}>
                      {user.fullName}
                    </Text>
                  )}
                  <Ionicons name="chevron-down" size={14} color={Colors.light.textSecondary} />
                </Pressable>
              </View>
            ) : (
              // Anonymous User Section
              !isMobile && (
                <View style={styles.authButtons}>
                  <Link href="/login" asChild>
                    <Pressable style={styles.btnSecondary}>
                      <Text style={styles.btnSecondaryText}>Đăng nhập</Text>
                    </Pressable>
                  </Link>
                  <Link href="/register" asChild>
                    <Pressable style={styles.btnPrimary}>
                      <Text style={styles.btnPrimaryText}>Đăng ký</Text>
                    </Pressable>
                  </Link>
                </View>
              )
            )}

            {/* Mobile Hamburger toggle */}
            {isMobile && (
              <Pressable
                onPress={() => setMobileMenuOpen(!mobileMenuOpen)}
                style={styles.hamburger}>
                <Ionicons
                  name={mobileMenuOpen ? 'close' : 'menu'}
                  size={28}
                  color={Colors.light.text}
                />
              </Pressable>
            )}
          </View>
        </View>

        {/* User Dropdown Menu (Desktop) */}
        {!isMobile && userMenuOpen && isAuthenticated && user && (
          <View style={[styles.dropdownMenu, Shadows.md]}>
            <Text style={styles.dropdownHeader} numberOfLines={1}>{user.email}</Text>
            <View style={styles.divider} />
            <Pressable onPress={() => { setUserMenuOpen(false); router.push(getDashboardHref() as any); }} style={styles.dropdownItem}>
              <Ionicons name="grid-outline" size={18} color={Colors.light.text} style={{ marginRight: 10 }} />
              <Text style={styles.dropdownItemText}>
                {user?.role === 'landlord' ? 'My Home' : 'Dashboard của tôi'}
              </Text>
            </Pressable>
            {/* My Account (Hồ sơ của tôi) */}
            <Pressable onPress={() => { setUserMenuOpen(false); router.push(user.role === 'tenant' ? '/tenant/dashboard?tab=profile' : getDashboardHref() as any); }} style={styles.dropdownItem}>
              <Ionicons name="person-outline" size={18} color={Colors.light.text} style={{ marginRight: 10 }} />
              <Text style={styles.dropdownItemText}>Hồ sơ của tôi</Text>
            </Pressable>
            <Pressable onPress={() => { setUserMenuOpen(false); router.push('/notifications'); }} style={styles.dropdownItem}>
              <Ionicons name="notifications-outline" size={18} color={Colors.light.text} style={{ marginRight: 10 }} />
              <Text style={styles.dropdownItemText}>Thông báo</Text>
            </Pressable>
            <View style={styles.divider} />
            <Pressable onPress={handleLogout} style={[styles.dropdownItem, { paddingVertical: 12 }]}>
              <Ionicons name="log-out-outline" size={18} color={Colors.danger} style={{ marginRight: 10 }} />
              <Text style={[styles.dropdownItemText, { color: Colors.danger }]}>Đăng xuất</Text>
            </Pressable>
          </View>
        )}
      </View>

      {/* 2. MOBILE MENU DRAWER */}
      {isMobile && mobileMenuOpen && (
        <View style={[styles.mobileMenu, Shadows.lg]}>
          <ScrollView>
            {navLinks.map((link) => (
              <Link key={link.href} href={link.href as any} asChild>
                <Pressable style={styles.mobileMenuItem}>
                  <Text style={styles.mobileMenuText}>{link.label}</Text>
                </Pressable>
              </Link>
            ))}

            {isAuthenticated ? (
              <>
                <Link href={getDashboardHref() as any} asChild>
                  <Pressable style={styles.mobileMenuItem}>
                    <Text style={styles.mobileMenuText}>
                      {user?.role === 'landlord' ? 'My Home' : 'Dashboard của tôi'}
                    </Text>
                  </Pressable>
                </Link>
                <Pressable onPress={handleLogout} style={styles.mobileMenuItem}>
                  <Text style={[styles.mobileMenuText, { color: Colors.danger }]}>Đăng xuất</Text>
                </Pressable>
              </>
            ) : (
              <View style={styles.mobileAuthActions}>
                <Link href="/login" asChild>
                  <Pressable style={[styles.btnSecondary, { marginBottom: 10, width: '100%', alignItems: 'center' }]}>
                    <Text style={styles.btnSecondaryText}>Đăng nhập</Text>
                  </Pressable>
                </Link>
                <Link href="/register" asChild>
                  <Pressable style={[styles.btnPrimary, { width: '100%', alignItems: 'center' }]}>
                    <Text style={styles.btnPrimaryText}>Đăng ký</Text>
                  </Pressable>
                </Link>
              </View>
            )}
          </ScrollView>
        </View>
      )}

      {/* 3. MAIN CONTENT */}
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <View style={styles.mainContent}>{children}</View>

        {/* 4. FOOTER */}
        <View style={styles.footer}>
          <View style={[styles.footerContent, { flexDirection: Platform.OS === 'web' && !isMobile ? 'row' : 'column' }]}>
            {/* Column 1: Info */}
            <View style={styles.footerCol}>
              <BrandLogo size="large" showSubtext={true} />
              <Text style={styles.footerDesc}>
                Nền tảng tìm kiếm, đăng tin và quản lý phòng trọ tiện ích hàng đầu Việt Nam. Kết nối trực tiếp, thông tin xác thực.
              </Text>
            </View>

            {/* Column 2: Quick links */}
            <View style={styles.footerCol}>
              <Text style={styles.footerHeading}>Liên kết nhanh</Text>
              <Link href="/" asChild><Pressable><Text style={styles.footerLink}>Trang chủ</Text></Pressable></Link>
              <Link href="/list" asChild><Pressable><Text style={styles.footerLink}>Danh sách phòng</Text></Pressable></Link>
              <Link href="/guide" asChild><Pressable><Text style={styles.footerLink}>Hướng dẫn đăng tin</Text></Pressable></Link>
            </View>

            {/* Column 3: Contact */}
            <View style={styles.footerCol}>
              <Text style={styles.footerHeading}>Thông tin liên hệ</Text>
              <Text style={styles.footerContactText}>Email: support@isinhvien.vn</Text>
              <Text style={styles.footerContactText}>Hotline: 0877.876.877 (Mr. Huân)</Text>
              <Text style={styles.footerContactText}>Địa chỉ: Văn phòng iSinhvien (Tầng trệt Nhà khách ĐHQG - HCM)</Text>
            </View>
          </View>
          
          <View style={styles.footerDivider} />
          <Text style={styles.copyrightText}>
            © {new Date().getFullYear()} iSinhvien. Tất cả quyền được bảo lưu. Bản quyền thuộc về đại học Quốc Gia.
          </Text>
        </View>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.light.background,
  },
  navbar: {
    height: 70,
    backgroundColor: Colors.light.card,
    borderBottomWidth: Border.width.sm,
    borderBottomColor: Colors.light.border,
    justifyContent: 'center',
    zIndex: 100,
    position: Platform.OS === 'web' ? 'fixed' : 'relative',
    top: 0,
    left: 0,
    right: 0,
  },
  navContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xl,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  logoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  logoIcon: {
    backgroundColor: Colors.primary,
    padding: 6,
    borderRadius: Border.radius.md,
  },
  logoText: {
    fontSize: 22,
    fontWeight: 'bold',
    color: Colors.light.text,
  },
  desktopLinks: {
    flexDirection: 'row',
    gap: Spacing.xl,
    alignItems: 'center',
  },
  navLinkText: {
    fontSize: 15,
    fontWeight: '500',
    color: Colors.light.textSecondary,
  },
  navLinkActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  navRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  authButtons: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  btnPrimary: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Border.radius.md,
  },
  btnPrimaryText: {
    color: 'white',
    fontWeight: '600',
    fontSize: 14,
  },
  btnSecondary: {
    backgroundColor: 'transparent',
    borderWidth: Border.width.sm,
    borderColor: Colors.primary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: Border.radius.md,
  },
  btnSecondaryText: {
    color: Colors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
  userSection: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
  },
  iconButton: {
    position: 'relative',
    padding: 4,
  },
  badge: {
    position: 'absolute',
    top: -2,
    right: -2,
    backgroundColor: Colors.danger,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: 'white',
    fontSize: 10,
    fontWeight: 'bold',
  },
  profileToggle: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    paddingVertical: 4,
    paddingHorizontal: 8,
    borderRadius: Border.radius.md,
    backgroundColor: Colors.light.backgroundElement,
  },
  avatarPlaceholder: {
    width: 32,
    height: 32,
    borderRadius: 16,
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
    fontSize: 14,
  },
  username: {
    fontSize: 14,
    fontWeight: '600',
    color: Colors.light.text,
    maxWidth: 100,
  },
  hamburger: {
    padding: 4,
  },
  dropdownMenu: {
    position: 'absolute',
    top: 65,
    right: Spacing.xl,
    width: 220,
    backgroundColor: Colors.light.card,
    borderRadius: Border.radius.md,
    borderWidth: Border.width.sm,
    borderColor: Colors.light.border,
    paddingVertical: Spacing.sm,
    zIndex: 1000,
  },
  dropdownHeader: {
    fontSize: 12,
    color: Colors.light.textSecondary,
    paddingHorizontal: Spacing.lg,
    paddingVertical: 4,
  },
  dropdownItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: 10,
  },
  dropdownItemText: {
    fontSize: 14,
    color: Colors.light.text,
  },
  divider: {
    height: 1,
    backgroundColor: Colors.light.border,
    marginVertical: Spacing.xs,
  },
  mobileMenu: {
    position: 'absolute',
    top: 70,
    left: 0,
    right: 0,
    backgroundColor: Colors.light.card,
    borderBottomWidth: Border.width.sm,
    borderBottomColor: Colors.light.border,
    paddingBottom: Spacing.lg,
    zIndex: 99,
  },
  mobileMenuItem: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.light.backgroundElement,
  },
  mobileMenuText: {
    fontSize: 16,
    fontWeight: '500',
    color: Colors.light.text,
  },
  mobileAuthActions: {
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.lg,
  },
  scrollContent: {
    flexGrow: 1,
    paddingTop: Platform.OS === 'web' ? 70 : 0, // Add spacing for fixed navbar on web
  },
  mainContent: {
    flex: 1,
    minHeight: 500,
  },
  footer: {
    backgroundColor: '#0f172a', // Slate 900 dark bg
    paddingTop: Spacing.xxl,
    paddingBottom: Spacing.xl,
    paddingHorizontal: Spacing.xl,
  },
  footerContent: {
    justifyContent: 'space-between',
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
    gap: Spacing.xl,
  },
  footerCol: {
    flex: 1,
    gap: Spacing.sm,
  },
  footerLogoText: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#ffffff',
  },
  footerDesc: {
    color: '#94a3b8',
    fontSize: 14,
    lineHeight: 20,
  },
  footerHeading: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: Spacing.xs,
  },
  footerLink: {
    color: '#94a3b8',
    fontSize: 14,
    paddingVertical: 4,
  },
  footerContactText: {
    color: '#94a3b8',
    fontSize: 14,
  },
  footerDivider: {
    height: 1,
    backgroundColor: '#334155',
    marginVertical: Spacing.xl,
    maxWidth: MaxContentWidth,
    width: '100%',
    alignSelf: 'center',
  },
  copyrightText: {
    color: '#64748b',
    fontSize: 12,
    textAlign: 'center',
  },
});
