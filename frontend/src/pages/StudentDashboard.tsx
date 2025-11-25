import React from 'react';
import { BookOpen, Clock, Award, TrendingUp, Play, CheckCircle } from 'lucide-react';

const ENROLLED_COURSES = [
  {
    id: '1',
    title: 'Introduction to Data Science with Python',
    thumbnail: '',
    progress: 65,
    totalLessons: 24,
    completedLessons: 16,
    nextLesson: 'Data Visualization with Matplotlib',
    instructor: 'Dr. Sarah Kim',
  },
  {
    id: '2',
    title: 'Web Development Bootcamp 2024',
    thumbnail: '',
    progress: 32,
    totalLessons: 48,
    completedLessons: 15,
    nextLesson: 'React Components and Props',
    instructor: 'Alex Park',
  },
];

const RECENT_ACTIVITY = [
  {
    id: '1',
    type: 'completed',
    title: 'Completed: NumPy Arrays Basics',
    course: 'Data Science',
    time: '2 hours ago',
  },
  {
    id: '2',
    type: 'quiz',
    title: 'Quiz Passed: Python Fundamentals',
    course: 'Data Science',
    score: 92,
    time: '5 hours ago',
  },
  {
    id: '3',
    type: 'enrolled',
    title: 'Enrolled in Advanced Machine Learning',
    course: 'Machine Learning',
    time: '1 day ago',
  },
];

export default function StudentDashboard() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="container mx-auto px-4 py-8">
        {/* Welcome Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">Welcome back, Student!</h1>
          <p className="text-gray-600 dark:text-gray-400">Continue your learning journey</p>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-blue-100 dark:bg-blue-900 p-3 rounded-lg">
                <BookOpen className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Active</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">12</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Enrolled Courses</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-green-100 dark:bg-green-900 p-3 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600 dark:text-green-400" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Completed</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">5</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Courses Completed</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-purple-100 dark:bg-purple-900 p-3 rounded-lg">
                <Clock className="w-6 h-6 text-purple-600 dark:text-purple-400" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Total</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">127</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Learning Hours</p>
          </div>

          <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-orange-100 dark:bg-orange-900 p-3 rounded-lg">
                <Award className="w-6 h-6 text-orange-600 dark:text-orange-400" />
              </div>
              <span className="text-sm text-gray-500 dark:text-gray-400">Earned</span>
            </div>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-1">8</h3>
            <p className="text-sm text-gray-600 dark:text-gray-400">Certificates</p>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Continue Learning */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Continue Learning</h2>
              </div>
              <div className="p-6 space-y-4">
                {ENROLLED_COURSES.map((course) => (
                  <div
                    key={course.id}
                    className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex-1">
                        <h3 className="font-semibold text-gray-900 dark:text-white mb-1">{course.title}</h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400">by {course.instructor}</p>
                      </div>
                      <button className="ml-4 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-semibold transition-colors flex items-center">
                        <Play className="w-4 h-4 mr-1" />
                        Continue
                      </button>
                    </div>

                    {/* Progress Bar */}
                    <div className="mb-3">
                      <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
                        <span>
                          {course.completedLessons} of {course.totalLessons} lessons
                        </span>
                        <span>{course.progress}% complete</span>
                      </div>
                      <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600 transition-all"
                          style={{ width: `${course.progress}%` }}
                        />
                      </div>
                    </div>

                    {/* Next Lesson */}
                    <div className="text-sm text-gray-700 dark:text-gray-300">
                      <span className="font-semibold">Next:</span> {course.nextLesson}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Learning Streak */}
            <div className="bg-gradient-to-r from-orange-500 to-red-500 rounded-lg shadow p-6 text-white">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold mb-2">🔥 Learning Streak</h3>
                  <p className="text-3xl font-bold mb-1">7 Days</p>
                  <p className="text-sm opacity-90">Keep it up! You're doing great!</p>
                </div>
                <div className="text-right">
                  <TrendingUp className="w-16 h-16 opacity-50" />
                </div>
              </div>
            </div>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Recent Activity */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recent Activity</h2>
              </div>
              <div className="p-6 space-y-4">
                {RECENT_ACTIVITY.map((activity) => (
                  <div key={activity.id} className="flex items-start">
                    <div
                      className={`w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0 ${
                        activity.type === 'completed'
                          ? 'bg-green-100 dark:bg-green-900'
                          : activity.type === 'quiz'
                          ? 'bg-blue-100 dark:bg-blue-900'
                          : 'bg-purple-100 dark:bg-purple-900'
                      }`}
                    >
                      {activity.type === 'completed' ? (
                        <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
                      ) : activity.type === 'quiz' ? (
                        <Award className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      ) : (
                        <BookOpen className="w-5 h-5 text-purple-600 dark:text-purple-400" />
                      )}
                    </div>
                    <div className="ml-3 flex-1">
                      <p className="text-sm font-medium text-gray-900 dark:text-white">{activity.title}</p>
                      <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.course}</p>
                      {activity.score && (
                        <p className="text-xs text-green-600 dark:text-green-400 mt-1">Score: {activity.score}%</p>
                      )}
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">{activity.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Recommended Courses */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="p-6 border-b border-gray-200 dark:border-gray-700">
                <h2 className="text-xl font-bold text-gray-900 dark:text-white">Recommended for You</h2>
              </div>
              <div className="p-6 space-y-4">
                <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 transition-colors cursor-pointer">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    Advanced Machine Learning
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                    Take your ML skills to the next level
                  </p>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-gray-700 dark:text-gray-300 font-semibold">₩79,000</span>
                    <span className="text-blue-600 dark:text-blue-400 font-semibold">View Course →</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
