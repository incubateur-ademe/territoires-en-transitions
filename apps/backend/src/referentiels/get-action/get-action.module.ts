import { Module } from '@nestjs/common';
import { GetActionRepository } from './get-action.repository';
import { GetActionService } from './get-action.service';

@Module({
  providers: [GetActionRepository, GetActionService],
  exports: [GetActionService],
})
export class GetActionModule {}
