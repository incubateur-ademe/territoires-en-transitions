import { Injectable, Logger } from '@nestjs/common';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { bibliothequeFichierTable } from '@tet/backend/collectivites/documents/models/bibliotheque-fichier.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { DocumentHash } from '@tet/domain/collectivites';
import { PlanStatusEnum } from '@tet/domain/plans';
import { isUniqueViolation } from '@tet/backend/utils/nest/errors.utils';
import {
  and,
  count,
  desc,
  eq,
  getTableColumns,
  gt,
  inArray,
  isNotNull,
  lt,
  ne,
  or,
  sql,
} from 'drizzle-orm';
import { PgUpdateSetSource } from 'drizzle-orm/pg-core';
import { ImportCheckpoint } from './models/import-checkpoint';
import { PIPELINE_CHECKPOINT_SCHEMA_VERSION } from './pipeline/pipeline-checkpoint';
import { ImportJobStats } from './models/import-job-stats';
import { PlanDraft } from './models/plan-draft';
import {
  AiPlanImportJob,
  aiPlanImportJobInFlightStatuses,
  AiPlanImportJobOptions,
  AiPlanImportJobStatus,
  AiPlanImportJobStatusEnum,
  AiPlanImportJobStatusView,
  PreviousAiImport,
} from './models/ai-plan-import-job';
import { aiPlanImportJobTable } from './models/ai-plan-import-job.table';
import {
  AI_PLAN_IMPORT_CHECKPOINT_RETENTION_DAYS,
  AI_PLAN_IMPORT_MAX_IN_FLIGHT_JOBS_PER_USER,
  AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY,
} from './ai-plan-import.constants';
import {
  AiPlanImportErrorEnum,
  type AiPlanImportError,
} from './ai-plan-import.errors';
import {
  initialStepStates,
  StepStates,
} from './pipeline/run-import-pipeline';

export type CreateJobInput = {
  collectiviteId: number;
  createdBy: string;
  sourcePath: string;
  fichierId: number;
  options: AiPlanImportJobOptions;
};

/** Le fichier importé, désigné par sa ligne de bibliothèque ou son hash. */
export type ImportedFichierRef =
  | { collectiviteId: number; fichierId: number }
  | { collectiviteId: number; hash: DocumentHash };

class CreatePlanAbortedError<E> extends Error {
  constructor(readonly result: Result<never, E>) {
    super('Création du plan du job annulée');
  }
}

// Le point de reprise pèse le texte du document : il ne se lit qu'à part.
const { checkpoint: _checkpoint, ...jobColumns } =
  getTableColumns(aiPlanImportJobTable);

/**
 * Reprenable : en échec, avec un point de reprise au format courant et encore
 * dans le délai de rétention.
 */
const isResumable = sql<boolean>`${aiPlanImportJobTable.status} = ${
  AiPlanImportJobStatusEnum.FAILED
} AND ${aiPlanImportJobTable.checkpoint} ->> 'schemaVersion' = ${String(
  PIPELINE_CHECKPOINT_SCHEMA_VERSION
)} AND ${
  aiPlanImportJobTable.modifiedAt
} > now() - make_interval(days => ${AI_PLAN_IMPORT_CHECKPOINT_RETENTION_DAYS})`;

const statusViewProjection = {
  id: aiPlanImportJobTable.id,
  collectiviteId: aiPlanImportJobTable.collectiviteId,
  status: aiPlanImportJobTable.status,
  stepStates: aiPlanImportJobTable.stepStates,
  error: aiPlanImportJobTable.error,
  createdPlanId: aiPlanImportJobTable.createdPlanId,
  qualitativeReview: sql<
    string | null
  >`${aiPlanImportJobTable.draft} ->> 'qualitativeReview'`,
  resumable: sql<boolean>`coalesce(${isResumable}, false)`,
  withSecteurs: sql<boolean>`coalesce((${aiPlanImportJobTable.options} ->> 'withSecteurs')::boolean, false)`,
};

@Injectable()
export class AiPlanImportJobRepository {
  private readonly db = this.database.db;
  private readonly logger = new Logger(AiPlanImportJobRepository.name);

  constructor(private readonly database: DatabaseService) {}

