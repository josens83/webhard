import { useState, useEffect } from 'react';
import {
  X, Download, ZoomIn, ZoomOut, RotateCw, Maximize2,
  ChevronLeft, ChevronRight, Play, Pause, Volume2, VolumeX,
  FileText, Image as ImageIcon, Film, Music, Archive, File
} from 'lucide-react';

interface FilePreviewProps {
  file: {
    id: string;
    title: string;
    fileName: string;
    mimeType: string;
    fileSize: number | string;
    storagePath?: string;
    previewUrl?: string;
    thumbnailUrl?: string;
  };
  isOpen: boolean;
  onClose: () => void;
  onDownload?: () => void;
  canDownload?: boolean;
}

type PreviewType = 'image' | 'video' | 'audio' | 'pdf' | 'document' | 'archive' | 'unknown';

const getPreviewType = (mimeType: string): PreviewType => {
  if (mimeType.startsWith('image/')) return 'image';
  if (mimeType.startsWith('video/')) return 'video';
  if (mimeType.startsWith('audio/')) return 'audio';
  if (mimeType === 'application/pdf') return 'pdf';
  if (
    mimeType.includes('document') ||
    mimeType.includes('word') ||
    mimeType.includes('excel') ||
    mimeType.includes('powerpoint') ||
    mimeType === 'text/plain'
  ) return 'document';
  if (
    mimeType.includes('zip') ||
    mimeType.includes('rar') ||
    mimeType.includes('7z') ||
    mimeType.includes('tar')
  ) return 'archive';
  return 'unknown';
};

const getFileIcon = (previewType: PreviewType) => {
  switch (previewType) {
    case 'image': return ImageIcon;
    case 'video': return Film;
    case 'audio': return Music;
    case 'pdf':
    case 'document': return FileText;
    case 'archive': return Archive;
    default: return File;
  }
};

const formatFileSize = (size: number | string) => {
  const bytes = Number(size);
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
};

