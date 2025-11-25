import React, { useState } from 'react';
import { ChevronRight, BookOpen, Target, Clock, Sparkles, CheckCircle } from 'lucide-react';

/**
 * Personalized Onboarding Flow
 * Inspired by: Duolingo, Netflix, Spotify
 *
 * Goals:
 * - Capture user intent (Netflix: "What do you want to watch?")
 * - Provide immediate value (Duolingo: Interactive lesson on day 1)
 * - Progress visualization
 * - < 2 minutes to complete
 */

interface OnboardingStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
}

const ONBOARDING_STEPS: OnboardingStep[] = [
  {
    id: 'goal',
    title: 'What's your learning goal?',
    description: 'Help us personalize your experience',
    icon: <Target className="w-8 h-8" />,
  },
  {
    id: 'level',
    title: 'What's your current level?',
    description: 'We'll recommend the right courses',
    icon: <BookOpen className="w-8 h-8" />,
  },
  {
    id: 'time',
    title: 'How much time can you commit?',
    description: 'We'll create a realistic schedule',
    icon: <Clock className="w-8 h-8" />,
  },
  {
    id: 'interests',
    title: 'What interests you most?',
    description: 'Choose your favorite topics',
    icon: <Sparkles className="w-8 h-8" />,
  },
];

const LEARNING_GOALS = [
  { id: 'career', label: 'Advance my career', icon: '💼' },
  { id: 'certification', label: 'Get certified', icon: '🏆' },
  { id: 'hobby', label: 'Learn for fun', icon: '🎨' },
  { id: 'academic', label: 'Academic success', icon: '🎓' },
  { id: 'business', label: 'Start a business', icon: '🚀' },
];

const SKILL_LEVELS = [
  { id: 'beginner', label: 'Beginner', description: 'Just starting out', emoji: '🌱' },
  { id: 'intermediate', label: 'Intermediate', description: 'Some experience', emoji: '🌿' },
  { id: 'advanced', label: 'Advanced', description: 'Experienced learner', emoji: '🌳' },
];

const TIME_COMMITMENTS = [
  { id: '5min', label: '5-10 min/day', description: 'Casual learning', hours: 1 },
  { id: '30min', label: '30 min/day', description: 'Regular learner', hours: 3 },
  { id: '1hour', label: '1+ hour/day', description: 'Serious student', hours: 7 },
  { id: 'weekend', label: 'Weekends only', description: 'Weekend warrior', hours: 4 },
];

const INTERESTS = [
  { id: 'tech', label: 'Technology', icon: '💻' },
  { id: 'business', label: 'Business', icon: '💼' },
  { id: 'design', label: 'Design', icon: '🎨' },
  { id: 'data', label: 'Data Science', icon: '📊' },
  { id: 'languages', label: 'Languages', icon: '🌍' },
  { id: 'math', label: 'Mathematics', icon: '📐' },
  { id: 'science', label: 'Science', icon: '🔬' },
  { id: 'arts', label: 'Arts', icon: '🎭' },
];

