import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  Alert,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { userApi } from '../api';
import { useAuthStore } from '../store/authStore';

export default function MyPageScreen({ navigation }: any) {
  const { user, logout } = useAuthStore();

  const { data: purchasesData } = useQuery({
    queryKey: ['purchases'],
    queryFn: () => userApi.getPurchases(),
  });

  const { data: transactionsData } = useQuery({
    queryKey: ['transactions'],
    queryFn: () => userApi.getTransactions(),
  });

  const purchases = purchasesData?.data?.purchases || [];
  const transactions = transactionsData?.data?.transactions || [];

  const handleLogout = () => {
    Alert.alert('로그아웃', '정말 로그아웃 하시겠습니까?', [
      { text: '취소', style: 'cancel' },
      {
        text: '로그아웃',
        style: 'destructive',
        onPress: () => logout(),
      },
    ]);
  };

  return (
    <ScrollView style={styles.container}>
      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.avatarContainer}>
          <Ionicons name="person-circle" size={80} color="#0ea5e9" />
        </View>
        <Text style={styles.userName}>{user?.displayName || user?.username}</Text>
        <Text style={styles.userEmail}>{user?.email}</Text>

        <View style={styles.balanceContainer}>
          <View style={styles.balanceItem}>
            <Ionicons name="wallet" size={20} color="#0ea5e9" />
            <View>
              <Text style={styles.balanceLabel}>캐시</Text>
              <Text style={styles.balanceValue}>{user?.cash.toLocaleString()}원</Text>
            </View>
          </View>
          <View style={styles.divider} />
          <View style={styles.balanceItem}>
            <Ionicons name="star" size={20} color="#f59e0b" />
            <View>
              <Text style={styles.balanceLabel}>포인트</Text>
              <Text style={styles.balanceValue}>{user?.point.toLocaleString()}P</Text>
            </View>
          </View>
        </View>

        <TouchableOpacity
          style={styles.chargeButton}
          onPress={() => navigation.navigate('Charge')}
        >
          <Ionicons name="add-circle" size={20} color="#fff" />
          <Text style={styles.chargeButtonText}>충전하기</Text>
        </TouchableOpacity>
      </View>

      {/* Quick Actions */}
      <TouchableOpacity
        style={styles.uploadButton}
        onPress={() => navigation.navigate('Upload')}
      >
        <Ionicons name="cloud-upload" size={24} color="#fff" />
        <Text style={styles.uploadButtonText}>파일 업로드</Text>
      </TouchableOpacity>

      {/* Menu Items */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>내 활동</Text>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="download" size={24} color="#0ea5e9" />
            <Text style={styles.menuItemText}>다운로드 내역</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="cart" size={24} color="#0ea5e9" />
            <Text style={styles.menuItemText}>구매 내역</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text style={styles.badge}>{purchases.length}</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="heart" size={24} color="#ef4444" />
            <Text style={styles.menuItemText}>찜한 파일</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="receipt" size={24} color="#0ea5e9" />
            <Text style={styles.menuItemText}>캐시 내역</Text>
          </View>
          <View style={styles.menuItemRight}>
            <Text style={styles.badge}>{transactions.length}</Text>
            <Ionicons name="chevron-forward" size={20} color="#ccc" />
          </View>
        </TouchableOpacity>
      </View>

      {/* Recent Purchases */}
      {purchases.length > 0 && (
        <View style={styles.section}>
          <View style={styles.sectionHeader}>
            <Text style={styles.sectionTitle}>최근 구매</Text>
            <TouchableOpacity>
              <Text style={styles.seeMore}>전체보기</Text>
            </TouchableOpacity>
          </View>

          {purchases.slice(0, 3).map((purchase: any) => (
            <TouchableOpacity
              key={purchase.id}
              style={styles.purchaseCard}
              onPress={() =>
                navigation.navigate('FileDetail', { id: purchase.file.id })
              }
            >
              <View style={styles.fileIcon}>
                <Ionicons name="document" size={24} color="#0ea5e9" />
              </View>
              <View style={styles.purchaseInfo}>
                <Text style={styles.purchaseTitle} numberOfLines={1}>
                  {purchase.file.title}
                </Text>
                <Text style={styles.purchaseDate}>
                  {new Date(purchase.createdAt).toLocaleDateString()}
                </Text>
              </View>
              <Text style={styles.purchasePrice}>
                {purchase.price.toLocaleString()}원
              </Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* Settings */}
      <View style={styles.menuSection}>
        <Text style={styles.sectionTitle}>설정</Text>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="person" size={24} color="#666" />
            <Text style={styles.menuItemText}>프로필 수정</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="notifications" size={24} color="#666" />
            <Text style={styles.menuItemText}>알림 설정</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="help-circle" size={24} color="#666" />
            <Text style={styles.menuItemText}>고객센터</Text>
          </View>
          <Ionicons name="chevron-forward" size={20} color="#ccc" />
        </TouchableOpacity>

        <TouchableOpacity style={styles.menuItem} onPress={handleLogout}>
          <View style={styles.menuItemLeft}>
            <Ionicons name="log-out" size={24} color="#ef4444" />
            <Text style={[styles.menuItemText, styles.logoutText]}>로그아웃</Text>
          </View>
        </TouchableOpacity>
      </View>

      <View style={styles.footer}>
        <Text style={styles.footerText}>WeDisk v1.0.0</Text>
        <Text style={styles.footerText}>© 2024 WeDisk. All rights reserved.</Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  userCard: {
    backgroundColor: '#fff',
    alignItems: 'center',
    padding: 30,
    marginBottom: 15,
  },
  avatarContainer: {
    marginBottom: 15,
  },
  userName: {
    fontSize: 20,
    fontWeight: 'bold',
    marginBottom: 4,
  },
  userEmail: {
    fontSize: 14,
    color: '#666',
    marginBottom: 20,
  },
  balanceContainer: {
    flexDirection: 'row',
    width: '100%',
    backgroundColor: '#f9fafb',
    padding: 20,
    borderRadius: 12,
    marginBottom: 15,
  },
  balanceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  divider: {
    width: 1,
    backgroundColor: '#e5e7eb',
    marginHorizontal: 15,
  },
  balanceLabel: {
    fontSize: 12,
    color: '#999',
    marginBottom: 2,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  chargeButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 30,
    paddingVertical: 12,
    borderRadius: 8,
    gap: 8,
  },
  chargeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  uploadButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#10b981',
    marginHorizontal: 15,
    marginBottom: 15,
    paddingVertical: 15,
    borderRadius: 8,
    gap: 8,
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
  menuSection: {
    backgroundColor: '#fff',
    marginBottom: 15,
    paddingVertical: 10,
  },
  section: {
    backgroundColor: '#fff',
    marginBottom: 15,
    padding: 15,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 15,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    paddingVertical: 10,
    color: '#333',
  },
  seeMore: {
    fontSize: 14,
    color: '#0ea5e9',
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingVertical: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  menuItemLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
  },
  menuItemText: {
    fontSize: 15,
    color: '#333',
  },
  menuItemRight: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  badge: {
    backgroundColor: '#0ea5e9',
    color: '#fff',
    fontSize: 12,
    fontWeight: 'bold',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 10,
    minWidth: 20,
    textAlign: 'center',
  },
  logoutText: {
    color: '#ef4444',
  },
  purchaseCard: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f5f5f5',
  },
  fileIcon: {
    width: 40,
    height: 40,
    borderRadius: 8,
    backgroundColor: '#f0f9ff',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  purchaseInfo: {
    flex: 1,
  },
  purchaseTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  purchaseDate: {
    fontSize: 12,
    color: '#999',
  },
  purchasePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  footer: {
    alignItems: 'center',
    padding: 30,
  },
  footerText: {
    fontSize: 12,
    color: '#999',
    marginBottom: 4,
  },
});
