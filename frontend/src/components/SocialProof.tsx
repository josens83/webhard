import React, { useEffect, useState } from 'react';
import { Star, Users, Award, TrendingUp, CheckCircle, Quote } from 'lucide-react';

/**
 * Social Proof Components
 * Inspired by: Airbnb, Stripe, Netflix
 *
 * Types:
 * - User counts ("X students enrolled")
 * - Testimonials (Real user reviews)
 * - Ratings & Reviews
 * - Trust badges (Verified, Featured)
 * - Recent activity ("John just enrolled")
 * - Social proof notifications
 */

interface Testimonial {
  id: string;
  name: string;
  role: string;
  avatar?: string;
  rating: number;
  text: string;
  course?: string;
}

const SAMPLE_TESTIMONIALS: Testimonial[] = [
  {
    id: '1',
    name: 'Sarah Kim',
    role: 'Data Scientist at Google',
    rating: 5,
    text: 'The AI tutor is incredible! It helped me understand machine learning concepts I struggled with for months.',
    course: 'Advanced Machine Learning',
  },
  {
    id: '2',
    name: 'James Lee',
    role: 'Full Stack Developer',
    rating: 5,
    text: 'Best online learning platform I\'ve used. The courses are practical and the blockchain certificates are amazing.',
    course: 'Web Development Bootcamp',
  },
  {
    id: '3',
    name: 'Maria Garcia',
    role: 'UX Designer',
    rating: 5,
    text: 'Earned my certificate and got promoted at work. The quality of content is world-class.',
    course: 'UX Design Masterclass',
  },
];

// Statistics Component (Netflix-style)
export function PlatformStats() {
  const [stats, setStats] = useState({
    students: 0,
    courses: 0,
    certificates: 0,
    rating: 0,
  });

  useEffect(() => {
    // Animated counter effect
    const targets = {
      students: 45678,
      courses: 1234,
      certificates: 8923,
      rating: 4.9,
    };

    const duration = 2000; // 2 seconds
    const steps = 60;
    const interval = duration / steps;

    let current = 0;
    const timer = setInterval(() => {
      current++;
      const progress = current / steps;

      setStats({
        students: Math.floor(targets.students * progress),
        courses: Math.floor(targets.courses * progress),
        certificates: Math.floor(targets.certificates * progress),
        rating: parseFloat((targets.rating * progress).toFixed(1)),
      });

      if (current >= steps) {
        setStats(targets);
        clearInterval(timer);
      }
    }, interval);

    return () => clearInterval(timer);
  }, []);

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-6 py-12">
      <div className="text-center">
        <div className="flex items-center justify-center mb-3">
          <Users className="w-8 h-8 text-blue-600 dark:text-blue-400" />
        </div>
        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
          {stats.students.toLocaleString()}+
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Active Students</div>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center mb-3">
          <TrendingUp className="w-8 h-8 text-green-600 dark:text-green-400" />
        </div>
        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
          {stats.courses.toLocaleString()}+
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Expert Courses</div>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center mb-3">
          <Award className="w-8 h-8 text-purple-600 dark:text-purple-400" />
        </div>
        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
          {stats.certificates.toLocaleString()}+
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Certificates Issued</div>
      </div>

      <div className="text-center">
        <div className="flex items-center justify-center mb-3">
          <Star className="w-8 h-8 text-yellow-500 dark:text-yellow-400 fill-current" />
        </div>
        <div className="text-4xl font-bold text-gray-900 dark:text-white mb-1">
          {stats.rating}
        </div>
        <div className="text-sm text-gray-600 dark:text-gray-400">Average Rating</div>
      </div>
    </div>
  );
}

