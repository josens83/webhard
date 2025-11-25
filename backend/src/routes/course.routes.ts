import { Router } from 'express';
import courseService from '../services/course.service';
import { authenticate } from '../middleware/auth.middleware';

const router = Router();

/**
 * @route   POST /api/courses
 * @desc    Create a new course
 * @access  Private (Teachers/Creators)
 */
router.post('/', authenticate, async (req, res) => {
  try {
    const course = await courseService.createCourse({
      ...req.body,
      creatorId: req.user.id,
    });

    res.status(201).json({
      success: true,
      data: course,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/courses
 * @desc    Search and filter courses
 * @access  Public
 */
router.get('/', async (req, res) => {
  try {
    const {
      query,
      educationType,
      categoryId,
      difficultyLevel,
      priceMin,
      priceMax,
      gradeLevel,
      subjectArea,
      page,
      limit,
    } = req.query;

    const result = await courseService.searchCourses({
      query: query as string,
      educationType: educationType as any,
      categoryId: categoryId as string,
      difficultyLevel: difficultyLevel as any,
      priceMin: priceMin ? Number(priceMin) : undefined,
      priceMax: priceMax ? Number(priceMax) : undefined,
      gradeLevel: gradeLevel as string,
      subjectArea: subjectArea as string,
      page: page ? Number(page) : 1,
      limit: limit ? Number(limit) : 20,
    });

    res.json({
      success: true,
      data: result.courses,
      pagination: result.pagination,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/courses/:id
 * @desc    Get course by ID
 * @access  Public
 */
router.get('/:id', async (req, res) => {
  try {
    const course = await courseService.getCourseById(req.params.id);

    if (!course) {
      return res.status(404).json({
        success: false,
        message: 'Course not found',
      });
    }

    res.json({
      success: true,
      data: course,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   PUT /api/courses/:id
 * @desc    Update course
 * @access  Private (Course creator/teacher)
 */
router.put('/:id', authenticate, async (req, res) => {
  try {
    const course = await courseService.updateCourse(req.params.id, req.body);

    res.json({
      success: true,
      data: course,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/courses/:id/publish
 * @desc    Publish course
 * @access  Private (Course creator/teacher)
 */
router.post('/:id/publish', authenticate, async (req, res) => {
  try {
    const course = await courseService.publishCourse(req.params.id);

    res.json({
      success: true,
      data: course,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   POST /api/courses/:id/enroll
 * @desc    Enroll in course
 * @access  Private
 */
router.post('/:id/enroll', authenticate, async (req, res) => {
  try {
    const enrollment = await courseService.enrollStudent(req.params.id, req.user.id);

    res.status(201).json({
      success: true,
      data: enrollment,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/courses/:id/stats
 * @desc    Get course statistics
 * @access  Private (Course creator/teacher/admin)
 */
router.get('/:id/stats', authenticate, async (req, res) => {
  try {
    const stats = await courseService.getCourseStats(req.params.id);

    res.json({
      success: true,
      data: stats,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   DELETE /api/courses/:id
 * @desc    Delete course
 * @access  Private (Course creator/admin)
 */
router.delete('/:id', authenticate, async (req, res) => {
  try {
    const course = await courseService.deleteCourse(req.params.id);

    res.json({
      success: true,
      data: course,
    });
  } catch (error: any) {
    res.status(400).json({
      success: false,
      message: error.message,
    });
  }
});

/**
 * @route   GET /api/courses/my/enrollments
 * @desc    Get user's enrollments
 * @access  Private
 */
router.get('/my/enrollments', authenticate, async (req, res) => {
  try {
    const enrollments = await courseService.getStudentEnrollments(req.user.id);

    res.json({
      success: true,
      data: enrollments,
    });
  } catch (error: any) {
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
});

export default router;
