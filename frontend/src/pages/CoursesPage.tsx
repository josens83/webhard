import React, { useState } from 'react';
import { Search, Filter, BookOpen, TrendingUp, Award, Clock } from 'lucide-react';
import CourseCard from '../components/CourseCard';

const SAMPLE_COURSES = [
  {
    id: '1',
    title: 'Introduction to Data Science with Python',
    description: 'Learn the fundamentals of data science using Python, pandas, and machine learning libraries.',
    thumbnail: '',
    price: 49000,
    difficultyLevel: 'BEGINNER',
    enrollmentCount: 1245,
    rating: 4.8,
    estimatedHours: 40,
    creator: {
      username: 'dr_kim',
      displayName: 'Dr. Sarah Kim',
      avatar: '',
    },
    category: {
      name: 'Data Science',
    },
  },
  {
    id: '2',
    title: 'Advanced Calculus for Engineering',
    description: 'Master calculus concepts essential for engineering applications.',
    thumbnail: '',
    price: 0,
    difficultyLevel: 'ADVANCED',
    enrollmentCount: 892,
    rating: 4.9,
    estimatedHours: 60,
    creator: {
      username: 'prof_lee',
      displayName: 'Prof. James Lee',
      avatar: '',
    },
    category: {
      name: 'Mathematics',
    },
  },
  {
    id: '3',
    title: 'Web Development Bootcamp 2024',
    description: 'Complete web development course from HTML/CSS to React and Node.js',
    thumbnail: '',
    price: 89000,
    difficultyLevel: 'INTERMEDIATE',
    enrollmentCount: 3456,
    rating: 4.7,
    estimatedHours: 120,
    creator: {
      username: 'dev_park',
      displayName: 'Alex Park',
      avatar: '',
    },
    category: {
      name: 'Web Development',
    },
  },
];

export default function CoursesPage() {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('all');
  const [selectedDifficulty, setSelectedDifficulty] = useState('all');
  const [selectedPrice, setSelectedPrice] = useState('all');

  const categories = [
    'All Categories',
    'Data Science',
    'Mathematics',
    'Web Development',
    'Computer Science',
    'Business',
    'Languages',
  ];

  const difficulties = ['All Levels', 'Beginner', 'Elementary', 'Intermediate', 'Advanced', 'Expert'];

  const priceFilters = ['All Prices', 'Free', 'Paid', 'Under ₩50,000', 'Under ₩100,000'];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 to-purple-600 text-white py-16">
        <div className="container mx-auto px-4">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">Explore Courses</h1>
          <p className="text-xl mb-8 opacity-90">
            Discover world-class educational content from expert educators
          </p>

          {/* Search Bar */}
          <div className="max-w-3xl">
            <div className="relative">
              <input
                type="text"
                placeholder="Search courses, topics, or instructors..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full px-6 py-4 pr-12 rounded-lg text-gray-900 dark:text-white bg-white dark:bg-gray-800 focus:outline-none focus:ring-2 focus:ring-blue-500"
              />
              <Search className="absolute right-4 top-1/2 transform -translate-y-1/2 text-gray-400 w-6 h-6" />
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8">
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center mb-2">
                <BookOpen className="w-5 h-5 mr-2" />
                <span className="font-semibold">1,234</span>
              </div>
              <p className="text-sm opacity-80">Courses</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center mb-2">
                <TrendingUp className="w-5 h-5 mr-2" />
                <span className="font-semibold">45,678</span>
              </div>
              <p className="text-sm opacity-80">Students</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Award className="w-5 h-5 mr-2" />
                <span className="font-semibold">892</span>
              </div>
              <p className="text-sm opacity-80">Instructors</p>
            </div>
            <div className="bg-white/10 backdrop-blur-sm rounded-lg p-4">
              <div className="flex items-center mb-2">
                <Clock className="w-5 h-5 mr-2" />
                <span className="font-semibold">50,000+</span>
              </div>
              <p className="text-sm opacity-80">Learning Hours</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Filters Sidebar */}
          <aside className="lg:w-64 flex-shrink-0">
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6 sticky top-4">
              <div className="flex items-center mb-4">
                <Filter className="w-5 h-5 mr-2 text-blue-600" />
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">Filters</h2>
              </div>

              {/* Category Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Category</h3>
                <select
                  value={selectedCategory}
                  onChange={(e) => setSelectedCategory(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {categories.map((cat) => (
                    <option key={cat} value={cat.toLowerCase()}>
                      {cat}
                    </option>
                  ))}
                </select>
              </div>

              {/* Difficulty Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Difficulty</h3>
                <select
                  value={selectedDifficulty}
                  onChange={(e) => setSelectedDifficulty(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {difficulties.map((diff) => (
                    <option key={diff} value={diff.toLowerCase()}>
                      {diff}
                    </option>
                  ))}
                </select>
              </div>

              {/* Price Filter */}
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">Price</h3>
                <select
                  value={selectedPrice}
                  onChange={(e) => setSelectedPrice(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {priceFilters.map((price) => (
                    <option key={price} value={price.toLowerCase()}>
                      {price}
                    </option>
                  ))}
                </select>
              </div>

              {/* Reset Filters */}
              <button className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Reset Filters
              </button>
            </div>
          </aside>

          {/* Courses Grid */}
          <main className="flex-1">
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
                {SAMPLE_COURSES.length} Courses Found
              </h2>
              <select className="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option>Most Popular</option>
                <option>Highest Rated</option>
                <option>Newest First</option>
                <option>Price: Low to High</option>
                <option>Price: High to Low</option>
              </select>
            </div>

            {/* Course Cards Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
              {SAMPLE_COURSES.map((course) => (
                <CourseCard
                  key={course.id}
                  course={course}
                  onEnroll={() => console.log('Enroll in', course.title)}
                />
              ))}
            </div>

            {/* Pagination */}
            <div className="mt-8 flex items-center justify-center space-x-2">
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
              </button>
              <button className="px-4 py-2 bg-blue-600 text-white rounded-lg font-semibold">1</button>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                2
              </button>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                3
              </button>
              <button className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Next
              </button>
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
