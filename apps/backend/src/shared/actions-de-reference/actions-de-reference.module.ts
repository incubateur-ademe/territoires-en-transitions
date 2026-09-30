import { Module } from '@nestjs/common';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { ActionsDeReferenceTableRepository } from './actions-de-reference-table.repository';
import { ActionsDeReferenceRepository } from './actions-de-reference.repository';
import { ActionsDeReferenceRouter } from './actions-de-reference.router';
import { ListActionsDeReferenceService } from './list-actions-de-reference/list-actions-de-reference.service';
import { UpdateActionDeReferenceService } from './update-action-de-reference/update-action-de-reference.service';

@Module({
  imports: [TransactionModule],
  providers: [
    {
      provide: ActionsDeReferenceRepository,
      useClass: ActionsDeReferenceTableRepository,
    },
    ListActionsDeReferenceService,
    UpdateActionDeReferenceService,
    ActionsDeReferenceRouter,
  ],
  exports: [ActionsDeReferenceRouter],
})
export class ActionsDeReferenceModule {}
