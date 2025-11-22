import React, { useState } from 'react';
import { Play, Pause, SkipForward, SkipBack, Volume2, Maximize, Check } from 'lucide-react';

interface Lesson {
  id: string;
  title: string;
  duration?: number;
  videoUrl?: string;
  content?: string;
  isCompleted?: boolean;
}

interface LessonPlayerProps {
  lesson: Lesson;
  onComplete?: () => void;
  onNext?: () => void;
  onPrevious?: () => void;
}

export default function LessonPlayer({ lesson, onComplete, onNext, onPrevious }: LessonPlayerProps) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(lesson.duration || 0);

  const handlePlayPause = () => {
    setIsPlaying(!isPlaying);
  };

  const handleMarkComplete = () => {
    onComplete?.();
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg overflow-hidden">
      {/* Video Player */}
      <div className="relative bg-black aspect-video">
        {lesson.videoUrl ? (
          <div className="w-full h-full flex items-center justify-center">
            {/* Video would be rendered here with react-player or video element */}
            <div className="text-white">
              <Play className="w-20 h-20 opacity-50" />
            </div>
          </div>
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-blue-500 to-purple-600">
            <div className="text-center text-white p-8">
              <h3 className="text-2xl font-bold mb-2">{lesson.title}</h3>
              <p className="text-sm opacity-80">No video available for this lesson</p>
            </div>
          </div>
        )}

        {/* Video Controls Overlay */}
        {lesson.videoUrl && (
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
            {/* Progress Bar */}
            <div className="mb-3">
              <div className="w-full h-1 bg-gray-600 rounded-full overflow-hidden">
                <div
                  className="h-full bg-blue-500 transition-all"
                  style={{ width: `${(currentTime / duration) * 100}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-white mt-1">
                <span>{formatTime(currentTime)}</span>
                <span>{formatTime(duration)}</span>
              </div>
            </div>

            {/* Control Buttons */}
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <button
                  onClick={onPrevious}
                  className="text-white hover:text-blue-400 transition-colors"
                  disabled={!onPrevious}
                >
                  <SkipBack className="w-6 h-6" />
                </button>
                <button
                  onClick={handlePlayPause}
                  className="bg-blue-600 hover:bg-blue-700 text-white rounded-full p-3 transition-colors"
                >
                  {isPlaying ? <Pause className="w-6 h-6" /> : <Play className="w-6 h-6" />}
                </button>
                <button
                  onClick={onNext}
                  className="text-white hover:text-blue-400 transition-colors"
                  disabled={!onNext}
                >
                  <SkipForward className="w-6 h-6" />
                </button>
              </div>

              <div className="flex items-center space-x-3">
                <button className="text-white hover:text-blue-400 transition-colors">
                  <Volume2 className="w-5 h-5" />
                </button>
                <button className="text-white hover:text-blue-400 transition-colors">
                  <Maximize className="w-5 h-5" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Lesson Content */}
      <div className="p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{lesson.title}</h2>
          {lesson.isCompleted && (
            <div className="flex items-center text-green-600 dark:text-green-400">
              <Check className="w-5 h-5 mr-1" />
              <span className="text-sm font-semibold">Completed</span>
            </div>
          )}
        </div>

        {lesson.content && (
          <div className="prose dark:prose-invert max-w-none mb-6">
            <p className="text-gray-700 dark:text-gray-300">{lesson.content}</p>
          </div>
        )}

        {/* Actions */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div className="flex space-x-3">
            {onPrevious && (
              <button
                onClick={onPrevious}
                className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              >
                Previous Lesson
              </button>
            )}
          </div>

          <div className="flex space-x-3">
            {!lesson.isCompleted && (
              <button
                onClick={handleMarkComplete}
                className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors flex items-center"
              >
                <Check className="w-4 h-4 mr-2" />
                Mark Complete
              </button>
            )}
            {onNext && (
              <button
                onClick={onNext}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
              >
                Next Lesson
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
