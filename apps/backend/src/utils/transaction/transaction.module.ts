import { Module } from '@nestjs/common';
import { TransactionManager } from './transaction-manager.service';

@Module({
  providers: [TransactionManager],
  exports: [TransactionManager],
})
export class TransactionModule {}
