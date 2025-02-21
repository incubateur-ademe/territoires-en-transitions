import { PermissionOperation } from '@/backend/auth/authorizations/permission-operation.enum';
import { PermissionService } from '@/backend/auth/authorizations/permission.service';
import { ResourceType } from '@/backend/auth/authorizations/resource-type.enum';
import {
  BadRequestException,
  Injectable,
  InternalServerErrorException,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { and, asc, eq, inArray, sql } from 'drizzle-orm';
import { DateTime } from 'luxon';
import slugify from 'slugify';
import { AuthRole, AuthUser } from '../../auth/models/auth.models';
import { GetPersonnalisationReponsesResponseType } from '../../personnalisations/models/get-personnalisation-reponses.response';
import { DatabaseService } from '../../utils/database/database.service';
import { getErrorWithCode } from '../../utils/nest/errors.utils';
import { roundTo } from '../../utils/number.utils';
import { PgIntegrityConstraintViolation } from '../../utils/postgresql-error-codes.enum';
import { GetReferentielScoresResponseType } from '../compute-score/get-referentiel-scores.response';
import { GetScoreSnapshotsRequestType } from '../models/get-score-snapshots.request';
import {
  GetScoreSnapshotsResponseType,
  ScoreSnapshotCollectiviteInfoType,
  ScoreSnapshotInfoType,
} from '../models/get-score-snapshots.response';
import { ReferentielId } from '../models/referentiel-id.enum';
import { SnapshotJalon } from './snapshot-jalon.enum';
import {
  CreateScoreSnapshotType,
  ScoreSnapshotType,
  snapshotTable,
} from './snapshot.table';

@Injectable()
export class SnapshotsService {
  static SCORE_COURANT_SNAPSHOT_REF = 'score-courant';
  static SCORE_COURANT_SNAPSHOT_NOM = 'Score courant';
  static PRE_AUDIT_SNAPSHOT_REF_PREFIX = 'pre-audit-';
  static PRE_AUDIT_SNAPSHOT_NOM_SUFFIX = ' - avant audit ';
  static POST_AUDIT_SNAPSHOT_REF_PREFIX = 'post-audit-';
  static POST_AUDIT_SNAPSHOT_NOM_SUFFIX = ' - audit ';
  static JOUR_SNAPSHOT_REF_PREFIX = 'jour-';
  static SCORE_PERSONNALISE_REF_PREFIX = 'user-';
  static JOUR_SNAPSHOT_NOM_PREFIX = ' - jour du ';

  static USER_DELETION_ALLOWED_SNAPSHOT_TYPES: SnapshotJalon[] = [
    SnapshotJalon.DATE_PERSONNALISEE,
    SnapshotJalon.VISITE_ANNUELLE,
  ];

  private readonly logger = new Logger(SnapshotsService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly permissionService: PermissionService
  ) {}

  slugifyName(name: string): string {
    if (name) {
      return slugify(name.toLowerCase(), {
        replacement: '-',
        remove: /[*+~.()'"!:@]/g,
      });
    }
    return name;
  }

  fillDefaultSnapshotNomRef(
    scoreResponse: Pick<
      GetReferentielScoresResponseType,
      'snapshot' | 'jalon' | 'anneeAudit' | 'date'
    >,
    snapshotNom?: string
  ) {
    if (!scoreResponse.snapshot) {
      scoreResponse.snapshot = {
        ref: '',
        nom: snapshotNom || '',
        createdAt: '',
        createdBy: '',
        modifiedAt: '',
        modifiedBy: '',
      };
    }

    if (
      (scoreResponse.jalon === SnapshotJalon.PRE_AUDIT ||
        scoreResponse.jalon === SnapshotJalon.POST_AUDIT) &&
      !scoreResponse.anneeAudit
    ) {
      throw new InternalServerErrorException(
        `L'année de l'audit doit être définie pour le jalon ${scoreResponse.jalon}`
      );
    }
    const dateTime = DateTime.fromISO(scoreResponse.date);

    switch (scoreResponse.jalon) {
      case SnapshotJalon.PRE_AUDIT:
        scoreResponse.snapshot.ref = `${SnapshotsService.PRE_AUDIT_SNAPSHOT_REF_PREFIX}${scoreResponse.anneeAudit}`;
        scoreResponse.snapshot.nom = `${scoreResponse.anneeAudit}${SnapshotsService.PRE_AUDIT_SNAPSHOT_NOM_SUFFIX}`;
        break;
      case SnapshotJalon.POST_AUDIT:
        scoreResponse.snapshot.ref = `${SnapshotsService.POST_AUDIT_SNAPSHOT_REF_PREFIX}${scoreResponse.anneeAudit}`;
        scoreResponse.snapshot.nom = `${scoreResponse.anneeAudit}${SnapshotsService.POST_AUDIT_SNAPSHOT_NOM_SUFFIX}`;
        break;
      case SnapshotJalon.SCORE_COURANT:
        scoreResponse.snapshot.ref = scoreResponse.snapshot.nom
          ? `${
              SnapshotsService.SCORE_PERSONNALISE_REF_PREFIX
            }${this.slugifyName(scoreResponse.snapshot.nom)}`
          : SnapshotsService.SCORE_COURANT_SNAPSHOT_REF;
        scoreResponse.snapshot.nom =
          scoreResponse.snapshot.nom ||
          SnapshotsService.SCORE_COURANT_SNAPSHOT_NOM;
        break;
      case SnapshotJalon.JOUR_AUTO:
        scoreResponse.snapshot.ref = `${
          SnapshotsService.JOUR_SNAPSHOT_REF_PREFIX
        }${dateTime.toISODate()}`;
        scoreResponse.snapshot.nom = `${dateTime.year}${
          SnapshotsService.JOUR_SNAPSHOT_NOM_PREFIX
        }${dateTime.toFormat('dd/MM/yyyy')}`;
        break;
      case SnapshotJalon.DATE_PERSONNALISEE:
        scoreResponse.snapshot.ref = scoreResponse.snapshot.nom
          ? this.slugifyName(scoreResponse.snapshot.nom)
          : '';
        break;

      default:
        throw new InternalServerErrorException(
          `Un nom de snapshot doit être défini pour le jalon ${scoreResponse.jalon}`
        );
    }
    scoreResponse.snapshot.ref = scoreResponse.snapshot.ref.slice(0, 30);

    this.logger.log(
      `Snapshot ref: ${scoreResponse.snapshot.ref}, nom: ${scoreResponse.snapshot.nom}`
    );

    if (!scoreResponse.snapshot.nom || !scoreResponse.snapshot.ref) {
      throw new InternalServerErrorException(
        `Un nom de snapshot doit être défini pour le jalon ${scoreResponse.jalon}`
      );
    }
  }

  getSnapshotInfoFromScoreResponse(
    scoreResponse: GetReferentielScoresResponseType
  ): ScoreSnapshotCollectiviteInfoType {
    return {
      collectiviteId: scoreResponse.collectiviteId,
      referentielId: scoreResponse.referentielId,
      ref: scoreResponse.snapshot!.ref!,
      nom: scoreResponse.snapshot!.nom,
      date: scoreResponse.date,
      typeJalon: scoreResponse.jalon,
      pointFait: scoreResponse.scores.score.pointFait || 0,
      pointProgramme: scoreResponse.scores.score.pointProgramme || 0,
      pointPasFait: scoreResponse.scores.score.pointPasFait || 0,
      pointPotentiel: scoreResponse.scores.score.pointPotentiel || 0,
      referentielVersion: scoreResponse.referentielVersion,
      auditId: scoreResponse.auditId || null,
      createdAt: scoreResponse.snapshot!.createdAt,
      createdBy: scoreResponse.snapshot!.createdBy,
      modifiedAt: scoreResponse.snapshot!.modifiedAt,
      modifiedBy: scoreResponse.snapshot!.modifiedBy,
    };
  }

  /**
   * Upsert score snapshot: update always allowed
   * @param createScoreSnapshot
   * @returns
   */
  async upsertScoreSnapshot(
    createScoreSnapshot: CreateScoreSnapshotType
  ): Promise<ScoreSnapshotType[]> {
    return (await this.databaseService.db
      .insert(snapshotTable)
      .values(createScoreSnapshot)
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
          referentielScores: sql.raw(
            `excluded.${snapshotTable.referentielScores.name}`
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
      .returning()) as ScoreSnapshotType[];
  }

  /**
   * Insert with upsert only allowed if jalon is current score
   * @param createScoreSnapshot
   * @returns
   */
  async insertScoreSnapshotWithAllowedCurrentScoreUpdate(
    createScoreSnapshot: CreateScoreSnapshotType
  ): Promise<ScoreSnapshotType[]> {
    return (await this.databaseService.db
      .insert(snapshotTable)
      .values(createScoreSnapshot)
      .onConflictDoUpdate({
        // Only allow to update current score
        target: [snapshotTable.collectiviteId, snapshotTable.referentielId],
        targetWhere: eq(snapshotTable.typeJalon, SnapshotJalon.SCORE_COURANT),
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
          referentielScores: sql.raw(
            `excluded.${snapshotTable.referentielScores.name}`
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
      .returning()) as ScoreSnapshotType[];
  }

  async saveSnapshotForScoreResponse(
    scoreResponse: GetReferentielScoresResponseType,
    personnalisationResponses: GetPersonnalisationReponsesResponseType,
    snapshotNom?: string,
    snapshotForceUpdate?: boolean,
    userId?: string
  ): Promise<ScoreSnapshotType> {
    const scoreDate = scoreResponse.date;

    if (!scoreResponse.snapshot?.ref || !scoreResponse.snapshot?.nom) {
      this.fillDefaultSnapshotNomRef(scoreResponse, snapshotNom);
    }

    const createScoreSnapshot: CreateScoreSnapshotType = {
      collectiviteId: scoreResponse.collectiviteId,
      referentielId: scoreResponse.referentielId,
      referentielVersion: scoreResponse.referentielVersion,
      auditId: scoreResponse.auditId,
      date: scoreDate,
      ref: scoreResponse.snapshot!.ref!,
      nom: scoreResponse.snapshot!.nom!,
      typeJalon:
        scoreResponse.snapshot?.ref !==
          SnapshotsService.SCORE_COURANT_SNAPSHOT_REF &&
        scoreResponse.jalon === SnapshotJalon.SCORE_COURANT
          ? SnapshotJalon.DATE_PERSONNALISEE
          : scoreResponse.jalon,
      pointFait: scoreResponse.scores.score.pointFait || 0,
      pointProgramme: scoreResponse.scores.score.pointProgramme || 0,
      pointPasFait: scoreResponse.scores.score.pointPasFait || 0,
      pointPotentiel: scoreResponse.scores.score.pointPotentiel || 0,
      referentielScores: scoreResponse,
      personnalisationReponses: personnalisationResponses,
      createdBy: userId,
      modifiedBy: userId,
    };
    this.logger.log(
      `Saving score snapshot with ref ${createScoreSnapshot.ref} and type ${createScoreSnapshot.typeJalon} for collectivite ${createScoreSnapshot.collectiviteId} and referentiel ${createScoreSnapshot.referentielId} (force update: ${snapshotForceUpdate})`
    );

    let scoreSnapshots: ScoreSnapshotType[] = [];
    try {
      if (snapshotForceUpdate) {
        const existingSnapshot = await this.getSummary(
          createScoreSnapshot.collectiviteId,
          createScoreSnapshot.referentielId as ReferentielId,
          createScoreSnapshot.ref!,
          true
        );
        if (
          existingSnapshot &&
          existingSnapshot.typeJalon !== createScoreSnapshot.typeJalon
        ) {
          throw new BadRequestException(
            `Impossible de mettre à jour le snapshot de score avec la référence ${createScoreSnapshot.ref} pour la collectivite ${createScoreSnapshot.collectiviteId} et le referentiel ${createScoreSnapshot.referentielId} car le type de jalon est différent (existant: ${existingSnapshot?.typeJalon}, nouveau: ${createScoreSnapshot.typeJalon})`
          );
        }

        scoreSnapshots = await this.upsertScoreSnapshot(createScoreSnapshot);
      } else {
        scoreSnapshots =
          await this.insertScoreSnapshotWithAllowedCurrentScoreUpdate(
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

    if (!scoreSnapshots.length) {
      throw new InternalServerErrorException(
        'Impossible de sauvegarder le snapshot de score'
      );
    }
    const scoreSnapshot = scoreSnapshots[0] as ScoreSnapshotType;
    scoreResponse.snapshot!.createdBy = scoreSnapshot.createdBy;
    scoreResponse.snapshot!.createdAt = scoreSnapshot.createdAt;
    scoreResponse.snapshot!.modifiedBy = scoreSnapshot.modifiedBy;
    scoreResponse.snapshot!.modifiedAt = scoreSnapshot.modifiedAt;

    return scoreSnapshot;
  }

  async list(
    collectiviteId: number,
    referentielId: ReferentielId,
    parameters?: GetScoreSnapshotsRequestType
  ): Promise<GetScoreSnapshotsResponseType> {
    const { typesJalon } = parameters ?? {};

    const baseConditions = [
      eq(snapshotTable.collectiviteId, collectiviteId),
      eq(snapshotTable.referentielId, referentielId),
    ];

    const whereConditions = [
      ...baseConditions,
      ...(typesJalon ? [inArray(snapshotTable.typeJalon, typesJalon)] : []),
    ];

    const snapshotList = await this.databaseService.db
      .select({
        ref: snapshotTable.ref,
        nom: snapshotTable.nom,
        date: snapshotTable.date,
        typeJalon: snapshotTable.typeJalon,
        pointFait: snapshotTable.pointFait,
        pointProgramme: snapshotTable.pointProgramme,
        pointPasFait: snapshotTable.pointPasFait,
        pointPotentiel: snapshotTable.pointPotentiel,
        referentielVersion: snapshotTable.referentielVersion,
        auditId: snapshotTable.auditId,
        createdAt: snapshotTable.createdAt,
        createdBy: snapshotTable.createdBy,
        modifiedAt: snapshotTable.modifiedAt,
        modifiedBy: snapshotTable.modifiedBy,
      })
      .from(snapshotTable)
      .where(and(...whereConditions))
      .orderBy(asc(snapshotTable.date));

    const response: GetScoreSnapshotsResponseType = {
      collectiviteId: parseInt(collectiviteId as unknown as string),
      referentielId,
      typesJalon: typesJalon ?? [],
      snapshots: snapshotList.map((snapshot) => ({
        ...snapshot,
        pointNonRenseigne:
          roundTo(
            snapshot.pointPotentiel -
              (snapshot.pointFait +
                snapshot.pointPasFait +
                snapshot.pointProgramme),
            2
          ) || undefined,
      })),
    };
    return response;
  }

  async getSummary(
    collectiviteId: number,
    referentielId: ReferentielId,
    snapshotRef: string,
    doNotThrowIfNotFound = false
  ): Promise<ScoreSnapshotInfoType | null> {
    const result = await this.databaseService.db
      .select({
        ref: snapshotTable.ref,
        nom: snapshotTable.nom,
        date: snapshotTable.date,
        typeJalon: snapshotTable.typeJalon,
        pointFait: snapshotTable.pointFait,
        pointProgramme: snapshotTable.pointProgramme,
        pointPasFait: snapshotTable.pointPasFait,
        pointPotentiel: snapshotTable.pointPotentiel,
        referentielVersion: snapshotTable.referentielVersion,
        auditId: snapshotTable.auditId,
        createdAt: snapshotTable.createdAt,
        createdBy: snapshotTable.createdBy,
        modifiedAt: snapshotTable.modifiedAt,
        modifiedBy: snapshotTable.modifiedBy,
      })
      .from(snapshotTable)
      .where(
        and(
          eq(snapshotTable.collectiviteId, collectiviteId),
          eq(snapshotTable.referentielId, referentielId),
          eq(snapshotTable.ref, snapshotRef)
        )
      );

    if (!result.length && !doNotThrowIfNotFound) {
      throw new NotFoundException(
        `Aucun snapshot de score avec la référence ${snapshotRef} n'a été trouvé pour la collectivité ${collectiviteId} et le referentiel ${referentielId}`
      );
    }
    return result.length ? result[0] : null;
  }

  async get(
    collectiviteId: number,
    referentielId: ReferentielId,
    snapshotRef: string = SnapshotsService.SCORE_COURANT_SNAPSHOT_REF
  ): Promise<GetReferentielScoresResponseType> {
    const result = (await this.databaseService.db
      .select()
      .from(snapshotTable)
      .where(
        and(
          eq(snapshotTable.collectiviteId, collectiviteId),
          eq(snapshotTable.referentielId, referentielId),
          eq(snapshotTable.ref, snapshotRef)
        )
      )) as ScoreSnapshotType[];

    if (!result.length) {
      throw new NotFoundException(
        `Aucun snapshot de score avec la référence ${snapshotRef} n'a été trouvé pour la collectivité ${collectiviteId} et le referentiel ${referentielId}`
      );
    }

    const fullScores = result[0].referentielScores;
    fullScores.snapshot = {
      ref: result[0].ref!,
      nom: result[0].nom,
      createdAt: result[0].createdAt,
      createdBy: result[0].createdBy,
      modifiedAt: result[0].modifiedAt,
      modifiedBy: result[0].modifiedBy,
    };

    return fullScores;
  }

  async delete(
    collectiviteId: number,
    referentielId: ReferentielId,
    snapshotRef: string,
    tokenInfo: AuthUser
  ): Promise<void> {
    await this.permissionService.isAllowed(
      tokenInfo,
      PermissionOperation.REFERENTIELS_EDITION,
      ResourceType.COLLECTIVITE,
      collectiviteId
    );

    const snapshotInfo = await this.getSummary(
      collectiviteId,
      referentielId,
      snapshotRef
    );
    if (
      !SnapshotsService.USER_DELETION_ALLOWED_SNAPSHOT_TYPES.includes(
        snapshotInfo!.typeJalon
      ) &&
      tokenInfo.role !== AuthRole.SERVICE_ROLE
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
}
