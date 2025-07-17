export type ErrorDetail = {
  statusCode: number; // Http status code
  code: string; // Custom error code
  message: string;
};

export const ERROR_CODES = {
  AUTH: {
    INVALID_TOKEN: {
      statusCode: 401,
      code: 'ERR-AUTH-001',
      message: 'Invalid authentication token.'
    },
    UNAUTHORIZED: {
      statusCode: 401,
      code: 'ERR-AUTH-002',
      message: 'Unauthorized access.'
    },
    INVALID_CODE: {
      statusCode: 401,
      code: 'ERR-AUTH-003',
      message: 'Invalid code',
    },
    TOKEN_EXPIRED: {
      statusCode: 401,
      code: 'ERR-AUTH-004',
      message: 'Authentication token has expired.'
    },
    INVALID_CREDENTIALS: {
      statusCode: 401,
      code: 'ERR-AUTH-005',
      message: 'Invalid email or password.'
    },
    ACCESS_DENIED: {
      statusCode: 403,
      code: 'ERR-AUTH-006',
      message: 'Access denied. Insufficient permissions.'
    },
    EMAIL_VERIFICATION_FAILED: {
      statusCode: 401,
      code: 'ERR-AUTH-007',
      message: 'Please verify your email before logging in.'
    },
    FORGOT_PASSWORD_FAILED: {
      statusCode: 404,
      code: 'ERR-AUTH-008',
      message: 'User with provided email not found.'
    }
  },
  USER: {
    NOT_FOUND: {
      statusCode: 404,
      code: 'ERR-USER-001',
      message: 'User not found.'
    },
    ALREADY_EXISTS: {
      statusCode: 409,
      code: 'ERR-USER-002',
      message: 'User already exists with this email.'
    },
    INVALID_INPUT: {
      statusCode: 400,
      code: 'ERR-USER-003',
      message: 'Invalid user input data.'
    },
    ACCOUNT_DISABLED: {
      statusCode: 403,
      code: 'ERR-USER-004',
      message: 'User account is disabled.'
    }
  },
  EXPENSE: {
    NOT_FOUND: {
      statusCode: 404,
      code: 'ERR-EXP-001',
      message: 'Expense not found.'
    },
    INVALID_AMOUNT: {
      statusCode: 400,
      code: 'ERR-EXP-002',
      message: 'Invalid expense amount.'
    },
    INVALID_CATEGORY: {
      statusCode: 400,
      code: 'ERR-EXP-003',
      message: 'Invalid expense category.'
    },
    UNAUTHORIZED: {
      statusCode: 401,
      code: 'ERR-EXP-004',
      message: 'Unauthorized access.'
    },
    DATE_INVALID: {
      statusCode: 400,
      code: 'ERR-EXP-005',
      message: 'Invalid date.'
    }
  },
  BUDGET: {
    NOT_FOUND: {
      statusCode: 404,
      code: 'ERR-BUD-001',
      message: 'Budget not found.'
    },
    INVALID_AMOUNT: {
      statusCode: 400,
      code: 'ERR-BUD-002',
      message: 'Invalid budget amount.'
    },
    LIMIT_EXCEEDED: {
      statusCode: 400,
      code: 'ERR-BUD-003',
      message: 'Budget limit exceeded.'
    }
  },
  CATEGORY: {
    NOT_FOUND: {
      statusCode: 404,
      code: 'ERR-CAT-001',
      message: 'Category not found.'
    },
    ALREADY_EXISTS: {
      statusCode: 409,
      code: 'ERR-CAT-002',
      message: 'Category already exists.'
    },
    IN_USE: {
      statusCode: 400,
      code: 'ERR-CAT-003',
      message: 'Category is in use and cannot be deleted.'
    }
  },
  GENERAL: {
    SERVER_ERROR: {
      statusCode: 500,
      code: 'ERR-GEN-001',
      message: 'Internal server error.'
    },
    BAD_REQUEST: {
      statusCode: 400,
      code: 'ERR-GEN-002',
      message: 'Bad request.'
    },
    NOT_FOUND: {
      statusCode: 404,
      code: 'ERR-GEN-003',
      message: 'Resource not found.'
    },
    EMAIL_SEND_FAILED: {
      statusCode: 500,
      code: 'ERR-GEN-004',
      message: 'Failed to send email.'
    }
  }
} as const; 