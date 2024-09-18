import { createParamDecorator, ExecutionContext } from '@nestjs/common';

export const TokenInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request.tokenInfo;
  },
);