export default function OnboardingFlow() {
  const [currentStep, setCurrentStep] = useState(0);
  const [selections, setSelections] = useState({
    goal: '',
    level: '',
    time: '',
    interests: [] as string[],
  });

  const progress = ((currentStep + 1) / ONBOARDING_STEPS.length) * 100;

  const handleNext = () => {
    if (currentStep < ONBOARDING_STEPS.length - 1) {
      setCurrentStep(currentStep + 1);

      // Track onboarding progress
      trackEvent('onboarding_step_completed', {
        step: ONBOARDING_STEPS[currentStep].id,
        stepNumber: currentStep + 1,
      });
    } else {
      completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const completeOnboarding = async () => {
    // Track completion
    trackEvent('onboarding_completed', {
      goal: selections.goal,
      level: selections.level,
      time: selections.time,
      interests: selections.interests,
    });

    // Save preferences
    await saveUserPreferences(selections);

    // Redirect to personalized dashboard
    window.location.href = '/dashboard';
  };

  const trackEvent = (event: string, properties: any) => {
    console.log('Analytics:', event, properties);
    // In production, send to analytics service
  };

  const saveUserPreferences = async (preferences: any) => {
    // In production, save to backend
    console.log('Saving preferences:', preferences);
  };

  const canProceed = () => {
    switch (ONBOARDING_STEPS[currentStep].id) {
      case 'goal':
        return selections.goal !== '';
      case 'level':
        return selections.level !== '';
      case 'time':
        return selections.time !== '';
      case 'interests':
        return selections.interests.length > 0;
      default:
        return true;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-purple-50 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-semibold text-gray-600 dark:text-gray-400">
              Step {currentStep + 1} of {ONBOARDING_STEPS.length}
            </span>
            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
              {Math.round(progress)}%
            </span>
          </div>
          <div className="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-gradient-to-r from-blue-500 to-purple-500 transition-all duration-500 ease-out"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>

        {/* Main Card */}
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl p-8 md:p-12">
          {/* Icon & Title */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-blue-100 dark:bg-blue-900 rounded-full mb-4 text-blue-600 dark:text-blue-400">
              {ONBOARDING_STEPS[currentStep].icon}
            </div>
            <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
              {ONBOARDING_STEPS[currentStep].title}
            </h2>
            <p className="text-gray-600 dark:text-gray-400">
              {ONBOARDING_STEPS[currentStep].description}
            </p>
          </div>

          {/* Step Content */}
          <div className="mb-8">
            {ONBOARDING_STEPS[currentStep].id === 'goal' && (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {LEARNING_GOALS.map((goal) => (
                  <button
                    key={goal.id}
                    onClick={() => setSelections({ ...selections, goal: goal.id })}
                    className={`p-6 rounded-xl border-2 transition-all text-left ${
                      selections.goal === goal.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="text-4xl mb-3">{goal.icon}</div>
                    <div className="font-semibold text-gray-900 dark:text-white">{goal.label}</div>
                  </button>
                ))}
              </div>
            )}

            {ONBOARDING_STEPS[currentStep].id === 'level' && (
              <div className="space-y-4">
                {SKILL_LEVELS.map((level) => (
                  <button
                    key={level.id}
                    onClick={() => setSelections({ ...selections, level: level.id })}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left flex items-center ${
                      selections.level === level.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="text-4xl mr-4">{level.emoji}</div>
                    <div>
                      <div className="font-semibold text-gray-900 dark:text-white mb-1">{level.label}</div>
                      <div className="text-sm text-gray-600 dark:text-gray-400">{level.description}</div>
                    </div>
                    {selections.level === level.id && (
                      <CheckCircle className="ml-auto w-6 h-6 text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {ONBOARDING_STEPS[currentStep].id === 'time' && (
              <div className="space-y-4">
                {TIME_COMMITMENTS.map((time) => (
                  <button
                    key={time.id}
                    onClick={() => setSelections({ ...selections, time: time.id })}
                    className={`w-full p-6 rounded-xl border-2 transition-all text-left ${
                      selections.time === time.id
                        ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                        : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-semibold text-gray-900 dark:text-white mb-1">{time.label}</div>
                        <div className="text-sm text-gray-600 dark:text-gray-400">{time.description}</div>
                      </div>
                      <div className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                        ~{time.hours}h/week
                      </div>
                    </div>
                    {selections.time === time.id && (
                      <CheckCircle className="mt-2 w-5 h-5 text-blue-500" />
                    )}
                  </button>
                ))}
              </div>
            )}

            {ONBOARDING_STEPS[currentStep].id === 'interests' && (
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">Select all that apply</p>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {INTERESTS.map((interest) => {
                    const isSelected = selections.interests.includes(interest.id);
                    return (
                      <button
                        key={interest.id}
                        onClick={() => {
                          const newInterests = isSelected
                            ? selections.interests.filter((i) => i !== interest.id)
                            : [...selections.interests, interest.id];
                          setSelections({ ...selections, interests: newInterests });
                        }}
                        className={`p-4 rounded-xl border-2 transition-all ${
                          isSelected
                            ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20'
                            : 'border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-700'
                        }`}
                      >
                        <div className="text-3xl mb-2">{interest.icon}</div>
                        <div className="text-sm font-semibold text-gray-900 dark:text-white">
                          {interest.label}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>

          {/* Navigation */}
          <div className="flex items-center justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={handleBack}
              disabled={currentStep === 0}
              className="px-6 py-3 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Back
            </button>

            <button
              onClick={handleNext}
              disabled={!canProceed()}
              className="px-8 py-3 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-lg font-semibold hover:from-blue-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center"
            >
              {currentStep === ONBOARDING_STEPS.length - 1 ? 'Get Started' : 'Continue'}
              <ChevronRight className="ml-2 w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Skip Option */}
        <div className="text-center mt-4">
          <button
            onClick={() => (window.location.href = '/dashboard')}
            className="text-sm text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
          >
            Skip for now
          </button>
        </div>
      </div>
    </div>
  );
}
