import type { StatusCode } from "hono/utils/http-status";
import {
  BaseException,
  type ExceptionResponse,
} from "../../exceptions/base.exception";

export class UnauthenticatedException extends BaseException {
  statusCode: StatusCode = 401;

  constructor() {
    super("Unauthenticated");
  }

  serializeErrors(): ExceptionResponse {
    return {
      status: this.statusCode,
      message: this.message,
    };
  }
}
