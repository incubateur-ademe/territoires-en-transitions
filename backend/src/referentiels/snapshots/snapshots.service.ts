import { PermissionService } from '@/backend/users/authorizations/permission.service';
import {
  getISOFormatDateQuery,
  roundTo,
  toSlug,
} from '@/backend/utils/index-domain';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, desc, eq, getTableColumns, sql } from 'drizzle-orm';
import { chunk, omit } from 'es-toolkit';
import { DateTime } from 'luxon';
import { z } from 'zod';
import { PersonnalisationReponsesPayload } from '../../personnalisations/models/get-personnalisation-reponses.response';
import { AuthRole, AuthUser } from '../../users/models/auth.models';
import { DatabaseService } from '../../utils/database/database.service';
import {
  getErrorMessage,
  getErrorWithCode,
} from '../../utils/nest/errors.utils';
import { PgIntegrityConstraintViolation } from '../../utils/postgresql-error-codes.enum';
import { ComputeScoreMode } from '../compute-score/compute-score-mode.enum';
import ScoresService from '../compute-score/scores.service';
import { postAuditScoresTable } from '../labellisations/post-audit-scores.table';
import { preAuditScoresTable } from '../labellisations/pre-audit-scores.table';
import { ReferentielId } from '../models/referentiel-id.enum';
import { ScoresPayload } from './scores-payload.dto';
import { SnapshotJalon, SnapshotJalonEnum } from './snapshot-jalon.enum';
import {
  Snapshot,
  SnapshotInsert,
  snapshotTable,
  SnapshotWithoutPayloads,
} from './snapshot.table';
import { upsertSnapshotRequestSchema } from './upsert-snapshot.request';

