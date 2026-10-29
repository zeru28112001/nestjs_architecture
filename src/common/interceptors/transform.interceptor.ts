import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import type { Observable } from 'rxjs';
import { map } from 'rxjs/operators';

export interface Response<T> {
  success: boolean;
  data: T;
  message: string;
}

@Injectable()
export class TransformInterceptor<T>
  implements NestInterceptor<T, Response<T> | any>
{
  intercept(
    context: ExecutionContext,
    next: CallHandler,
  ): Observable<Response<T> | any> {
    return next.handle().pipe(
      map((data) => {
        // If the response already has a success field (e.g. from ApiResponse), return as is
        if (data && typeof data === 'object' && 'success' in data) {
          return data;
        }

        // Handle pagination structure specifically if detected (e.g. getPagination wrap)
        if (
          data &&
          typeof data === 'object' &&
          'content' in data &&
          'totalPages' in data
        ) {
          return {
            success: true,
            data,
            message: 'Success',
          };
        }

        return {
          success: true,
          data,
          message: 'Success',
        };
      }),
    );
  }
}