  /**
   * Crée le job si l'utilisateur n'a aucun autre import en cours (sauf
   * `limitUserInFlight: false`), si la collectivité reste sous son quota sur
   * 24 heures glissantes et si elle n'a pas déjà un import en cours.
   */
  async createWithinQuotas<E>(
    input: CreateJobInput,
    {
      limitUserInFlight,
      createPlan,
    }: {
      limitUserInFlight: boolean;
      /** Crée le plan vide du job, dans la même transaction. */
      createPlan: (tx: Transaction) => Promise<Result<number, E>>;
    }
  ): Promise<Result<AiPlanImportJob, AiPlanImportError | E>> {
    try {
      return await this.db.transaction(async (tx) => {
        if (limitUserInFlight) {
          // Sans ce verrou, deux lancements simultanés du même utilisateur sur
          // deux collectivités passeraient chacun le comptage. Le quota
          // journalier n'en a pas besoin : l'index in-flight n'admet qu'un
          // lancement à la fois par collectivité.
          await tx.execute(
            sql`SELECT pg_advisory_xact_lock(hashtext('ai_plan_import_job'), hashtext(${input.createdBy}))`
          );

          const [userInFlight] = await tx
            .select({ value: count() })
            .from(aiPlanImportJobTable)
            .where(
              and(
                eq(aiPlanImportJobTable.createdBy, input.createdBy),
                inArray(
                  aiPlanImportJobTable.status,
                  aiPlanImportJobInFlightStatuses
                )
              )
            );
          if (
            userInFlight.value >= AI_PLAN_IMPORT_MAX_IN_FLIGHT_JOBS_PER_USER
          ) {
            return failure(AiPlanImportErrorEnum.USER_IN_FLIGHT_JOB_EXISTS);
          }
        }

        const [lastDay] = await tx
          .select({ value: count() })
          .from(aiPlanImportJobTable)
          .where(
            and(
              eq(aiPlanImportJobTable.collectiviteId, input.collectiviteId),
              gt(
                aiPlanImportJobTable.createdAt,
                sql`now() - interval '24 hours'`
              )
            )
          );
        if (lastDay.value >= AI_PLAN_IMPORT_MAX_JOBS_PER_COLLECTIVITE_PER_DAY) {
          return failure(AiPlanImportErrorEnum.DAILY_QUOTA_EXCEEDED);
        }

        const [created] = await tx
          .insert(aiPlanImportJobTable)
          .values({
            collectiviteId: input.collectiviteId,
            createdBy: input.createdBy,
            sourcePath: input.sourcePath,
            fichierId: input.fichierId,
            options: input.options,
            status: AiPlanImportJobStatusEnum.PENDING,
            stepStates: initialStepStates(),
          })
          .onConflictDoNothing()
          .returning({ id: aiPlanImportJobTable.id });

        if (!created) {
          return failure(AiPlanImportErrorEnum.IN_FLIGHT_JOB_EXISTS);
        }

        const plan = await createPlan(tx);
        if (!plan.success) {
          // Lever annule l'insertion du job : renvoyer un échec la validerait.
          throw new CreatePlanAbortedError(plan);
        }

        const [withPlan] = await tx
          .update(aiPlanImportJobTable)
          .set({ createdPlanId: plan.data })
          .where(eq(aiPlanImportJobTable.id, created.id))
          .returning(jobColumns);
        return success(withPlan);
      });
    } catch (error) {
      if (error instanceof CreatePlanAbortedError) {
        return error.result as Result<never, E>;
      }
      this.logger.error(`Création du job d'import: ${getErrorMessage(error)}`);
      return failure(AiPlanImportErrorEnum.CREATE_JOB_ERROR, toError(error));
    }
  }

