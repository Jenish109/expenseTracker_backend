export type SuccessDetail = {
  status_code: number;
  message: string;
};

export const SUCCESS_CODES = {
  AUTH: {
    EMAIL_VERIFIED: {
      status_code: 200,
      message: 'Email verified successfully.'
    },
    REGISTERED: {
      status_code: 201,
      message: 'User registered successfully.'
    },
    LOGIN_SUCCESS: {
      status_code: 200,
      message: 'User logged in successfully.'
    },
    LOGOUT_SUCCESS: {
      status_code: 200,
      message: 'User logged out successfully.'
    },
    FORGOT_PASSWORD: {
      status_code: 200,
      message: 'Password reset email sent successfully.'
    },
    CHANGE_PASSWORD: {
      status_code: 200,
      message: 'Password reset successfully.'
    },
    PROFILE_RETRIEVED: {
      status_code: 200,
      message: 'Profile retrieved successfully.'
    },
    PROFILE_UPDATED: {
      status_code: 200,
      message: 'Profile updated successfully.'
    }
  },
  USER: {
    PROFILE_UPDATED: {
      status_code: 200,
      message: 'Profile updated successfully.'
    }
  },
  EXPENSE: {
    CREATED: {
      status_code: 201,
      message: 'Expense created successfully.'
    },
    UPDATED: {
      status_code: 200,
      message: 'Expense updated successfully.'
    },
    DELETED: {
      status_code: 200,
      message: 'Expense deleted successfully.'
    }
  },
  BUDGET: {
    CREATED: {
      status_code: 201,
      message: 'Budget created successfully.'
    },
    UPDATED: {
      status_code: 200,
      message: 'Budget updated successfully.'
    },
    DELETED: {
      status_code: 200,
      message: 'Budget deleted successfully.'
    }
  },
  CATEGORY: {
    CREATED: {
      status_code: 201,
      message: 'Category created successfully.'
    },
    UPDATED: {
      status_code: 200,
      message: 'Category updated successfully.'
    },
    DELETED: {
      status_code: 200,
      message: 'Category deleted successfully.'
    }
  },
  GENERAL: {
    SUCCESS: {
      status_code: 200,
      message: 'Operation completed successfully.'
    }
  },
  SETTINGS: {
    RETRIEVED: {
      status_code: 200,
      message: 'Settings retrieved successfully.'
    },
    UPDATED: {
      status_code: 200,
      message: 'Settings updated successfully.'
    }
  }
} as const; 