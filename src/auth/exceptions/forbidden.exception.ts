import type { StatusCode } from 'hono/utils/http-status';

import { BaseException, type ExceptionResponse } from '../../exceptions/base.exception';

export class ForbiddenException extends BaseException {
  statusCode: StatusCode = 403;

  constructor() {
    super('Forbidden');
  }

  serializeErrors(): ExceptionResponse {
    return {
      status: this.statusCode,
      message: this.message,
    };
  }
}
