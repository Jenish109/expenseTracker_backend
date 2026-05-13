export class AppError extends Error {
  readonly status: number;
  readonly code: string;
  readonly details?: unknown;

  constructor(status: number, code: string, message: string, details?: unknown) {
    super(message);
    this.name = "AppError";
    this.status = status;
    this.code = code;
    this.details = details;
  }
}

export class ValidationError extends AppError {
  constructor(message: string, details?: unknown) {
    super(400, "VALIDATION_ERROR", message, details);
    this.name = "ValidationError";
  }
}

export class AuthError extends AppError {
  constructor(message = "Unauthorized") {
    super(401, "UNAUTHORIZED", message);
    this.name = "AuthError";
  }
}

export class ForbiddenError extends AppError {
  constructor(code = "FORBIDDEN", message = "Forbidden") {
    super(403, code, message);
    this.name = "ForbiddenError";
  }
}

export class PlanError extends AppError {
  constructor(required: string) {
    super(403, "UPGRADE_REQUIRED", `Upgrade required: ${required}`);
    this.name = "PlanError";
  }
}
