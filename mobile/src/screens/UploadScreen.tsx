import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Platform,
  Image,
} from 'react-native';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import * as DocumentPicker from 'expo-document-picker';
import * as ImagePicker from 'expo-image-picker';
import { filesApi, categoriesApi } from '../api';

export default function UploadScreen({ navigation }: any) {
  const queryClient = useQueryClient();
  const [file, setFile] = useState<any>(null);
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    categoryId: '',
    price: '0',
    tags: '',
  });

  const { data: categoriesData } = useQuery({
    queryKey: ['categories'],
    queryFn: categoriesApi.getCategories,
  });

  const categories = categoriesData?.data || [];

  const uploadMutation = useMutation({
    mutationFn: filesApi.uploadFile,
    onSuccess: () => {
      Alert.alert('업로드 완료', '파일이 업로드되었습니다. 관리자 승인을 기다려주세요.', [
        {
          text: '확인',
          onPress: () => navigation.navigate('MyPage'),
        },
      ]);
      queryClient.invalidateQueries({ queryKey: ['my-files'] });
    },
    onError: (error: any) => {
      Alert.alert('업로드 실패', error.response?.data?.message || '파일 업로드에 실패했습니다.');
    },
  });

  const pickDocument = async () => {
    try {
      const result = await DocumentPicker.getDocumentAsync({
        type: '*/*',
        copyToCacheDirectory: true,
      });

      if (result.type === 'success' || !result.canceled) {
        const selectedFile = result.assets ? result.assets[0] : result;
        setFile({
          uri: selectedFile.uri,
          name: selectedFile.name,
          type: selectedFile.mimeType || 'application/octet-stream',
          size: selectedFile.size,
        });
      }
    } catch (error) {
      Alert.alert('오류', '파일 선택에 실패했습니다.');
    }
  };

  const pickImage = async () => {
    const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();

    if (!permissionResult.granted) {
      Alert.alert('권한 필요', '갤러리 접근 권한이 필요합니다.');
      return;
    }

    try {
      const result = await ImagePicker.launchImageLibraryAsync({
        mediaTypes: ImagePicker.MediaTypeOptions.All,
        quality: 1,
      });

      if (!result.canceled && result.assets) {
        const asset = result.assets[0];
        setFile({
          uri: asset.uri,
          name: asset.fileName || `file_${Date.now()}.${asset.uri.split('.').pop()}`,
          type: asset.type === 'image' ? 'image/jpeg' : 'video/mp4',
          size: asset.fileSize,
        });
      }
    } catch (error) {
      Alert.alert('오류', '이미지 선택에 실패했습니다.');
    }
  };

  const handleUpload = () => {
    if (!file) {
      Alert.alert('오류', '파일을 선택해주세요.');
      return;
    }

    if (!formData.title.trim()) {
      Alert.alert('오류', '제목을 입력해주세요.');
      return;
    }

    if (!formData.categoryId) {
      Alert.alert('오류', '카테고리를 선택해주세요.');
      return;
    }

    const data = new FormData();
    data.append('file', {
      uri: file.uri,
      name: file.name,
      type: file.type,
    } as any);
    data.append('title', formData.title);
    data.append('description', formData.description);
    data.append('categoryId', formData.categoryId);
    data.append('price', formData.price);
    data.append('priceType', parseInt(formData.price) > 0 ? 'PAID' : 'FREE');
    data.append('tags', formData.tags);

    uploadMutation.mutate(data);
  };

  const formatFileSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`;
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  };

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => navigation.goBack()}>
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>파일 업로드</Text>
          <View style={{ width: 24 }} />
        </View>

        {/* File Picker */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>파일 선택</Text>

          {file ? (
            <View style={styles.filePreview}>
              {file.type?.startsWith('image/') && (
                <Image source={{ uri: file.uri }} style={styles.previewImage} />
              )}
              <View style={styles.fileInfo}>
                <Ionicons name="document" size={24} color="#0ea5e9" />
                <View style={styles.fileDetails}>
                  <Text style={styles.fileName} numberOfLines={1}>
                    {file.name}
                  </Text>
                  <Text style={styles.fileSize}>{formatFileSize(file.size || 0)}</Text>
                </View>
                <TouchableOpacity onPress={() => setFile(null)}>
                  <Ionicons name="close-circle" size={24} color="#ef4444" />
                </TouchableOpacity>
              </View>
            </View>
          ) : (
            <View style={styles.pickerButtons}>
              <TouchableOpacity style={styles.pickerButton} onPress={pickDocument}>
                <Ionicons name="document-attach" size={32} color="#0ea5e9" />
                <Text style={styles.pickerButtonText}>문서 선택</Text>
              </TouchableOpacity>
              <TouchableOpacity style={styles.pickerButton} onPress={pickImage}>
                <Ionicons name="image" size={32} color="#10b981" />
                <Text style={styles.pickerButtonText}>이미지/영상</Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        {/* Form */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>파일 정보</Text>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>제목 *</Text>
            <TextInput
              style={styles.input}
              placeholder="파일 제목을 입력하세요"
              value={formData.title}
              onChangeText={(text) => setFormData({ ...formData, title: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>설명</Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder="파일에 대한 설명을 입력하세요"
              value={formData.description}
              onChangeText={(text) => setFormData({ ...formData, description: text })}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />
          </View>

          <View style={styles.row}>
            <View style={[styles.inputGroup, { flex: 1, marginRight: 10 }]}>
              <Text style={styles.label}>카테고리 *</Text>
              <View style={styles.selectContainer}>
                {categories.map((category: any) => (
                  <TouchableOpacity
                    key={category.id}
                    style={[
                      styles.categoryChip,
                      formData.categoryId === category.id && styles.categoryChipActive,
                    ]}
                    onPress={() => setFormData({ ...formData, categoryId: category.id })}
                  >
                    <Text
                      style={[
                        styles.categoryChipText,
                        formData.categoryId === category.id && styles.categoryChipTextActive,
                      ]}
                    >
                      {category.name}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>
            </View>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>가격 (캐시)</Text>
            <TextInput
              style={styles.input}
              placeholder="0 (무료)"
              value={formData.price}
              onChangeText={(text) => setFormData({ ...formData, price: text })}
              keyboardType="number-pad"
            />
            <Text style={styles.hint}>0을 입력하면 무료 파일로 등록됩니다</Text>
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>태그</Text>
            <TextInput
              style={styles.input}
              placeholder="태그를 쉼표로 구분하여 입력 (예: 영화,액션,2024)"
              value={formData.tags}
              onChangeText={(text) => setFormData({ ...formData, tags: text })}
            />
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="information-circle" size={20} color="#0ea5e9" />
          <Text style={styles.noticeText}>
            업로드된 파일은 관리자 승인 후 공개됩니다.{'\n'}
            저작권을 침해하는 파일은 업로드하지 마세요.
          </Text>
        </View>
      </ScrollView>

      {/* Upload Button */}
      <View style={styles.bottomBar}>
        <TouchableOpacity
          style={[styles.uploadButton, (!file || !formData.title || !formData.categoryId) && styles.uploadButtonDisabled]}
          onPress={handleUpload}
          disabled={!file || !formData.title || !formData.categoryId || uploadMutation.isPending}
        >
          <Ionicons name="cloud-upload" size={20} color="#fff" />
          <Text style={styles.uploadButtonText}>
            {uploadMutation.isPending ? '업로드 중...' : '업로드'}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f5f5f5',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 15,
    paddingTop: 50,
    paddingBottom: 15,
    backgroundColor: '#fff',
    borderBottomWidth: 1,
    borderBottomColor: '#eee',
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: 'bold',
  },
  section: {
    backgroundColor: '#fff',
    padding: 15,
    marginTop: 10,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 15,
  },
  pickerButtons: {
    flexDirection: 'row',
    gap: 15,
  },
  pickerButton: {
    flex: 1,
    alignItems: 'center',
    padding: 20,
    borderWidth: 2,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    borderStyle: 'dashed',
  },
  pickerButtonText: {
    marginTop: 8,
    fontSize: 14,
    fontWeight: '600',
    color: '#666',
  },
  filePreview: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 12,
    overflow: 'hidden',
  },
  previewImage: {
    width: '100%',
    height: 200,
    resizeMode: 'cover',
  },
  fileInfo: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 12,
    gap: 12,
  },
  fileDetails: {
    flex: 1,
  },
  fileName: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 4,
  },
  fileSize: {
    fontSize: 12,
    color: '#999',
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
    color: '#333',
  },
  input: {
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
  },
  textArea: {
    height: 100,
  },
  hint: {
    fontSize: 12,
    color: '#999',
    marginTop: 4,
  },
  row: {
    flexDirection: 'row',
  },
  selectContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  categoryChip: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: '#ddd',
    backgroundColor: '#fff',
  },
  categoryChipActive: {
    backgroundColor: '#0ea5e9',
    borderColor: '#0ea5e9',
  },
  categoryChipText: {
    fontSize: 13,
    color: '#666',
  },
  categoryChipTextActive: {
    color: '#fff',
    fontWeight: '600',
  },
  notice: {
    flexDirection: 'row',
    backgroundColor: '#f0f9ff',
    padding: 15,
    margin: 15,
    borderRadius: 8,
    gap: 10,
  },
  noticeText: {
    flex: 1,
    fontSize: 12,
    color: '#666',
    lineHeight: 18,
  },
  bottomBar: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
  },
  uploadButton: {
    flexDirection: 'row',
    backgroundColor: '#0ea5e9',
    paddingVertical: 15,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    gap: 8,
  },
  uploadButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  uploadButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
