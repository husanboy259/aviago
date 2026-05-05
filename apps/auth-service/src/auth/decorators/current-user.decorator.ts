import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { UserEntity } from '../../users/user.entity';

export const CurrentUser = createParamDecorator(
  (_data: unknown, ctx: ExecutionContext): UserEntity => {
    return ctx.switchToHttp().getRequest().user;
  },
);
