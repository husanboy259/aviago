import { Injectable, ExecutionContext } from '@nestjs/common';
import { AuthGuard } from '@nestjs/passport';

@Injectable()
export class OptionalJwtGuard extends AuthGuard('jwt') {
  // Never throw — just attach user to request if token is valid
  handleRequest(err: any, user: any) {
    return user || null;
  }
}
