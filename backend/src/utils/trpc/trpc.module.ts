import { Global, Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';

@Global()
@Module({
  providers: [TrpcService],
  exports: [TrpcService],
})
export class TrpcModule {}
