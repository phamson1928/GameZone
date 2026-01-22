import {
  Injectable,
  NestInterceptor,
  ExecutionContext,
  CallHandler,
} from '@nestjs/common';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { ApiResponseDto } from '../dto/api-response.dto.js';

/**
 * Transform all successful responses to a standard format
 */
@Injectable()
export class TransformResponseInterceptor<T> implements NestInterceptor<
  T,
  ApiResponseDto<T>
> {
  intercept(
    _context: ExecutionContext,
    next: CallHandler<T>,
  ): Observable<ApiResponseDto<T>> {
    return next.handle().pipe(
      map((data: T): ApiResponseDto<T> => {
        // If data is already an ApiResponseDto, return as is
        if (data instanceof ApiResponseDto) {
          return data as ApiResponseDto<T>;
        }

        // If data has its own pagination structure, don't wrap it again
        if (
          data &&
          typeof data === 'object' &&
          'data' in data &&
          'meta' in data
        ) {
          return ApiResponseDto.success<T>(data);
        }

        return ApiResponseDto.success<T>(data);
      }),
    );
  }
}
