import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  SetPersonnalisationReponseSavedEvent,
  SetPersonnalisationReponseService,
} from '@tet/backend/collectivites/personnalisations/set-personnalisation-reponse/set-personnalisation-reponse.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { sqlToDate, sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { toSlug } from '@tet/backend/utils/string.utils';
import { PersonnalisationReponsesPayload } from '@tet/domain/collectivites';
import {
  getReferentielIdFromActionId,
  ReferentielId,
  SCORES_PAYLOAD_CURRENT_VERSION,
  ScoreSnapshot,
  ScoreSnapshotCreate,
  ScoresPayload,
  SnapshotJalon,
  SnapshotJalonEnum,
  SnapshotWithoutPayloads,
} from '@tet/domain/referentiels';
import { roundTo } from '@tet/domain/utils';
import { and, eq, getTableColumns, sql } from 'drizzle-orm';
import { omit } from 'es-toolkit';
import { DateTime } from 'luxon';
import { z } from 'zod';
import {
  CollectiviteReferentielModeService,
  isCollectiviteReferentielDisplayId,
} from '../../collectivites/collectivite-referentiel-mode/collectivite-referentiel-mode.service';
import { AuthUser } from '../../users/models/auth.models';
import { DatabaseService } from '../../utils/database/database.service';
import { Transaction } from '../../utils/database/transaction.utils';
import { isErrorWithCause } from '../../utils/nest/errors.utils';
import { PgIntegrityConstraintViolation } from '../../utils/postgresql-error-codes.enum';
import { ActionPersonnalisationsService } from '../action-personnalisations/action-personnalisations.service';
import ScoresService from '../compute-score/scores.service';
import { GetReferentielDefinitionService } from '../definitions/get-referentiel-definition/get-referentiel-definition.service';
import { snapshotTable } from './snapshot.table';
import { SNAPSHOTS, USER_MUTABLE_SNAPSHOT_JALONS } from './snapshots.constants';
import { SnapshotsErrorEnum, type SnapshotsError } from './snapshots.errors';
import { upsertSnapshotInputSchema } from './upsert-snapshot.input';

@Injectable()
export class SnapshotsService {
  private readonly logger = new Logger(SnapshotsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly scoresService: ScoresService,
    private readonly actionPersonnalisationService: ActionPersonnalisationsService,
    private readonly setPersonnalisationReponseService: SetPersonnalisationReponseService,
    private readonly referentielDefinitionService: GetReferentielDefinitionService,
    private readonly collectiviteReferentielModeService: CollectiviteReferentielModeService
  ) {
    // Recompute score snapshots when personnalisation answers change.
    this.setPersonnalisationReponseService.registerResponseListener((event) =>
      this.onPersonnalisationResponseSaved(event)
    );
  }

  private async onPersonnalisationResponseSaved(
    event: SetPersonnalisationReponseSavedEvent
  ): Promise<void> {
    const actionIds =
      await this.actionPersonnalisationService.getActionIdsForQuestion(
        event.questionId
      );

    if (!actionIds.length) {
      return;
    }

    const uniqueReferentielIds = [
      ...new Set(
        actionIds.map((actionId) => getReferentielIdFromActionId(actionId))
      ),
    ];

    // Recompute current snapshots for every impacted referential.
    this.logger.log(
      `Recomputing current snapshots for ${
        uniqueReferentielIds.length
      } referentiels (${uniqueReferentielIds.join(', ')}) for collectivite ${
        event.collectiviteId
      }`
    );
    await Promise.all(
      uniqueReferentielIds.map(async (referentielId) => {
        const result = await this.computeAndUpsert(
          {
            collectiviteId: event.collectiviteId,
            referentielId,
            jalon: SnapshotJalonEnum.COURANT,
          },
          { user: event.user }
        );

        if (!result.success) {
          this.logger.error(
            `Échec du recalcul du snapshot courant pour la collectivité ${event.collectiviteId} et le référentiel ${referentielId}`,
            result.cause?.stack
          );
        }
      })
    );
  }

