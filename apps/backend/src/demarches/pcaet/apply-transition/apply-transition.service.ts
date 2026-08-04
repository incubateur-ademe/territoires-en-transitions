import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import {
  applyTransition as applyWorkflowTransition,
  computeAvisDeadline,
  DemarchePcaetTransitionEnum,
  type DemarchePcaet,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { GetDemarchePcaetRepository } from '../get-demarche-pcaet/get-demarche-pcaet.repository';
import { DemarchePcaetGuardsService } from '../shared/demarche-pcaet-guards.service';
import { DemarchePcaetPilotesRepository } from '../shared/demarche-pcaet-pilotes.repository';
import { DemarchePcaetRefRepository } from '../shared/demarche-pcaet-ref.repository';
import {
  ApplyTransitionError,
  ApplyTransitionErrorEnum,
} from './apply-transition.errors';
import { ApplyTransitionInput } from './apply-transition.input';
import { ApplyTransitionRepository } from './apply-transition.repository';

@Injectable()
export class ApplyTransitionService {
  private readonly logger = new Logger(ApplyTransitionService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
    private readonly demarchePcaetRefRepository: DemarchePcaetRefRepository,
    private readonly pilotesRepository: DemarchePcaetPilotesRepository,
    private readonly guardsService: DemarchePcaetGuardsService,
    private readonly applyTransitionRepository: ApplyTransitionRepository,
    private readonly getDemarchePcaetRepository: GetDemarchePcaetRepository
  ) {}

  /**
   * Chemin d'écriture unique du statut : permission générale d'édition,
   * puis transition vérifiée (structure + guards serveur) et journalisée.
   */
  async applyTransition(
    input: ApplyTransitionInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DemarchePcaet, ApplyTransitionError>> {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<Result<DemarchePcaet, ApplyTransitionError>> => {
      const demarche = await this.demarchePcaetRefRepository.findRef(
        input,
        { forUpdate: true },
        transaction
      );
      if (!demarche) {
        return failure(ApplyTransitionErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
      }

      // Permission d'édition vérifiée sur le collectiviteId stocké (IDOR) ;
      // les conditions plus fines (pilote, délais…) sont des guards.
      const permissionResult = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
        ResourceType.COLLECTIVITE,
        { collectiviteId: demarche.collectiviteId },
        transaction
      );
      if (!permissionResult.success) {
        return failure(ApplyTransitionErrorEnum.UNAUTHORIZED);
      }

      const pilotes = await this.pilotesRepository.listPiloteUserIds(
        demarche.id,
        transaction
      );
      const guardResults = this.guardsService.computeGuardResults(
        {
          status: demarche.status,
          pilotes,
          avisDeadlineAt: demarche.avisDeadlineAt,
        },
        user
      );
      const transitionResult = applyWorkflowTransition(
        demarche.status,
        input.transition,
        { guardResults }
      );
      if (!transitionResult.success) {
        return failure(ApplyTransitionErrorEnum[transitionResult.error]);
      }
      const toStatus = transitionResult.data.toStatus;

      // L'échéance des avis est figée au moment de la transmission : si le
      // délai légal change, les dossiers déjà transmis gardent la leur.
      const now = new Date();
      const transmission =
        input.transition === DemarchePcaetTransitionEnum.TRANSMETTRE_POUR_AVIS
          ? {
              transmittedAt: now.toISOString(),
              avisDeadlineAt: computeAvisDeadline(now).toISOString(),
            }
          : undefined;

      const persistResult =
        await this.applyTransitionRepository.persistTransition(
          demarche,
          toStatus,
          input.transition,
          user.id,
          transmission,
          transaction
        );
      if (!persistResult.success) {
        return failure(ApplyTransitionErrorEnum.DATABASE_ERROR);
      }

      this.logger.log(
        `Transition ${input.transition} applied on demarche PCAET ${demarche.id} (${demarche.status} → ${toStatus}) by user ${user.id}`
      );

      const getResult = await this.getDemarchePcaetRepository.getDemarchePcaet(
        { demarcheId: demarche.id, collectiviteId: demarche.collectiviteId },
        transaction
      );
      if (!getResult.success) {
        return failure(ApplyTransitionErrorEnum.DEMARCHE_PCAET_NOT_FOUND);
      }
      return {
        success: true,
        data: this.guardsService.enrich(getResult.data, user),
      };
    };

    return tx
      ? executeInTransaction(tx)
      : this.databaseService.db.transaction(executeInTransaction);
  }
}
