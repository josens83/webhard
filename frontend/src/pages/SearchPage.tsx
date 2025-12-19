import { useState, useEffect, useCallback } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import {
  Search, Filter, X, Download, Eye, Star, Heart,
  ChevronDown, ChevronUp, SlidersHorizontal, Tag, Clock
} from 'lucide-react';
import { filesApi } from '../api/files';
import debounce from 'lodash/debounce';

interface SearchFilters {
  q: string;
  category: string;
  minPrice: string;
  maxPrice: string;
  priceType: string;
  fileType: string;
  sortBy: string;
  tags: string[];
  dateRange: string;
}

const CATEGORIES = [
  { id: '', name: '전체' },
  { id: 'movie', name: '영화' },
  { id: 'drama', name: '드라마' },
  { id: 'video', name: '동영상' },
  { id: 'game', name: '게임' },
  { id: 'anime', name: '애니' },
  { id: 'book', name: '도서' },
  { id: 'education', name: '교육' },
  { id: 'etc', name: '기타' },
];

const SORT_OPTIONS = [
  { value: 'relevance', label: '관련순' },
  { value: 'latest', label: '최신순' },
  { value: 'popular', label: '인기순' },
  { value: 'rating', label: '평점순' },
  { value: 'price_low', label: '가격 낮은순' },
  { value: 'price_high', label: '가격 높은순' },
];

const DATE_RANGES = [
  { value: '', label: '전체 기간' },
  { value: 'today', label: '오늘' },
  { value: 'week', label: '최근 1주' },
  { value: 'month', label: '최근 1개월' },
  { value: '3months', label: '최근 3개월' },
  { value: 'year', label: '최근 1년' },
];

const FILE_TYPES = [
  { value: '', label: '전체' },
  { value: 'video', label: '동영상' },
  { value: 'audio', label: '오디오' },
  { value: 'document', label: '문서' },
  { value: 'image', label: '이미지' },
  { value: 'archive', label: '압축파일' },
];

