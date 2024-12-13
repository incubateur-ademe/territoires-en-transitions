import { TrpcService } from './trpc.service';
import { Global, Module } from '@nestjs/common';

@Global()
@Module({
  providers: [TrpcService],
  exports: [TrpcService],
})
export class TrpcModule {}