  private getDb(tx?: Transaction) {
    return tx ?? this.databaseService.db;
  }

  private canUserMutateSnapshot(jalon: SnapshotJalon): boolean {
    return USER_MUTABLE_SNAPSHOT_JALONS.includes(jalon);
  }

  private getDefaultSnapshotMetadata({
    nom: snapshotNom,
    jalon,
    anneeAudit,
  }: {
    nom?: string;
    jalon?: SnapshotJalon;
    anneeAudit?: number;
  }): Result<{ ref: string; nom: string }, SnapshotsError> {
    let ref = '';
    let nom = snapshotNom || '';

    if (
      (jalon === SnapshotJalonEnum.PRE_AUDIT ||
        jalon === SnapshotJalonEnum.POST_AUDIT) &&
      !anneeAudit
    ) {
      this.logger.warn(
        `L'année de l'audit doit être définie pour le jalon ${jalon}`
      );
      return failure(SnapshotsErrorEnum.SNAPSHOT_INVALID_METADATA);
    }

    switch (jalon) {
      case SnapshotJalonEnum.PRE_AUDIT:
        ref = `${SNAPSHOTS.PRE_AUDIT_REF_PREFIX}${anneeAudit}`;
        nom = `${anneeAudit}${SNAPSHOTS.PRE_AUDIT_NOM_SUFFIX}`;
        break;

      case SnapshotJalonEnum.POST_AUDIT:
        ref = `${SNAPSHOTS.POST_AUDIT_REF_PREFIX}${anneeAudit}`;
        nom = `${anneeAudit}${SNAPSHOTS.POST_AUDIT_NOM_SUFFIX}`;
        break;

      case SnapshotJalonEnum.COURANT:
        ref = nom
          ? `${SNAPSHOTS.SCORE_PERSONNALISE_REF_PREFIX}${toSlug(nom)}`
          : SNAPSHOTS.SCORE_COURANT_REF;
        nom = nom || SNAPSHOTS.SCORE_COURANT_NOM;
        break;

      case SnapshotJalonEnum.DATE_PERSONNALISEE:
        ref = nom ? toSlug(nom) : '';
        break;

      case SnapshotJalonEnum.PRE_SWITCH_TE:
        ref = SNAPSHOTS.PRE_SWITCH_TE_REF;
        nom = SNAPSHOTS.PRE_SWITCH_TE_NOM;
        break;

      default:
        this.logger.warn(
          `Un nom de snapshot doit être défini pour le jalon ${jalon}`
        );
        return failure(SnapshotsErrorEnum.SNAPSHOT_INVALID_METADATA);
    }

    ref = ref.slice(0, 30);

    if (!nom || !ref) {
      this.logger.warn(
        `Un nom de snapshot doit être défini pour le jalon ${jalon}`
      );
      return failure(SnapshotsErrorEnum.SNAPSHOT_INVALID_METADATA);
    }

    return success({ ref, nom });
  }

  /**
   * Upsert score snapshot: update always allowed
   * @param snapshot
   * @returns
   */
  private async upsertScoreSnapshot(
    snapshot: ScoreSnapshotCreate,
    tx?: Transaction
  ): Promise<ScoreSnapshot> {
    return await this.getDb(tx)
      .insert(snapshotTable)
      .values(snapshot)
      .onConflictDoUpdate({
        target: [
          snapshotTable.collectiviteId,
          snapshotTable.referentielId,
          snapshotTable.ref,
        ],
        set: {
          date: sql.raw(`excluded.${snapshotTable.date.name}`),
          pointFait: sql.raw(`excluded.${snapshotTable.pointFait.name}`),
          pointPotentiel: sql.raw(
            `excluded.${snapshotTable.pointPotentiel.name}`
          ),
          pointProgramme: sql.raw(
            `excluded.${snapshotTable.pointProgramme.name}`
          ),
          pointPasFait: sql.raw(`excluded.${snapshotTable.pointPasFait.name}`),
          scoresPayload: sql.raw(
            `excluded.${snapshotTable.scoresPayload.name}`
          ),
          personnalisationReponses: sql.raw(
            `excluded.${snapshotTable.personnalisationReponses.name}`
          ),
          referentielVersion: sql.raw(
            `excluded.${snapshotTable.referentielVersion.name}`
          ),
          modifiedBy: sql.raw(`excluded.${snapshotTable.modifiedBy.name}`),
        },
      })
      .returning()
      .then((result) => result[0]);
  }

