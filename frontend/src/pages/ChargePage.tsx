import { useState } from 'react';
import { useMutation } from '@tanstack/react-query';
import apiClient from '../api/client';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';

const CHARGE_AMOUNTS = [
  { amount: 5000, bonus: { cash: 0, point: 250, coupon: 0 } },
  { amount: 10000, bonus: { cash: 1000, point: 2000, coupon: 3 } },
  { amount: 20000, bonus: { cash: 2000, point: 6000, coupon: 9 } },
  { amount: 30000, bonus: { cash: 3000, point: 10000, coupon: 24 } },
  { amount: 50000, bonus: { cash: 5000, point: 20000, coupon: 45 } },
  { amount: 90000, bonus: { cash: 9000, point: 40000, coupon: 90 } },
  { amount: 200000, bonus: { cash: 20000, point: 90000, coupon: 210 } },
];

export default function ChargePage() {
  const [selectedAmount, setSelectedAmount] = useState(30000);
  const [paymentMethod, setPaymentMethod] = useState('card');
  const { user } = useAuthStore();

  const chargeMutation = useMutation({
    mutationFn: async (data: any) => {
      const response = await apiClient.post('/payments/charge', data);
      return response.data;
    },
    onSuccess: () => {
      toast.success('캐시 충전이 완료되었습니다!');
    },
  });

  const handleCharge = () => {
    chargeMutation.mutate({
      amount: selectedAmount,
      paymentMethod,
      pgProvider: 'tosspayments',
    });
  };

  const selectedBonus = CHARGE_AMOUNTS.find((a) => a.amount === selectedAmount)?.bonus;

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-6">캐시 충전</h1>

        {/* Step 1: Select amount */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">1단계 : 결제금액을 선택해 주세요.</h2>

          <div className="space-y-3">
            {CHARGE_AMOUNTS.map((item) => (
              <label
                key={item.amount}
                className={`flex items-center justify-between p-4 border-2 rounded-lg cursor-pointer transition ${
                  selectedAmount === item.amount
                    ? 'border-blue-600 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
              >
                <input
                  type="radio"
                  name="amount"
                  value={item.amount}
                  checked={selectedAmount === item.amount}
                  onChange={(e) => setSelectedAmount(parseInt(e.target.value))}
                  className="mr-4"
                />

                <div className="flex-1">
                  <span className="text-lg font-semibold">
                    {item.amount.toLocaleString()} 캐시
                  </span>
                </div>

                <div className="text-right text-sm">
                  {item.bonus.cash > 0 && (
                    <span className="text-green-600 font-semibold mr-2">
                      {item.bonus.cash.toLocaleString()} 캐시 또는
                    </span>
                  )}
                  {item.bonus.point > 0 && (
                    <span className="text-blue-600 font-semibold mr-2">
                      {item.bonus.point.toLocaleString()} 포인트 또는
                    </span>
                  )}
                  {item.bonus.coupon > 0 && (
                    <span className="text-purple-600 font-semibold">
                      쿠폰 {item.bonus.coupon}장
                    </span>
                  )}
                </div>
              </label>
            ))}
          </div>

          {selectedBonus && (
            <div className="mt-4 p-4 bg-blue-50 rounded-lg">
              <p className="text-center text-sm">
                적립되는 캐시는 <span className="font-bold text-blue-600">{selectedAmount.toLocaleString()} 캐시</span> +
                <span className="font-bold text-green-600"> {selectedBonus.cash.toLocaleString()} 포인트</span>이며
                결제 시 부가세 10%를 포함한 <span className="font-bold">{Math.floor(selectedAmount * 1.1).toLocaleString()}원</span>이 결제됩니다.
              </p>
            </div>
          )}
        </div>

        {/* Step 2: Select payment method */}
        <div className="mb-8">
          <h2 className="text-lg font-semibold mb-4">2단계 : 결제방법을 선택해 주세요.</h2>

          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <button
              onClick={() => setPaymentMethod('phone')}
              className={`p-4 border-2 rounded-lg ${
                paymentMethod === 'phone' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}
            >
              휴대폰
            </button>

            <button
              onClick={() => setPaymentMethod('kakao')}
              className={`p-4 border-2 rounded-lg ${
                paymentMethod === 'kakao' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}
            >
              카카오페이
            </button>

            <button
              onClick={() => setPaymentMethod('samsung')}
              className={`p-4 border-2 rounded-lg ${
                paymentMethod === 'samsung' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}
            >
              삼성페이
            </button>

            <button
              onClick={() => setPaymentMethod('card')}
              className={`p-4 border-2 rounded-lg ${
                paymentMethod === 'card' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}
            >
              신용카드
            </button>

            <button
              onClick={() => setPaymentMethod('transfer')}
              className={`p-4 border-2 rounded-lg ${
                paymentMethod === 'transfer' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}
            >
              실시간계좌이체
            </button>

            <button
              onClick={() => setPaymentMethod('kbank')}
              className={`p-4 border-2 rounded-lg ${
                paymentMethod === 'kbank' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}
            >
              케이뱅크
            </button>

            <button
              onClick={() => setPaymentMethod('toss')}
              className={`p-4 border-2 rounded-lg ${
                paymentMethod === 'toss' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}
            >
              토스페이
            </button>

            <button
              onClick={() => setPaymentMethod('payco')}
              className={`p-4 border-2 rounded-lg ${
                paymentMethod === 'payco' ? 'border-blue-600 bg-blue-50' : 'border-gray-200'
              }`}
            >
              페이코
            </button>
          </div>
        </div>

        <button
          onClick={handleCharge}
          disabled={chargeMutation.isPending}
          className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white text-lg font-semibold rounded-lg disabled:opacity-50"
        >
          {chargeMutation.isPending ? '결제 처리 중...' : '결제하기'}
        </button>
      </div>
    </div>
  );
}
