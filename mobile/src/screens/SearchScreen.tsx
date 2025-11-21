import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { useQuery } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { filesApi } from '../api';

export default function SearchScreen({ navigation }: any) {
  const [searchQuery, setSearchQuery] = useState('');
  const [activeQuery, setActiveQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const categories = [
    { id: null, name: '전체' },
    { id: '1', name: '영화' },
    { id: '2', name: '드라마' },
    { id: '3', name: '애니' },
    { id: '4', name: '게임' },
    { id: '5', name: '음악' },
    { id: '6', name: '도서' },
    { id: '7', name: '교육' },
  ];

  const { data, isLoading } = useQuery({
    queryKey: ['search', activeQuery, selectedCategory],
    queryFn: () =>
      filesApi.searchFiles({
        q: activeQuery,
        categoryId: selectedCategory || undefined,
        limit: 20,
      }),
    enabled: activeQuery.length > 0,
  });

  const files = data?.data?.files || [];

  const handleSearch = () => {
    if (searchQuery.trim()) {
      setActiveQuery(searchQuery.trim());
    }
  };

  const handleCategorySelect = (categoryId: string | null) => {
    setSelectedCategory(categoryId);
  };

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
      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <View style={styles.searchInputContainer}>
          <Ionicons name="search" size={20} color="#999" />
          <TextInput
            style={styles.searchInput}
            placeholder="파일 검색..."
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearch}
            returnKeyType="search"
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity onPress={() => setSearchQuery('')}>
              <Ionicons name="close-circle" size={20} color="#999" />
            </TouchableOpacity>
          )}
        </View>
        <TouchableOpacity style={styles.searchButton} onPress={handleSearch}>
          <Text style={styles.searchButtonText}>검색</Text>
        </TouchableOpacity>
      </View>

      {/* Categories */}
      <View style={styles.categoryContainer}>
        <FlatList
          horizontal
          showsHorizontalScrollIndicator={false}
          data={categories}
          keyExtractor={(item) => item.id || 'all'}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={[
                styles.categoryChip,
                selectedCategory === item.id && styles.categoryChipActive,
              ]}
              onPress={() => handleCategorySelect(item.id)}
            >
              <Text
                style={[
                  styles.categoryChipText,
                  selectedCategory === item.id && styles.categoryChipTextActive,
                ]}
              >
                {item.name}
              </Text>
            </TouchableOpacity>
          )}
          contentContainerStyle={styles.categoryList}
        />
      </View>

      {/* Results */}
      {activeQuery.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="search" size={80} color="#ddd" />
          <Text style={styles.emptyText}>검색어를 입력하세요</Text>
          <Text style={styles.emptySubText}>
            파일 제목, 설명, 태그로 검색할 수 있습니다
          </Text>
        </View>
      ) : isLoading ? (
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#0ea5e9" />
        </View>
      ) : files.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Ionicons name="document-text-outline" size={80} color="#ddd" />
          <Text style={styles.emptyText}>검색 결과가 없습니다</Text>
          <Text style={styles.emptySubText}>
            다른 검색어로 시도해보세요
          </Text>
        </View>
      ) : (
        <>
          <View style={styles.resultHeader}>
            <Text style={styles.resultCount}>
              총 {files.length}개의 파일
            </Text>
          </View>
          <FlatList
            data={files}
            renderItem={renderFile}
            keyExtractor={(item) => item.id}
            contentContainerStyle={styles.listContainer}
          />
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
  searchContainer: {
    flexDirection: 'row',
    padding: 15,
    backgroundColor: '#fff',
    gap: 10,
  },
  searchInputContainer: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f5f5f5',
    borderRadius: 8,
    paddingHorizontal: 15,
    gap: 10,
  },
  searchInput: {
    flex: 1,
    height: 45,
    fontSize: 16,
  },
  searchButton: {
    backgroundColor: '#0ea5e9',
    paddingHorizontal: 20,
    borderRadius: 8,
    justifyContent: 'center',
  },
  searchButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
  },
  categoryContainer: {
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  categoryList: {
    paddingHorizontal: 15,
    paddingVertical: 10,
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
    marginRight: 8,
  },
  categoryChipActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  categoryChipText: {
    fontSize: 14,
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  emptyContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#333',
    marginTop: 20,
    marginBottom: 8,
  },
  emptySubText: {
    fontSize: 14,
    color: '#999',
    textAlign: 'center',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  resultHeader: {
    paddingHorizontal: 15,
    paddingVertical: 12,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  resultCount: {
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
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
});
