import { useQuery } from '@tanstack/react-query';
import { useSearchParams, Link } from 'react-router-dom';
import { filesApi } from '../api/files';
import { Download, Eye, Star } from 'lucide-react';

export default function FilesPage() {
  const [searchParams, setSearchParams] = useSearchParams();

  const page = parseInt(searchParams.get('page') || '1');
  const category = searchParams.get('category') || undefined;
  const search = searchParams.get('search') || undefined;
  const sortBy = (searchParams.get('sortBy') as any) || 'latest';

  const { data, isLoading } = useQuery({
    queryKey: ['files', { page, category, search, sortBy }],
    queryFn: () => filesApi.getFiles({ page, category, search, sortBy }),
  });

  const handlePageChange = (newPage: number) => {
    setSearchParams({ ...Object.fromEntries(searchParams), page: newPage.toString() });
  };

  if (isLoading) {
    return <div className="text-center py-8">로딩 중...</div>;
  }

  const files = data?.data?.files || [];
  const pagination = data?.data?.pagination;

  return (
    <div className="space-y-4">
      {/* Filter bar */}
      <div className="bg-white rounded-lg shadow p-4 flex items-center justify-between">
        <div className="flex gap-4">
          <select
            value={sortBy}
            onChange={(e) => setSearchParams({ ...Object.fromEntries(searchParams), sortBy: e.target.value })}
            className="px-3 py-2 border rounded"
          >
            <option value="latest">최신순</option>
            <option value="popular">인기순</option>
            <option value="rating">평점순</option>
          </select>

          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">20</button>
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">50</button>
            <button className="px-3 py-1 text-sm border rounded hover:bg-gray-50">100</button>
          </div>
        </div>

        <p className="text-sm text-gray-600">
          전체 {pagination?.total.toLocaleString()}개
        </p>
      </div>

      {/* File list */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <table className="w-full">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-4 py-3 text-left text-sm font-semibold">제목</th>
              <th className="px-4 py-3 text-center text-sm font-semibold w-24">용량</th>
              <th className="px-4 py-3 text-center text-sm font-semibold w-24">가격</th>
              <th className="px-4 py-3 text-center text-sm font-semibold w-32">분류</th>
              <th className="px-4 py-3 text-center text-sm font-semibold w-32">아이디</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {files.map((file: any) => (
              <tr key={file.id} className="hover:bg-gray-50">
                <td className="px-4 py-3">
                  <Link to={`/files/${file.id}`} className="hover:text-blue-600 flex items-center gap-2">
                    {file.title}
                    <div className="flex gap-2 text-xs text-gray-500">
                      <span className="flex items-center gap-1">
                        <Download className="w-3 h-3" />
                        {file.downloadCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Eye className="w-3 h-3" />
                        {file.viewCount}
                      </span>
                      <span className="flex items-center gap-1">
                        <Star className="w-3 h-3" />
                        {file.ratingAverage.toFixed(1)}
                      </span>
                    </div>
                  </Link>
                </td>
                <td className="px-4 py-3 text-center text-sm">
                  {(Number(file.fileSize) / 1024 / 1024).toFixed(1)}MB
                </td>
                <td className="px-4 py-3 text-center text-sm font-medium">
                  {file.price === 0 ? '무료' : `${file.price}캐시`}
                </td>
                <td className="px-4 py-3 text-center text-sm">{file.category.name}</td>
                <td className="px-4 py-3 text-center text-sm">{file.uploader.username}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {pagination && (
        <div className="flex justify-center gap-2">
          {Array.from({ length: pagination.totalPages }, (_, i) => i + 1).map((p) => (
            <button
              key={p}
              onClick={() => handlePageChange(p)}
              className={`px-4 py-2 rounded ${
                p === page
                  ? 'bg-blue-600 text-white'
                  : 'bg-white hover:bg-gray-100'
              }`}
            >
              {p}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