export default function FilePreview({
  file,
  isOpen,
  onClose,
  onDownload,
  canDownload = false
}: FilePreviewProps) {
  const [zoom, setZoom] = useState(1);
  const [rotation, setRotation] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);

  const previewType = getPreviewType(file.mimeType);
  const FileIcon = getFileIcon(previewType);

  // Sample preview URL - in production, this would come from backend
  const previewUrl = file.previewUrl || `/api/files/${file.id}/preview`;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (!isOpen) return;
      if (e.key === 'Escape') onClose();
      if (e.key === '+' || e.key === '=') setZoom(z => Math.min(z + 0.25, 3));
      if (e.key === '-') setZoom(z => Math.max(z - 0.25, 0.5));
      if (e.key === 'r') setRotation(r => (r + 90) % 360);
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const handleZoomIn = () => setZoom(z => Math.min(z + 0.25, 3));
  const handleZoomOut = () => setZoom(z => Math.max(z - 0.25, 0.5));
  const handleRotate = () => setRotation(r => (r + 90) % 360);
  const handleReset = () => {
    setZoom(1);
    setRotation(0);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderPreview = () => {
    switch (previewType) {
      case 'image':
        return (
          <div className="relative flex items-center justify-center h-full overflow-auto">
            <img
              src={previewUrl}
              alt={file.title}
              className="max-w-none transition-transform duration-200"
              style={{
                transform: `scale(${zoom}) rotate(${rotation}deg)`,
              }}
              onError={(e) => {
                (e.target as HTMLImageElement).src = '/placeholder-image.png';
              }}
            />
          </div>
        );

      case 'video':
        return (
          <div className="relative flex flex-col items-center justify-center h-full">
            <video
              src={previewUrl}
              className="max-h-[70vh] max-w-full"
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={(e) => setProgress((e.target as HTMLVideoElement).currentTime)}
              onLoadedMetadata={(e) => setDuration((e.target as HTMLVideoElement).duration)}
            >
              <source src={previewUrl} type={file.mimeType} />
              동영상을 재생할 수 없습니다.
            </video>
          </div>
        );

      case 'audio':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8">
            <div className="w-64 h-64 bg-gradient-to-br from-purple-500 to-pink-500 rounded-2xl flex items-center justify-center mb-8 shadow-xl">
              <Music className="w-24 h-24 text-white" />
            </div>
            <h3 className="text-xl font-bold text-white mb-4">{file.title}</h3>
            <audio
              src={previewUrl}
              className="w-full max-w-md"
              controls
              onPlay={() => setIsPlaying(true)}
              onPause={() => setIsPlaying(false)}
              onTimeUpdate={(e) => setProgress((e.target as HTMLAudioElement).currentTime)}
              onLoadedMetadata={(e) => setDuration((e.target as HTMLAudioElement).duration)}
            >
              <source src={previewUrl} type={file.mimeType} />
              오디오를 재생할 수 없습니다.
            </audio>
          </div>
        );

      case 'pdf':
        return (
          <div className="h-full w-full bg-gray-100">
            <iframe
              src={`${previewUrl}#toolbar=0`}
              className="w-full h-full border-0"
              title={file.title}
            />
          </div>
        );

      case 'document':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-32 h-32 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
              <FileText className="w-16 h-16 text-blue-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{file.title}</h3>
            <p className="text-gray-400 mb-4">{file.fileName}</p>
            <p className="text-sm text-gray-500 mb-6">
              문서 파일은 미리보기를 지원하지 않습니다.
            </p>
            {canDownload && (
              <button
                onClick={onDownload}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                다운로드하여 보기
              </button>
            )}
          </div>
        );

      case 'archive':
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-32 h-32 bg-yellow-100 rounded-2xl flex items-center justify-center mb-6">
              <Archive className="w-16 h-16 text-yellow-600" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{file.title}</h3>
            <p className="text-gray-400 mb-4">{file.fileName}</p>
            <p className="text-sm text-gray-500 mb-2">
              압축 파일 ({formatFileSize(file.fileSize)})
            </p>
            <p className="text-sm text-gray-500 mb-6">
              압축 파일은 미리보기를 지원하지 않습니다.
            </p>
            {canDownload && (
              <button
                onClick={onDownload}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                다운로드
              </button>
            )}
          </div>
        );

      default:
        return (
          <div className="flex flex-col items-center justify-center h-full p-8 text-center">
            <div className="w-32 h-32 bg-gray-700 rounded-2xl flex items-center justify-center mb-6">
              <File className="w-16 h-16 text-gray-400" />
            </div>
            <h3 className="text-xl font-bold text-white mb-2">{file.title}</h3>
            <p className="text-gray-400 mb-4">{file.fileName}</p>
            <p className="text-sm text-gray-500 mb-6">
              이 파일 형식은 미리보기를 지원하지 않습니다.
            </p>
            {canDownload && (
              <button
                onClick={onDownload}
                className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition flex items-center gap-2"
              >
                <Download className="w-5 h-5" />
                다운로드
              </button>
            )}
          </div>
        );
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 bg-black/95 flex flex-col"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-black/50 border-b border-gray-800">
        <div className="flex items-center gap-3">
          <FileIcon className="w-5 h-5 text-gray-400" />
          <div>
            <h2 className="text-white font-medium">{file.title}</h2>
            <p className="text-xs text-gray-500">{file.fileName} • {formatFileSize(file.fileSize)}</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* Zoom controls for images */}
          {previewType === 'image' && (
            <>
              <button
                onClick={handleZoomOut}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
                title="축소 (-)"
              >
                <ZoomOut className="w-5 h-5 text-gray-400" />
              </button>
              <span className="text-gray-400 text-sm w-16 text-center">
                {Math.round(zoom * 100)}%
              </span>
              <button
                onClick={handleZoomIn}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
                title="확대 (+)"
              >
                <ZoomIn className="w-5 h-5 text-gray-400" />
              </button>
              <div className="w-px h-6 bg-gray-700 mx-2" />
              <button
                onClick={handleRotate}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
                title="회전 (R)"
              >
                <RotateCw className="w-5 h-5 text-gray-400" />
              </button>
              <button
                onClick={handleReset}
                className="p-2 hover:bg-gray-800 rounded-lg transition"
                title="초기화"
              >
                <Maximize2 className="w-5 h-5 text-gray-400" />
              </button>
              <div className="w-px h-6 bg-gray-700 mx-2" />
            </>
          )}

          {/* Download button */}
          {canDownload && (
            <button
              onClick={onDownload}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition"
            >
              <Download className="w-4 h-4" />
              다운로드
            </button>
          )}

          {/* Close button */}
          <button
            onClick={onClose}
            className="p-2 hover:bg-gray-800 rounded-lg transition ml-2"
            title="닫기 (ESC)"
          >
            <X className="w-5 h-5 text-gray-400" />
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-hidden">
        {renderPreview()}
      </div>

      {/* Footer with keyboard shortcuts */}
      <div className="px-4 py-2 bg-black/50 border-t border-gray-800">
        <div className="flex items-center justify-center gap-6 text-xs text-gray-500">
          <span>ESC 닫기</span>
          {previewType === 'image' && (
            <>
              <span>+/- 확대/축소</span>
              <span>R 회전</span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