  /**
   * Plan le plus récent, encore présent et non en échec, issu d'un import du
   * même fichier dans la même collectivité.
   */
  async findPreviousImport(
    ref: ImportedFichierRef
  ): Promise<Result<PreviousAiImport | null, AiPlanImportError>> {
    try {
      const [row] = await this.db
        .select({
          planId: axeTable.id,
          planNom: axeTable.nom,
          planStatus: axeTable.status,
          importedAt: aiPlanImportJobTable.createdAt,
        })
        .from(aiPlanImportJobTable)
        .innerJoin(
          bibliothequeFichierTable,
          eq(bibliothequeFichierTable.id, aiPlanImportJobTable.fichierId)
        )
        .innerJoin(axeTable, eq(axeTable.id, aiPlanImportJobTable.createdPlanId))
        .where(
          and(
            eq(aiPlanImportJobTable.collectiviteId, ref.collectiviteId),
            eq(bibliothequeFichierTable.collectiviteId, ref.collectiviteId),
            'fichierId' in ref
              ? eq(bibliothequeFichierTable.id, ref.fichierId)
              : eq(bibliothequeFichierTable.hash, ref.hash),
            ne(axeTable.status, PlanStatusEnum.FAILED)
          )
        )
        .orderBy(desc(aiPlanImportJobTable.createdAt))
        .limit(1);

      return success(row ?? null);
    } catch (error) {
      this.logger.error(
        `Recherche d'un import antérieur pour la collectivité ${
          ref.collectiviteId
        }: ${getErrorMessage(error)}`
      );
      return failure(AiPlanImportErrorEnum.GET_JOB_ERROR, toError(error));
    }
  }

