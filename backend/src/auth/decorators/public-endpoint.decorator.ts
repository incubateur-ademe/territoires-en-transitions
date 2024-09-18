import { Reflector } from '@nestjs/core';

export const PublicEndpoint = Reflector.createDecorator<boolean>();
