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
  type DemarchePcaetGuardId,
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
import {
  DemarchePcaetActeurEnum,
  DemarchePcaetEventEnum,
} from './tracking/demarche-pcaet-tracking.constants';
import { daysBetween } from './tracking/demarche-pcaet-tracking.rules';
import { DemarchePcaetTrackingService } from './tracking/demarche-pcaet-tracking.service';

/** Ce que la transition a constaté, pour l'événement émis une fois acquise. */
type TransitionOutcome =
  | {
      applied: true;
      fromStatus: DemarchePcaetRef['status'];
      statusEnteredAt: string | null;
    }
  | {
      applied: false;
      demarche: DemarchePcaetRef;
      blockedBy: DemarchePcaetGuardId[];
    };

/** Ce qu'une transition écrit sur la démarche en plus de son statut. */
export type DemarchePcaetTransitionStamps = {
  transmittedAt?: string;
  avisDeadlineAt?: string;
  publishedAt?: string;
  adoptedAt?: string;
};

/**
 * Ce que rendent les effets : leurs tampons, ou un `Result` quand un effet peut
 * refuser la transition avec une erreur typée.
 */
type DemarchePcaetTransitionEffectsOutput<EffectError> =
  | DemarchePcaetTransitionStamps
  | Result<DemarchePcaetTransitionStamps, EffectError>;

/**
 * Les effets propres à une transition, exécutés dans la transaction qui la
 * persiste. Chaque opération écrit les siens : ils ne sont pas dérivés d'une
 * table, pour rester lisibles là où ils comptent.
 *
 * Un effet qui rend un `Result` en échec annule la transition : la transaction
 * est annulée, l'erreur remonte telle quelle à l'appelant et aucun événement
 * `TRANSITION` n'est émis.
 */
export type DemarchePcaetTransitionEffects<EffectError = never> = (context: {
  demarche: DemarchePcaetRef;
  /** Ce que les guards ont lu — évite de relire pour les effets. */
  guardContext: DemarchePcaetGuardContext;
  user: AuthenticatedUser;
  transaction: Transaction;
}) =>
  | Promise<DemarchePcaetTransitionEffectsOutput<EffectError>>
  | DemarchePcaetTransitionEffectsOutput<EffectError>;

export type DemarchePcaetTransitionResult<EffectError = never> = Result<
  DemarchePcaet,
  | DemarchePcaetTransitionError
  | 'UNAUTHORIZED'
  | 'DATABASE_ERROR'
  | 'SERVER_ERROR'
  | EffectError
>;

/**
 * Socle des cinq opérations de transition : verrou de ligne, permission,
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
    private readonly getDemarchePcaetRepository: GetDemarchePcaetRepository,
    private readonly trackingService: DemarchePcaetTrackingService
  ) {}

  async apply<EffectError = never>(
    input: DemarchePcaetTransitionInput,
    transition: DemarchePcaetTransition,
    { user, tx }: ServiceSecondArg,
    effects?: DemarchePcaetTransitionEffects<EffectError>
  ): Promise<DemarchePcaetTransitionResult<EffectError>> {
    return this.applyWithActor(input, transition, user, tx, effects);
  }

  /**
   * Même socle, mais sans acteur : les transitions constatées par le système
   * (`avis_tous_rendus`, `delai_avis_echu`, `pcaet_suivant_adopte`) n'ont
   * personne à autoriser. La
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

  private async applyWithActor<EffectError = never>(
    input: DemarchePcaetTransitionInput,
    transition: DemarchePcaetTransition,
    user: AuthenticatedUser | null,
    tx: Transaction | undefined,
    effects?: DemarchePcaetTransitionEffects<EffectError>
  ): Promise<DemarchePcaetTransitionResult<EffectError>> {
    let outcome: TransitionOutcome | undefined;
    const executeInTransaction = async (
      transaction: Transaction
    ): Promise<DemarchePcaetTransitionResult<EffectError>> => {
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
        user,
        transaction
      );
      const transitionResult = applyTransition(demarche.status, transition, {
        guardResults: this.guardsService.computeGuardResults(
          guardContext,
          user
        ),
      });
      if (!transitionResult.success) {
        outcome = {
          applied: false,
          demarche,
          blockedBy: transitionResult.blockedBy,
        };
        return failure(toDemarchePcaetTransitionError(transitionResult));
      }
      const { toStatus } = transitionResult.data;

      // `user` conditionne l'appel autant que `effects` : les effets tamponnent
      // au nom de quelqu'un, et une transition système n'en déclare aucun.
      const effectsOutput =
        effects && user
          ? await effects({ demarche, guardContext, user, transaction })
          : {};
      // Un effet en échec refuse la transition : rendu tel quel, il annule la
      // transaction (`executeTransaction` relance tout `Result` en échec), et
      // `outcome` reste vide, donc aucun événement n'est émis.
      if ('success' in effectsOutput && !effectsOutput.success) {
        return failure(effectsOutput.error, effectsOutput.cause);
      }
      const stamps =
        'success' in effectsOutput ? effectsOutput.data : effectsOutput;

      outcome = {
        applied: true,
        fromStatus: demarche.status,
        statusEnteredAt: await this.transitionRepository.findStatusEnteredAt(
          demarche.id,
          demarche.status,
          transaction
        ),
      };

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

    const result: DemarchePcaetTransitionResult<EffectError> =
      await this.transactionManager.executeSingle(executeInTransaction, tx);
    this.trackOutcome(transition, user, outcome, result);
    return result;
  }

  private trackOutcome<EffectError>(
    transition: DemarchePcaetTransition,
    user: AuthenticatedUser | null,
    outcome: TransitionOutcome | undefined,
    result: DemarchePcaetTransitionResult<EffectError>
  ) {
    const context = {
      userId: user?.id,
      acteur: user
        ? DemarchePcaetActeurEnum.COLLECTIVITE
        : DemarchePcaetActeurEnum.SYSTEME,
    };
    if (outcome?.applied && result.success) {
      const demarche = result.data;
      this.trackingService.track(DemarchePcaetEventEnum.TRANSITION, demarche, {
        ...context,
        properties: {
          transition,
          fromStatus: outcome.fromStatus,
          toStatus: demarche.status,
          joursDepuisCreation: daysBetween(demarche.createdAt),
          joursDansStatutPrecedent: daysBetween(
            outcome.statusEnteredAt ?? demarche.createdAt
          ),
        },
      });
    } else if (outcome && !outcome.applied) {
      this.trackingService.track(
        DemarchePcaetEventEnum.TRANSITION_REFUSEE,
        outcome.demarche,
        {
          ...context,
          properties: {
            transition,
            blockedBy: outcome.blockedBy[0] ?? 'transition_not_allowed',
            blockedByAll: outcome.blockedBy,
          },
        }
      );
    }
  }
}
