import { PrismaClient, CourseStatus, DifficultyLevel, EducationType } from '@prisma/client';

const prisma = new PrismaClient();

interface CreateCourseDTO {
  title: string;
  slug: string;
  description?: string;
  objectives?: string[];
  prerequisites?: string[];
  difficultyLevel?: DifficultyLevel;
  estimatedHours?: number;
  categoryId: string;
  educationType: EducationType;
  gradeLevel?: string[];
  subjectArea?: string;
  curriculumStandard?: string;
  learningStandards?: string[];
  thumbnail?: string;
  previewVideo?: string;
  price?: number;
  creatorId: string;
  teacherId?: string;
  institutionId?: string;
}

interface UpdateCourseDTO {
  title?: string;
  description?: string;
  objectives?: string[];
  prerequisites?: string[];
  difficultyLevel?: DifficultyLevel;
  estimatedHours?: number;
  categoryId?: string;
  gradeLevel?: string[];
  subjectArea?: string;
  thumbnail?: string;
  previewVideo?: string;
  price?: number;
  teacherId?: string;
  status?: CourseStatus;
  isPublished?: boolean;
}

class CourseService {
  /**
   * Create a new course
   */
  async createCourse(data: CreateCourseDTO) {
    const course = await prisma.course.create({
      data: {
        title: data.title,
        slug: data.slug,
        description: data.description,
        objectives: data.objectives || [],
        prerequisites: data.prerequisites || [],
        difficultyLevel: data.difficultyLevel || 'BEGINNER',
        estimatedHours: data.estimatedHours,
        categoryId: data.categoryId,
        educationType: data.educationType,
        gradeLevel: data.gradeLevel || [],
        subjectArea: data.subjectArea,
        curriculumStandard: data.curriculumStandard,
        learningStandards: data.learningStandards || [],
        thumbnail: data.thumbnail,
        previewVideo: data.previewVideo,
        price: data.price || 0,
        creatorId: data.creatorId,
        teacherId: data.teacherId,
        institutionId: data.institutionId,
      },
      include: {
        creator: {
          select: {
            id: true,
            username: true,
            displayName: true,
            avatar: true,
          },
        },
        category: true,
      },
    });

    return course;
  }

