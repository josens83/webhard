import React from 'react';
import { BookOpen, Users, Award, TrendingUp, Clock, Star } from 'lucide-react';

interface CourseCardProps {
  course: {
    id: string;
    title: string;
    description?: string;
    thumbnail?: string;
    price: number;
    difficultyLevel?: string;
    enrollmentCount?: number;
    rating?: number;
    estimatedHours?: number;
    creator?: {
      displayName?: string;
      username: string;
      avatar?: string;
    };
    category?: {
      name: string;
    };
  };
  onEnroll?: () => void;
}

export default function CourseCard({ course, onEnroll }: CourseCardProps) {
  const difficultyColors = {
    BEGINNER: 'bg-green-100 text-green-800',
    ELEMENTARY: 'bg-blue-100 text-blue-800',
    INTERMEDIATE: 'bg-yellow-100 text-yellow-800',
    ADVANCED: 'bg-orange-100 text-orange-800',
    EXPERT: 'bg-red-100 text-red-800',
  };

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-xl transition-shadow duration-300 cursor-pointer">
      {/* Thumbnail */}
      <div className="relative h-48 bg-gradient-to-br from-blue-500 to-purple-600">
        {course.thumbnail ? (
          <img
            src={course.thumbnail}
            alt={course.title}
            className="w-full h-full object-cover"
          />
        ) : (
          <div className="flex items-center justify-center h-full">
            <BookOpen className="w-16 h-16 text-white opacity-50" />
          </div>
        )}
        {course.difficultyLevel && (
          <span
            className={`absolute top-3 right-3 px-3 py-1 rounded-full text-xs font-semibold ${
              difficultyColors[course.difficultyLevel as keyof typeof difficultyColors] || 'bg-gray-100 text-gray-800'
            }`}
          >
            {course.difficultyLevel}
          </span>
        )}
      </div>

      {/* Content */}
      <div className="p-5">
        {/* Category */}
        {course.category && (
          <p className="text-xs text-blue-600 dark:text-blue-400 font-semibold mb-2 uppercase tracking-wide">
            {course.category.name}
          </p>
        )}

        {/* Title */}
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-2 line-clamp-2">
          {course.title}
        </h3>

        {/* Description */}
        {course.description && (
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
            {course.description}
          </p>
        )}

        {/* Creator */}
        <div className="flex items-center mb-4">
          <div className="w-8 h-8 rounded-full bg-gray-300 dark:bg-gray-600 flex items-center justify-center overflow-hidden">
            {course.creator?.avatar ? (
              <img src={course.creator.avatar} alt={course.creator.username} className="w-full h-full object-cover" />
            ) : (
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">
                {(course.creator?.displayName || course.creator?.username || 'U')[0].toUpperCase()}
              </span>
            )}
          </div>
          <span className="ml-2 text-sm text-gray-700 dark:text-gray-300">
            {course.creator?.displayName || course.creator?.username}
          </span>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-between text-sm text-gray-600 dark:text-gray-400 mb-4">
          <div className="flex items-center space-x-4">
            {course.enrollmentCount !== undefined && (
              <div className="flex items-center">
                <Users className="w-4 h-4 mr-1" />
                <span>{course.enrollmentCount.toLocaleString()}</span>
              </div>
            )}
            {course.rating !== undefined && (
              <div className="flex items-center">
                <Star className="w-4 h-4 mr-1 fill-yellow-400 text-yellow-400" />
                <span>{course.rating.toFixed(1)}</span>
              </div>
            )}
            {course.estimatedHours !== undefined && (
              <div className="flex items-center">
                <Clock className="w-4 h-4 mr-1" />
                <span>{course.estimatedHours}h</span>
              </div>
            )}
          </div>
        </div>

        {/* Price and CTA */}
        <div className="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
          <div>
            {course.price === 0 ? (
              <span className="text-lg font-bold text-green-600 dark:text-green-400">FREE</span>
            ) : (
              <span className="text-lg font-bold text-gray-900 dark:text-white">
                ₩{course.price.toLocaleString()}
              </span>
            )}
          </div>
          <button
            onClick={onEnroll}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-sm transition-colors"
          >
            Enroll Now
          </button>
        </div>
      </div>
    </div>
  );
}
