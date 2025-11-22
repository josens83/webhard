import { Router } from 'express';
import aiLearningService from '../services/ai-learning.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/ai-learning/quiz/generate
 * @desc    Generate quiz questions using AI
 * @access  Private (Teachers/Creators)
 */
router.post('/quiz/generate', authenticate, async (req, res) => {
  try {
    const { topic, difficulty, questionCount, questionType } = req.body;

    const questions = await aiLearningService.generateQuiz({
      topic,
      difficulty,
      questionCount: questionCount || 5,
      questionType,
    });

    res.json({
      success: true,
      data: questions,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/ai-learning/tutoring
 * @desc    Get AI tutoring help
 * @access  Private
 */
router.post('/tutoring', authenticate, async (req, res) => {
  try {
    const { subject, question, context } = req.body;

    const result = await aiLearningService.provideTutoring({
      studentId: req.user.id,
      subject,
      question,
      context,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/ai-learning/learning-path
 * @desc    Generate personalized learning path
 * @access  Private
 */
router.post('/learning-path', authenticate, async (req, res) => {
  try {
    const { targetRole, currentLevel, interests, timeCommitment } = req.body;

    const result = await aiLearningService.generateLearningPath({
      userId: req.user.id,
      targetRole,
      currentLevel,
      interests,
      timeCommitment,
    });

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/ai-learning/content/analyze
 * @desc    Analyze educational content quality
 * @access  Private (Teachers/Creators)
 */
router.post('/content/analyze', authenticate, async (req, res) => {
  try {
    const { content, fileType } = req.body;

    const analysis = await aiLearningService.analyzeContent({
      content,
      fileType,
    });

    res.json({
      success: true,
      data: analysis,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/ai-learning/plagiarism/check
 * @desc    Check content for plagiarism
 * @access  Private (Teachers/Creators/Admin)
 */
router.post('/plagiarism/check', authenticate, async (req, res) => {
  try {
    const { content, title } = req.body;

    const result = await aiLearningService.checkPlagiarism(content, title);

    res.json({
      success: true,
      data: result,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/ai-learning/content/summarize
 * @desc    Generate content summary
 * @access  Private
 */
router.post('/content/summarize', authenticate, async (req, res) => {
  try {
    const { content, maxLength } = req.body;

    const summary = await aiLearningService.generateSummary(content, maxLength);

    res.json({
      success: true,
      data: { summary },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/ai-learning/content/translate
 * @desc    Translate educational content
 * @access  Private
 */
router.post('/content/translate', authenticate, async (req, res) => {
  try {
    const { content, targetLanguage } = req.body;

    const translation = await aiLearningService.translateContent(content, targetLanguage);

    res.json({
      success: true,
      data: { translation },
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
