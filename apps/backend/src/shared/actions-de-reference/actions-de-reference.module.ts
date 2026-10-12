import { Module } from '@nestjs/common';
import { FichesModule } from '@tet/backend/plans/fiches/fiches.module';
import { TransactionModule } from '@tet/backend/utils/transaction/transaction.module';
import { ActionDeReferenceFicheTableRepository } from './action-de-reference-fiche-table.repository';
import { ActionDeReferenceFicheRepository } from './action-de-reference-fiche.repository';
import { ActionsDeReferenceTableRepository } from './actions-de-reference-table.repository';
import { ActionsDeReferenceRepository } from './actions-de-reference.repository';
import { ActionsDeReferenceRouter } from './actions-de-reference.router';
import { GetActionDeReferenceService } from './get-action-de-reference/get-action-de-reference.service';
import { ListActionsDeReferenceService } from './list-actions-de-reference/list-actions-de-reference.service';
import { ListFichesActionDeReferenceService } from './list-fiches-action-de-reference/list-fiches-action-de-reference.service';
import { UpdateActionDeReferenceService } from './update-action-de-reference/update-action-de-reference.service';

@Module({
  imports: [TransactionModule, FichesModule],
  providers: [
    {
      provide: ActionsDeReferenceRepository,
      useClass: ActionsDeReferenceTableRepository,
    },
    {
      provide: ActionDeReferenceFicheRepository,
      useClass: ActionDeReferenceFicheTableRepository,
    },
    GetActionDeReferenceService,
    ListActionsDeReferenceService,
    ListFichesActionDeReferenceService,
    UpdateActionDeReferenceService,
    ActionsDeReferenceRouter,
  ],
  exports: [ActionsDeReferenceRouter],
})
export class ActionsDeReferenceModule {}
