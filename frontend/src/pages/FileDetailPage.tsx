import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { filesApi } from '../api/files';
import { Download, Heart, Star, Flag } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { useState } from 'react';

export default function FileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const [comment, setComment] = useState('');

  const { data, isLoading, refetch } = useQuery({
    queryKey: ['file', id],
    queryFn: () => filesApi.getFileById(id!),
    enabled: !!id,
  });

  const purchaseMutation = useMutation({
    mutationFn: (paymentMethod: string) => filesApi.purchaseFile(id!, paymentMethod),
    onSuccess: () => {
      toast.success('구매가 완료되었습니다!');
      refetch();
    },
  });

  const downloadMutation = useMutation({
    mutationFn: () => filesApi.downloadFile(id!),
    onSuccess: (data) => {
      toast.success('다운로드 시작!');
      // Download file logic here
      window.open(data.data.downloadUrl, '_blank');
    },
  });

  const favoriteMutation = useMutation({
    mutationFn: () => filesApi.toggleFavorite(id!),
    onSuccess: () => {
      toast.success('찜하기가 업데이트되었습니다!');
      refetch();
    },
  });

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  const file = data?.data;

  if (!file) {
    return <div className="text-center py-8">파일을 찾을 수 없습니다.</div>;
  }

  const handlePurchase = (method: string) => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    purchaseMutation.mutate(method);
  };

  const handleDownload = () => {
    if (!isAuthenticated) {
      toast.error('로그인이 필요합니다.');
      return;
    }
    downloadMutation.mutate();
  };

  return (
    <div className="space-y-6">
      {/* File info card */}
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-2xl font-bold mb-4">{file.title}</h1>

        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="flex gap-2">
            <span className="text-gray-600">파일명:</span>
            <span>{file.fileName}</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-600">업로더:</span>
            <Link to={`/users/${file.uploader.id}`} className="text-blue-600 hover:underline">
              {file.uploader.displayName}
            </Link>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-600">크기/용량:</span>
            <span>{(Number(file.fileSize) / 1024 / 1024).toFixed(1)}MB</span>
          </div>
          <div className="flex gap-2">
            <span className="text-gray-600">다운로드:</span>
            <span>{file.downloadCount}회</span>
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex gap-3">
          <button
            onClick={handleDownload}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-3 rounded-lg flex items-center justify-center gap-2"
          >
            <Download className="w-5 h-5" />
            내려받기
          </button>

          {file.price > 0 && (
            <>
              <button
                onClick={() => handlePurchase('POINT')}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white py-3 rounded-lg"
              >
                포인트 사용
              </button>
              <button
                onClick={() => handlePurchase('COUPON')}
                className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-3 rounded-lg"
              >
                쿠폰 사용
              </button>
            </>
          )}

          <button
            onClick={() => favoriteMutation.mutate()}
            className="px-6 bg-gray-100 hover:bg-gray-200 rounded-lg"
          >
            <Heart className="w-5 h-5" />
          </button>
        </div>
      </div>

      {/* Description */}
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-bold">상세 설명</h2>
          <div className="flex gap-4 text-sm text-gray-600">
            <button className="text-red-600 hover:underline flex items-center gap-1">
              <Flag className="w-4 h-4" />
              신고
            </button>
            <button className="hover:underline">판매자 자료보기</button>
            <button className="hover:underline">댓글 ({file.comments?.length || 0})</button>
          </div>
        </div>

        <div className="prose max-w-none">
          {file.description || '설명이 없습니다.'}
        </div>
      </div>

      {/* Comments */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">댓글 ({file.comments?.length || 0})</h3>

        {isAuthenticated && (
          <div className="mb-6">
            <textarea
              value={comment}
              onChange={(e) => setComment(e.target.value)}
              placeholder="댓글을 입력하세요..."
              className="w-full px-4 py-2 border rounded-lg resize-none"
              rows={3}
            />
            <button className="mt-2 px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg">
              댓글 작성
            </button>
          </div>
        )}

        <div className="space-y-4">
          {file.comments?.map((comment: any) => (
            <div key={comment.id} className="border-b pb-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="font-semibold">{comment.user.displayName}</span>
                <span className="text-sm text-gray-500">
                  {new Date(comment.createdAt).toLocaleDateString()}
                </span>
              </div>
              <p className="text-gray-700">{comment.content}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recommended files */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="text-lg font-bold mb-4">추천 자료</h3>
        <div className="space-y-3">
          {/* Similar files would be listed here */}
        </div>
      </div>
    </div>
  );
}
