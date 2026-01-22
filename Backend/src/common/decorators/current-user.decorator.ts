import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import {
  RequestWithUser,
  JwtPayload,
} from '../interfaces/request.interface.js';

/**
 * Decorator to extract the current user from the request
 * Usage: @CurrentUser() user: JwtPayload or @CurrentUser('sub') userId: string
 */
export const CurrentUser = createParamDecorator(
  (
    data: keyof JwtPayload | undefined,
    ctx: ExecutionContext,
  ): JwtPayload | string | null => {
    const request = ctx.switchToHttp().getRequest<RequestWithUser>();
    const user = request.user;

    if (!user) {
      return null;
    }

    return data ? (user[data] as string) : user;
  },
);
