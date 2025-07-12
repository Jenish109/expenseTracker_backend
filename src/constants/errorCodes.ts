export interface ErrorDetail {
  code: string;
  message: string;
  statusCode: number;
}

export const ERROR_CODES = {
  AUTH: {
    INVALID_TOKEN: {
      code: 'AUTH_001',
      message: 'Invalid authentication token',
      statusCode: 401
    },
    TOKEN_EXPIRED: {
      code: 'AUTH_002',
      message: 'Authentication token has expired',
      statusCode: 401
    },
    INVALID_CREDENTIALS: {
      code: 'AUTH_003',
      message: 'Invalid email or password',
      statusCode: 401
    },
    ACCESS_DENIED: {
      code: 'AUTH_004',
      message: 'Access denied. Insufficient permissions',
      statusCode: 403
    },
    TOKEN_MISSING: {
      code: 'AUTH_005',
      message: 'Authentication token is missing',
      statusCode: 401
    },
    TOKEN_GENERATION_FAILED: {
      code: 'AUTH_006',
      message: 'Failed to generate authentication tokens',
      statusCode: 500
    },
    LOGIN_FAILED: {
      code: 'AUTH_007',
      message: 'Login failed',
      statusCode: 500
    }
  },
  USER: {
    NOT_FOUND: {
      code: 'USER_001',
      message: 'User not found',
      statusCode: 404
    },
    ALREADY_EXISTS: {
      code: 'USER_002',
      message: 'User already exists with this email',
      statusCode: 409
    },
    INVALID_INPUT: {
      code: 'USER_003',
      message: 'Invalid user input data',
      statusCode: 400
    },
    INVALID_PASSWORD: {
      code: 'USER_004',
      message: 'Password does not meet requirements',
      statusCode: 400
    },
    ACCOUNT_DISABLED: {
      code: 'USER_005',
      message: 'User account is disabled',
      statusCode: 403
    }
  },
  EXPENSE: {
    NOT_FOUND: {
      code: 'EXP_001',
      message: 'Expense not found',
      statusCode: 404
    },
    INVALID_AMOUNT: {
      code: 'EXP_002',
      message: 'Invalid expense amount',
      statusCode: 400
    },
    INVALID_CATEGORY: {
      code: 'EXP_003',
      message: 'Invalid expense category',
      statusCode: 400
    },
    UNAUTHORIZED: {
      code: 'EXP_004',
      message: 'Unauthorized to access this expense',
      statusCode: 403
    },
    DATE_INVALID: {
      code: 'EXP_005',
      message: 'Invalid expense date',
      statusCode: 400
    },
    INVALID_DATA: {
      code: 'EXP_006',
      message: 'Invalid expense data',
      statusCode: 400
    }
  },
  BUDGET: {
    NOT_FOUND: {
      code: 'BUD_001',
      message: 'Budget not found',
      statusCode: 404
    },
    INVALID_AMOUNT: {
      code: 'BUD_002',
      message: 'Invalid budget amount',
      statusCode: 400
    },
    INVALID_PERIOD: {
      code: 'BUD_003',
      message: 'Invalid budget period',
      statusCode: 400
    },
    LIMIT_EXCEEDED: {
      code: 'BUD_004',
      message: 'Budget limit exceeded',
      statusCode: 400
    },
    OVERLAP_PERIOD: {
      code: 'BUD_005',
      message: 'Budget period overlaps with existing budget',
      statusCode: 409
    }
  },
  CATEGORY: {
    NOT_FOUND: {
      code: 'CAT_001',
      message: 'Category not found',
      statusCode: 404
    },
    ALREADY_EXISTS: {
      code: 'CAT_002',
      message: 'Category already exists',
      statusCode: 409
    },
    INVALID_COLOR: {
      code: 'CAT_003',
      message: 'Invalid category color format',
      statusCode: 400
    }
  },
  DATABASE: {
    OPERATION_FAILED: {
      code: 'DB_001',
      message: 'Database operation failed',
      statusCode: 500
    },
    CONNECTION_ERROR: {
      code: 'DB_002',
      message: 'Database connection error',
      statusCode: 500
    },
    CONSTRAINT_VIOLATION: {
      code: 'DB_003',
      message: 'Database constraint violation',
      statusCode: 400
    },
    RECORD_NOT_FOUND: {
      code: 'DB_004',
      message: 'Database record not found',
      statusCode: 404
    },
    DUPLICATE_ENTRY: {
      code: 'DB_005',
      message: 'Duplicate database entry',
      statusCode: 409
    }
  },
  VALIDATION: {
    REQUIRED_FIELD: {
      code: 'VAL_001',
      message: 'Required field is missing',
      statusCode: 400
    },
    INVALID_FORMAT: {
      code: 'VAL_002',
      message: 'Invalid data format',
      statusCode: 400
    },
    TYPE_MISMATCH: {
      code: 'VAL_003',
      message: 'Data type mismatch',
      statusCode: 400
    }
  },
  SERVICE: {
    OPERATION_FAILED: {
      code: 'SVC_001',
      message: 'Service operation failed',
      statusCode: 500
    },
    EXTERNAL_API_ERROR: {
      code: 'SVC_002',
      message: 'External API error',
      statusCode: 502
    },
    RATE_LIMIT: {
      code: 'SVC_003',
      message: 'Rate limit exceeded',
      statusCode: 429
    }
  },
  GENERAL: {
    SERVER_ERROR: {
      code: 'GEN_001',
      message: 'Internal server error',
      statusCode: 500
    },
    BAD_REQUEST: {
      code: 'GEN_002',
      message: 'Bad request',
      statusCode: 400
    },
    NOT_FOUND: {
      code: 'GEN_003',
      message: 'Resource not found',
      statusCode: 404
    },
    METHOD_NOT_ALLOWED: {
      code: 'GEN_004',
      message: 'Method not allowed',
      statusCode: 405
    },
    TOO_MANY_REQUESTS: {
      code: 'GEN_005',
      message: 'Too many requests',
      statusCode: 429
    }
  }
} as const; 