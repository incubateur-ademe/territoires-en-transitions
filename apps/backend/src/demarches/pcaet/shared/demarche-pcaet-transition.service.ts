import { Injectable, Logger } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  applyTransition,
  type DemarchePcaet,
  type DemarchePcaetTransition,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { GetDemarchePcaetRepository } from '../get-demarche-pcaet/get-demarche-pcaet.repository';
import {
  DemarchePcaetGuardsService,
  type DemarchePcaetGuardContext,
} from './demarche-pcaet-guards.service';
import {
  DemarchePcaetRefRepository,
  type DemarchePcaetRef,
} from './demarche-pcaet-ref.repository';
import {
  DemarchePcaetTransitionErrorEnum,
  toDemarchePcaetTransitionError,
  type DemarchePcaetTransitionError,
} from './demarche-pcaet-transition.errors';
import { DemarchePcaetTransitionInput } from './demarche-pcaet-transition.input';
import { DemarchePcaetTransitionRepository } from './demarche-pcaet-transition.repository';

/** Ce qu'une transition écrit sur la démarche en plus de son statut. */
export type DemarchePcaetTransitionStamps = {
  transmittedAt?: string;
  avisDeadlineAt?: string;
  publishedAt?: string | null;
};

/**
 * Les effets propres à une transition, exécutés dans la transaction qui la
 * persiste. Chaque opération écrit les siens : ils ne sont pas dérivés d'une
 * table, pour rester lisibles là où ils comptent.
 */
export type DemarchePcaetTransitionEffects = (context: {
  demarche: DemarchePcaetRef;
  /** Ce que les guards ont lu — évite de relire pour les effets. */
  guardContext: DemarchePcaetGuardContext;
  user: AuthenticatedUser;
  transaction: Transaction;
}) => Promise<DemarchePcaetTransitionStamps> | DemarchePcaetTransitionStamps;

export type DemarchePcaetTransitionResult = Result<
  DemarchePcaet,
  | DemarchePcaetTransitionError
  | 'UNAUTHORIZED'
  | 'DATABASE_ERROR'
  | 'SERVER_ERROR'
>;

/**
 * Socle des six opérations de transition : verrou de ligne, permission,
 * évaluation des guards, application du workflow, persistance et journal.
 *
 * Ce qu'il ne fait pas : décider **quelle** transition appliquer, ni ce qu'elle
 * écrit d'autre. Chaque opération le lui dit.
 */
@Injectable()
export class DemarchePcaetTransitionService {
  private readonly logger = new Logger(DemarchePcaetTransitionService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly transactionManager: TransactionManager,
    private readonly refRepository: DemarchePcaetRefRepository,
    private readonly guardsService: DemarchePcaetGuardsService,
    private readonly transitionRepository: DemarchePcaetTransitionRepository,
    private readonly getDemarchePcaetRepository: GetDemarchePcaetRepository
  ) {}

  async apply(
    input: DemarchePcaetTransitionInput,
    transition: DemarchePcaetTransition,
    { user, tx }: ServiceSecondArg,
    effects?: DemarchePcaetTransitionEffects
  ): Promise<DemarchePcaetTransitionResult> {
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<DemarchePcaetTransitionResult> => {
      // Le verrou de ligne tient jusqu'à la fin : les guards sont évalués et le
      // statut écrit sur le même état, sans transition concurrente entre les deux.
      const demarche = await this.refRepository.findRef(
        input,
        { forUpdate: true },
        transaction
      );
      if (!demarche) {
        return failure(
          DemarchePcaetTransitionErrorEnum.DEMARCHE_PCAET_NOT_FOUND
        );
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
        return failure('UNAUTHORIZED');
      }

      const guardContext = await this.guardsService.loadContext(
        demarche,
        transaction
      );
      const transitionResult = applyTransition(demarche.status, transition, {
        guardResults: this.guardsService.computeGuardResults(
          guardContext,
          user
        ),
      });
      if (!transitionResult.success) {
        return failure(toDemarchePcaetTransitionError(transitionResult));
      }
      const { toStatus } = transitionResult.data;

      const stamps = effects
        ? await effects({ demarche, guardContext, user, transaction })
        : {};

      const persistResult = await this.transitionRepository.persistTransition(
        demarche,
        toStatus,
        transition,
        user.id,
        stamps,
        transaction
      );
      if (!persistResult.success) {
        return failure('DATABASE_ERROR');
      }

      this.logger.log(
        `Transition ${transition} applied on demarche PCAET ${demarche.id} (${demarche.status} → ${toStatus}) by user ${user.id}`
      );

      const getResult = await this.getDemarchePcaetRepository.getDemarchePcaet(
        { demarcheId: demarche.id, collectiviteId: demarche.collectiviteId },
        transaction
      );
      if (!getResult.success) {
        return failure(
          DemarchePcaetTransitionErrorEnum.DEMARCHE_PCAET_NOT_FOUND
        );
      }
      return {
        success: true,
        data: await this.guardsService.enrich(
          getResult.data,
          user,
          transaction
        ),
      };
    };

    return this.transactionManager.executeSingle(executeInTransaction, tx);
  }
}
