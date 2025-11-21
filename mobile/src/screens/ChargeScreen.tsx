import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  TextInput,
  StyleSheet,
  Alert,
} from 'react-native';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { Ionicons } from '@expo/vector-icons';
import { paymentApi } from '../api';
import { useAuthStore } from '../store/authStore';

export default function ChargeScreen({ navigation }: any) {
  const { user } = useAuthStore();
  const queryClient = useQueryClient();
  const [selectedAmount, setSelectedAmount] = useState<number | null>(null);
  const [customAmount, setCustomAmount] = useState('');
  const [selectedMethod, setSelectedMethod] = useState<string | null>(null);

  const amounts = [
    { value: 10000, bonus: { cash: 0, point: 1000 } },
    { value: 30000, bonus: { cash: 0, point: 3000 } },
    { value: 50000, bonus: { cash: 2500, point: 5000 } },
    { value: 100000, bonus: { cash: 5000, point: 10000 } },
    { value: 300000, bonus: { cash: 15000, point: 30000 } },
    { value: 500000, bonus: { cash: 25000, point: 50000 } },
  ];

  const paymentMethods = [
    { id: 'card', name: '신용카드', icon: 'card' },
    { id: 'phone', name: '휴대폰', icon: 'phone-portrait' },
    { id: 'kakao', name: '카카오페이', icon: 'chatbubble' },
    { id: 'samsung', name: '삼성페이', icon: 'phone-portrait' },
    { id: 'transfer', name: '계좌이체', icon: 'wallet' },
    { id: 'toss', name: '토스', icon: 'card' },
  ];

  const chargeMutation = useMutation({
    mutationFn: (data: { amount: number; method: string }) =>
      paymentApi.requestPayment(data),
    onSuccess: (data) => {
      Alert.alert('충전 요청', '결제 페이지로 이동합니다.', [
        {
          text: '확인',
          onPress: () => {
            // In a real app, open payment webview or external app
            console.log('Payment URL:', data.data.paymentUrl);
            queryClient.invalidateQueries({ queryKey: ['user'] });
            navigation.goBack();
          },
        },
      ]);
    },
    onError: (error: any) => {
      Alert.alert('충전 실패', error.response?.data?.message || '충전에 실패했습니다.');
    },
  });

  const getBonus = (amount: number) => {
    const preset = amounts.find((a) => a.value === amount);
    if (preset) return preset.bonus;

    // Calculate bonus for custom amounts
    if (amount >= 50000) {
      return {
        cash: Math.floor(amount * 0.05),
        point: Math.floor(amount * 0.1),
      };
    } else if (amount >= 10000) {
      return {
        cash: 0,
        point: Math.floor(amount * 0.1),
      };
    }
    return { cash: 0, point: 0 };
  };

  const handleCharge = () => {
    const amount = selectedAmount || parseInt(customAmount);

    if (!amount || amount < 1000) {
      Alert.alert('오류', '최소 충전 금액은 1,000원입니다.');
      return;
    }

    if (!selectedMethod) {
      Alert.alert('오류', '결제 수단을 선택해주세요.');
      return;
    }

    const bonus = getBonus(amount);
    const totalCash = amount + bonus.cash;

    Alert.alert(
      '충전 확인',
      `충전 금액: ${amount.toLocaleString()}원\n보너스 캐시: ${bonus.cash.toLocaleString()}원\n보너스 포인트: ${bonus.point.toLocaleString()}P\n\n총 ${totalCash.toLocaleString()}원을 충전하시겠습니까?`,
      [
        { text: '취소', style: 'cancel' },
        {
          text: '충전',
          onPress: () => chargeMutation.mutate({ amount, method: selectedMethod }),
        },
      ]
    );
  };

  const currentAmount = selectedAmount || parseInt(customAmount) || 0;
  const currentBonus = getBonus(currentAmount);

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scrollView}>
        {/* Current Balance */}
        <View style={styles.balanceCard}>
          <Text style={styles.balanceTitle}>현재 보유</Text>
          <View style={styles.balanceRow}>
            <View style={styles.balanceItem}>
              <Ionicons name="wallet" size={20} color="#0ea5e9" />
              <Text style={styles.balanceLabel}>캐시</Text>
              <Text style={styles.balanceValue}>{user?.cash.toLocaleString()}원</Text>
            </View>
            <View style={styles.balanceItem}>
              <Ionicons name="star" size={20} color="#f59e0b" />
              <Text style={styles.balanceLabel}>포인트</Text>
              <Text style={styles.balanceValue}>{user?.point.toLocaleString()}P</Text>
            </View>
          </View>
        </View>

        {/* Preset Amounts */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>충전 금액 선택</Text>
          <View style={styles.amountGrid}>
            {amounts.map((item) => (
              <TouchableOpacity
                key={item.value}
                style={[
                  styles.amountCard,
                  selectedAmount === item.value && styles.amountCardActive,
                ]}
                onPress={() => {
                  setSelectedAmount(item.value);
                  setCustomAmount('');
                }}
              >
                <Text
                  style={[
                    styles.amountValue,
                    selectedAmount === item.value && styles.amountValueActive,
                  ]}
                >
                  {item.value.toLocaleString()}원
                </Text>
                {(item.bonus.cash > 0 || item.bonus.point > 0) && (
                  <View style={styles.bonusInfo}>
                    {item.bonus.cash > 0 && (
                      <Text style={styles.bonusText}>
                        +{item.bonus.cash.toLocaleString()}캐시
                      </Text>
                    )}
                    {item.bonus.point > 0 && (
                      <Text style={styles.bonusText}>
                        +{item.bonus.point.toLocaleString()}P
                      </Text>
                    )}
                  </View>
                )}
              </TouchableOpacity>
            ))}
          </View>
        </View>

        {/* Custom Amount */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>직접 입력</Text>
          <TextInput
            style={styles.customInput}
            placeholder="금액을 입력하세요 (최소 1,000원)"
            keyboardType="number-pad"
            value={customAmount}
            onChangeText={(text) => {
              setCustomAmount(text);
              setSelectedAmount(null);
            }}
          />
        </View>

        {/* Bonus Preview */}
        {currentAmount >= 1000 && (
          <View style={styles.bonusPreview}>
            <View style={styles.bonusPreviewHeader}>
              <Ionicons name="gift" size={24} color="#0ea5e9" />
              <Text style={styles.bonusPreviewTitle}>충전 혜택</Text>
            </View>
            <View style={styles.bonusPreviewContent}>
              <View style={styles.bonusPreviewRow}>
                <Text style={styles.bonusPreviewLabel}>충전 금액</Text>
                <Text style={styles.bonusPreviewValue}>
                  {currentAmount.toLocaleString()}원
                </Text>
              </View>
              <View style={styles.bonusPreviewRow}>
                <Text style={styles.bonusPreviewLabel}>보너스 캐시</Text>
                <Text style={[styles.bonusPreviewValue, styles.bonusHighlight]}>
                  +{currentBonus.cash.toLocaleString()}원
                </Text>
              </View>
              <View style={styles.bonusPreviewRow}>
                <Text style={styles.bonusPreviewLabel}>보너스 포인트</Text>
                <Text style={[styles.bonusPreviewValue, styles.bonusHighlight]}>
                  +{currentBonus.point.toLocaleString()}P
                </Text>
              </View>
              <View style={styles.divider} />
              <View style={styles.bonusPreviewRow}>
                <Text style={styles.bonusTotalLabel}>총 충전액</Text>
                <Text style={styles.bonusTotalValue}>
                  {(currentAmount + currentBonus.cash).toLocaleString()}원
                </Text>
              </View>
            </View>
          </View>
        )}

        {/* Payment Methods */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>결제 수단</Text>
          <View style={styles.methodGrid}>
            {paymentMethods.map((method) => (
              <TouchableOpacity
                key={method.id}
                style={[
                  styles.methodCard,
                  selectedMethod === method.id && styles.methodCardActive,
                ]}
                onPress={() => setSelectedMethod(method.id)}
              >
                <Ionicons
                  name={method.icon as any}
                  size={32}
                  color={selectedMethod === method.id ? '#0ea5e9' : '#666'}
                />
                <Text
                  style={[
                    styles.methodText,
                    selectedMethod === method.id && styles.methodTextActive,
                  ]}
                >
                  {method.name}
                </Text>
              </TouchableOpacity>
            ))}
          </View>
        </View>

        <View style={styles.notice}>
          <Ionicons name="information-circle" size={20} color="#666" />
          <Text style={styles.noticeText}>
            충전된 캐시는 파일 구매에 사용할 수 있습니다.{'\n'}
            포인트는 다음 구매 시 할인 혜택으로 제공됩니다.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom Button */}
      <View style={styles.bottomBar}>
        <View style={styles.totalContainer}>
          <Text style={styles.totalLabel}>충전 금액</Text>
          <Text style={styles.totalValue}>
            {currentAmount > 0 ? `${currentAmount.toLocaleString()}원` : '0원'}
          </Text>
        </View>
        <TouchableOpacity
          style={[
            styles.chargeButton,
            (!currentAmount || !selectedMethod) && styles.chargeButtonDisabled,
          ]}
          onPress={handleCharge}
          disabled={!currentAmount || !selectedMethod || chargeMutation.isPending}
        >
          <Text style={styles.chargeButtonText}>
            {chargeMutation.isPending ? '처리 중...' : '충전하기'}
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
  balanceCard: {
    backgroundColor: '#fff',
    padding: 20,
    margin: 15,
    borderRadius: 12,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  balanceTitle: {
    fontSize: 14,
    color: '#666',
    marginBottom: 12,
  },
  balanceRow: {
    flexDirection: 'row',
    gap: 20,
  },
  balanceItem: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  balanceLabel: {
    fontSize: 13,
    color: '#666',
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  section: {
    paddingHorizontal: 15,
    marginBottom: 20,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: 'bold',
    marginBottom: 12,
  },
  amountGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  amountCard: {
    width: '48%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  amountCardActive: {
    borderColor: '#0ea5e9',
    backgroundColor: '#f0f9ff',
  },
  amountValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#333',
    marginBottom: 4,
  },
  amountValueActive: {
    color: '#0ea5e9',
  },
  bonusInfo: {
    marginTop: 4,
  },
  bonusText: {
    fontSize: 11,
    color: '#10b981',
    fontWeight: '600',
  },
  customInput: {
    backgroundColor: '#fff',
    height: 50,
    borderRadius: 8,
    paddingHorizontal: 15,
    fontSize: 16,
    borderWidth: 1,
    borderColor: '#e5e7eb',
  },
  bonusPreview: {
    backgroundColor: '#fff',
    marginHorizontal: 15,
    marginBottom: 20,
    borderRadius: 12,
    padding: 20,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  bonusPreviewHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 15,
  },
  bonusPreviewTitle: {
    fontSize: 16,
    fontWeight: 'bold',
  },
  bonusPreviewContent: {
    gap: 10,
  },
  bonusPreviewRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bonusPreviewLabel: {
    fontSize: 14,
    color: '#666',
  },
  bonusPreviewValue: {
    fontSize: 14,
    fontWeight: '600',
    color: '#333',
  },
  bonusHighlight: {
    color: '#10b981',
  },
  divider: {
    height: 1,
    backgroundColor: '#e5e7eb',
    marginVertical: 5,
  },
  bonusTotalLabel: {
    fontSize: 16,
    fontWeight: 'bold',
    color: '#333',
  },
  bonusTotalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  methodGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  methodCard: {
    width: '31%',
    backgroundColor: '#fff',
    padding: 15,
    borderRadius: 12,
    alignItems: 'center',
    borderWidth: 2,
    borderColor: '#e5e7eb',
  },
  methodCardActive: {
    borderColor: '#0ea5e9',
    backgroundColor: '#f0f9ff',
  },
  methodText: {
    fontSize: 12,
    color: '#666',
    marginTop: 8,
    fontWeight: '600',
  },
  methodTextActive: {
    color: '#0ea5e9',
  },
  notice: {
    flexDirection: 'row',
    backgroundColor: '#f9fafb',
    padding: 15,
    marginHorizontal: 15,
    marginBottom: 20,
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
    flexDirection: 'row',
    backgroundColor: '#fff',
    padding: 15,
    borderTopWidth: 1,
    borderTopColor: '#eee',
    gap: 15,
  },
  totalContainer: {
    justifyContent: 'center',
  },
  totalLabel: {
    fontSize: 12,
    color: '#999',
  },
  totalValue: {
    fontSize: 18,
    fontWeight: 'bold',
    color: '#0ea5e9',
  },
  chargeButton: {
    flex: 1,
    backgroundColor: '#0ea5e9',
    height: 50,
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
  },
  chargeButtonDisabled: {
    backgroundColor: '#cbd5e1',
  },
  chargeButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: 'bold',
  },
});