  async getById(
    id: string
  ): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    try {
      const [row] = await this.db
        .select(jobColumns)
        .from(aiPlanImportJobTable)
        .where(eq(aiPlanImportJobTable.id, id))
        .limit(1);

      if (!row) {
        return failure(AiPlanImportErrorEnum.JOB_NOT_FOUND);
      }

      return success(row);
    } catch (error) {
      this.logger.error(
        `Lecture du job d'import ${id}: ${getErrorMessage(error)}`
      );
      return failure(AiPlanImportErrorEnum.GET_JOB_ERROR, toError(error));
    }
  }

  async getStatusView(
    id: string
  ): Promise<Result<AiPlanImportJobStatusView, AiPlanImportError>> {
    try {
      const [row] = await this.db
        .select(statusViewProjection)
        .from(aiPlanImportJobTable)
        .where(eq(aiPlanImportJobTable.id, id))
        .limit(1);

      if (!row) {
        return failure(AiPlanImportErrorEnum.JOB_NOT_FOUND);
      }

      return success(row);
    } catch (error) {
      this.logger.error(
        `Lecture du statut du job ${id}: ${getErrorMessage(error)}`
      );
      return failure(AiPlanImportErrorEnum.GET_JOB_ERROR, toError(error));
    }
  }

  async findInFlightByCollectivite(
    collectiviteId: number
  ): Promise<Result<AiPlanImportJobStatusView | null, AiPlanImportError>> {
    try {
      const [row] = await this.db
        .select(statusViewProjection)
        .from(aiPlanImportJobTable)
        .where(
          and(
            eq(aiPlanImportJobTable.collectiviteId, collectiviteId),
            inArray(
              aiPlanImportJobTable.status,
              aiPlanImportJobInFlightStatuses
            )
          )
        )
        .orderBy(desc(aiPlanImportJobTable.createdAt))
        .limit(1);

      return success(row ?? null);
    } catch (error) {
      this.logger.error(
        `Reading in-flight job for collectivité ${collectiviteId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(AiPlanImportErrorEnum.GET_JOB_ERROR, toError(error));
    }
  }

  async countInFlight(): Promise<Result<number, AiPlanImportError>> {
    try {
      const [row] = await this.db
        .select({ value: count() })
        .from(aiPlanImportJobTable)
        .where(
          inArray(aiPlanImportJobTable.status, aiPlanImportJobInFlightStatuses)
        );
      return success(row.value);
    } catch (error) {
      this.logger.error(
        `Comptage des jobs en cours: ${getErrorMessage(error)}`
      );
      return failure(AiPlanImportErrorEnum.GET_JOB_ERROR, toError(error));
    }
  }

  /**
   * Depuis `running` aussi : BullMQ redistribue le job d'un processus arrêté
   * en cours de route. Le passage augmente alors, et l'exécution qu'il
   * remplace, si elle tourne encore, n'écrit plus rien (cf. `attempt`).
   */
  async transitionToRunning(
    id: string
  ): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    return this.updateAndReturn({
      id,
      patch: {
        status: AiPlanImportJobStatusEnum.RUNNING,
        error: null,
        startedAt: sql`coalesce(${aiPlanImportJobTable.startedAt}, now())`,
        attempt: sql`${aiPlanImportJobTable.attempt} + CASE WHEN ${aiPlanImportJobTable.status} = ${AiPlanImportJobStatusEnum.RUNNING} THEN 1 ELSE 0 END`,
        modifiedAt: new Date().toISOString(),
      },
      allowedFromStatuses: aiPlanImportJobInFlightStatuses,
    });
  }

  async saveCheckpoint(
    id: string,
    attempt: number,
    checkpoint: ImportCheckpoint
  ): Promise<Result<undefined, AiPlanImportError>> {
    const saved = await this.updateAndReturn({
      id,
      attempt,
      patch: { checkpoint, modifiedAt: new Date().toISOString() },
      allowedFromStatuses: [AiPlanImportJobStatusEnum.RUNNING],
    });
    return saved.success ? success(undefined) : saved;
  }

  async getCheckpoint(
    id: string
  ): Promise<Result<ImportCheckpoint | null, AiPlanImportError>> {
    try {
      const [row] = await this.db
        .select({ checkpoint: aiPlanImportJobTable.checkpoint })
        .from(aiPlanImportJobTable)
        .where(eq(aiPlanImportJobTable.id, id))
        .limit(1);
      return row
        ? success(row.checkpoint)
        : failure(AiPlanImportErrorEnum.JOB_NOT_FOUND);
    } catch (error) {
      this.logger.error(
        `Lecture du point de reprise du job ${id}: ${getErrorMessage(error)}`
      );
      return failure(AiPlanImportErrorEnum.GET_JOB_ERROR, toError(error));
    }
  }

  /** L'import reprenable qui a créé ce plan, s'il y en a un. */
  async findResumableByPlan(
    planId: number
  ): Promise<Result<{ jobId: string } | null, AiPlanImportError>> {
    try {
      const [row] = await this.db
        .select({ jobId: aiPlanImportJobTable.id })
        .from(aiPlanImportJobTable)
        .where(and(eq(aiPlanImportJobTable.createdPlanId, planId), isResumable))
        .orderBy(desc(aiPlanImportJobTable.createdAt))
        .limit(1);
      return success(row ?? null);
    } catch (error) {
      this.logger.error(
        `Recherche de l'import reprenable du plan ${planId}: ${getErrorMessage(
          error
        )}`
      );
      return failure(AiPlanImportErrorEnum.GET_JOB_ERROR, toError(error));
    }
  }

  /**
   * Remet en file un import reprenable. Le temps de traitement repart de la
   * reprise : celui passé en échec n'en fait pas partie.
   */
  async resumeFailed(
    id: string,
    tx: Transaction
  ): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    try {
      const [row] = await tx
        .update(aiPlanImportJobTable)
        .set({
          status: AiPlanImportJobStatusEnum.PENDING,
          error: null,
          startedAt: null,
          finishedAt: null,
          attempt: sql`${aiPlanImportJobTable.attempt} + 1`,
          modifiedAt: new Date().toISOString(),
        })
        .where(and(eq(aiPlanImportJobTable.id, id), isResumable))
        .returning(jobColumns);
      return row
        ? success(row)
        : failure(AiPlanImportErrorEnum.JOB_NOT_RESUMABLE);
    } catch (error) {
      if (isUniqueViolation(error)) {
        return failure(AiPlanImportErrorEnum.IN_FLIGHT_JOB_EXISTS);
      }
      this.logger.error(`Reprise du job ${id}: ${getErrorMessage(error)}`);
      return failure(AiPlanImportErrorEnum.UPDATE_JOB_ERROR, toError(error));
    }
  }

  /**
   * Le point de reprise d'un échec porte le texte du document : il ne survit
   * pas à la durée de rétention, ni à un nouvel import de la collectivité
   * quand elle est donnée.
   */
  async purgeFailedCheckpoints(
    collectiviteId?: number
  ): Promise<Result<undefined, AiPlanImportError>> {
    const expired = lt(
      aiPlanImportJobTable.modifiedAt,
      sql`now() - make_interval(days => ${AI_PLAN_IMPORT_CHECKPOINT_RETENTION_DAYS})`
    );
    try {
      await this.db
        .update(aiPlanImportJobTable)
        .set({ checkpoint: null })
        .where(
          and(
            eq(aiPlanImportJobTable.status, AiPlanImportJobStatusEnum.FAILED),
            isNotNull(aiPlanImportJobTable.checkpoint),
            collectiviteId === undefined
              ? expired
              : or(
                  eq(aiPlanImportJobTable.collectiviteId, collectiviteId),
                  expired
                )
          )
        );
      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Purge des points de reprise: ${getErrorMessage(error)}`
      );
      return failure(AiPlanImportErrorEnum.UPDATE_JOB_ERROR, toError(error));
    }
  }

  async updateStepStates(
    id: string,
    attempt: number,
    stepStates: StepStates
  ): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    return this.updateAndReturn({
      id,
      attempt,
      patch: { stepStates, modifiedAt: new Date().toISOString() },
      allowedFromStatuses: [AiPlanImportJobStatusEnum.RUNNING],
    });
  }

  async markDone(input: {
    id: string;
    attempt: number;
    draft: PlanDraft;
    stepStates: StepStates;
    createdPlanId: number;
    stats?: ImportJobStats;
    tx?: Transaction;
  }): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    return this.updateAndReturn({
      id: input.id,
      attempt: input.attempt,
      patch: {
        status: AiPlanImportJobStatusEnum.DONE,
        draft: input.draft,
        stepStates: input.stepStates,
        createdPlanId: input.createdPlanId,
        stats: input.stats,
        checkpoint: null,
        finishedAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      },
      allowedFromStatuses: [AiPlanImportJobStatusEnum.RUNNING],
      tx: input.tx,
    });
  }

  async markFailed(input: {
    id: string;
    /** Absent : l'échec vaut quel que soit le passage (échec terminal). */
    attempt?: number;
    error: string;
    /** Absent : l'avancement en base reste celui de la dernière étape. */
    stepStates?: StepStates;
    draft?: PlanDraft;
    stats?: ImportJobStats;
    /** Point de reprise devenu inutilisable : l'import n'est plus reprenable. */
    dropCheckpoint?: boolean;
  }): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    return this.updateAndReturn({
      id: input.id,
      attempt: input.attempt,
      patch: {
        status: AiPlanImportJobStatusEnum.FAILED,
        error: input.error,
        stepStates: input.stepStates,
        draft: input.draft,
        stats: input.stats,
        ...(input.dropCheckpoint ? { checkpoint: null } : {}),
        finishedAt: new Date().toISOString(),
        modifiedAt: new Date().toISOString(),
      },
      allowedFromStatuses: [
        AiPlanImportJobStatusEnum.PENDING,
        AiPlanImportJobStatusEnum.RUNNING,
      ],
    });
  }

  async deleteIfPending(
    id: string
  ): Promise<Result<undefined, AiPlanImportError>> {
    try {
      await this.db
        .delete(aiPlanImportJobTable)
        .where(
          and(
            eq(aiPlanImportJobTable.id, id),
            eq(aiPlanImportJobTable.status, AiPlanImportJobStatusEnum.PENDING)
          )
        );
      return success(undefined);
    } catch (error) {
      this.logger.error(
        `Suppression du job pending ${id}: ${getErrorMessage(error)}`
      );
      return failure(AiPlanImportErrorEnum.UPDATE_JOB_ERROR, toError(error));
    }
  }

  /**
   * `attempt` : seule l'exécution du passage en cours écrit. Une exécution
   * remplacée par une reprise (verrou BullMQ perdu) ne touche plus au job.
   */
  private async updateAndReturn({
    id,
    attempt,
    patch,
    allowedFromStatuses,
    tx,
  }: {
    id: string;
    attempt?: number;
    patch: PgUpdateSetSource<typeof aiPlanImportJobTable>;
    allowedFromStatuses: AiPlanImportJobStatus[];
    tx?: Transaction;
  }): Promise<Result<AiPlanImportJob, AiPlanImportError>> {
    try {
      const [row] = await (tx ?? this.db)
        .update(aiPlanImportJobTable)
        .set(patch)
        .where(
          and(
            eq(aiPlanImportJobTable.id, id),
            inArray(aiPlanImportJobTable.status, allowedFromStatuses),
            attempt === undefined
              ? undefined
              : eq(aiPlanImportJobTable.attempt, attempt)
          )
        )
        .returning(jobColumns);

      if (!row) {
        return failure(AiPlanImportErrorEnum.JOB_NOT_FOUND);
      }

      return success(row);
    } catch (error) {
      this.logger.error(
        `Mise à jour du job ${id}: ${getErrorMessage(error)}`
      );
      return failure(AiPlanImportErrorEnum.UPDATE_JOB_ERROR, toError(error));
    }
  }
}

const toError = (error: unknown): Error =>
  error instanceof Error ? error : new Error(getErrorMessage(error));
