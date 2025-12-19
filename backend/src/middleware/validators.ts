import { body, param, query, validationResult } from 'express-validator';
import { Request, Response, NextFunction } from 'express';

// Validation result handler middleware
export const validate = (req: Request, res: Response, next: NextFunction) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({
      success: false,
      message: '입력값이 올바르지 않습니다.',
      errors: errors.array().map(err => ({
        field: (err as any).path || (err as any).param,
        message: err.msg,
      })),
    });
  }
  next();
};

// ==================== Auth Validators ====================

export const registerValidation = [
  body('email')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요.')
    .normalizeEmail()
    .isLength({ max: 255 })
    .withMessage('이메일은 255자 이하여야 합니다.'),
  body('password')
    .isLength({ min: 8, max: 100 })
    .withMessage('비밀번호는 8자 이상 100자 이하여야 합니다.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.'),
  body('username')
    .isLength({ min: 2, max: 50 })
    .withMessage('사용자명은 2자 이상 50자 이하여야 합니다.')
    .matches(/^[a-zA-Z0-9가-힣_]+$/)
    .withMessage('사용자명은 영문, 한글, 숫자, 밑줄만 사용 가능합니다.')
    .trim()
    .escape(),
  validate,
];

export const loginValidation = [
  body('email')
    .isEmail()
    .withMessage('유효한 이메일 주소를 입력해주세요.')
    .normalizeEmail(),
  body('password')
    .notEmpty()
    .withMessage('비밀번호를 입력해주세요.'),
  validate,
];

export const changePasswordValidation = [
  body('currentPassword')
    .notEmpty()
    .withMessage('현재 비밀번호를 입력해주세요.'),
  body('newPassword')
    .isLength({ min: 8, max: 100 })
    .withMessage('새 비밀번호는 8자 이상 100자 이하여야 합니다.')
    .matches(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/)
    .withMessage('새 비밀번호는 대문자, 소문자, 숫자를 포함해야 합니다.'),
  validate,
];

// ==================== File Validators ====================

export const fileUploadValidation = [
  body('title')
    .isLength({ min: 2, max: 200 })
    .withMessage('파일 제목은 2자 이상 200자 이하여야 합니다.')
    .trim()
    .escape(),
  body('description')
    .optional()
    .isLength({ max: 5000 })
    .withMessage('설명은 5000자 이하여야 합니다.')
    .trim(),
  body('categoryId')
    .notEmpty()
    .withMessage('카테고리를 선택해주세요.')
    .isString()
    .withMessage('유효한 카테고리 ID가 아닙니다.'),
  body('price')
    .optional()
    .isInt({ min: 0, max: 10000000 })
    .withMessage('가격은 0원 이상 1000만원 이하여야 합니다.'),
  body('tags')
    .optional()
    .isArray({ max: 20 })
    .withMessage('태그는 최대 20개까지 가능합니다.'),
  body('tags.*')
    .optional()
    .isString()
    .isLength({ max: 50 })
    .withMessage('각 태그는 50자 이하여야 합니다.'),
  validate,
];

export const fileIdValidation = [
  param('id')
    .isString()
    .notEmpty()
    .withMessage('파일 ID가 필요합니다.'),
  validate,
];

export const fileSearchValidation = [
  query('q')
    .optional()
    .isString()
    .isLength({ max: 200 })
    .withMessage('검색어는 200자 이하여야 합니다.')
    .trim()
    .escape(),
  query('category')
    .optional()
    .isString(),
  query('minPrice')
    .optional()
    .isInt({ min: 0 })
    .withMessage('최소 가격은 0 이상이어야 합니다.'),
  query('maxPrice')
    .optional()
    .isInt({ min: 0 })
    .withMessage('최대 가격은 0 이상이어야 합니다.'),
  query('sort')
    .optional()
    .isIn(['latest', 'popular', 'price_asc', 'price_desc', 'rating'])
    .withMessage('유효하지 않은 정렬 옵션입니다.'),
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('페이지 번호는 1에서 1000 사이여야 합니다.'),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('페이지당 항목 수는 1에서 100 사이여야 합니다.'),
  validate,
];

