import type { StatusCode } from 'hono/utils/http-status';

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
/**
 * A type that represents an error response to be sent back to the client
 */
export type ExceptionResponse = {
  status: number;
  message: string;
  // Only has value if the error is a validation error (Copied from Zod Validation Issue)
  validationIssues?: {
    path: string;
    message: string;
    fatal?: boolean;
  }[];
};

// -------------------------------------------------------------------------------------------------
// -------------------------------------------------------------------------------------------------
/**
 * An abstract class that is extended by all other custom exceptions.
 *
 * Every sub-class of this class must implement the `serializeErrors()` method to return
 * the serialized errors object with the type of `ExceptionResponse` to be sent back to the client.
 */
export abstract class BaseException extends Error {
  /**
   * The status code of the error
   */
  abstract statusCode: StatusCode;

  readonly message: string;

  constructor(message: string) {
    super(message);
    this.message = message;
  }

  /**
   * A method that returns the serialized errors object to be sent back to the client
   */
  abstract serializeErrors(): ExceptionResponse;
}