export default function SearchPage() {
  const [searchParams, setSearchParams] = useSearchParams();
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);

  const [filters, setFilters] = useState<SearchFilters>({
    q: searchParams.get('q') || searchParams.get('search') || '',
    category: searchParams.get('category') || '',
    minPrice: searchParams.get('minPrice') || '',
    maxPrice: searchParams.get('maxPrice') || '',
    priceType: searchParams.get('priceType') || '',
    fileType: searchParams.get('fileType') || '',
    sortBy: searchParams.get('sortBy') || 'relevance',
    tags: searchParams.get('tags')?.split(',').filter(Boolean) || [],
    dateRange: searchParams.get('dateRange') || '',
  });

  const [tagInput, setTagInput] = useState('');
  const page = parseInt(searchParams.get('page') || '1');

  // Build query params for API
  const buildQueryParams = useCallback(() => {
    const params: any = { page };
    if (filters.q) params.q = filters.q;
    if (filters.category) params.category = filters.category;
    if (filters.minPrice) params.minPrice = parseInt(filters.minPrice);
    if (filters.maxPrice) params.maxPrice = parseInt(filters.maxPrice);
    if (filters.priceType) params.priceType = filters.priceType;
    if (filters.fileType) params.fileType = filters.fileType;
    if (filters.sortBy) params.sortBy = filters.sortBy;
    if (filters.tags.length > 0) params.tags = filters.tags;
    if (filters.dateRange) params.dateRange = filters.dateRange;
    return params;
  }, [filters, page]);

  // Search query
  const { data, isLoading, refetch } = useQuery({
    queryKey: ['search', buildQueryParams()],
    queryFn: () => filesApi.searchFiles(buildQueryParams()),
    enabled: true,
  });

  // Auto-suggest debounced
  const fetchSuggestions = useCallback(
    debounce(async (query: string) => {
      if (query.length < 2) {
        setSuggestions([]);
        return;
      }
      try {
        const res = await filesApi.getSuggestions(query);
        setSuggestions(res.data?.map((s: any) => s.title) || []);
      } catch {
        setSuggestions([]);
      }
    }, 300),
    []
  );

  useEffect(() => {
    if (filters.q) {
      fetchSuggestions(filters.q);
    }
  }, [filters.q, fetchSuggestions]);

  // Update URL when filters change
  const applyFilters = () => {
    const params = new URLSearchParams();
    if (filters.q) params.set('q', filters.q);
    if (filters.category) params.set('category', filters.category);
    if (filters.minPrice) params.set('minPrice', filters.minPrice);
    if (filters.maxPrice) params.set('maxPrice', filters.maxPrice);
    if (filters.priceType) params.set('priceType', filters.priceType);
    if (filters.fileType) params.set('fileType', filters.fileType);
    if (filters.sortBy && filters.sortBy !== 'relevance') params.set('sortBy', filters.sortBy);
    if (filters.tags.length > 0) params.set('tags', filters.tags.join(','));
    if (filters.dateRange) params.set('dateRange', filters.dateRange);
    setSearchParams(params);
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setShowSuggestions(false);
    applyFilters();
  };

  const handleFilterChange = (key: keyof SearchFilters, value: any) => {
    setFilters(prev => ({ ...prev, [key]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !filters.tags.includes(tagInput.trim())) {
      setFilters(prev => ({ ...prev, tags: [...prev.tags, tagInput.trim()] }));
      setTagInput('');
    }
  };

  const removeTag = (tag: string) => {
    setFilters(prev => ({ ...prev, tags: prev.tags.filter(t => t !== tag) }));
  };

  const clearFilters = () => {
    setFilters({
      q: '',
      category: '',
      minPrice: '',
      maxPrice: '',
      priceType: '',
      fileType: '',
      sortBy: 'relevance',
      tags: [],
      dateRange: '',
    });
    setSearchParams(new URLSearchParams());
  };

  const handlePageChange = (newPage: number) => {
    const params = new URLSearchParams(searchParams);
    params.set('page', newPage.toString());
    setSearchParams(params);
  };

  const files = data?.data?.files || [];
  const pagination = data?.data?.pagination || { total: 0, totalPages: 0 };

  const activeFiltersCount = [
    filters.category,
    filters.minPrice,
    filters.maxPrice,
    filters.priceType,
    filters.fileType,
    filters.dateRange,
    filters.tags.length > 0,
  ].filter(Boolean).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-6">
        {/* Search Header */}
        <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm p-6 mb-6">
          <form onSubmit={handleSearch} className="relative">
            <div className="flex gap-3">
              <div className="relative flex-1">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                <input
                  type="text"
                  value={filters.q}
                  onChange={(e) => {
                    handleFilterChange('q', e.target.value);
                    setShowSuggestions(true);
                  }}
                  onFocus={() => setShowSuggestions(true)}
                  onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                  placeholder="검색어를 입력하세요..."
                  className="w-full pl-12 pr-4 py-3 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent dark:text-white text-lg"
                />
                {/* Suggestions dropdown */}
                {showSuggestions && suggestions.length > 0 && (
                  <div className="absolute top-full left-0 right-0 bg-white dark:bg-gray-800 border dark:border-gray-700 rounded-lg shadow-lg mt-1 z-50 overflow-hidden">
                    {suggestions.map((suggestion, idx) => (
                      <button
                        key={idx}
                        type="button"
                        onClick={() => {
                          handleFilterChange('q', suggestion);
                          setShowSuggestions(false);
                        }}
                        className="w-full text-left px-4 py-2 hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white"
                      >
                        {suggestion}
                      </button>
                    ))}
                  </div>
                )}
              </div>

              <button
                type="button"
                onClick={() => setShowAdvanced(!showAdvanced)}
                className={`flex items-center gap-2 px-4 py-3 border rounded-xl transition ${
                  showAdvanced || activeFiltersCount > 0
                    ? 'bg-blue-50 border-blue-300 text-blue-600'
                    : 'border-gray-200 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-700'
                }`}
              >
                <SlidersHorizontal className="w-5 h-5" />
                <span className="hidden sm:inline">고급검색</span>
                {activeFiltersCount > 0 && (
                  <span className="bg-blue-500 text-white text-xs px-2 py-0.5 rounded-full">
                    {activeFiltersCount}
                  </span>
                )}
                {showAdvanced ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
              </button>

              <button
                type="submit"
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-xl transition flex items-center gap-2"
              >
                <Search className="w-5 h-5" />
                <span className="hidden sm:inline">검색</span>
              </button>
            </div>
          </form>

          {/* Advanced Filters */}
          {showAdvanced && (
            <div className="mt-6 pt-6 border-t dark:border-gray-700">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                {/* Category */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    카테고리
                  </label>
                  <select
                    value={filters.category}
                    onChange={(e) => handleFilterChange('category', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat.id} value={cat.id}>{cat.name}</option>
                    ))}
                  </select>
                </div>

                {/* Price Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    가격 유형
                  </label>
                  <select
                    value={filters.priceType}
                    onChange={(e) => handleFilterChange('priceType', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    <option value="">전체</option>
                    <option value="FREE">무료</option>
                    <option value="PAID">유료</option>
                  </select>
                </div>

                {/* Price Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    가격 범위
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      type="number"
                      placeholder="최소"
                      value={filters.minPrice}
                      onChange={(e) => handleFilterChange('minPrice', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                    <span className="text-gray-400">~</span>
                    <input
                      type="number"
                      placeholder="최대"
                      value={filters.maxPrice}
                      onChange={(e) => handleFilterChange('maxPrice', e.target.value)}
                      className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                    />
                  </div>
                </div>

                {/* File Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    파일 유형
                  </label>
                  <select
                    value={filters.fileType}
                    onChange={(e) => handleFilterChange('fileType', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    {FILE_TYPES.map(type => (
                      <option key={type.value} value={type.value}>{type.label}</option>
                    ))}
                  </select>
                </div>

                {/* Date Range */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    등록일
                  </label>
                  <select
                    value={filters.dateRange}
                    onChange={(e) => handleFilterChange('dateRange', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    {DATE_RANGES.map(range => (
                      <option key={range.value} value={range.value}>{range.label}</option>
                    ))}
                  </select>
                </div>

                {/* Sort By */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    정렬
                  </label>
                  <select
                    value={filters.sortBy}
                    onChange={(e) => handleFilterChange('sortBy', e.target.value)}
                    className="w-full px-3 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                  >
                    {SORT_OPTIONS.map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label}</option>
                    ))}
                  </select>
                </div>

                {/* Tags */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    태그
                  </label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Tag className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                      <input
                        type="text"
                        placeholder="태그 추가"
                        value={tagInput}
                        onChange={(e) => setTagInput(e.target.value)}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter') {
                            e.preventDefault();
                            addTag();
                          }
                        }}
                        className="w-full pl-9 pr-4 py-2 bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 dark:text-white"
                      />
                    </div>
                    <button
                      type="button"
                      onClick={addTag}
                      className="px-4 py-2 bg-gray-200 dark:bg-gray-600 text-gray-700 dark:text-white rounded-lg hover:bg-gray-300 dark:hover:bg-gray-500 transition"
                    >
                      추가
                    </button>
                  </div>
                  {/* Tags display */}
                  {filters.tags.length > 0 && (
                    <div className="flex flex-wrap gap-2 mt-2">
                      {filters.tags.map(tag => (
                        <span
                          key={tag}
                          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 dark:bg-blue-900 text-blue-700 dark:text-blue-300 rounded-full text-sm"
                        >
                          #{tag}
                          <button
                            type="button"
                            onClick={() => removeTag(tag)}
                            className="hover:text-red-500"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Filter actions */}
              <div className="flex justify-between items-center mt-4 pt-4 border-t dark:border-gray-700">
                <button
                  type="button"
                  onClick={clearFilters}
                  className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 text-sm"
                >
                  필터 초기화
                </button>
                <button
                  type="button"
                  onClick={applyFilters}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition text-sm font-medium"
                >
                  필터 적용
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Results Header */}
        <div className="flex justify-between items-center mb-4">
          <p className="text-gray-600 dark:text-gray-400">
            {filters.q && (
              <>
                <span className="font-medium text-gray-900 dark:text-white">"{filters.q}"</span> 검색결과{' '}
              </>
            )}
            총 <span className="font-bold text-blue-600">{pagination.total.toLocaleString()}</span>개
          </p>
          <div className="flex gap-2">
            <button className="px-3 py-1 text-sm border dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white">
              목록형
            </button>
            <button className="px-3 py-1 text-sm border dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 dark:text-white">
              카드형
            </button>
          </div>
        </div>

        {/* Results */}
        {isLoading ? (
          <div className="text-center py-12">
            <div className="animate-spin w-8 h-8 border-2 border-blue-600 border-t-transparent rounded-full mx-auto mb-4"></div>
            <p className="text-gray-500 dark:text-gray-400">검색 중...</p>
          </div>
        ) : files.length === 0 ? (
          <div className="text-center py-12 bg-white dark:bg-gray-800 rounded-xl">
            <Search className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 mb-2">검색 결과가 없습니다</p>
            <p className="text-sm text-gray-400 dark:text-gray-500">
              다른 검색어나 필터를 사용해 보세요
            </p>
          </div>
        ) : (
          <div className="bg-white dark:bg-gray-800 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th className="px-4 py-3 text-left text-sm font-semibold text-gray-700 dark:text-gray-300">제목</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">용량</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 w-24">가격</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 w-32">분류</th>
                  <th className="px-4 py-3 text-center text-sm font-semibold text-gray-700 dark:text-gray-300 w-32">등록일</th>
                </tr>
              </thead>
              <tbody className="divide-y dark:divide-gray-700">
                {files.map((file: any) => (
                  <tr key={file.id} className="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td className="px-4 py-3">
                      <Link to={`/files/${file.id}`} className="hover:text-blue-600 dark:text-white">
                        <div className="flex items-center gap-3">
                          <span className="font-medium">{file.title}</span>
                          <div className="flex gap-2 text-xs text-gray-500 dark:text-gray-400">
                            <span className="flex items-center gap-1">
                              <Download className="w-3 h-3" />
                              {file.downloadCount}
                            </span>
                            <span className="flex items-center gap-1">
                              <Eye className="w-3 h-3" />
                              {file.viewCount}
                            </span>
                            <span className="flex items-center gap-1 text-yellow-500">
                              <Star className="w-3 h-3 fill-current" />
                              {(file.ratingAverage || 0).toFixed(1)}
                            </span>
                            {file.favoriteCount > 0 && (
                              <span className="flex items-center gap-1 text-red-400">
                                <Heart className="w-3 h-3" />
                                {file.favoriteCount}
                              </span>
                            )}
                          </div>
                        </div>
                        {file.tags && file.tags.length > 0 && (
                          <div className="flex gap-1 mt-1">
                            {file.tags.slice(0, 3).map((tag: any) => (
                              <span
                                key={tag.id || tag.name}
                                className="text-xs px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 rounded"
                              >
                                #{tag.name || tag}
                              </span>
                            ))}
                          </div>
                        )}
                      </Link>
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                      {(Number(file.fileSize) / 1024 / 1024).toFixed(1)}MB
                    </td>
                    <td className="px-4 py-3 text-center text-sm font-medium">
                      {file.price === 0 ? (
                        <span className="text-green-600">무료</span>
                      ) : (
                        <span className="text-blue-600">{file.price.toLocaleString()}캐시</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-600 dark:text-gray-400">
                      {file.category?.name || '-'}
                    </td>
                    <td className="px-4 py-3 text-center text-sm text-gray-500 dark:text-gray-400">
                      <div className="flex items-center justify-center gap-1">
                        <Clock className="w-3 h-3" />
                        {new Date(file.createdAt).toLocaleDateString('ko-KR')}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {/* Pagination */}
        {pagination.totalPages > 1 && (
          <div className="flex justify-center gap-2 mt-6">
            <button
              onClick={() => handlePageChange(Math.max(1, page - 1))}
              disabled={page === 1}
              className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white"
            >
              이전
            </button>
            {Array.from({ length: Math.min(10, pagination.totalPages) }, (_, i) => {
              const pageNum = Math.max(1, Math.min(page - 5, pagination.totalPages - 9)) + i;
              if (pageNum > pagination.totalPages) return null;
              return (
                <button
                  key={pageNum}
                  onClick={() => handlePageChange(pageNum)}
                  className={`px-4 py-2 rounded-lg transition ${
                    pageNum === page
                      ? 'bg-blue-600 text-white'
                      : 'bg-white dark:bg-gray-800 border dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-white'
                  }`}
                >
                  {pageNum}
                </button>
              );
            })}
            <button
              onClick={() => handlePageChange(Math.min(pagination.totalPages, page + 1))}
              disabled={page === pagination.totalPages}
              className="px-4 py-2 border dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed dark:text-white"
            >
              다음
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
