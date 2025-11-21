import React from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { filesApi } from '../api';
import { useAuthStore } from '../store/authStore';

export default function HomeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const [refreshing, setRefreshing] = React.useState(false);

  const { data: popularFiles, refetch: refetchPopular } = useQuery({
    queryKey: ['files', { sortBy: 'popular', limit: 10 }],
    queryFn: () => filesApi.getFiles({ sortBy: 'popular', limit: 10 }),
  });

  const { data: latestFiles, refetch: refetchLatest } = useQuery({
    queryKey: ['files', { sortBy: 'latest', limit: 10 }],
    queryFn: () => filesApi.getFiles({ sortBy: 'latest', limit: 10 }),
  });

  const onRefresh = async () => {
    setRefreshing(true);
    await Promise.all([refetchPopular(), refetchLatest()]);
    setRefreshing(false);
  };

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      {/* User Info Card */}
      <View style={styles.userCard}>
        <View style={styles.userInfo}>
          <Text style={styles.userName}>{user?.displayName || user?.username}님</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Ionicons name="wallet" size={16} color="#0ea5e9" />
              <Text style={styles.balanceText}>{user?.cash.toLocaleString()} 캐시</Text>
            </View>
            <View style={styles.balanceItem}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.balanceText}>{user?.point.toLocaleString()} 포인트</Text>
            </View>
          </View>
        </View>
        <TouchableOpacity
          style={styles.chargeButton}
          onPress={() => navigation.navigate('Charge')}
        >
          <Text style={styles.chargeButtonText}>충전</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.section}>
        <Text style={styles.sectionTitle}>카테고리</Text>
        <ScrollView horizontal showsHorizontalScrollIndicator={false}>
          {['영화', '드라마', '애니', '게임', '음악', '도서', '교육'].map((category) => (
            <TouchableOpacity key={category} style={styles.categoryCard}>
              <Text style={styles.categoryIcon}>📁</Text>
              <Text style={styles.categoryText}>{category}</Text>
            </TouchableOpacity>
          ))}
        </ScrollView>
      </View>

      {/* Popular Files */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>인기 파일</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Files', { sortBy: 'popular' })}>
            <Text style={styles.seeMore}>더보기 →</Text>
          </TouchableOpacity>
        </View>
        {popularFiles?.data?.files?.map((file: any) => (
          <TouchableOpacity
            key={file.id}
            style={styles.fileCard}
            onPress={() => navigation.navigate('FileDetail', { id: file.id })}
          >
            <View style={styles.fileIcon}>
              <Ionicons name="document" size={24} color="#0ea5e9" />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileTitle} numberOfLines={1}>
                {file.title}
              </Text>
              <View style={styles.fileStats}>
                <Text style={styles.fileStat}>
                  <Ionicons name="download" size={12} /> {file.downloadCount}
                </Text>
                <Text style={styles.fileStat}>
                  <Ionicons name="star" size={12} /> {file.ratingAverage.toFixed(1)}
                </Text>
              </View>
            </View>
            <Text style={styles.filePrice}>
              {file.price === 0 ? '무료' : `${file.price.toLocaleString()}원`}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Latest Files */}
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>최신 파일</Text>
          <TouchableOpacity onPress={() => navigation.navigate('Files', { sortBy: 'latest' })}>
            <Text style={styles.seeMore}>더보기 →</Text>
          </TouchableOpacity>
        </View>
        {latestFiles?.data?.files?.slice(0, 5).map((file: any) => (
          <TouchableOpacity
            key={file.id}
            style={styles.fileCard}
            onPress={() => navigation.navigate('FileDetail', { id: file.id })}
          >
            <View style={styles.fileIcon}>
              <Ionicons name="document" size={24} color="#10b981" />
            </View>
            <View style={styles.fileInfo}>
              <Text style={styles.fileTitle} numberOfLines={1}>
                {file.title}
              </Text>
              <Text style={styles.fileCategory}>{file.category.name}</Text>
            </View>
            <Text style={styles.filePrice}>
              {file.price === 0 ? '무료' : `${file.price.toLocaleString()}원`}
            </Text>
          </TouchableOpacity>
        ))}
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
    padding: 20,
    margin: 15,
    marginTop: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  userInfo: {
    flex: 1,
  },
  userName: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 8,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 15,
  },
  balanceItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  balanceText: {
    fontSize: 14,
    color: '#666',
  },
  chargeButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 8,
  },
  chargeButtonText: {
    color: '#fff',
    fontWeight: 'bold',
  },
  section: {
    marginBottom: 20,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: 'bold',
    paddingHorizontal: 15,
    marginBottom: 10,
  },
  seeMore: {
    color: '#0ea5e9',
    fontSize: 14,
  },
  categoryCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginLeft: 15,
    borderRadius: 12,
    alignItems: 'center',
    minWidth: 80,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  categoryIcon: {
    fontSize: 32,
    marginBottom: 5,
  },
  categoryText: {
    fontSize: 12,
    fontWeight: '600',
  },
  fileCard: {
    backgroundColor: '#fff',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 10,
    borderRadius: 12,
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
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
  fileInfo: {
    flex: 1,
  },
  fileTitle: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileStats: {
    flexDirection: 'row',
    gap: 10,
  },
  fileStat: {
    fontSize: 12,
    color: '#666',
  },
  fileCategory: {
    fontSize: 12,
    color: '#666',
  },
  filePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
});
