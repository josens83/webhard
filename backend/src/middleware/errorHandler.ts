import { Request, Response, NextFunction } from 'express';
import { Prisma } from '@prisma/client';
import multer from 'multer';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;
  code?: string;
  details?: any;

  constructor(message: string, statusCode: number = 500, code?: string, details?: any) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = true;
    this.code = code;
    this.details = details;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Error codes for i18n and client handling
export const ErrorCodes = {
  // Authentication
  AUTH_REQUIRED: 'AUTH_REQUIRED',
  AUTH_INVALID_TOKEN: 'AUTH_INVALID_TOKEN',
  AUTH_TOKEN_EXPIRED: 'AUTH_TOKEN_EXPIRED',
  AUTH_FORBIDDEN: 'AUTH_FORBIDDEN',

  // Validation
  VALIDATION_FAILED: 'VALIDATION_FAILED',
  INVALID_INPUT: 'INVALID_INPUT',

  // Resource
  NOT_FOUND: 'NOT_FOUND',
  ALREADY_EXISTS: 'ALREADY_EXISTS',
  CONFLICT: 'CONFLICT',

  // File
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',
  FILE_TYPE_NOT_ALLOWED: 'FILE_TYPE_NOT_ALLOWED',
  FILE_UPLOAD_FAILED: 'FILE_UPLOAD_FAILED',

  // Rate Limit
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  DAILY_LIMIT_EXCEEDED: 'DAILY_LIMIT_EXCEEDED',

  // Payment
  INSUFFICIENT_BALANCE: 'INSUFFICIENT_BALANCE',
  PAYMENT_FAILED: 'PAYMENT_FAILED',

  // Server
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
};

// Korean error messages
const errorMessages: Record<string, string> = {
  [ErrorCodes.AUTH_REQUIRED]: '로그인이 필요합니다.',
  [ErrorCodes.AUTH_INVALID_TOKEN]: '유효하지 않은 인증 토큰입니다.',
  [ErrorCodes.AUTH_TOKEN_EXPIRED]: '인증 토큰이 만료되었습니다. 다시 로그인해주세요.',
  [ErrorCodes.AUTH_FORBIDDEN]: '접근 권한이 없습니다.',
  [ErrorCodes.VALIDATION_FAILED]: '입력값이 올바르지 않습니다.',
  [ErrorCodes.NOT_FOUND]: '요청한 리소스를 찾을 수 없습니다.',
  [ErrorCodes.ALREADY_EXISTS]: '이미 존재하는 데이터입니다.',
  [ErrorCodes.CONFLICT]: '요청을 처리할 수 없습니다. 데이터 충돌이 발생했습니다.',
  [ErrorCodes.FILE_TOO_LARGE]: '파일 크기가 허용된 한도를 초과했습니다.',
  [ErrorCodes.FILE_TYPE_NOT_ALLOWED]: '지원하지 않는 파일 형식입니다.',
  [ErrorCodes.FILE_UPLOAD_FAILED]: '파일 업로드에 실패했습니다.',
  [ErrorCodes.RATE_LIMIT_EXCEEDED]: '요청이 너무 많습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCodes.DAILY_LIMIT_EXCEEDED]: '일일 사용 한도를 초과했습니다. 내일 다시 시도해주세요.',
  [ErrorCodes.INSUFFICIENT_BALANCE]: '잔액이 부족합니다.',
  [ErrorCodes.PAYMENT_FAILED]: '결제 처리에 실패했습니다.',
  [ErrorCodes.INTERNAL_ERROR]: '서버 오류가 발생했습니다. 잠시 후 다시 시도해주세요.',
  [ErrorCodes.SERVICE_UNAVAILABLE]: '서비스를 일시적으로 사용할 수 없습니다.',
};

