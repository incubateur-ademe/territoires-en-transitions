import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { sqlToDate, sqlToDateTimeISO } from '@tet/backend/utils/column.utils';
import { toSlug } from '@tet/backend/utils/string.utils';
import { PersonnalisationReponsesPayload } from '@tet/domain/collectivites';
import {
  ReferentielId,
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
import { AuthRole, AuthUser } from '../../users/models/auth.models';
import { DatabaseService } from '../../utils/database/database.service';
import { isErrorWithCause } from '../../utils/nest/errors.utils';
import { PgIntegrityConstraintViolation } from '../../utils/postgresql-error-codes.enum';
import ScoresService from '../compute-score/scores.service';
import { snapshotTable } from './snapshot.table';
import { upsertSnapshotInputSchema } from './upsert-snapshot.input';

@Injectable()
export class SnapshotsService {
  static readonly SCORE_COURANT_SNAPSHOT_REF = 'score-courant';
  static readonly SCORE_COURANT_SNAPSHOT_NOM = 'Score courant';
  static readonly PRE_AUDIT_SNAPSHOT_REF_PREFIX = 'pre-audit-';
  static readonly PRE_AUDIT_SNAPSHOT_NOM_SUFFIX = ' - avant audit ';
  static readonly POST_AUDIT_SNAPSHOT_REF_PREFIX = 'post-audit-';
  static readonly POST_AUDIT_SNAPSHOT_NOM_SUFFIX = ' - audit ';
  static readonly JOUR_SNAPSHOT_REF_PREFIX = 'jour-';
  static readonly SCORE_PERSONNALISE_REF_PREFIX = 'user-';
  static readonly JOUR_SNAPSHOT_NOM_PREFIX = ' - jour du ';

  static USER_DELETION_ALLOWED_SNAPSHOT_TYPES: SnapshotJalon[] = [
    SnapshotJalonEnum.DATE_PERSONNALISEE,
  ];

  private readonly logger = new Logger(SnapshotsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService,
    private readonly scoresService: ScoresService
  ) {}

  private getDefaultSnapshotMetadata({
    nom: snapshotNom,
    jalon,
    anneeAudit,
  }: {
    nom?: string;
    jalon?: SnapshotJalon;
    anneeAudit?: number;
  }) {
    let ref = '',
      nom = snapshotNom || '';

    if (
      (jalon === SnapshotJalonEnum.PRE_AUDIT ||
        jalon === SnapshotJalonEnum.POST_AUDIT) &&
      !anneeAudit
    ) {
      throw new InternalServerErrorException(
        `L'année de l'audit doit être définie pour le jalon ${jalon}`
      );
    }

    switch (jalon) {
      case SnapshotJalonEnum.PRE_AUDIT:
        ref = `${SnapshotsService.PRE_AUDIT_SNAPSHOT_REF_PREFIX}${anneeAudit}`;
        nom = `${anneeAudit}${SnapshotsService.PRE_AUDIT_SNAPSHOT_NOM_SUFFIX}`;
        break;

      case SnapshotJalonEnum.POST_AUDIT:
        ref = `${SnapshotsService.POST_AUDIT_SNAPSHOT_REF_PREFIX}${anneeAudit}`;
        nom = `${anneeAudit}${SnapshotsService.POST_AUDIT_SNAPSHOT_NOM_SUFFIX}`;
        break;

      case SnapshotJalonEnum.COURANT:
        ref = nom
          ? `${SnapshotsService.SCORE_PERSONNALISE_REF_PREFIX}${toSlug(nom)}`
          : SnapshotsService.SCORE_COURANT_SNAPSHOT_REF;
        nom = nom || SnapshotsService.SCORE_COURANT_SNAPSHOT_NOM;
        break;

      case SnapshotJalonEnum.DATE_PERSONNALISEE:
        ref = nom ? toSlug(nom) : '';
        break;

      default:
        throw new InternalServerErrorException(
          `Un nom de snapshot doit être défini pour le jalon ${jalon}`
        );
    }

    ref = ref.slice(0, 30);

    this.logger.log(`ScoreSnapshot ref: ${ref}, nom: ${nom}`);

    if (!nom || !ref) {
      throw new InternalServerErrorException(
        `Un nom de snapshot doit être défini pour le jalon ${jalon}`
      );
    }

    return { ref, nom };
  }

  /**
   * Upsert score snapshot: update always allowed
   * @param snapshot
   * @returns
   */
  private async upsertScoreSnapshot(
    snapshot: ScoreSnapshotCreate
  ): Promise<ScoreSnapshot> {
    return await this.databaseService.db
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
  ): Promise<ScoreSnapshot[]> {
    this.logger.log(
      `Mise à jour du nom du snapshot ref: ${snapshotRef}, pour la collectivité ${collectiviteId} et le référentiel ${referentielId}. Nouveau nom: ${newName}.`
    );

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
      throw new NotFoundException(
        `Aucun snapshot de score avec la référence ${snapshotRef} n'a été trouvé pour la collectivité ${collectiviteId} et le referentiel ${referentielId}`
      );
    }

    if (snapshot.jalon !== SnapshotJalonEnum.DATE_PERSONNALISEE) {
      throw new BadRequestException(
        `Seuls les noms des snapshots de type ${SnapshotJalonEnum.DATE_PERSONNALISEE} peuvent être modifiés`
      );
    }

    return await this.databaseService.db
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
  }

  /**
   * Insert with upsert only allowed if jalon is current score
   */
  private async insertSnapshotOrUpsertIfCurrentJalon(
    snapshot: ScoreSnapshotCreate
  ): Promise<ScoreSnapshot> {
    return this.databaseService.db
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

  async computeAndUpsert({
    collectiviteId,
    referentielId,
    nom,
    ref,
    date,
    jalon,
    auditId,
    user,
  }: z.infer<typeof upsertSnapshotInputSchema> & {
    user?: AuthUser;
  }): Promise<ScoreSnapshot> {
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

    const snapshot = await this.saveSnapshotForScoreResponse(
      scoresPayload,
      personnalisationReponsesPayload,
      nom,
      true,
      user?.id,
      ref
    );

    return snapshot;
  }

  private async saveSnapshotForScoreResponse(
    scoresPayload: ScoresPayload,
    personnalisationResponses: PersonnalisationReponsesPayload,
    snapshotNom?: string,
    snapshotForceUpdate?: boolean,
    userId?: string | null,
    snapshotRef?: string
  ): Promise<ScoreSnapshot> {
    if (!snapshotRef) {
      const { ref, nom } = this.getDefaultSnapshotMetadata({
        nom: snapshotNom,
        jalon: scoresPayload.jalon,
        anneeAudit: scoresPayload.anneeAudit,
      });
      snapshotRef = ref;
      snapshotNom = nom;
    } else {
      if (!snapshotNom) {
        snapshotNom = snapshotRef;
      }
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
        snapshotRef !== SnapshotsService.SCORE_COURANT_SNAPSHOT_REF &&
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
      if (snapshotForceUpdate) {
        const existingSnapshot = await this.getSnapshotWithoutPayloads(
          createScoreSnapshot.collectiviteId,
          createScoreSnapshot.referentielId as ReferentielId,
          createScoreSnapshot.ref
        );

        if (
          existingSnapshot &&
          existingSnapshot.jalon !== createScoreSnapshot.jalon
        ) {
          throw new BadRequestException(
            `Impossible de mettre à jour le snapshot de score avec la référence ${createScoreSnapshot.ref} pour la collectivite ${createScoreSnapshot.collectiviteId} et le referentiel ${createScoreSnapshot.referentielId} car le type de jalon est différent (existant: ${existingSnapshot?.jalon}, nouveau: ${createScoreSnapshot.jalon})`
          );
        }

        this.logger.log(
          `Updating snapshot of score with ref ${createScoreSnapshot.ref} and type ${createScoreSnapshot.jalon} for collectivite ${createScoreSnapshot.collectiviteId} and referentiel ${createScoreSnapshot.referentielId}`
        );
        scoreSnapshot = await this.upsertScoreSnapshot(createScoreSnapshot);
      } else {
        this.logger.log(
          `Inserting snapshot of score with ref ${createScoreSnapshot.ref} and type ${createScoreSnapshot.jalon} for collectivite ${createScoreSnapshot.collectiviteId} and referentiel ${createScoreSnapshot.referentielId}`
        );
        scoreSnapshot = await this.insertSnapshotOrUpsertIfCurrentJalon(
          createScoreSnapshot
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
        throw new BadRequestException(
          `Un snapshot de score avec la référence ${createScoreSnapshot.ref} existe déjà pour la collectivite ${createScoreSnapshot.collectiviteId} et le referentiel ${createScoreSnapshot.referentielId}`
        );
      }
      throw error;
    }

    if (!scoreSnapshot) {
      throw new InternalServerErrorException(
        'Impossible de sauvegarder le snapshot de score'
      );
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

    return scoreSnapshot;
  }

  private async getSnapshotWithoutPayloads(
    collectiviteId: number,
    referentielId: ReferentielId,
    snapshotRef: string
  ): Promise<SnapshotWithoutPayloads | null> {
    const result = await this.databaseService.db
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
    snapshotRef: string = SnapshotsService.SCORE_COURANT_SNAPSHOT_REF,
    user?: AuthUser
  ): Promise<ScoreSnapshot> {
    let snapshot = await this.databaseService.db
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

    if (
      snapshotRef === SnapshotsService.SCORE_COURANT_SNAPSHOT_REF &&
      !snapshot
    ) {
      this.logger.log(
        `Force compute of current score for '${referentielId}' and CT ${collectiviteId}`
      );

      // compute the score then save it into current snapshot
      snapshot = await this.computeAndUpsert({
        collectiviteId,
        referentielId,
        jalon: SnapshotJalonEnum.COURANT,
        user,
      });
    }

    if (!snapshot) {
      throw new NotFoundException(
        `Aucun snapshot de score avec la référence ${snapshotRef} n'a été trouvé pour la collectivité ${collectiviteId} et le referentiel ${referentielId}`
      );
    }

    return snapshot;
  }

  async forceRecompute(
    collectiviteId: number,
    referentielId: ReferentielId,
    snapshotRef: string,
    user?: AuthUser
  ): Promise<ScoreSnapshot> {
    this.logger.log(
      `Forcing recompute of snapshot ${snapshotRef} for collectivite ${collectiviteId} and referentiel ${referentielId}`
    );
    // Only allowed for service role
    if (user) {
      this.permissionService.hasServiceRole(user);
    }

    const snapshot = await this.getSnapshotWithoutPayloads(
      collectiviteId,
      referentielId,
      snapshotRef
    );

    if (!snapshot) {
      throw new NotFoundException(
        `Aucun snapshot de score avec la référence ${snapshotRef} n'a été trouvé pour la collectivité ${collectiviteId} et le referentiel ${referentielId}`
      );
    }
    this.logger.log(
      `ScoreSnapshot ${snapshotRef} modified at ${
        snapshot.modifiedAt
      }, score: ${snapshot.pointFait}/${snapshot.pointPotentiel} = ${roundTo(
        (snapshot.pointFait * 100) / snapshot.pointPotentiel,
        2
      )}%`
    );

    let updatedSnapshot: ScoreSnapshot;
    if (snapshot.jalon === SnapshotJalonEnum.COURANT) {
      updatedSnapshot = await this.computeAndUpsert({
        collectiviteId,
        referentielId,
        ref: snapshotRef,
        user,
      });
    } else if (
      snapshot.jalon === SnapshotJalonEnum.POST_AUDIT ||
      snapshot.jalon === SnapshotJalonEnum.PRE_AUDIT
    ) {
      updatedSnapshot = await this.computeAndUpsert({
        collectiviteId,
        referentielId,
        ref: snapshotRef,
        jalon: snapshot.jalon,
        auditId: snapshot.auditId || undefined,
        user,
      });
    } else {
      updatedSnapshot = await this.computeAndUpsert({
        collectiviteId,
        referentielId,
        ref: snapshotRef,
        date: snapshot.date,
        nom: snapshot.nom,
        user,
      });
    }

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

    return updatedSnapshot;
  }

  async delete(
    collectiviteId: number,
    referentielId: ReferentielId,
    snapshotRef: string,
    user: AuthUser
  ): Promise<void> {
    const snapshot = await this.getSnapshotWithoutPayloads(
      collectiviteId,
      referentielId,
      snapshotRef
    );

    if (!snapshot) {
      throw new NotFoundException(
        `Aucun snapshot de score avec la référence ${snapshotRef} n'a été trouvé pour la collectivité ${collectiviteId} et le referentiel ${referentielId}`
      );
    }

    if (
      !SnapshotsService.USER_DELETION_ALLOWED_SNAPSHOT_TYPES.includes(
        snapshot.jalon
      ) &&
      user.role !== AuthRole.SERVICE_ROLE
    ) {
      throw new ForbiddenException(
        `Uniquement les snaphots de type ${SnapshotsService.USER_DELETION_ALLOWED_SNAPSHOT_TYPES.join(
          ','
        )} peuvent être supprimés par un utilisateur.`
      );
    }

    const result = await this.databaseService.db
      .delete(snapshotTable)
      .where(
        and(
          eq(snapshotTable.collectiviteId, collectiviteId),
          eq(snapshotTable.referentielId, referentielId),
          eq(snapshotTable.ref, snapshotRef)
        )
      );

    if (result.rowCount === 0) {
      throw new NotFoundException(
        `Aucun snapshot de score avec la référence ${snapshotRef} n'a été trouvé`
      );
    }
  }
}
