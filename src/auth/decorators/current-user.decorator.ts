
import {
  createParamDecorator,
  ExecutionContext,
} from '@nestjs/common';

export interface AuthenticatedUser {
  userId: string;
  name: string;
  email: string;
}

export const CurrentUser = createParamDecorator(
  (_data: unknown, context: ExecutionContext): AuthenticatedUser => {
    const request = context.switchToHttp().getRequest();
    return request.user as AuthenticatedUser;
  },
);
