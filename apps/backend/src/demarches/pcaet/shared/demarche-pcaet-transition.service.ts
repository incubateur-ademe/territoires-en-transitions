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
    return this.applyWithActor(input, transition, user, tx, effects);
  }

  /**
   * Même socle, mais sans acteur : les transitions constatées par le système
   * (`avis_tous_rendus`, `delai_avis_echu`) n'ont personne à autoriser. La
   * permission n'est donc pas vérifiée — ce sont leurs guards métier qui font
   * autorité — et le journal enregistre `created_by = null` plutôt que
   * d'imputer la bascule à un utilisateur qui ne l'a pas demandée.
   *
   * Pas d'effets ici : une transition système ne tamponne rien d'autre que son
   * statut.
   */
  async applyAsSystem(
    input: DemarchePcaetTransitionInput,
    transition: DemarchePcaetTransition,
    { tx }: { tx?: Transaction }
  ): Promise<DemarchePcaetTransitionResult> {
    return this.applyWithActor(input, transition, null, tx);
  }

  private async applyWithActor(
    input: DemarchePcaetTransitionInput,
    transition: DemarchePcaetTransition,
    user: AuthenticatedUser | null,
    tx: Transaction | undefined,
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
      // les conditions plus fines (pilote, délais…) sont des guards. Sans
      // acteur, il n'y a rien à autoriser : cf. `applyAsSystem`.
      if (user) {
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

      // `user` conditionne l'appel autant que `effects` : les effets tamponnent
      // au nom de quelqu'un, et une transition système n'en déclare aucun.
      const stamps =
        effects && user
          ? await effects({ demarche, guardContext, user, transaction })
          : {};

      const persistResult = await this.transitionRepository.persistTransition(
        demarche,
        toStatus,
        transition,
        user?.id ?? null,
        stamps,
        transaction
      );
      if (!persistResult.success) {
        return failure('DATABASE_ERROR');
      }

      this.logger.log(
        `Transition ${transition} applied on demarche PCAET ${demarche.id} (${
          demarche.status
        } → ${toStatus}) by ${user ? `user ${user.id}` : 'system'}`
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