  async updateName(
    collectiviteId: number,
    referentielId: ReferentielId,
    snapshotRef: string,
    newName: string
  ): Promise<Result<ScoreSnapshot[], SnapshotsError>> {
    this.logger.log(
      `Mise à jour du nom du snapshot ref: ${snapshotRef}, pour la collectivité ${collectiviteId} et le référentiel ${referentielId}. Nouveau nom: ${newName}.`
    );

    try {
      const snapshot = await this.databaseService.db
        .select()
        .from(snapshotTable)
        .where(
          and(
            eq(snapshotTable.collectiviteId, collectiviteId),
            eq(snapshotTable.referentielId, referentielId),
            eq(snapshotTable.ref, snapshotRef)
          )
        )
        .then((result) => result[0]);

      if (!snapshot) {
        return failure(SnapshotsErrorEnum.SNAPSHOT_NOT_FOUND);
      }

      if (!this.canUserMutateSnapshot(snapshot.jalon)) {
        return failure(SnapshotsErrorEnum.SNAPSHOT_NAME_UPDATE_FORBIDDEN);
      }

      const updatedSnapshots = await this.databaseService.db
        .update(snapshotTable)
        .set({ nom: newName })
        .where(
          and(
            eq(snapshotTable.collectiviteId, collectiviteId),
            eq(snapshotTable.referentielId, referentielId),
            eq(snapshotTable.ref, snapshotRef)
          )
        )
        .returning();

      return success(updatedSnapshots);
    } catch (error) {
      this.logger.error(error);
      return failure(
        SnapshotsErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Insert with upsert only allowed if jalon is current score
   */
  private async insertSnapshotOrUpsertIfCurrentJalon(
    snapshot: ScoreSnapshotCreate,
    tx?: Transaction
  ): Promise<ScoreSnapshot> {
    return this.getDb(tx)
      .insert(snapshotTable)
      .values(snapshot)
      .onConflictDoUpdate({
        // Only allow to update current score
        target: [snapshotTable.collectiviteId, snapshotTable.referentielId],
        targetWhere: eq(snapshotTable.jalon, SnapshotJalonEnum.COURANT),
        set: {
          date: sql.raw(`excluded.${snapshotTable.date.name}`),
          pointFait: sql.raw(`excluded.${snapshotTable.pointFait.name}`),
          pointPotentiel: sql.raw(
            `excluded.${snapshotTable.pointPotentiel.name}`
          ),
          pointProgramme: sql.raw(
            `excluded.${snapshotTable.pointProgramme.name}`
          ),
          pointPasFait: sql.raw(`excluded.${snapshotTable.pointPasFait.name}`),
          scoresPayload: sql.raw(
            `excluded.${snapshotTable.scoresPayload.name}`
          ),
          personnalisationReponses: sql.raw(
            `excluded.${snapshotTable.personnalisationReponses.name}`
          ),
          referentielVersion: sql.raw(
            `excluded.${snapshotTable.referentielVersion.name}`
          ),
          modifiedBy: sql.raw(`excluded.${snapshotTable.modifiedBy.name}`),
        },
      })
      .returning()
      .then((result) => result[0]);
  }

  async computeAndUpsert(
    {
      collectiviteId,
      referentielId,
      nom,
      ref,
      date,
      jalon,
      auditId,
    }: Omit<z.infer<typeof upsertSnapshotInputSchema>, 'date'> & {
      date?: string;
    },
    { user, tx }: { user?: AuthUser; tx?: Transaction } = {}
  ): Promise<Result<ScoreSnapshot, SnapshotsError>> {
    try {
      const { scoresPayload, personnalisationReponsesPayload } =
        await this.scoresService.computeScoreForCollectivite(
          referentielId,
          collectiviteId,
          {
            date,
            jalon,
            auditId,
            snapshotNom: nom,
          },
          user
        );

      return await this.saveSnapshotForScoreResponse(
        scoresPayload,
        personnalisationReponsesPayload,
        nom,
        true,
        user?.id,
        ref,
        tx
      );
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        return failure(SnapshotsErrorEnum.COLLECTIVITE_NOT_FOUND, error);
      }
      if (error instanceof BadRequestException) {
        return failure(SnapshotsErrorEnum.SERVER_ERROR, error);
      }
      return failure(
        SnapshotsErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private async saveSnapshotForScoreResponse(
    scoresPayload: ScoresPayload,
    personnalisationResponses: PersonnalisationReponsesPayload,
    snapshotNom?: string,
    snapshotForceUpdate?: boolean,
    userId?: string | null,
    snapshotRef?: string,
    tx?: Transaction
  ): Promise<Result<ScoreSnapshot, SnapshotsError>> {
    if (!snapshotRef) {
      const metadataResult = this.getDefaultSnapshotMetadata({
        nom: snapshotNom,
        jalon: scoresPayload.jalon,
        anneeAudit: scoresPayload.anneeAudit,
      });

      if (!metadataResult.success) {
        return metadataResult;
      }

      const { ref, nom } = metadataResult.data;
      this.logger.log(`ScoreSnapshot ref: ${ref}, nom: ${nom}`);
      snapshotRef = ref;
      snapshotNom = nom;
    } else if (!snapshotNom) {
      snapshotNom = snapshotRef;
    }

    const createScoreSnapshot = {
      collectiviteId: scoresPayload.collectiviteId,
      referentielId: scoresPayload.referentielId,
      referentielVersion: scoresPayload.referentielVersion,
      auditId: scoresPayload.auditId,
      date: scoresPayload.date,
      ref: snapshotRef,
      nom: snapshotNom,
      jalon:
        snapshotRef !== SNAPSHOTS.SCORE_COURANT_REF &&
        scoresPayload.jalon === SnapshotJalonEnum.COURANT
          ? SnapshotJalonEnum.DATE_PERSONNALISEE
          : scoresPayload.jalon,
      etoiles: scoresPayload.scores.score.etoiles || null,
      pointFait: scoresPayload.scores.score.pointFait || 0,
      pointProgramme: scoresPayload.scores.score.pointProgramme || 0,
      pointPasFait: scoresPayload.scores.score.pointPasFait || 0,
      pointPotentiel: scoresPayload.scores.score.pointPotentiel || 0,
      scoresPayload: scoresPayload,
      personnalisationReponses: personnalisationResponses,
      createdBy: userId,
      modifiedBy: userId,
    } satisfies ScoreSnapshotCreate;

    this.logger.log(
      `Saving score snapshot with ref ${createScoreSnapshot.ref} and type ${createScoreSnapshot.jalon} for collectivite ${createScoreSnapshot.collectiviteId} and referentiel ${createScoreSnapshot.referentielId} (force update: ${snapshotForceUpdate})`
    );

    let scoreSnapshot: ScoreSnapshot;
    try {
      if (
        snapshotForceUpdate &&
        createScoreSnapshot.jalon !== SnapshotJalonEnum.COURANT
      ) {
        const existingSnapshot = await this.getSnapshotWithoutPayloads(
          createScoreSnapshot.collectiviteId,
          createScoreSnapshot.referentielId as ReferentielId,
          createScoreSnapshot.ref,
          tx
        );

        if (
          existingSnapshot &&
          existingSnapshot.jalon !== createScoreSnapshot.jalon
        ) {
          return failure(SnapshotsErrorEnum.SNAPSHOT_JALON_MISMATCH);
        }

        this.logger.log(
          `Updating snapshot of score with ref ${createScoreSnapshot.ref} and type ${createScoreSnapshot.jalon} for collectivite ${createScoreSnapshot.collectiviteId} and referentiel ${createScoreSnapshot.referentielId}`
        );
        scoreSnapshot = await this.upsertScoreSnapshot(createScoreSnapshot, tx);
      } else {
        this.logger.log(
          `Inserting snapshot of score with ref ${createScoreSnapshot.ref} and type ${createScoreSnapshot.jalon} for collectivite ${createScoreSnapshot.collectiviteId} and referentiel ${createScoreSnapshot.referentielId}`
        );
        scoreSnapshot = await this.insertSnapshotOrUpsertIfCurrentJalon(
          createScoreSnapshot,
          tx
        );
      }
    } catch (error) {
      if (
        isErrorWithCause(error) &&
        error.cause.code === PgIntegrityConstraintViolation.UniqueViolation
      ) {
        this.logger.error(
          `Unique violation for snapshot ${createScoreSnapshot.ref}: ${error.cause.detail} (${error.cause.code}, ${error.cause.constraint})`
        );
        return failure(SnapshotsErrorEnum.SNAPSHOT_REF_ALREADY_EXISTS);
      }

      this.logger.error(error);
      return failure(
        SnapshotsErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }

    if (!scoreSnapshot) {
      return failure(SnapshotsErrorEnum.SNAPSHOT_SAVE_FAILED);
    }

    scoreSnapshot.date = DateTime.fromSQL(scoreSnapshot.date).toFormat(
      'yyyy-MM-dd'
    );
    scoreSnapshot.createdAt = DateTime.fromSQL(
      scoreSnapshot.createdAt
    ).toISO() as string;
    scoreSnapshot.modifiedAt = DateTime.fromSQL(
      scoreSnapshot.modifiedAt
    ).toISO() as string;

    return success(scoreSnapshot);
  }

  private isSnapshotPayloadOutdated(snapshot: ScoreSnapshot): boolean {
    const version = snapshot.scoresPayload.payloadVersion;
    return !version || version < SCORES_PAYLOAD_CURRENT_VERSION;
  }

  private async getSnapshotWithoutPayloads(
    collectiviteId: number,
    referentielId: ReferentielId,
    snapshotRef: string,
    tx?: Transaction
  ): Promise<SnapshotWithoutPayloads | null> {
    const result = await this.getDb(tx)
      .select(
        omit(getTableColumns(snapshotTable), [
          'scoresPayload',
          'personnalisationReponses',
        ])
      )
      .from(snapshotTable)
      .where(
        and(
          eq(snapshotTable.collectiviteId, collectiviteId),
          eq(snapshotTable.referentielId, referentielId),
          eq(snapshotTable.ref, snapshotRef)
        )
      );

    return result.length ? result[0] : null;
  }

  async get(
    collectiviteId: number,
    referentielId: ReferentielId,
    snapshotRef: string = SNAPSHOTS.SCORE_COURANT_REF,
    { user, tx }: { user?: AuthUser; tx?: Transaction } = {}
  ): Promise<Result<ScoreSnapshot, SnapshotsError>> {
    let referentielDefinition;
    let snapshot: ScoreSnapshot | undefined;

    try {
      referentielDefinition =
        await this.referentielDefinitionService.getReferentielDefinition(
          referentielId
        );
      snapshot = await this.getDb(tx)
        .select({
          ...getTableColumns(snapshotTable),
          date: sqlToDate(snapshotTable.date),
          createdAt: sqlToDateTimeISO(snapshotTable.createdAt),
          modifiedAt: sqlToDateTimeISO(snapshotTable.modifiedAt),
        })
        .from(snapshotTable)
        .where(
          and(
            eq(snapshotTable.collectiviteId, collectiviteId),
            eq(snapshotTable.referentielId, referentielId),
            eq(snapshotTable.ref, snapshotRef)
          )
        )
        .limit(1)
        .then((result) => result[0]);
    } catch (error) {
      this.logger.error(error);
      if (error instanceof NotFoundException) {
        return failure(SnapshotsErrorEnum.NOT_FOUND, error);
      }
      return failure(
        SnapshotsErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }

    if (snapshotRef === SNAPSHOTS.SCORE_COURANT_REF) {
      const needsRecompute = !snapshot
        ? 'no-snapshot'
        : referentielDefinition.version !== snapshot.referentielVersion
        ? 'referentiel-version-differ'
        : this.isSnapshotPayloadOutdated(snapshot)
        ? 'payload-version-outdated'
        : false;

      if (needsRecompute) {
        const logMessage =
          needsRecompute === 'no-snapshot'
            ? `no-snapshot: Force compute of current score for '${referentielId}' and CT ${collectiviteId} (referentiel version: ${referentielDefinition.version}, snapshot version: ${snapshot?.referentielVersion})`
            : needsRecompute === 'referentiel-version-differ'
            ? `referentiel-version-differ: Force compute of current score for '${referentielId}' and CT ${collectiviteId} (referentiel version: ${referentielDefinition.version}, snapshot version: ${snapshot?.referentielVersion})`
            : `payload-version-outdated: Snapshot payload version outdated (${
                snapshot?.scoresPayload.payloadVersion ?? 'undefined'
              } < ${SCORES_PAYLOAD_CURRENT_VERSION}), recomputing for '${referentielId}' and CT ${collectiviteId}`;

        this.logger.log(logMessage);

        const computeResult = await this.computeAndUpsert(
          {
            collectiviteId,
            referentielId,
            jalon: SnapshotJalonEnum.COURANT,
          },
          { user, tx }
        );

        if (!computeResult.success) {
          return computeResult;
        }

        snapshot = computeResult.data;
      }
    }

    if (!snapshot) {
      return failure(SnapshotsErrorEnum.SNAPSHOT_NOT_FOUND);
    }

    return success(snapshot);
  }

  async getCurrent(
    collectiviteId: number,
    referentielId: ReferentielId,
    { user, tx }: { user?: AuthUser; tx?: Transaction } = {}
  ): Promise<Result<ScoreSnapshot, SnapshotsError>> {
    if (!isCollectiviteReferentielDisplayId(referentielId)) {
      return this.get(collectiviteId, referentielId, undefined, { user, tx });
    }

    const referentielModeResult =
      await this.collectiviteReferentielModeService.getReferentielMode(
        collectiviteId,
        referentielId
      );

    if (!referentielModeResult.success) {
      // si on ne sait pas si le référentiel est archivé, on ne renvoie pas
      // `score-courant`
      this.logger.error(
        `Unable to resolve referentiel mode for collectivite ${collectiviteId}, referentiel ${referentielId}: ${referentielModeResult.error}`
      );

      if (
        referentielModeResult.error === 'PREFERENCES_PARSE_ERROR' ||
        referentielModeResult.error === 'COLLECTIVITE_NOT_FOUND'
      ) {
        return failure(
          referentielModeResult.error,
          referentielModeResult.cause
        );
      }

      return failure(
        SnapshotsErrorEnum.SERVER_ERROR,
        referentielModeResult.cause
      );
    }

    if (referentielModeResult.data === 'archived') {
      return this.get(
        collectiviteId,
        referentielId,
        SNAPSHOTS.PRE_SWITCH_TE_REF,
        { user, tx }
      );
    }

    return this.get(collectiviteId, referentielId, undefined, { user, tx });
  }

  async forceRecompute(
    collectiviteId: number,
    referentielId: ReferentielId,
    snapshotRef: string,
    { user }: { user?: AuthUser } = {}
  ): Promise<Result<ScoreSnapshot, SnapshotsError>> {
    this.logger.log(
      `Forcing recompute of snapshot ${snapshotRef} for collectivite ${collectiviteId} and referentiel ${referentielId}`
    );

    let snapshot: SnapshotWithoutPayloads | null;
    try {
      snapshot = await this.getSnapshotWithoutPayloads(
        collectiviteId,
        referentielId,
        snapshotRef
      );
    } catch (error) {
      this.logger.error(error);
      return failure(
        SnapshotsErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }

    if (!snapshot) {
      return failure(SnapshotsErrorEnum.SNAPSHOT_NOT_FOUND);
    }
    this.logger.log(
      `ScoreSnapshot ${snapshotRef} modified at ${
        snapshot.modifiedAt
      }, score: ${snapshot.pointFait}/${snapshot.pointPotentiel} = ${roundTo(
        (snapshot.pointFait * 100) / snapshot.pointPotentiel,
        2
      )}%`
    );

    let computeResult: Result<ScoreSnapshot, SnapshotsError>;
    if (snapshot.jalon === SnapshotJalonEnum.COURANT) {
      computeResult = await this.computeAndUpsert(
        {
          collectiviteId,
          referentielId,
          ref: snapshotRef,
        },
        { user }
      );
    } else if (
      snapshot.jalon === SnapshotJalonEnum.POST_AUDIT ||
      snapshot.jalon === SnapshotJalonEnum.PRE_AUDIT
    ) {
      computeResult = await this.computeAndUpsert(
        {
          collectiviteId,
          referentielId,
          ref: snapshotRef,
          jalon: snapshot.jalon,
          auditId: snapshot.auditId || undefined,
        },
        { user }
      );
    } else {
      computeResult = await this.computeAndUpsert(
        {
          collectiviteId,
          referentielId,
          ref: snapshotRef,
          date: snapshot.date,
          nom: snapshot.nom,
        },
        { user }
      );
    }

    if (!computeResult.success) {
      return computeResult;
    }

    const updatedSnapshot = computeResult.data;

    this.logger.log(
      `ScoreSnapshot ${snapshotRef} updated at ${
        updatedSnapshot.modifiedAt
      }, score: ${updatedSnapshot.pointFait}/${
        updatedSnapshot.pointPotentiel
      } = ${roundTo(
        (updatedSnapshot.pointFait * 100) / updatedSnapshot.pointPotentiel,
        2
      )}%`
    );

    return success(updatedSnapshot);
  }

  async delete(
    collectiviteId: number,
    referentielId: ReferentielId,
    snapshotRef: string,
    { user }: ServiceSecondArg
  ): Promise<Result<void, SnapshotsError>> {
    let snapshot: SnapshotWithoutPayloads | null;
    try {
      snapshot = await this.getSnapshotWithoutPayloads(
        collectiviteId,
        referentielId,
        snapshotRef
      );
    } catch (error) {
      this.logger.error(error);
      return failure(
        SnapshotsErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }

    if (!snapshot) {
      return failure(SnapshotsErrorEnum.SNAPSHOT_NOT_FOUND);
    }

    if (
      !this.canUserMutateSnapshot(snapshot.jalon) &&
      !this.permissionService.hasServiceRole(user, true)
    ) {
      return failure(SnapshotsErrorEnum.SNAPSHOT_DELETION_FORBIDDEN);
    }

    const deleteResult = await this.databaseService.db
      .delete(snapshotTable)
      .where(
        and(
          eq(snapshotTable.collectiviteId, collectiviteId),
          eq(snapshotTable.referentielId, referentielId),
          eq(snapshotTable.ref, snapshotRef)
        )
      );

    if (deleteResult.rowCount === 0) {
      return failure(SnapshotsErrorEnum.SNAPSHOT_NOT_FOUND);
    }

    return success(undefined);
  }
}
