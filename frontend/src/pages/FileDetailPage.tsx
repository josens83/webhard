import { useQuery, useMutation } from '@tanstack/react-query';
import { useParams, Link } from 'react-router-dom';
import { filesApi } from '../api/files';
import { Download, Heart, Star, Flag, Eye, Play, Tag, Calendar, User, FileText, Info } from 'lucide-react';
import { useAuthStore } from '../store/authStore';
import toast from 'react-hot-toast';
import { useState } from 'react';
import FilePreview from '../components/FilePreview';

export default function FileDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { isAuthenticated, user } = useAuthStore();
  const [comment, setComment] = useState('');
  const [showPreview, setShowPreview] = useState(false);

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

  // Check if user can preview/download (purchased or owner or free)
  const canAccess = file.price === 0 ||
    file.uploaderId === user?.id ||
    file.purchased === true;

  const isPreviewable = ['image/', 'video/', 'audio/', 'application/pdf'].some(
    type => file.mimeType?.startsWith(type)
  );

  return (
    <div className="space-y-6">
      {/* File Preview Modal */}
      <FilePreview
        file={{
          id: file.id,
          title: file.title,
          fileName: file.fileName,
          mimeType: file.mimeType,
          fileSize: file.fileSize,
          previewUrl: canAccess ? `/api/files/${file.id}/preview` : undefined,
        }}
        isOpen={showPreview}
        onClose={() => setShowPreview(false)}
        onDownload={handleDownload}
        canDownload={canAccess}
      />

      {/* File info card */}
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-lg overflow-hidden">
        {/* Preview/Thumbnail Section */}
        <div className="relative bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-700 dark:to-gray-800 h-64 flex items-center justify-center">
          {file.thumbnailUrl ? (
            <img
              src={file.thumbnailUrl}
              alt={file.title}
              className="max-h-full max-w-full object-contain"
            />
          ) : (
            <div className="text-center">
              <FileText className="w-20 h-20 text-gray-400 dark:text-gray-500 mx-auto mb-2" />
              <span className="text-gray-500 dark:text-gray-400 text-sm">{file.fileExtension?.toUpperCase() || 'FILE'}</span>
            </div>
          )}

          {/* Preview button overlay */}
          {isPreviewable && (
            <button
              onClick={() => setShowPreview(true)}
              className="absolute inset-0 bg-black/0 hover:bg-black/30 transition-colors flex items-center justify-center group"
            >
              <div className="bg-white/90 dark:bg-gray-800/90 rounded-full p-4 opacity-0 group-hover:opacity-100 transition-opacity shadow-lg">
                <Play className="w-8 h-8 text-blue-600" />
              </div>
            </button>
          )}

          {/* Price badge */}
          <div className="absolute top-4 right-4">
            {file.price === 0 ? (
              <span className="px-4 py-2 bg-green-500 text-white font-bold rounded-lg shadow">
                무료
              </span>
            ) : (
              <span className="px-4 py-2 bg-blue-600 text-white font-bold rounded-lg shadow">
                {file.price.toLocaleString()}캐시
              </span>
            )}
          </div>
        </div>

        {/* File Info */}
        <div className="p-6">
          <div className="flex items-start justify-between mb-4">
            <div>
              <h1 className="text-2xl font-bold dark:text-white mb-2">{file.title}</h1>
              <div className="flex items-center gap-4 text-sm text-gray-500 dark:text-gray-400">
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {file.viewCount.toLocaleString()} 조회
                </span>
                <span className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  {file.downloadCount.toLocaleString()} 다운로드
                </span>
                <span className="flex items-center gap-1 text-yellow-500">
                  <Star className="w-4 h-4 fill-current" />
                  {(file.ratingAverage || 0).toFixed(1)} ({file.ratingCount || 0})
                </span>
                <span className="flex items-center gap-1 text-red-400">
                  <Heart className="w-4 h-4" />
                  {file.favoriteCount || 0}
                </span>
              </div>
            </div>
          </div>

          {/* File metadata grid */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">파일명</span>
              <span className="text-sm font-medium dark:text-white truncate block" title={file.fileName}>
                {file.fileName}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">용량</span>
              <span className="text-sm font-medium dark:text-white">
                {(Number(file.fileSize) / 1024 / 1024).toFixed(1)}MB
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">카테고리</span>
              <span className="text-sm font-medium dark:text-white">
                {file.category?.name || '-'}
              </span>
            </div>
            <div>
              <span className="text-xs text-gray-500 dark:text-gray-400 block mb-1">등록일</span>
              <span className="text-sm font-medium dark:text-white flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(file.createdAt).toLocaleDateString('ko-KR')}
              </span>
            </div>
          </div>

          {/* Uploader info */}
          <div className="flex items-center gap-3 mb-6 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
            <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold">
              {file.uploader?.avatar ? (
                <img src={file.uploader.avatar} alt="" className="w-full h-full rounded-full object-cover" />
              ) : (
                (file.uploader?.displayName || file.uploader?.username || 'U')[0].toUpperCase()
              )}
            </div>
            <div className="flex-1">
              <Link
                to={`/users/${file.uploader?.id}`}
                className="font-medium text-blue-600 hover:underline dark:text-blue-400"
              >
                {file.uploader?.displayName || file.uploader?.username}
              </Link>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {file.uploader?.isSeller && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400 rounded text-xs">
                    판매자
                  </span>
                )}
              </p>
            </div>
            <div className="flex gap-2">
              <button className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-white">
                자료 보기
              </button>
              <button className="px-4 py-2 text-sm border dark:border-gray-600 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 dark:text-white">
                쪽지
              </button>
            </div>
          </div>

          {/* Tags */}
          {file.tags && file.tags.length > 0 && (
            <div className="flex items-center gap-2 mb-6">
              <Tag className="w-4 h-4 text-gray-400" />
              <div className="flex flex-wrap gap-2">
                {file.tags.map((tagItem: any) => (
                  <Link
                    key={tagItem.tag?.id || tagItem.id}
                    to={`/search?tags=${tagItem.tag?.name || tagItem.name}`}
                    className="px-3 py-1 bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded-full text-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 hover:text-blue-600 dark:hover:text-blue-400 transition"
                  >
                    #{tagItem.tag?.name || tagItem.name}
                  </Link>
                ))}
              </div>
            </div>
          )}

          {/* Action buttons */}
          <div className="flex gap-3">
            {isPreviewable && (
              <button
                onClick={() => setShowPreview(true)}
                className="px-6 py-3 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-xl flex items-center justify-center gap-2 font-medium dark:text-white transition"
              >
                <Eye className="w-5 h-5" />
                미리보기
              </button>
            )}

            {file.price > 0 && !canAccess ? (
              <>
                <button
                  onClick={() => handlePurchase('CASH')}
                  className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-500/30 transition"
                >
                  <Download className="w-5 h-5" />
                  {file.price.toLocaleString()}캐시로 구매
                </button>
                <button
                  onClick={() => handlePurchase('POINT')}
                  className="px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-xl font-medium transition"
                >
                  포인트
                </button>
              </>
            ) : (
              <button
                onClick={handleDownload}
                disabled={downloadMutation.isPending}
                className="flex-1 bg-gradient-to-r from-blue-600 to-blue-700 hover:from-blue-700 hover:to-blue-800 text-white py-3 rounded-xl flex items-center justify-center gap-2 font-medium shadow-lg shadow-blue-500/30 transition disabled:opacity-50"
              >
                <Download className="w-5 h-5" />
                {downloadMutation.isPending ? '다운로드 중...' : '다운로드'}
              </button>
            )}

            <button
              onClick={() => favoriteMutation.mutate()}
              disabled={favoriteMutation.isPending}
              className={`px-6 py-3 rounded-xl flex items-center justify-center gap-2 transition ${
                file.isFavorited
                  ? 'bg-red-100 dark:bg-red-900/30 text-red-600'
                  : 'bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 dark:text-white'
              }`}
            >
              <Heart className={`w-5 h-5 ${file.isFavorited ? 'fill-current' : ''}`} />
            </button>
          </div>
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
