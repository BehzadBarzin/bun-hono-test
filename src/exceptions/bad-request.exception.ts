import type { StatusCode } from 'hono/utils/http-status';

import { BaseException, type ExceptionResponse } from './base.exception';

export class BadRequestException extends BaseException {
  statusCode: StatusCode = 400;

  constructor(message?: string) {
    super(message || 'Bad Request');
  }

  serializeErrors(): ExceptionResponse {
    return {
      status: this.statusCode,
      message: this.message,
    };
  }
}
