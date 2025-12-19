import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { CreditCard, ArrowUpRight, ArrowDownLeft, Filter, Download, Calendar, ChevronDown, FileText } from 'lucide-react';
import api from '../api/axios';
import toast from 'react-hot-toast';
import { format } from 'date-fns';
import { ko } from 'date-fns/locale';

interface Transaction {
  id: string;
  type: 'CHARGE' | 'PURCHASE' | 'SALE' | 'REFUND' | 'BONUS' | 'WITHDRAW';
  amount: number;
  balance: number;
  description: string;
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'CANCELLED';
  paymentMethod?: string;
  file?: {
    id: string;
    title: string;
  };
  createdAt: string;
}

type TransactionFilter = 'all' | 'CHARGE' | 'PURCHASE' | 'SALE' | 'REFUND';

export default function PaymentHistoryPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<TransactionFilter>('all');
  const [dateRange, setDateRange] = useState<{ start: string; end: string }>({
    start: '',
    end: '',
  });
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [stats, setStats] = useState({
    totalCharge: 0,
    totalPurchase: 0,
    totalSale: 0,
    totalRefund: 0,
  });

  useEffect(() => {
    fetchTransactions();
    fetchStats();
  }, [filter, dateRange]);

  const fetchTransactions = async (pageNum = 1) => {
    try {
      setLoading(pageNum === 1);
      const params: any = { page: pageNum, limit: 20 };
      if (filter !== 'all') {
        params.type = filter;
      }
      if (dateRange.start) {
        params.startDate = dateRange.start;
      }
      if (dateRange.end) {
        params.endDate = dateRange.end;
      }

      const response = await api.get('/payments/transactions', { params });
      const data = response.data.transactions || response.data;

      if (pageNum === 1) {
        setTransactions(data);
      } else {
        setTransactions((prev) => [...prev, ...data]);
      }
      setHasMore(data.length === 20);
      setPage(pageNum);
    } catch (error) {
      toast.error('거래 내역을 불러오는데 실패했습니다.');
    } finally {
      setLoading(false);
    }
  };

  const fetchStats = async () => {
    try {
      const response = await api.get('/payments/stats');
      setStats(response.data);
    } catch (error) {
      // Stats are optional
    }
  };

  const getTransactionIcon = (type: string) => {
    switch (type) {
      case 'CHARGE':
        return <ArrowDownLeft className="w-5 h-5 text-green-500" />;
      case 'PURCHASE':
        return <ArrowUpRight className="w-5 h-5 text-red-500" />;
      case 'SALE':
        return <ArrowDownLeft className="w-5 h-5 text-blue-500" />;
      case 'REFUND':
        return <ArrowDownLeft className="w-5 h-5 text-orange-500" />;
      case 'BONUS':
        return <ArrowDownLeft className="w-5 h-5 text-purple-500" />;
      case 'WITHDRAW':
        return <ArrowUpRight className="w-5 h-5 text-gray-500" />;
      default:
        return <CreditCard className="w-5 h-5 text-gray-500" />;
    }
  };

  const getTransactionTypeLabel = (type: string) => {
    switch (type) {
      case 'CHARGE':
        return '충전';
      case 'PURCHASE':
        return '구매';
      case 'SALE':
        return '판매 수익';
      case 'REFUND':
        return '환불';
      case 'BONUS':
        return '보너스';
      case 'WITHDRAW':
        return '출금';
      default:
        return type;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'COMPLETED':
        return <span className="text-xs px-2 py-0.5 bg-green-100 text-green-700 rounded-full">완료</span>;
      case 'PENDING':
        return <span className="text-xs px-2 py-0.5 bg-yellow-100 text-yellow-700 rounded-full">대기중</span>;
      case 'FAILED':
        return <span className="text-xs px-2 py-0.5 bg-red-100 text-red-700 rounded-full">실패</span>;
      case 'CANCELLED':
        return <span className="text-xs px-2 py-0.5 bg-gray-100 text-gray-700 rounded-full">취소됨</span>;
      default:
        return null;
    }
  };

  const exportToCSV = () => {
    const headers = ['날짜', '유형', '설명', '금액', '잔액', '상태'];
    const rows = transactions.map((t) => [
      format(new Date(t.createdAt), 'yyyy-MM-dd HH:mm'),
      getTransactionTypeLabel(t.type),
      t.description,
      t.amount.toLocaleString(),
      t.balance.toLocaleString(),
      t.status,
    ]);

    const csvContent = [headers.join(','), ...rows.map((r) => r.join(','))].join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `transactions_${format(new Date(), 'yyyyMMdd')}.csv`;
    link.click();
  };

  const filters: { key: TransactionFilter; label: string }[] = [
    { key: 'all', label: '전체' },
    { key: 'CHARGE', label: '충전' },
    { key: 'PURCHASE', label: '구매' },
    { key: 'SALE', label: '판매' },
    { key: 'REFUND', label: '환불' },
  ];

  return (
    <div className="max-w-4xl mx-auto">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <CreditCard className="w-6 h-6 text-blue-500" />
            <h1 className="text-2xl font-bold">결제 내역</h1>
          </div>
          <button
            onClick={exportToCSV}
            className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors"
          >
            <Download className="w-4 h-4" />
            CSV 다운로드
          </button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-4 gap-4">
          <div className="bg-green-50 rounded-lg p-4">
            <p className="text-sm text-green-600 mb-1">총 충전</p>
            <p className="text-xl font-bold text-green-700">+{stats.totalCharge.toLocaleString()}원</p>
          </div>
          <div className="bg-red-50 rounded-lg p-4">
            <p className="text-sm text-red-600 mb-1">총 구매</p>
            <p className="text-xl font-bold text-red-700">-{stats.totalPurchase.toLocaleString()}원</p>
          </div>
          <div className="bg-blue-50 rounded-lg p-4">
            <p className="text-sm text-blue-600 mb-1">판매 수익</p>
            <p className="text-xl font-bold text-blue-700">+{stats.totalSale.toLocaleString()}원</p>
          </div>
          <div className="bg-orange-50 rounded-lg p-4">
            <p className="text-sm text-orange-600 mb-1">환불</p>
            <p className="text-xl font-bold text-orange-700">+{stats.totalRefund.toLocaleString()}원</p>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-4 mb-6">
        <div className="flex flex-wrap items-center gap-4">
          {/* Type Filter */}
          <div className="flex gap-2">
            {filters.map((f) => (
              <button
                key={f.key}
                onClick={() => setFilter(f.key)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                  filter === f.key
                    ? 'bg-blue-500 text-white'
                    : 'bg-gray-100 text-gray-600 hover:bg-gray-200'
                }`}
              >
                {f.label}
              </button>
            ))}
          </div>

          {/* Date Range */}
          <div className="flex items-center gap-2 ml-auto">
            <Calendar className="w-4 h-4 text-gray-400" />
            <input
              type="date"
              value={dateRange.start}
              onChange={(e) => setDateRange((prev) => ({ ...prev, start: e.target.value }))}
              className="px-3 py-2 border rounded-lg text-sm"
            />
            <span className="text-gray-400">~</span>
            <input
              type="date"
              value={dateRange.end}
              onChange={(e) => setDateRange((prev) => ({ ...prev, end: e.target.value }))}
              className="px-3 py-2 border rounded-lg text-sm"
            />
          </div>
        </div>
      </div>

      {/* Transactions List */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-500"></div>
          </div>
        ) : transactions.length === 0 ? (
          <div className="text-center py-20">
            <CreditCard className="w-16 h-16 mx-auto text-gray-300 mb-4" />
            <p className="text-gray-500">거래 내역이 없습니다.</p>
          </div>
        ) : (
          <div className="divide-y">
            {transactions.map((transaction) => (
              <div key={transaction.id} className="p-4 flex items-center gap-4 hover:bg-gray-50 transition-colors">
                {/* Icon */}
                <div className="flex-shrink-0 w-10 h-10 bg-gray-100 rounded-full flex items-center justify-center">
                  {getTransactionIcon(transaction.type)}
                </div>

                {/* Content */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-gray-900">
                      {getTransactionTypeLabel(transaction.type)}
                    </span>
                    {getStatusBadge(transaction.status)}
                  </div>
                  <p className="text-sm text-gray-500 truncate">
                    {transaction.description}
                  </p>
                  {transaction.file && (
                    <Link
                      to={`/files/${transaction.file.id}`}
                      className="text-sm text-blue-500 hover:underline flex items-center gap-1 mt-1"
                    >
                      <FileText className="w-3 h-3" />
                      {transaction.file.title}
                    </Link>
                  )}
                </div>

                {/* Amount */}
                <div className="text-right">
                  <p className={`font-bold ${
                    ['CHARGE', 'SALE', 'REFUND', 'BONUS'].includes(transaction.type)
                      ? 'text-green-600'
                      : 'text-red-600'
                  }`}>
                    {['CHARGE', 'SALE', 'REFUND', 'BONUS'].includes(transaction.type) ? '+' : '-'}
                    {transaction.amount.toLocaleString()}원
                  </p>
                  <p className="text-xs text-gray-400">
                    잔액: {transaction.balance.toLocaleString()}원
                  </p>
                </div>

                {/* Date */}
                <div className="text-sm text-gray-400 text-right min-w-[80px]">
                  <p>{format(new Date(transaction.createdAt), 'MM.dd')}</p>
                  <p>{format(new Date(transaction.createdAt), 'HH:mm')}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Load More */}
        {hasMore && !loading && transactions.length > 0 && (
          <div className="p-4 text-center border-t">
            <button
              onClick={() => fetchTransactions(page + 1)}
              className="px-6 py-2 bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors"
            >
              더 보기
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