  /**
   * Get course by ID
   */
  async getCourseById(courseId: string, includeDetails = true) {
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      include: includeDetails
        ? {
            creator: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                bio: true,
                expertise: true,
              },
            },
            teacher: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
                bio: true,
                qualifications: true,
              },
            },
            category: true,
            institution: true,
            lessons: {
              orderBy: { order: 'asc' },
              include: {
                quiz: true,
              },
            },
            _count: {
              select: {
                enrollments: true,
                lessons: true,
              },
            },
          }
        : undefined,
    });

    return course;
  }

  /**
   * Update course
   */
  async updateCourse(courseId: string, data: UpdateCourseDTO) {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        ...data,
        updatedAt: new Date(),
      },
      include: {
        creator: true,
        category: true,
        teacher: true,
      },
    });

    return course;
  }

  /**
   * Publish course
   */
  async publishCourse(courseId: string) {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'PUBLISHED',
        isPublished: true,
        publishedAt: new Date(),
      },
    });

    return course;
  }

  /**
   * Search courses
   */
  async searchCourses(params: {
    query?: string;
    educationType?: EducationType;
    categoryId?: string;
    difficultyLevel?: DifficultyLevel;
    priceMin?: number;
    priceMax?: number;
    gradeLevel?: string;
    subjectArea?: string;
    page?: number;
    limit?: number;
  }) {
    const {
      query,
      educationType,
      categoryId,
      difficultyLevel,
      priceMin,
      priceMax,
      gradeLevel,
      subjectArea,
      page = 1,
      limit = 20,
    } = params;

    const where: any = {
      status: 'PUBLISHED',
      isPublished: true,
    };

    if (query) {
      where.OR = [
        { title: { contains: query, mode: 'insensitive' } },
        { description: { contains: query, mode: 'insensitive' } },
      ];
    }

    if (educationType) {
      where.educationType = educationType;
    }

    if (categoryId) {
      where.categoryId = categoryId;
    }

    if (difficultyLevel) {
      where.difficultyLevel = difficultyLevel;
    }

    if (priceMin !== undefined || priceMax !== undefined) {
      where.price = {};
      if (priceMin !== undefined) where.price.gte = priceMin;
      if (priceMax !== undefined) where.price.lte = priceMax;
    }

    if (gradeLevel) {
      where.gradeLevel = { has: gradeLevel };
    }

    if (subjectArea) {
      where.subjectArea = subjectArea;
    }

    const [courses, total] = await Promise.all([
      prisma.course.findMany({
        where,
        skip: (page - 1) * limit,
        take: limit,
        include: {
          creator: {
            select: {
              id: true,
              username: true,
              displayName: true,
              avatar: true,
            },
          },
          category: true,
          _count: {
            select: {
              enrollments: true,
              lessons: true,
            },
          },
        },
        orderBy: [
          { enrollmentCount: 'desc' },
          { rating: 'desc' },
          { createdAt: 'desc' },
        ],
      }),
      prisma.course.count({ where }),
    ]);

    return {
      courses,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Enroll student in course
   */
  async enrollStudent(courseId: string, studentId: string) {
    // Check if already enrolled
    const existing = await prisma.enrollment.findUnique({
      where: {
        studentId_courseId: {
          studentId,
          courseId,
        },
      },
    });

    if (existing) {
      throw new Error('Already enrolled in this course');
    }

    // Get course price
    const course = await prisma.course.findUnique({
      where: { id: courseId },
      select: { price: true, priceType: true },
    });

    if (!course) {
      throw new Error('Course not found');
    }

    // Create enrollment
    const enrollment = await prisma.enrollment.create({
      data: {
        studentId,
        courseId,
        purchasePrice: course.price,
        purchaseType: course.priceType,
        enrolledAt: new Date(),
      },
      include: {
        course: {
          include: {
            creator: true,
            lessons: {
              orderBy: { order: 'asc' },
            },
          },
        },
      },
    });

    // Update course enrollment count
    await prisma.course.update({
      where: { id: courseId },
      data: {
        enrollmentCount: {
          increment: 1,
        },
      },
    });

    return enrollment;
  }

  /**
   * Get student enrollments
   */
  async getStudentEnrollments(studentId: string) {
    const enrollments = await prisma.enrollment.findMany({
      where: { studentId },
      include: {
        course: {
          include: {
            creator: {
              select: {
                id: true,
                username: true,
                displayName: true,
                avatar: true,
              },
            },
            category: true,
            _count: {
              select: {
                lessons: true,
              },
            },
          },
        },
      },
      orderBy: { enrolledAt: 'desc' },
    });

    return enrollments;
  }

  /**
   * Update enrollment progress
   */
  async updateEnrollmentProgress(enrollmentId: string, progress: number) {
    const enrollment = await prisma.enrollment.update({
      where: { id: enrollmentId },
      data: {
        progress,
        updatedAt: new Date(),
      },
    });

    // If 100% completed, mark as completed
    if (progress >= 100) {
      await prisma.enrollment.update({
        where: { id: enrollmentId },
        data: {
          status: 'COMPLETED',
          completedAt: new Date(),
        },
      });
    }

    return enrollment;
  }

  /**
   * Get course statistics
   */
  async getCourseStats(courseId: string) {
    const [enrollments, avgProgress, completions] = await Promise.all([
      prisma.enrollment.count({
        where: { courseId },
      }),
      prisma.enrollment.aggregate({
        where: { courseId },
        _avg: {
          progress: true,
        },
      }),
      prisma.enrollment.count({
        where: {
          courseId,
          status: 'COMPLETED',
        },
      }),
    ]);

    const completionRate = enrollments > 0 ? (completions / enrollments) * 100 : 0;

    return {
      totalEnrollments: enrollments,
      averageProgress: avgProgress._avg.progress || 0,
      completions,
      completionRate,
    };
  }

  /**
   * Delete course
   */
  async deleteCourse(courseId: string) {
    const course = await prisma.course.update({
      where: { id: courseId },
      data: {
        status: 'DELETED',
        isPublished: false,
      },
    });

    return course;
  }
}

export default new CourseService();
