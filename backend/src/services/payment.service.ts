import axios from 'axios';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../config/database';

// 토스페이먼츠 설정
const TOSS_CLIENT_KEY = process.env.TOSS_CLIENT_KEY || '';
const TOSS_SECRET_KEY = process.env.TOSS_SECRET_KEY || '';
const TOSS_API_URL = 'https://api.tosspayments.com/v1';

// 아임포트 설정
const IAMPORT_API_KEY = process.env.IAMPORT_API_KEY || '';
const IAMPORT_API_SECRET = process.env.IAMPORT_API_SECRET || '';
const IAMPORT_API_URL = 'https://api.iamport.kr';

export interface PaymentRequest {
  userId: string;
  amount: number;
  method: 'card' | 'transfer' | 'phone' | 'kakao' | 'samsung' | 'toss' | 'payco';
  orderId?: string;
  orderName?: string;
  customerEmail?: string;
  customerName?: string;
}

export interface PaymentResult {
  success: boolean;
  transactionId: string;
  orderId: string;
  amount: number;
  method: string;
  paidAt?: Date;
  receiptUrl?: string;
  error?: string;
}

class PaymentService {
  // 토스페이먼츠 결제 요청
  async requestTossPayment(request: PaymentRequest): Promise<any> {
    const orderId = request.orderId || `order_${uuidv4()}`;

    const paymentData = {
      amount: request.amount,
      orderId,
      orderName: request.orderName || '캐시 충전',
      customerEmail: request.customerEmail,
      customerName: request.customerName,
      successUrl: `${process.env.FRONTEND_URL}/payment/success`,
      failUrl: `${process.env.FRONTEND_URL}/payment/fail`,
    };

    try {
      const response = await axios.post(
        `${TOSS_API_URL}/payments`,
        paymentData,
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      return {
        success: true,
        paymentKey: response.data.paymentKey,
        orderId,
        checkoutUrl: response.data.checkoutUrl,
      };
    } catch (error: any) {
      console.error('Toss payment request failed:', error.response?.data || error.message);
      return {
        success: false,
        error: error.response?.data?.message || 'Payment request failed',
      };
    }
  }

  // 토스페이먼츠 결제 승인
  async confirmTossPayment(paymentKey: string, orderId: string, amount: number): Promise<PaymentResult> {
    try {
      const response = await axios.post(
        `${TOSS_API_URL}/payments/${paymentKey}`,
        {
          orderId,
          amount,
        },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const payment = response.data;

      return {
        success: true,
        transactionId: payment.paymentKey,
        orderId: payment.orderId,
        amount: payment.totalAmount,
        method: payment.method,
        paidAt: new Date(payment.approvedAt),
        receiptUrl: payment.receipt?.url,
      };
    } catch (error: any) {
      console.error('Toss payment confirmation failed:', error.response?.data || error.message);
      return {
        success: false,
        transactionId: paymentKey,
        orderId,
        amount,
        method: 'unknown',
        error: error.response?.data?.message || 'Payment confirmation failed',
      };
    }
  }

  // 아임포트 액세스 토큰 발급
  private async getIamportToken(): Promise<string | null> {
    try {
      const response = await axios.post(`${IAMPORT_API_URL}/users/getToken`, {
        imp_key: IAMPORT_API_KEY,
        imp_secret: IAMPORT_API_SECRET,
      });

      return response.data.response.access_token;
    } catch (error) {
      console.error('Failed to get Iamport token:', error);
      return null;
    }
  }

  // 아임포트 결제 검증
  async verifyIamportPayment(impUid: string): Promise<PaymentResult> {
    try {
      const token = await this.getIamportToken();
      if (!token) {
        throw new Error('Failed to get access token');
      }

      const response = await axios.get(
        `${IAMPORT_API_URL}/payments/${impUid}`,
        {
          headers: {
            'Authorization': `Bearer ${token}`,
          },
        }
      );

      const payment = response.data.response;

      return {
        success: payment.status === 'paid',
        transactionId: payment.imp_uid,
        orderId: payment.merchant_uid,
        amount: payment.amount,
        method: payment.pay_method,
        paidAt: new Date(payment.paid_at * 1000),
        receiptUrl: payment.receipt_url,
      };
    } catch (error: any) {
      console.error('Iamport payment verification failed:', error.response?.data || error.message);
      return {
        success: false,
        transactionId: impUid,
        orderId: '',
        amount: 0,
        method: 'unknown',
        error: error.response?.data?.message || 'Payment verification failed',
      };
    }
  }

  // 결제 후 처리 (캐시 충전)
  async processPaymentSuccess(
    userId: string,
    paymentResult: PaymentResult
  ): Promise<void> {
    if (!paymentResult.success) {
      throw new Error(paymentResult.error || 'Payment failed');
    }

    const amount = paymentResult.amount;

    // 보너스 계산
    let bonusCash = 0;
    let bonusPoint = 0;
    let bonusCoupon = 0;

    if (amount >= 10000) {
      bonusPoint = Math.floor(amount * 0.1);
    }
    if (amount >= 20000) {
      bonusCash = Math.floor(amount * 0.05);
      bonusCoupon = Math.floor(amount / 10000) * 3;
    }
    if (amount >= 50000) {
      bonusCash = Math.floor(amount * 0.1);
      bonusCoupon = Math.floor(amount / 10000) * 5;
    }

    // 트랜잭션으로 처리
    await prisma.$transaction(async (tx) => {
      // 사용자 정보 가져오기
      const user = await tx.user.findUnique({
        where: { id: userId },
      });

      if (!user) {
        throw new Error('User not found');
      }

      // 캐시 및 포인트 업데이트
      await tx.user.update({
        where: { id: userId },
        data: {
          cash: { increment: amount + bonusCash },
          point: { increment: bonusPoint },
          couponCount: { increment: bonusCoupon },
        },
      });

      // 거래 내역 생성 - 캐시 충전
      await tx.transaction.create({
        data: {
          userId,
          type: 'DEPOSIT',
          amount,
          balance: user.cash + amount + bonusCash,
          currency: 'CASH',
          description: `캐시 충전: ${amount}원`,
          paymentMethod: paymentResult.method,
          pgProvider: 'tosspayments',
          pgTransactionId: paymentResult.transactionId,
          status: 'COMPLETED',
          metadata: {
            orderId: paymentResult.orderId,
            bonusCash,
            bonusPoint,
            bonusCoupon,
            paidAt: paymentResult.paidAt,
            receiptUrl: paymentResult.receiptUrl,
          },
        },
      });

      // 보너스 캐시 내역
      if (bonusCash > 0) {
        await tx.transaction.create({
          data: {
            userId,
            type: 'BONUS',
            amount: bonusCash,
            balance: user.cash + amount + bonusCash,
            currency: 'CASH',
            description: '충전 보너스 캐시',
            status: 'COMPLETED',
          },
        });
      }

      // 보너스 포인트 내역
      if (bonusPoint > 0) {
        await tx.transaction.create({
          data: {
            userId,
            type: 'BONUS',
            amount: bonusPoint,
            balance: user.point + bonusPoint,
            currency: 'POINT',
            description: '충전 보너스 포인트',
            status: 'COMPLETED',
          },
        });
      }

      // 알림 생성
      await tx.notification.create({
        data: {
          userId,
          type: 'PAYMENT',
          title: '캐시 충전 완료',
          message: `${amount.toLocaleString()}원이 충전되었습니다. (보너스 캐시: ${bonusCash}, 보너스 포인트: ${bonusPoint}, 보너스 쿠폰: ${bonusCoupon})`,
        },
      });
    });
  }

  // 환불 처리
  async processRefund(
    transactionId: string,
    reason: string
  ): Promise<{ success: boolean; message: string }> {
    try {
      const transaction = await prisma.transaction.findFirst({
        where: {
          pgTransactionId: transactionId,
        },
        include: {
          user: true,
        },
      });

      if (!transaction) {
        return {
          success: false,
          message: 'Transaction not found',
        };
      }

      if (transaction.status === 'REFUNDED') {
        return {
          success: false,
          message: 'Already refunded',
        };
      }

      // 토스페이먼츠 환불 API 호출
      const response = await axios.post(
        `${TOSS_API_URL}/payments/${transactionId}/cancel`,
        {
          cancelReason: reason,
        },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      // 환불 처리
      await prisma.$transaction(async (tx) => {
        // 사용자 캐시 차감
        await tx.user.update({
          where: { id: transaction.userId },
          data: {
            cash: { decrement: transaction.amount },
          },
        });

        // 거래 상태 업데이트
        await tx.transaction.update({
          where: { id: transaction.id },
          data: {
            status: 'REFUNDED',
          },
        });

        // 환불 거래 내역 생성
        await tx.transaction.create({
          data: {
            userId: transaction.userId,
            type: 'REFUND',
            amount: -transaction.amount,
            balance: transaction.user.cash - transaction.amount,
            currency: transaction.currency,
            description: `환불: ${reason}`,
            status: 'COMPLETED',
          },
        });

        // 알림 생성
        await tx.notification.create({
          data: {
            userId: transaction.userId,
            type: 'PAYMENT',
            title: '환불 완료',
            message: `${transaction.amount.toLocaleString()}원이 환불되었습니다. 사유: ${reason}`,
          },
        });
      });

      return {
        success: true,
        message: 'Refund processed successfully',
      };
    } catch (error: any) {
      console.error('Refund failed:', error.response?.data || error.message);
      return {
        success: false,
        message: error.response?.data?.message || 'Refund failed',
      };
    }
  }

  // 가상계좌 발급
  async issueVirtualAccount(
    userId: string,
    amount: number
  ): Promise<{
    success: boolean;
    accountNumber?: string;
    bankCode?: string;
    bankName?: string;
    expiresAt?: Date;
  }> {
    try {
      const orderId = `va_${uuidv4()}`;

      const response = await axios.post(
        `${TOSS_API_URL}/virtual-accounts`,
        {
          orderId,
          amount,
          orderName: '캐시 충전',
          validHours: 72, // 3일
        },
        {
          headers: {
            'Authorization': `Basic ${Buffer.from(`${TOSS_SECRET_KEY}:`).toString('base64')}`,
            'Content-Type': 'application/json',
          },
        }
      );

      const va = response.data;

      return {
        success: true,
        accountNumber: va.accountNumber,
        bankCode: va.bank,
        bankName: va.bankName,
        expiresAt: new Date(va.dueDate),
      };
    } catch (error: any) {
      console.error('Virtual account issuance failed:', error.response?.data || error.message);
      return {
        success: false,
      };
    }
  }
}

export const paymentService = new PaymentService();
