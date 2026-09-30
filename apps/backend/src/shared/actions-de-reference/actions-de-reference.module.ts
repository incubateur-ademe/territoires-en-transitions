import { Module } from '@nestjs/common';
import { ActionsDeReferenceTableRepository } from './actions-de-reference-table.repository';
import { ActionsDeReferenceRepository } from './actions-de-reference.repository';
import { ActionsDeReferenceRouter } from './actions-de-reference.router';
import { ListActionsDeReferenceService } from './list-actions-de-reference/list-actions-de-reference.service';

@Module({
  providers: [
    {
      provide: ActionsDeReferenceRepository,
      useClass: ActionsDeReferenceTableRepository,
    },
    ListActionsDeReferenceService,
    ActionsDeReferenceRouter,
  ],
  exports: [ActionsDeReferenceRouter],
})
export class ActionsDeReferenceModule {}
