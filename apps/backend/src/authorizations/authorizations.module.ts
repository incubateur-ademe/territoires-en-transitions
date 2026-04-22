import { Global, Module } from '@nestjs/common';
import { ScopeFactory } from './scope-factory.service';

@Global()
@Module({
  providers: [ScopeFactory],
  exports: [ScopeFactory],
})
export class AuthorizationsModule {}
