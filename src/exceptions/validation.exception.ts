import type { StatusCode } from "hono/utils/http-status";
import { BaseException, type ExceptionResponse } from "./base.exception";

import type { ZodError } from "zod";

export class ValidationException extends BaseException {
  statusCode: StatusCode = 400;

  zodError: ZodError;

  constructor(message: string, validationError: ZodError) {
    super(message);

    this.zodError = validationError;
  }

  serializeErrors(): ExceptionResponse {
    return {
      status: this.statusCode,
      message: this.message,
      validationIssues: this.zodError.issues.map((issue) => ({
        path: issue.path.join("."),
        message: issue.message,
        fatal: issue.fatal,
      })),
    };
  }
}
