import {
  ConflictException,
  ForbiddenException,
  HttpException,
  HttpStatus,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  UnprocessableEntityException,
} from '@nestjs/common';
import type { PaginationMeta } from '../../shared/pagination/pagination.utils.js';

export type { PaginationMeta };

export type ApiSuccessBody<T = unknown> = {
  success: true;
  message: string;
  data: T;
};

export type ApiSuccessWithMetaBody<
  T = unknown,
  TMeta extends Record<string, unknown> = Record<string, unknown>,
> = {
  success: true;
  message: string;
  data: T;
  meta: TMeta;
};

export type ApiErrorBody = {
  success: false;
  message: string;
  errors?: unknown;
};

/** HTTP 200 envelope with a machine-readable `code` */
export type ApiBusinessFailureBody<TCode extends string = string> = {
  success: false;
  message: string;
  code: TCode;
};

export class ApiResponse {
  /** Use for HTTP 200 / same-status business failures */
  static fail(message: string, errors?: unknown): ApiErrorBody {
    if (errors !== undefined && errors !== null) {
      return { success: false, message, errors };
    }
    return { success: false, message };
  }

  static failWithCode<TCode extends string>(
    message: string,
    code: TCode,
  ): ApiBusinessFailureBody<TCode> {
    return { success: false, message, code };
  }

  static success<T>(data: T, message?: string): ApiSuccessBody<T>;
  static success(data?: null, message?: string): ApiSuccessBody<null>;
  static success<T>(
    data: T | null = null,
    message = 'Success',
  ): ApiSuccessBody<T | null> {
    return { success: true, message, data };
  }

  static successWithMeta<
    TData,
    TMeta extends Record<string, unknown> = Record<string, unknown>,
  >(
    data: TData,
    meta: TMeta,
    message = 'Success',
  ): ApiSuccessWithMetaBody<TData, TMeta> {
    return { success: true, message, data, meta };
  }

  static error(
    message = 'Error',
    code = HttpStatus.BAD_REQUEST,
    errors?: unknown,
  ): never {
    throw new HttpException(ApiResponse.fail(message, errors), code);
  }

  static badRequest(message = 'Bad request'): never {
    throw new HttpException(ApiResponse.fail(message), HttpStatus.BAD_REQUEST);
  }

  static unauthorized(message = 'Unauthorized'): never {
    throw new UnauthorizedException(ApiResponse.fail(message));
  }

  static forbidden(message = 'Forbidden'): never {
    throw new ForbiddenException(ApiResponse.fail(message));
  }

  static notFound(message = 'Resource not found'): never {
    throw new NotFoundException(ApiResponse.fail(message));
  }

  static validationError(
    message = 'Validation failed',
    errors?: unknown,
  ): never {
    throw new UnprocessableEntityException(ApiResponse.fail(message, errors));
  }

  static relatedDataExists(
    message = 'Cannot delete: related data exists. Please remove the related data first.',
    details?: string[],
  ): never {
    throw new HttpException(
      ApiResponse.fail(message, details),
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }

  static conflict(
    message = 'Cannot delete: this record has related data. Please delete the related data first.',
  ): never {
    throw new ConflictException(ApiResponse.fail(message));
  }

  static conflictWithCode(
    message = 'Cannot delete: this record has related data. Please delete the related data first.',
    code = HttpStatus.CONFLICT,
  ): never {
    throw new HttpException(ApiResponse.fail(message), code);
  }

  static serverError(message = 'Internal server error'): never {
    throw new InternalServerErrorException(ApiResponse.fail(message));
  }

  static created<T>(
    data: T | null = null,
    message = 'Resource created successfully',
  ): ApiSuccessBody<T | null> {
    return { success: true, message, data };
  }

  static updated<T>(
    data: T | null = null,
    message = 'Resource updated successfully',
  ): ApiSuccessBody<T | null> {
    return { success: true, message, data };
  }

  static deleted(
    message = 'Resource deleted successfully',
  ): ApiSuccessBody<null> {
    return { success: true, message, data: null };
  }

  static withPagination<T>(
    items: T[],
    meta: PaginationMeta,
    message = 'Data retrieved successfully',
  ): ApiSuccessWithMetaBody<T[], PaginationMeta> {
    return { success: true, message, data: items, meta };
  }
}

