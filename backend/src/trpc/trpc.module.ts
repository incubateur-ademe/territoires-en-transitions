import { Global, Module } from '@nestjs/common';
import { TrpcService } from './trpc.service';

@Global()
@Module({
  imports: [],
  controllers: [],
  providers: [TrpcService],
  exports: [TrpcService],
})
export class TrpcModule {}
