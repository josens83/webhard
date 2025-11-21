import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Image,
} from 'react-native';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { filesApi } from '../api';
import { useAuthStore } from '../store/authStore';

export default function FileDetailScreen({ navigation, route }: any) {
  const { id } = route.params;
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [rating, setRating] = useState(0);
  const [comment, setComment] = useState('');

  const { data, isLoading } = useQuery({
    queryKey: ['file', id],
    queryFn: () => filesApi.getFileById(id),
  });

  const file = data?.data;

  const purchaseMutation = useMutation({
    mutationFn: () => filesApi.purchaseFile(id),
    onSuccess: () => {
      Alert.alert('구매 성공', '파일을 구매했습니다.');
      queryClient.invalidateQueries({ queryKey: ['file', id] });
    },
    onError: (error: any) => {
      Alert.alert('구매 실패', error.response?.data?.message || '구매에 실패했습니다.');
    },
  });

  const downloadMutation = useMutation({
    mutationFn: () => filesApi.downloadFile(id),
    onSuccess: (data) => {
      Alert.alert('다운로드', '다운로드를 시작합니다.', [
        {
          text: '확인',
          onPress: () => {
            // In a real app, use FileSystem to download
            console.log('Download URL:', data.data.downloadUrl);
          },
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('다운로드 실패', error.response?.data?.message || '다운로드에 실패했습니다.');
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: () => filesApi.toggleFavorite(id),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['file', id] });
    },
  });

  const ratingMutation = useMutation({
    mutationFn: (ratingValue: number) => filesApi.rateFile(id, ratingValue),
    onSuccess: () => {
      Alert.alert('평가 완료', '평가가 등록되었습니다.');
      queryClient.invalidateQueries({ queryKey: ['file', id] });
      setRating(0);
    },
  });

  const handlePurchase = () => {
    if (file?.price === 0) {
      downloadMutation.mutate();
    } else {
      Alert.alert(
        '파일 구매',
        `${file?.price.toLocaleString()}원을 사용하여 구매하시겠습니까?`,
        [
          { text: '취소', style: 'cancel' },
          { text: '구매', onPress: () => purchaseMutation.mutate() },
        ]
      );
    }
  };

  const handleDownload = () => {
    downloadMutation.mutate();
  };

  const handleRating = (value: number) => {
    setRating(value);
    ratingMutation.mutate(value);
  };

  if (isLoading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#0ea5e9" />
      </View>
    );
  }

  if (!file) {
    return (
      <View style={styles.errorContainer}>
        <Text style={styles.errorText}>파일을 찾을 수 없습니다.</Text>
      </View>
    );
  }

  const isPurchased = file.isPurchased || file.price === 0;

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#fff" />
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.favoriteButton}
            onPress={() => favoriteMutation.mutate()}
          >
            <Ionicons
              name={file.isFavorited ? 'heart' : 'heart-outline'}
              size={24}
              color={file.isFavorited ? '#ef4444' : '#fff'}
            />
          </TouchableOpacity>
        </View>

        {/* Thumbnail */}
        <View style={styles.thumbnailContainer}>
          {file.thumbnailUrl ? (
            <Image source={{ uri: file.thumbnailUrl }} style={styles.thumbnail} />
          ) : (
            <View style={styles.thumbnailPlaceholder}>
              <Ionicons name="document" size={80} color="#0ea5e9" />
            </View>
          )}
        </View>

        {/* File Info */}
        <View style={styles.infoContainer}>
          <Text style={styles.title}>{file.title}</Text>

          <View style={styles.metaRow}>
            <View style={styles.categoryBadge}>
              <Text style={styles.categoryText}>{file.category.name}</Text>
            </View>
            <Text style={styles.uploadDate}>
              {new Date(file.createdAt).toLocaleDateString()}
            </Text>
          </View>

          <View style={styles.statsRow}>
            <View style={styles.stat}>
              <Ionicons name="download" size={16} color="#666" />
              <Text style={styles.statText}>{file.downloadCount}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="eye" size={16} color="#666" />
              <Text style={styles.statText}>{file.viewCount}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="star" size={16} color="#f59e0b" />
              <Text style={styles.statText}>{file.ratingAverage.toFixed(1)}</Text>
            </View>
            <View style={styles.stat}>
              <Ionicons name="folder" size={16} color="#666" />
              <Text style={styles.statText}>
                {(Number(file.fileSize) / 1024 / 1024).toFixed(1)}MB
              </Text>
            </View>
          </View>

          {file.description && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>설명</Text>
              <Text style={styles.description}>{file.description}</Text>
            </View>
          )}

          {file.tags && file.tags.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>태그</Text>
              <View style={styles.tagContainer}>
                {file.tags.map((tag: any) => (
                  <View key={tag.id} style={styles.tag}>
                    <Text style={styles.tagText}>#{tag.name}</Text>
                  </View>
                ))}
              </View>
            </View>
          )}

          {/* Rating Section */}
          {isPurchased && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>이 파일을 평가해주세요</Text>
              <View style={styles.ratingContainer}>
                {[1, 2, 3, 4, 5].map((value) => (
                  <TouchableOpacity
                    key={value}
                    onPress={() => handleRating(value)}
                  >
                    <Ionicons
                      name={value <= (rating || file.myRating || 0) ? 'star' : 'star-outline'}
                      size={32}
                      color="#f59e0b"
                    />
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          )}

          {/* Comments Section */}
          {file.comments && file.comments.length > 0 && (
            <View style={styles.section}>
              <Text style={styles.sectionTitle}>
                댓글 ({file.comments.length})
              </Text>
              {file.comments.map((comment: any) => (
                <View key={comment.id} style={styles.comment}>
                  <View style={styles.commentHeader}>
                    <Text style={styles.commentAuthor}>{comment.user.displayName}</Text>
                    <Text style={styles.commentDate}>
                      {new Date(comment.createdAt).toLocaleDateString()}
                    </Text>
                  </View>
                  <Text style={styles.commentContent}>{comment.content}</Text>
                </View>
              ))}
            </View>
          )}
        </View>
      </ScrollView>

      {/* Bottom Action Bar */}
      <View style={styles.bottomBar}>
        <View style={styles.priceContainer}>
          <Text style={styles.priceLabel}>가격</Text>
          <Text style={styles.price}>
            {file.price === 0 ? '무료' : `${file.price.toLocaleString()}원`}
          </Text>
        </View>
        {isPurchased ? (
          <TouchableOpacity
            style={[styles.actionButton, styles.downloadButton]}
            onPress={handleDownload}
            disabled={downloadMutation.isPending}
          >
            <Ionicons name="download" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>
              {downloadMutation.isPending ? '다운로드 중...' : '다운로드'}
            </Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[styles.actionButton, styles.purchaseButton]}
            onPress={handlePurchase}
            disabled={purchaseMutation.isPending}
          >
            <Ionicons name="cart" size={20} color="#fff" />
            <Text style={styles.actionButtonText}>
              {purchaseMutation.isPending ? '구매 중...' : '구매하기'}
            </Text>
          </TouchableOpacity>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorText: {
    fontSize: 16,
    color: '#666',
  },
  scrollView: {
    flex: 1,
  },
  header: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    zIndex: 10,
  },
  backButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  favoriteButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  thumbnailContainer: {
    width: '100%',
    height: 250,
    backgroundColor: '#1e293b',
  },
  thumbnail: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  thumbnailPlaceholder: {
    width: '100%',
    height: '100%',
    justifyContent: 'center',
    alignItems: 'center',
  },
  infoContainer: {
    backgroundColor: '#fff',
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  metaRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  categoryBadge: {
    backgroundColor: '#e0f2fe',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  categoryText: {
    color: '#0ea5e9',
    fontSize: 12,
    fontWeight: '600',
  },
  uploadDate: {
    fontSize: 12,
    color: '#999',
  },
  statsRow: {
    flexDirection: 'row',
    gap: 20,
    paddingBottom: 20,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f0',
  },
  stat: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  statText: {
    fontSize: 14,
    color: '#666',
  },
  section: {
    marginTop: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 10,
  },
  description: {
    fontSize: 14,
    color: '#666',
    lineHeight: 22,
  },
  tagContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  tag: {
    backgroundColor: '#f0f0f0',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  tagText: {
    fontSize: 12,
    color: '#666',
  },
  ratingContainer: {
    flexDirection: 'row',
    gap: 8,
  },
  comment: {
    backgroundColor: '#f9f9f9',
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  commentHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 6,
  },
  commentAuthor: {
    fontSize: 13,
    fontWeight: '600',
  },
  commentDate: {
    fontSize: 11,
    color: '#999',
  },
  commentContent: {
    fontSize: 13,
    color: '#333',
    lineHeight: 20,
  },
  bottomBar: {
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 15,
  },
  priceContainer: {
    justifyContent: 'center',
  },
  priceLabel: {
    fontSize: 12,
    color: '#999',
  },
  price: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  purchaseButton: {
    backgroundColor: '#0ea5e9',
  },
  downloadButton: {
    backgroundColor: '#10b981',
  },
  actionButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