// const computeSnapshotOptionsSchema = z.discriminatedUnion('jalon', [
//   z.object({
//     jalon: z.literal(SnapshotJalonEnum.COURANT),
//   }),
//   z.object({
//     jalon: z
//       .literal(SnapshotJalonEnum.PRE_AUDIT)
//       .or(z.literal(SnapshotJalonEnum.POST_AUDIT)),
//     auditId: z.number(),
//   }),
//   z.object({
//     jalon: z.literal(SnapshotJalonEnum.DATE_PERSONNALISEE),
//     date: z.string().datetime(),
//   }),
// ]);

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
    date,
  }: {
    nom?: string;
    jalon?: SnapshotJalon;
    anneeAudit?: number;
    date: string;
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

    this.logger.log(`Snapshot ref: ${ref}, nom: ${nom}`);

    if (!nom || !ref) {
      throw new InternalServerErrorException(
        `Un nom de snapshot doit être défini pour le jalon ${jalon}`
      );
    }

    return { ref, nom };
  }

  // getSnapshotInfoFromScoreResponse(
  //   scoreResponse: ActionScoresPayload
  // ): ScoreSnapshotCollectiviteInfoType {
  //   return {
  //     collectiviteId: scoreResponse.collectiviteId,
  //     referentielId: scoreResponse.referentielId,
  //     ref: scoreResponse.snapshot!.ref!,
  //     nom: scoreResponse.snapshot!.nom,
  //     date: scoreResponse.date,
  //     jalon: scoreResponse.jalon,
  //     pointFait: scoreResponse.scores.score.pointFait || 0,
  //     pointProgramme: scoreResponse.scores.score.pointProgramme || 0,
  //     pointPasFait: scoreResponse.scores.score.pointPasFait || 0,
  //     pointPotentiel: scoreResponse.scores.score.pointPotentiel || 0,
  //     referentielVersion: scoreResponse.referentielVersion,
  //     auditId: scoreResponse.auditId || null,
  //     createdAt: scoreResponse.snapshot!.createdAt,
  //     createdBy: scoreResponse.snapshot!.createdBy,
  //     modifiedAt: scoreResponse.snapshot!.modifiedAt,
  //     modifiedBy: scoreResponse.snapshot!.modifiedBy,
  //   };
  // }

  /**
   * Upsert score snapshot: update always allowed
   * @param snapshot
   * @returns
   */
  async upsertScoreSnapshot(snapshot: SnapshotInsert): Promise<Snapshot> {
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
  ): Promise<Snapshot[]> {
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
  async insertSnapshotOrUpsertIfCurrentJalon(
    snapshot: SnapshotInsert
  ): Promise<Snapshot> {
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
  }: z.infer<typeof upsertSnapshotRequestSchema> & {
    user?: AuthUser;
  }): Promise<Snapshot> {
    const { scoresPayload, personnalisationReponsesPayload } =
      await this.scoresService.computeScoreForCollectivite(
        referentielId,
        collectiviteId,
        {
          mode: ComputeScoreMode.RECALCUL,
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
  ): Promise<Snapshot> {
    if (!snapshotRef) {
      const { ref, nom } = this.getDefaultSnapshotMetadata({
        nom: snapshotNom,
        jalon: scoresPayload.jalon,
        anneeAudit: scoresPayload.anneeAudit,
        date: scoresPayload.date,
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
      pointFait: scoresPayload.scores.score.pointFait || 0,
      pointProgramme: scoresPayload.scores.score.pointProgramme || 0,
      pointPasFait: scoresPayload.scores.score.pointPasFait || 0,
      pointPotentiel: scoresPayload.scores.score.pointPotentiel || 0,
      scoresPayload: scoresPayload,
      personnalisationReponses: personnalisationResponses,
      createdBy: userId,
      modifiedBy: userId,
    } satisfies SnapshotInsert;

    this.logger.log(
      `Saving score snapshot with ref ${createScoreSnapshot.ref} and type ${createScoreSnapshot.jalon} for collectivite ${createScoreSnapshot.collectiviteId} and referentiel ${createScoreSnapshot.referentielId} (force update: ${snapshotForceUpdate})`
    );

    let scoreSnapshot: Snapshot;
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

        scoreSnapshot = await this.upsertScoreSnapshot(createScoreSnapshot);
      } else {
        scoreSnapshot = await this.insertSnapshotOrUpsertIfCurrentJalon(
          createScoreSnapshot
        );
      }
    } catch (error) {
      const errorWithCode = getErrorWithCode(error);
      if (
        errorWithCode.code === PgIntegrityConstraintViolation.UniqueViolation
      ) {
        this.logger.error(error);
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
    scoreSnapshot.date = DateTime.fromSQL(scoreSnapshot.date).toISO() as string;
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
  ): Promise<Snapshot> {
    let snapshot = await this.databaseService.db
      .select({
        ...getTableColumns(snapshotTable),
        date: getISOFormatDateQuery(snapshotTable.date),
        createdAt: getISOFormatDateQuery(snapshotTable.createdAt),
        modifiedAt: getISOFormatDateQuery(snapshotTable.modifiedAt),
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
      (!snapshot || snapshot.scoresPayload.mode !== ComputeScoreMode.RECALCUL)
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
  ): Promise<Snapshot> {
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
      `Snapshot ${snapshotRef} modified at ${snapshot.modifiedAt}, score: ${
        snapshot.pointFait
      }/${snapshot.pointPotentiel} = ${roundTo(
        (snapshot.pointFait * 100) / snapshot.pointPotentiel,
        2
      )}%`
    );

    let updatedSnapshot: Snapshot;
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
      `Snapshot ${snapshotRef} updated at ${
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
      throw new UnauthorizedException(
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

  // TODO: endpoint to be removed, only used during migration
  async convertOldScoresToSnapshots() {
    // Save post audit scores to new table
    const postAuditScores = (
      await this.databaseService.db
        .select({
          collectiviteId: postAuditScoresTable.collectiviteId,
          referentiel: postAuditScoresTable.referentiel,
          auditId: postAuditScoresTable.auditId,
        })
        .from(postAuditScoresTable)
        .orderBy(desc(postAuditScoresTable.payloadTimestamp))
    ).map((score) => ({
      collectiviteId: score.collectiviteId,
      referentiel: score.referentiel,
      auditId: score.auditId,
      jalon: SnapshotJalonEnum.POST_AUDIT,
    }));
    this.logger.log(`Found ${postAuditScores.length} post audit scores`);

    const preAuditScores = (
      await this.databaseService.db
        .select({
          collectiviteId: preAuditScoresTable.collectiviteId,
          referentiel: preAuditScoresTable.referentiel,
          auditId: preAuditScoresTable.auditId,
        })
        .from(preAuditScoresTable)
        // .where(eq(preAuditScoresTable.collectiviteId, 2578))
        .orderBy(desc(preAuditScoresTable.payloadTimestamp))
    ).map((score) => ({
      collectiviteId: score.collectiviteId,
      referentiel: score.referentiel,
      auditId: score.auditId,
      jalon: SnapshotJalonEnum.PRE_AUDIT,
    }));

    this.logger.log(`Found ${preAuditScores.length} pre audit scores`);

    // const clientScores = (
    //   await this.databaseService.db
    //     .select({
    //       collectiviteId: clientScoresTable.collectiviteId,
    //       referentiel: clientScoresTable.referentiel,
    //     })
    //     .from(clientScoresTable)
    //     .orderBy(desc(clientScoresTable.payloadTimestamp))
    // ).map((score) => ({
    //   collectiviteId: score.collectiviteId,
    //   referentiel: score.referentiel,
    //   auditId: undefined,
    //   jalon: SnapshotJalonEnum.COURANT,
    // }));
    // this.logger.log(`Found ${preAuditScores.length} client current scores`);

    const allScores = [...preAuditScores, ...postAuditScores];

    const allScoresChunks = chunk(allScores, 10);
    const insertPromises: Promise<Snapshot | null>[] = [];
    let iChunk = 0;

    const allSnapshotsInfo = [];
    for (const allScoresChunk of allScoresChunks) {
      this.logger.log(
        `Chunk ${iChunk}/${allScoresChunk.length} de ${allScoresChunks.length} enregistrements`
      );

      insertPromises.push(
        ...allScoresChunk.map(async (score) => {
          const { scoresPayload, personnalisationReponsesPayload } =
            await this.scoresService.computeScoreForCollectivite(
              score.referentiel as ReferentielId,
              score.collectiviteId,
              {
                mode: ComputeScoreMode.DEPUIS_SAUVEGARDE,
                jalon: score.jalon,
                auditId: score.auditId,
              }
            );

          return this.saveSnapshotForScoreResponse(
            scoresPayload,
            personnalisationReponsesPayload,
            undefined,
            false
          )
            .then((result) => result)
            .catch((error) => {
              this.logger.error(error);
              this.logger.error(
                `Error computing score for collectivite ${
                  score.collectiviteId
                } and referentiel ${score.referentiel}: ${getErrorMessage(
                  error
                )}`
              );
              return null;
            });
        })
      );

      const snapshots = (await Promise.all(insertPromises))
        .filter((response) => Boolean(response))
        .map((snapshot) => {
          const { scoresPayload, personnalisationReponses, ...snapshotInfo } =
            snapshot!;
          return snapshotInfo;
        });

      allSnapshotsInfo.push(...snapshots);
      insertPromises.length = 0;
      iChunk++;
    }

    return {
      snapshots: allSnapshotsInfo,
    };
  }
}
