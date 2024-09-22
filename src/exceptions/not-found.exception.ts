import type { StatusCode } from 'hono/utils/http-status';

import { BaseException, type ExceptionResponse } from './base.exception';

export class NotFoundException extends BaseException {
  statusCode: StatusCode = 404;

  constructor(message?: string) {
    super(message || 'Not Found');
  }

  serializeErrors(): ExceptionResponse {
    return {
      status: this.statusCode,
      message: this.message,
    };
  }
}
