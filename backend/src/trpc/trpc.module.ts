import { Module } from '@nestjs/common';
import { TrpcService } from './services/trpc.service';

@Module({
  imports: [],
  controllers: [],
  providers: [TrpcService],
  exports: [TrpcService],
})
export class TrpcModule {}
