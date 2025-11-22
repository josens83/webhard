import React, { useState } from 'react';
import { Clock, CheckCircle, XCircle, Award } from 'lucide-react';

interface Question {
  id: string;
  questionText: string;
  questionType: 'MULTIPLE_CHOICE' | 'TRUE_FALSE';
  answers: {
    id: string;
    answerText: string;
    isCorrect: boolean;
  }[];
}

interface QuizProps {
  quiz: {
    id: string;
    title: string;
    description?: string;
    passingScore: number;
    timeLimit?: number;
    questions: Question[];
  };
  onSubmit?: (score: number, answers: Record<string, string>) => void;
}

export default function Quiz({ quiz, onSubmit }: QuizProps) {
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [score, setScore] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(quiz.timeLimit ? quiz.timeLimit * 60 : null);

  const question = quiz.questions[currentQuestion];
  const progress = ((currentQuestion + 1) / quiz.questions.length) * 100;

  const handleSelectAnswer = (answerId: string) => {
    if (!isSubmitted) {
      setSelectedAnswers({
        ...selectedAnswers,
        [question.id]: answerId,
      });
    }
  };

  const handleNext = () => {
    if (currentQuestion < quiz.questions.length - 1) {
      setCurrentQuestion(currentQuestion + 1);
    }
  };

  const handlePrevious = () => {
    if (currentQuestion > 0) {
      setCurrentQuestion(currentQuestion - 1);
    }
  };

  const handleSubmit = () => {
    // Calculate score
    let correct = 0;
    quiz.questions.forEach((q) => {
      const selectedAnswer = selectedAnswers[q.id];
      const correctAnswer = q.answers.find((a) => a.isCorrect);
      if (selectedAnswer === correctAnswer?.id) {
        correct++;
      }
    });

    const finalScore = (correct / quiz.questions.length) * 100;
    setScore(finalScore);
    setIsSubmitted(true);
    onSubmit?.(finalScore, selectedAnswers);
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  if (isSubmitted) {
    const passed = score >= quiz.passingScore;

    return (
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg p-8 text-center">
        <div className="mb-6">
          {passed ? (
            <div className="inline-flex items-center justify-center w-20 h-20 bg-green-100 dark:bg-green-900 rounded-full mb-4">
              <Award className="w-12 h-12 text-green-600 dark:text-green-400" />
            </div>
          ) : (
            <div className="inline-flex items-center justify-center w-20 h-20 bg-red-100 dark:bg-red-900 rounded-full mb-4">
              <XCircle className="w-12 h-12 text-red-600 dark:text-red-400" />
            </div>
          )}
        </div>

        <h2 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          {passed ? 'Congratulations!' : 'Keep Trying!'}
        </h2>
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          {passed
            ? `You passed the quiz with a score of ${score.toFixed(1)}%`
            : `You scored ${score.toFixed(1)}%. You need ${quiz.passingScore}% to pass.`}
        </p>

        <div className="bg-gray-100 dark:bg-gray-700 rounded-lg p-6 mb-6">
          <div className="grid grid-cols-3 gap-4 text-center">
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Questions</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.questions.length}</p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Correct</p>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {Math.round((score / 100) * quiz.questions.length)}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Score</p>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{score.toFixed(1)}%</p>
            </div>
          </div>
        </div>

        <button
          onClick={() => window.location.reload()}
          className="px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors"
        >
          {passed ? 'Continue to Next Lesson' : 'Retry Quiz'}
        </button>
      </div>
    );
  }

  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg">
      {/* Header */}
      <div className="p-6 border-b border-gray-200 dark:border-gray-700">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold text-gray-900 dark:text-white">{quiz.title}</h2>
          {timeRemaining !== null && (
            <div className="flex items-center text-orange-600 dark:text-orange-400">
              <Clock className="w-5 h-5 mr-2" />
              <span className="font-semibold">{formatTime(timeRemaining)}</span>
            </div>
          )}
        </div>

        {/* Progress Bar */}
        <div>
          <div className="flex justify-between text-sm text-gray-600 dark:text-gray-400 mb-2">
            <span>Question {currentQuestion + 1} of {quiz.questions.length}</span>
            <span>{progress.toFixed(0)}% Complete</span>
          </div>
          <div className="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
            <div
              className="h-full bg-blue-600 transition-all duration-300"
              style={{ width: `${progress}%` }}
            />
          </div>
        </div>
      </div>

      {/* Question */}
      <div className="p-6">
        <h3 className="text-xl font-semibold text-gray-900 dark:text-white mb-6">
          {question.questionText}
        </h3>

        {/* Answer Options */}
        <div className="space-y-3">
          {question.answers.map((answer, index) => {
            const isSelected = selectedAnswers[question.id] === answer.id;
            return (
              <button
                key={answer.id}
                onClick={() => handleSelectAnswer(answer.id)}
                className={`w-full p-4 text-left rounded-lg border-2 transition-all ${
                  isSelected
                    ? 'border-blue-600 bg-blue-50 dark:bg-blue-900/20'
                    : 'border-gray-200 dark:border-gray-700 hover:border-blue-400 dark:hover:border-blue-600'
                }`}
              >
                <div className="flex items-center">
                  <div
                    className={`w-6 h-6 rounded-full border-2 flex items-center justify-center mr-3 ${
                      isSelected
                        ? 'border-blue-600 bg-blue-600'
                        : 'border-gray-400 dark:border-gray-600'
                    }`}
                  >
                    {isSelected && <div className="w-3 h-3 bg-white rounded-full" />}
                  </div>
                  <span className="text-gray-900 dark:text-white font-medium">
                    {String.fromCharCode(65 + index)}. {answer.answerText}
                  </span>
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* Navigation */}
      <div className="p-6 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
        <button
          onClick={handlePrevious}
          disabled={currentQuestion === 0}
          className="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous
        </button>

        <div className="text-sm text-gray-600 dark:text-gray-400">
          {Object.keys(selectedAnswers).length} of {quiz.questions.length} answered
        </div>

        {currentQuestion < quiz.questions.length - 1 ? (
          <button
            onClick={handleNext}
            disabled={!selectedAnswers[question.id]}
            className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Next
          </button>
        ) : (
          <button
            onClick={handleSubmit}
            disabled={Object.keys(selectedAnswers).length !== quiz.questions.length}
            className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-semibold transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Submit Quiz
          </button>
        )}
      </div>
    </div>
  );
}
