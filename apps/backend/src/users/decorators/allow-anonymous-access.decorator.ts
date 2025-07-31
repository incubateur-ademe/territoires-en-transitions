import { Reflector } from '@nestjs/core';

export const AllowAnonymousAccess = Reflector.createDecorator<boolean>();
