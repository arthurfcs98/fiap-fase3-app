import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import type { AuthenticatedUser } from '../strategies/jwt.strategy';

/**
 * Decorator que extrai o usuário autenticado (extraído do JWT) do request.
 * Uso: `myEndpoint(@CurrentUser() user: AuthenticatedUser) { ... }`
 *      `myEndpoint(@CurrentUser('customerId') customerId: string) { ... }`
 */
export const CurrentUser = createParamDecorator(
  (data: keyof AuthenticatedUser | undefined, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest<{ user?: AuthenticatedUser }>();
    const user = request.user;
    return data ? user?.[data] : user;
  },
);
