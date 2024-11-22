import { createParamDecorator, ExecutionContext } from '@nestjs/common';
import { REQUEST_JWT_PAYLOAD_PARAM } from '../guards/auth.guard';

export const TokenInfo = createParamDecorator(
  (data: unknown, ctx: ExecutionContext) => {
    const request = ctx.switchToHttp().getRequest();
    return request[REQUEST_JWT_PAYLOAD_PARAM];
  }
);
