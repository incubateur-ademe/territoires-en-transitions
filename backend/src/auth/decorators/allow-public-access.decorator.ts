import { Reflector } from '@nestjs/core';

export const AllowPublicAccess = Reflector.createDecorator<boolean>();
