import { Global, Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';

@Module({
  providers: [TrpcService],
  exports: [TrpcService],
})
@Global()
export class TrpcModule {}
