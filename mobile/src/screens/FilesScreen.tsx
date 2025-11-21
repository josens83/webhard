import React, { useState } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { filesApi } from '../api';

export default function FilesScreen({ navigation, route }: any) {
  const [page, setPage] = useState(1);
  const [sortBy, setSortBy] = useState(route.params?.sortBy || 'latest');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['files', { page, sortBy }],
    queryFn: () => filesApi.getFiles({ page, sortBy, limit: 20 }),
  });

  const files = data?.data?.files || [];
  const pagination = data?.data?.pagination;

  const renderFile = ({ item }: any) => (
    <TouchableOpacity
      style={styles.fileCard}
      onPress={() => navigation.navigate('FileDetail', { id: item.id })}
    >
      <View style={styles.fileIcon}>
        <Ionicons name="document" size={32} color="#0ea5e9" />
      </View>
      <View style={styles.fileInfo}>
        <Text style={styles.fileTitle} numberOfLines={2}>
          {item.title}
        </Text>
        <Text style={styles.fileCategory}>{item.category.name}</Text>
        <View style={styles.fileStats}>
          <Text style={styles.fileStat}>
            <Ionicons name="download" size={12} /> {item.downloadCount}
          </Text>
          <Text style={styles.fileStat}>
            <Ionicons name="eye" size={12} /> {item.viewCount}
          </Text>
          <Text style={styles.fileStat}>
            <Ionicons name="star" size={12} /> {item.ratingAverage.toFixed(1)}
          </Text>
        </View>
      </View>
      <View style={styles.fileRight}>
        <Text style={styles.filePrice}>
          {item.price === 0 ? '무료' : `${item.price.toLocaleString()}원`}
        </Text>
        <Text style={styles.fileSize}>
          {(Number(item.fileSize) / 1024 / 1024).toFixed(1)}MB
        </Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Sort Options */}
      <View style={styles.sortContainer}>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'latest' && styles.sortButtonActive]}
          onPress={() => {
            setSortBy('latest');
            setPage(1);
            refetch();
          }}
        >
          <Text style={[styles.sortText, sortBy === 'latest' && styles.sortTextActive]}>
            최신순
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'popular' && styles.sortButtonActive]}
          onPress={() => {
            setSortBy('popular');
            setPage(1);
            refetch();
          }}
        >
          <Text style={[styles.sortText, sortBy === 'popular' && styles.sortTextActive]}>
            인기순
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.sortButton, sortBy === 'rating' && styles.sortButtonActive]}
          onPress={() => {
            setSortBy('rating');
            setPage(1);
            refetch();
          }}
        >
          <Text style={[styles.sortText, sortBy === 'rating' && styles.sortTextActive]}>
            평점순
          </Text>
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : (
        <>
          <FlatList
            data={files}
            renderItem={renderFile}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
            onEndReached={() => {
              if (pagination && page < pagination.totalPages) {
                setPage(page + 1);
              }
            }}
            onEndReachedThreshold={0.5}
          />

          {/* Pagination */}
          {pagination && pagination.totalPages > 1 && (
            <View style={styles.pagination}>
              <TouchableOpacity
                style={[styles.paginationButton, page === 1 && styles.paginationButtonDisabled]}
                onPress={() => {
                  if (page > 1) {
                    setPage(page - 1);
                    refetch();
                  }
                }}
                disabled={page === 1}
              >
                <Ionicons name="chevron-back" size={20} color={page === 1 ? '#ccc' : '#0ea5e9'} />
              </TouchableOpacity>
              <Text style={styles.paginationText}>
                {page} / {pagination.totalPages}
              </Text>
              <TouchableOpacity
                style={[
                  styles.paginationButton,
                  page === pagination.totalPages && styles.paginationButtonDisabled,
                ]}
                onPress={() => {
                  if (page < pagination.totalPages) {
                    setPage(page + 1);
                    refetch();
                  }
                }}
                disabled={page === pagination.totalPages}
              >
                <Ionicons
                  name="chevron-forward"
                  size={20}
                  color={page === pagination.totalPages ? '#ccc' : '#0ea5e9'}
                />
              </TouchableOpacity>
            </View>
          )}
        </>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  sortContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    gap: 10,
  },
  sortButton: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
  },
  sortButtonActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  sortText: {
    fontSize: 14,
    color: '#666',
  },
  sortTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  listContainer: {
    padding: 15,
  },
  fileCard: {
    backgroundColor: '#fff',
    padding: 15,
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
    width: 50,
    height: 50,
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
  fileCategory: {
    fontSize: 12,
    color: '#666',
    marginBottom: 4,
  },
  fileStats: {
    flexDirection: 'row',
    gap: 10,
  },
  fileStat: {
    fontSize: 11,
    color: '#999',
  },
  fileRight: {
    alignItems: 'flex-end',
  },
  filePrice: {
    fontSize: 14,
    fontWeight: 'bold',
    color: '#0ea5e9',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 11,
    color: '#999',
  },
  pagination: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: 15,
    backgroundColor: '#fff',
    gap: 20,
  },
  paginationButton: {
    padding: 8,
  },
  paginationButtonDisabled: {
    opacity: 0.5,
  },
  paginationText: {
    fontSize: 14,
    fontWeight: '600',
  },
});