// Testimonials Carousel (Stripe-style)
export function TestimonialsCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % SAMPLE_TESTIMONIALS.length);
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const testimonial = SAMPLE_TESTIMONIALS[currentIndex];

  return (
    <div className="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-800 dark:to-gray-900 rounded-2xl p-8 md:p-12">
      <div className="max-w-3xl mx-auto">
        <Quote className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-6 opacity-50" />

        <div className="mb-6">
          <div className="flex items-center mb-4">
            {[...Array(5)].map((_, i) => (
              <Star
                key={i}
                className={`w-5 h-5 ${
                  i < testimonial.rating
                    ? 'text-yellow-400 fill-current'
                    : 'text-gray-300 dark:text-gray-600'
                }`}
              />
            ))}
          </div>

          <p className="text-xl md:text-2xl text-gray-900 dark:text-white font-medium mb-6">
            "{testimonial.text}"
          </p>

          <div className="flex items-center">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold text-lg">
              {testimonial.name[0]}
            </div>
            <div className="ml-4">
              <div className="font-semibold text-gray-900 dark:text-white">{testimonial.name}</div>
              <div className="text-sm text-gray-600 dark:text-gray-400">{testimonial.role}</div>
            </div>
          </div>
        </div>

        {/* Dots */}
        <div className="flex items-center justify-center space-x-2 mt-8">
          {SAMPLE_TESTIMONIALS.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentIndex(index)}
              className={`w-2 h-2 rounded-full transition-all ${
                index === currentIndex
                  ? 'bg-blue-600 dark:bg-blue-400 w-8'
                  : 'bg-gray-300 dark:bg-gray-600'
              }`}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// Trust Badges (Airbnb-style)
export function TrustBadges() {
  const badges = [
    { icon: CheckCircle, text: 'Verified Instructors', color: 'blue' },
    { icon: Award, text: 'Industry Certified', color: 'purple' },
    { icon: Star, text: '4.9/5 Average Rating', color: 'yellow' },
    { icon: Users, text: '45K+ Students', color: 'green' },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
      {badges.map((badge, index) => (
        <div
          key={index}
          className="flex items-center justify-center p-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700"
        >
          <badge.icon className={`w-5 h-5 mr-2 text-${badge.color}-600 dark:text-${badge.color}-400`} />
          <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
            {badge.text}
          </span>
        </div>
      ))}
    </div>
  );
}

// Live Activity Notification (Booking.com-style)
export function LiveActivityNotification() {
  const [visible, setVisible] = useState(false);
  const [activity, setActivity] = useState({
    name: '',
    action: '',
    course: '',
    time: '',
  });

  useEffect(() => {
    const activities = [
      { name: 'John D.', action: 'just enrolled in', course: 'Data Science Bootcamp', time: '2 min ago' },
      { name: 'Sarah K.', action: 'completed', course: 'Machine Learning Course', time: '5 min ago' },
      { name: 'Mike L.', action: 'earned a certificate in', course: 'Web Development', time: '10 min ago' },
      { name: 'Emma W.', action: 'started', course: 'Python for Beginners', time: '15 min ago' },
    ];

    let index = 0;

    const showActivity = () => {
      setActivity(activities[index % activities.length]);
      setVisible(true);

      setTimeout(() => {
        setVisible(false);
      }, 5000);

      index++;
    };

    // Show first notification after 3 seconds
    const initialTimer = setTimeout(showActivity, 3000);

    // Then show every 15 seconds
    const interval = setInterval(showActivity, 15000);

    return () => {
      clearTimeout(initialTimer);
      clearInterval(interval);
    };
  }, []);

  if (!visible) return null;

  return (
    <div className="fixed bottom-4 left-4 z-50 animate-slide-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-2xl border border-gray-200 dark:border-gray-700 p-4 max-w-sm">
        <div className="flex items-start">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center text-white font-bold flex-shrink-0">
            {activity.name[0]}
          </div>
          <div className="ml-3 flex-1">
            <p className="text-sm text-gray-900 dark:text-white">
              <span className="font-semibold">{activity.name}</span> {activity.action}{' '}
              <span className="font-semibold">{activity.course}</span>
            </p>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{activity.time}</p>
          </div>
          <button
            onClick={() => setVisible(false)}
            className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 ml-2"
          >
            ×
          </button>
        </div>
      </div>
    </div>
  );
}

// Company Logos (Social Proof)
export function CompanyLogos() {
  const companies = [
    'Google', 'Microsoft', 'Amazon', 'Facebook', 'Apple',
    'Netflix', 'Tesla', 'Samsung'
  ];

  return (
    <div className="py-12">
      <p className="text-center text-sm text-gray-600 dark:text-gray-400 mb-8">
        Trusted by employees from leading companies
      </p>
      <div className="grid grid-cols-4 md:grid-cols-8 gap-8 items-center opacity-60">
        {companies.map((company) => (
          <div
            key={company}
            className="text-center text-gray-500 dark:text-gray-400 font-semibold text-sm"
          >
            {company}
          </div>
        ))}
      </div>
    </div>
  );
}