// ==================== Payment Validators ====================

export const chargeValidation = [
  body('amount')
    .isInt({ min: 1000, max: 10000000 })
    .withMessage('충전 금액은 1,000원 이상 1,000만원 이하여야 합니다.'),
  body('paymentMethod')
    .isIn(['card', 'bank', 'phone', 'kakao', 'naver', 'toss'])
    .withMessage('유효한 결제 수단을 선택해주세요.'),
  validate,
];

export const purchaseValidation = [
  body('fileId')
    .notEmpty()
    .withMessage('파일 ID가 필요합니다.')
    .isString(),
  body('paymentType')
    .optional()
    .isIn(['cash', 'point', 'mixed'])
    .withMessage('유효한 결제 유형을 선택해주세요.'),
  validate,
];

// ==================== Comment Validators ====================

export const commentValidation = [
  body('content')
    .isLength({ min: 1, max: 2000 })
    .withMessage('댓글은 1자 이상 2000자 이하여야 합니다.')
    .trim(),
  body('rating')
    .optional()
    .isInt({ min: 1, max: 5 })
    .withMessage('평점은 1에서 5 사이여야 합니다.'),
  validate,
];

// ==================== Message Validators ====================

export const sendMessageValidation = [
  body('recipientId')
    .notEmpty()
    .withMessage('수신자를 선택해주세요.')
    .isString(),
  body('title')
    .isLength({ min: 1, max: 200 })
    .withMessage('제목은 1자 이상 200자 이하여야 합니다.')
    .trim()
    .escape(),
  body('content')
    .isLength({ min: 1, max: 10000 })
    .withMessage('내용은 1자 이상 10000자 이하여야 합니다.')
    .trim(),
  validate,
];

// ==================== Friend Validators ====================

export const friendRequestValidation = [
  body('userId')
    .notEmpty()
    .withMessage('사용자 ID가 필요합니다.')
    .isString(),
  body('message')
    .optional()
    .isLength({ max: 500 })
    .withMessage('친구 신청 메시지는 500자 이하여야 합니다.')
    .trim(),
  validate,
];

// ==================== User Validators ====================

export const updateProfileValidation = [
  body('displayName')
    .optional()
    .isLength({ min: 1, max: 50 })
    .withMessage('표시 이름은 1자 이상 50자 이하여야 합니다.')
    .trim()
    .escape(),
  body('bio')
    .optional()
    .isLength({ max: 500 })
    .withMessage('자기소개는 500자 이하여야 합니다.')
    .trim(),
  body('phone')
    .optional()
    .matches(/^[0-9-+]{10,15}$/)
    .withMessage('유효한 전화번호 형식이 아닙니다.'),
  validate,
];

// ==================== Admin Validators ====================

export const adminFileActionValidation = [
  param('id')
    .isString()
    .notEmpty()
    .withMessage('파일 ID가 필요합니다.'),
  body('reason')
    .optional()
    .isLength({ max: 1000 })
    .withMessage('사유는 1000자 이하여야 합니다.')
    .trim(),
  validate,
];

// ==================== Pagination Validators ====================

export const paginationValidation = [
  query('page')
    .optional()
    .isInt({ min: 1, max: 1000 })
    .withMessage('페이지 번호는 1에서 1000 사이여야 합니다.')
    .toInt(),
  query('limit')
    .optional()
    .isInt({ min: 1, max: 100 })
    .withMessage('페이지당 항목 수는 1에서 100 사이여야 합니다.')
    .toInt(),
  validate,
];

// ==================== Sanitization Helpers ====================

export const sanitizeString = (str: string): string => {
  return str
    .replace(/[<>]/g, '') // Remove < and > to prevent basic HTML injection
    .trim();
};

export const sanitizeHtml = (html: string): string => {
  // Basic HTML sanitization - in production, use a library like DOMPurify
  return html
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/on\w+="[^"]*"/gi, '')
    .replace(/javascript:/gi, '');
};
