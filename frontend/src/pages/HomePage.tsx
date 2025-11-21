import { useQuery } from '@tanstack/react-query';
import { filesApi } from '../api/files';
import { Link } from 'react-router-dom';
import { Download, Eye, Star } from 'lucide-react';

export default function HomePage() {
  const { data: popularFiles } = useQuery({
    queryKey: ['files', { sortBy: 'popular', limit: 10 }],
    queryFn: () => filesApi.getFiles({ sortBy: 'popular', limit: 10 }),
  });

  const { data: latestFiles } = useQuery({
    queryKey: ['files', { sortBy: 'latest', limit: 10 }],
    queryFn: () => filesApi.getFiles({ sortBy: 'latest', limit: 10 }),
  });

  return (
    <div className="space-y-8">
      {/* Hero banner */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-8 text-white">
        <h2 className="text-3xl font-bold mb-2">WeDisk에 오신 것을 환영합니다</h2>
        <p className="text-lg">다양한 파일을 안전하고 빠르게 공유하세요</p>
      </div>

      {/* Popular files */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold">인기 파일</h3>
          <Link to="/files?sortBy=popular" className="text-blue-600 hover:underline">
            더보기 →
          </Link>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularFiles?.data?.files?.map((file: any) => (
            <Link
              key={file.id}
              to={`/files/${file.id}`}
              className="bg-white rounded-lg shadow hover:shadow-lg transition p-4"
            >
              <h4 className="font-semibold mb-2 line-clamp-2">{file.title}</h4>
              <div className="flex items-center gap-4 text-sm text-gray-600 mb-2">
                <span className="flex items-center gap-1">
                  <Download className="w-4 h-4" />
                  {file.downloadCount}
                </span>
                <span className="flex items-center gap-1">
                  <Eye className="w-4 h-4" />
                  {file.viewCount}
                </span>
                <span className="flex items-center gap-1">
                  <Star className="w-4 h-4" />
                  {file.ratingAverage.toFixed(1)}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-xs text-gray-500">{file.uploader.displayName}</span>
                <span className="text-sm font-semibold text-blue-600">
                  {file.price === 0 ? '무료' : `${file.price.toLocaleString()}원`}
                </span>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Latest files */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-2xl font-bold">최신 파일</h3>
          <Link to="/files?sortBy=latest" className="text-blue-600 hover:underline">
            더보기 →
          </Link>
        </div>

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
              {latestFiles?.data?.files?.map((file: any) => (
                <tr key={file.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3">
                    <Link to={`/files/${file.id}`} className="hover:text-blue-600">
                      {file.title}
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
      </section>
    </div>
  );
}