export const errorHandler = (
  err: Error | AppError | multer.MulterError,
  req: Request,
  res: Response,
  next: NextFunction
) => {
  let statusCode = 500;
  let message = '서버 오류가 발생했습니다.';
  let code = ErrorCodes.INTERNAL_ERROR;
  let details: any = undefined;

  // Custom AppError
  if (err instanceof AppError) {
    statusCode = err.statusCode;
    message = err.message;
    code = err.code || ErrorCodes.INTERNAL_ERROR;
    details = err.details;
  }

  // Multer errors (file upload)
  else if (err instanceof multer.MulterError) {
    statusCode = 400;
    switch (err.code) {
      case 'LIMIT_FILE_SIZE':
        code = ErrorCodes.FILE_TOO_LARGE;
        message = '파일 크기가 허용된 한도를 초과했습니다.';
        break;
      case 'LIMIT_FILE_COUNT':
        message = '업로드할 수 있는 파일 수를 초과했습니다.';
        code = ErrorCodes.FILE_UPLOAD_FAILED;
        break;
      case 'LIMIT_UNEXPECTED_FILE':
        message = '예상치 못한 파일 필드입니다.';
        code = ErrorCodes.FILE_UPLOAD_FAILED;
        break;
      default:
        message = '파일 업로드 중 오류가 발생했습니다.';
        code = ErrorCodes.FILE_UPLOAD_FAILED;
    }
  }

  // Prisma errors
  else if (err instanceof Prisma.PrismaClientKnownRequestError) {
    statusCode = 400;

    switch (err.code) {
      case 'P2002':
        code = ErrorCodes.ALREADY_EXISTS;
        // Extract the field name that caused the unique constraint violation
        const target = (err.meta?.target as string[])?.join(', ') || 'field';
        message = `중복된 ${target} 값입니다.`;
        details = { field: target };
        break;
      case 'P2025':
        statusCode = 404;
        code = ErrorCodes.NOT_FOUND;
        message = '요청한 데이터를 찾을 수 없습니다.';
        break;
      case 'P2003':
        code = ErrorCodes.CONFLICT;
        message = '참조된 데이터가 존재하지 않습니다.';
        break;
      case 'P2014':
        code = ErrorCodes.CONFLICT;
        message = '관계 데이터 제약 조건 위반입니다.';
        break;
      default:
        message = '데이터베이스 오류가 발생했습니다.';
    }
  }

  // Prisma validation error
  else if (err instanceof Prisma.PrismaClientValidationError) {
    statusCode = 400;
    code = ErrorCodes.VALIDATION_FAILED;
    message = '입력 데이터 형식이 올바르지 않습니다.';
  }

  // express-validator errors (if thrown directly)
  else if (err.name === 'ValidationError' || (err as any).errors) {
    statusCode = 400;
    code = ErrorCodes.VALIDATION_FAILED;
    message = err.message || '입력값이 올바르지 않습니다.';
    details = (err as any).errors;
  }

  // JWT errors
  else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    code = ErrorCodes.AUTH_INVALID_TOKEN;
    message = errorMessages[code];
  }

  else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    code = ErrorCodes.AUTH_TOKEN_EXPIRED;
    message = errorMessages[code];
  }

  // Syntax error (invalid JSON)
  else if (err instanceof SyntaxError && 'body' in err) {
    statusCode = 400;
    code = ErrorCodes.INVALID_INPUT;
    message = '잘못된 요청 형식입니다.';
  }

  // Generic file upload errors (from custom fileFilter)
  else if (err.message?.includes('파일') || err.message?.includes('file')) {
    statusCode = 400;
    code = ErrorCodes.FILE_TYPE_NOT_ALLOWED;
    message = err.message;
  }

  // Log error
  const logLevel = statusCode >= 500 ? 'error' : 'warn';
  console[logLevel](`[${new Date().toISOString()}] ${req.method} ${req.path}:`, {
    statusCode,
    code,
    message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack }),
  });

  // Send response
  res.status(statusCode).json({
    success: false,
    code,
    message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && {
      stack: err.stack,
      originalError: err.message
    }),
  });
};

// Async handler wrapper to catch errors automatically
export const asyncHandler = (fn: Function) => {
  return (req: Request, res: Response, next: NextFunction) => {
    Promise.resolve(fn(req, res, next)).catch(next);
  };
};
