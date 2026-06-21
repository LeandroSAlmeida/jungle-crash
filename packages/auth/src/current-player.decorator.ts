import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedPlayer } from './jwt.strategy';

export const CurrentPlayer = createParamDecorator((_: unknown, ctx: ExecutionContext): string => {
  const request = ctx.switchToHttp().getRequest();
  const user = request.user as AuthenticatedPlayer;
  return user.playerId;
});
