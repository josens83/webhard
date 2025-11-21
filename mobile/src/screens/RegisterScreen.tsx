import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  Alert,
} from 'react-native';
import { useMutation } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { authApi } from '../api';

export default function RegisterScreen({ navigation }: any) {
  const [formData, setFormData] = useState({
    username: '',
    email: '',
    password: '',
    confirmPassword: '',
    displayName: '',
    phone: '',
  });

  const registerMutation = useMutation({
    mutationFn: authApi.register,
    onSuccess: () => {
      Alert.alert(
        '회원가입 성공',
        '로그인 페이지로 이동합니다.',
        [
          {
            text: '확인',
            onPress: () => navigation.navigate('Login'),
          },
        ]
      );
    },
    onError: (error: any) => {
      Alert.alert('회원가입 실패', error.response?.data?.message || '회원가입에 실패했습니다.');
    },
  });

  const handleRegister = () => {
    if (!formData.username || !formData.email || !formData.password) {
      Alert.alert('오류', '필수 항목을 모두 입력해주세요.');
      return;
    }

    if (formData.password !== formData.confirmPassword) {
      Alert.alert('오류', '비밀번호가 일치하지 않습니다.');
      return;
    }

    if (formData.password.length < 6) {
      Alert.alert('오류', '비밀번호는 6자 이상이어야 합니다.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
      Alert.alert('오류', '올바른 이메일 형식이 아닙니다.');
      return;
    }

    registerMutation.mutate({
      username: formData.username,
      email: formData.email,
      password: formData.password,
      displayName: formData.displayName || formData.username,
      phone: formData.phone,
    });
  };

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
    >
      <ScrollView style={styles.scrollView} contentContainerStyle={styles.scrollContent}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => navigation.goBack()}
          >
            <Ionicons name="arrow-back" size={24} color="#333" />
          </TouchableOpacity>
          <Text style={styles.title}>회원가입</Text>
        </View>

        <View style={styles.formContainer}>
          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              아이디 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="아이디를 입력하세요"
              value={formData.username}
              onChangeText={(text) => setFormData({ ...formData, username: text })}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              이메일 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="example@email.com"
              value={formData.email}
              onChangeText={(text) => setFormData({ ...formData, email: text })}
              keyboardType="email-address"
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              비밀번호 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="6자 이상 입력하세요"
              value={formData.password}
              onChangeText={(text) => setFormData({ ...formData, password: text })}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>
              비밀번호 확인 <Text style={styles.required}>*</Text>
            </Text>
            <TextInput
              style={styles.input}
              placeholder="비밀번호를 다시 입력하세요"
              value={formData.confirmPassword}
              onChangeText={(text) => setFormData({ ...formData, confirmPassword: text })}
              secureTextEntry
              autoCapitalize="none"
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>닉네임</Text>
            <TextInput
              style={styles.input}
              placeholder="표시될 이름 (선택사항)"
              value={formData.displayName}
              onChangeText={(text) => setFormData({ ...formData, displayName: text })}
            />
          </View>

          <View style={styles.inputGroup}>
            <Text style={styles.label}>전화번호</Text>
            <TextInput
              style={styles.input}
              placeholder="010-0000-0000 (선택사항)"
              value={formData.phone}
              onChangeText={(text) => setFormData({ ...formData, phone: text })}
              keyboardType="phone-pad"
            />
          </View>

          <View style={styles.benefitBox}>
            <Ionicons name="gift" size={24} color="#0ea5e9" />
            <Text style={styles.benefitText}>
              회원가입 시 <Text style={styles.benefitHighlight}>5,000 캐시</Text>와{' '}
              <Text style={styles.benefitHighlight}>1,000 포인트</Text>를 드립니다!
            </Text>
          </View>

          <TouchableOpacity
            style={styles.registerButton}
            onPress={handleRegister}
            disabled={registerMutation.isPending}
          >
            <Text style={styles.registerButtonText}>
              {registerMutation.isPending ? '가입 중...' : '회원가입'}
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.loginLink}
            onPress={() => navigation.navigate('Login')}
          >
            <Text style={styles.loginLinkText}>
              이미 계정이 있으신가요? <Text style={styles.loginLinkBold}>로그인</Text>
            </Text>
          </TouchableOpacity>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    paddingBottom: 30,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 50,
    paddingBottom: 20,
  },
  backButton: {
    marginRight: 15,
  },
  title: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  formContainer: {
    paddingHorizontal: 30,
  },
  inputGroup: {
    marginBottom: 20,
  },
  label: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
    marginBottom: 8,
  },
  required: {
    color: '#ef4444',
  },
  input: {
    height: 50,
    borderWidth: 1,
    borderColor: '#ddd',
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
  },
  benefitBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#f0f9ff',
    padding: 15,
    borderRadius: 8,
    marginBottom: 20,
    gap: 10,
  },
  benefitText: {
    flex: 1,
    fontSize: 13,
    color: '#333',
  },
  benefitHighlight: {
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  registerButton: {
    height: 50,
    backgroundColor: '#0ea5e9',
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: 10,
  },
  registerButtonText: {
    color: '#fff',
    fontSize: 18,
    fontWeight: 'bold',
  },
  loginLink: {
    marginTop: 20,
    alignItems: 'center',
  },
  loginLinkText: {
    color: '#666',
    fontSize: 14,
  },
  loginLinkBold: {
    color: '#0ea5e9',
    fontWeight: 'bold',
  },
});
