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
import { NiveauAcces } from '../../auth/models/niveau-acces.enum';
import { AuthService } from '../../auth/services/auth.service';
import { PgIntegrityConstraintViolation } from '../../common/models/postgresql-error-codes.enum';
import DatabaseService from '../../common/services/database.service';
import { getErrorWithCode } from '../../common/services/errors.helper';
import { GetPersonnalisationReponsesResponseType } from '../../personnalisations/models/get-personnalisation-reponses.response';
import { GetReferentielScoresResponseType } from '../models/get-referentiel-scores.response';
import { GetScoreSnapshotsRequestType } from '../models/get-score-snapshots.request';
import {
  GetScoreSnapshotsResponseType,
  ScoreSnapshotCollectiviteInfoType,
  ScoreSnapshotInfoType,
} from '../models/get-score-snapshots.response';
import { ReferentielType } from '../models/referentiel.enum';
import { ScoreJalon } from '../models/score-jalon.enum';
import {
  CreateScoreSnapshotType,
  scoreSnapshotTable,
  ScoreSnapshotType,
} from '../models/score-snapshot.table';

@Injectable()
export default class ReferentielsScoringSnapshotsService {
  static SCORE_COURANT_SNAPSHOT_REF = 'score-courant';
  static SCORE_COURANT_SNAPSHOT_NOM = 'Score courant';
  static PRE_AUDIT_SNAPSHOT_REF_PREFIX = 'pre-audit-';
  static PRE_AUDIT_SNAPSHOT_NOM_PREFIX = 'Avant audit ';
  static POST_AUDIT_SNAPSHOT_REF_PREFIX = 'post-audit-';
  static POST_AUDIT_SNAPSHOT_NOM_PREFIX = 'Audité ';
  static JOUR_SNAPSHOT_REF_PREFIX = 'jour-';
  static SCORE_PERSONNALISE_REF_PREFIX = 'user-';
  static JOUR_SNAPSHOT_NOM_PREFIX = 'Jour du ';

  static USER_DELETION_ALLOWED_SNAPSHOT_TYPES: ScoreJalon[] = [
    ScoreJalon.DATE_PERSONNALISEE,
    ScoreJalon.VISITE_ANNUELLE,
  ];

  private readonly logger = new Logger(
    ReferentielsScoringSnapshotsService.name
  );

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly authService: AuthService
  ) {}

  slugifyName(name: string): string {
    if (name) {
      return slugify(name, {
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
      (scoreResponse.jalon === ScoreJalon.PRE_AUDIT ||
        scoreResponse.jalon === ScoreJalon.POST_AUDIT) &&
      !scoreResponse.anneeAudit
    ) {
      throw new InternalServerErrorException(
        `L'année de l'audit doit être définie pour le jalon ${scoreResponse.jalon}`
      );
    }
    const dateTime = DateTime.fromISO(scoreResponse.date);

    switch (scoreResponse.jalon) {
      case ScoreJalon.PRE_AUDIT:
        scoreResponse.snapshot.ref = `${ReferentielsScoringSnapshotsService.PRE_AUDIT_SNAPSHOT_REF_PREFIX}${scoreResponse.anneeAudit}`;
        scoreResponse.snapshot.nom = `${ReferentielsScoringSnapshotsService.PRE_AUDIT_SNAPSHOT_NOM_PREFIX}${scoreResponse.anneeAudit}`;
        break;
      case ScoreJalon.POST_AUDIT:
        scoreResponse.snapshot.ref = `${ReferentielsScoringSnapshotsService.POST_AUDIT_SNAPSHOT_REF_PREFIX}${scoreResponse.anneeAudit}`;
        scoreResponse.snapshot.nom = `${ReferentielsScoringSnapshotsService.POST_AUDIT_SNAPSHOT_NOM_PREFIX}${scoreResponse.anneeAudit}`;
        break;
      case ScoreJalon.SCORE_COURANT:
        scoreResponse.snapshot.ref = scoreResponse.snapshot.nom
          ? `${
              ReferentielsScoringSnapshotsService.SCORE_PERSONNALISE_REF_PREFIX
            }${this.slugifyName(scoreResponse.snapshot.nom)}`
          : ReferentielsScoringSnapshotsService.SCORE_COURANT_SNAPSHOT_REF;
        scoreResponse.snapshot.nom =
          scoreResponse.snapshot.nom ||
          ReferentielsScoringSnapshotsService.SCORE_COURANT_SNAPSHOT_NOM;
        break;
      case ScoreJalon.JOUR_AUTO:
        scoreResponse.snapshot.ref = `${
          ReferentielsScoringSnapshotsService.JOUR_SNAPSHOT_REF_PREFIX
        }${dateTime.toISODate()}`;
        scoreResponse.snapshot.nom = `${
          ReferentielsScoringSnapshotsService.JOUR_SNAPSHOT_NOM_PREFIX
        }${dateTime.toFormat('dd/MM/yyyy')}`;
        break;
      case ScoreJalon.DATE_PERSONNALISEE:
        scoreResponse.snapshot.ref = scoreResponse.snapshot.nom
          ? this.slugifyName(scoreResponse.snapshot.nom)
          : '';
        break;

      default:
        throw new InternalServerErrorException(
          `Un nom de snapshot doit être défini pour le jalon ${scoreResponse.jalon}`
        );
    }

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
      date: DateTime.fromISO(scoreResponse.date).toJSDate(),
      typeJalon: scoreResponse.jalon,
      pointFait: scoreResponse.scores.score.pointFait || 0,
      pointProgramme: scoreResponse.scores.score.pointProgramme || 0,
      pointPasFait: scoreResponse.scores.score.pointPasFait || 0,
      pointPotentiel: scoreResponse.scores.score.pointPotentiel || 0,
      referentielVersion: scoreResponse.referentielVersion,
      auditId: scoreResponse.auditId || null,
      createdAt: DateTime.fromISO(scoreResponse.snapshot!.createdAt).toJSDate(),
      createdBy: scoreResponse.snapshot!.createdBy,
      modifiedAt: DateTime.fromISO(
        scoreResponse.snapshot!.modifiedAt
      ).toJSDate(),
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
      .insert(scoreSnapshotTable)
      .values(createScoreSnapshot)
      .onConflictDoUpdate({
        target: [
          scoreSnapshotTable.collectiviteId,
          scoreSnapshotTable.referentielId,
          scoreSnapshotTable.ref,
        ],
        set: {
          date: sql.raw(`excluded.${scoreSnapshotTable.date.name}`),
          pointFait: sql.raw(`excluded.${scoreSnapshotTable.pointFait.name}`),
          pointPotentiel: sql.raw(
            `excluded.${scoreSnapshotTable.pointPotentiel.name}`
          ),
          pointProgramme: sql.raw(
            `excluded.${scoreSnapshotTable.pointProgramme.name}`
          ),
          pointPasFait: sql.raw(
            `excluded.${scoreSnapshotTable.pointPasFait.name}`
          ),
          referentielScores: sql.raw(
            `excluded.${scoreSnapshotTable.referentielScores.name}`
          ),
          personnalisationReponses: sql.raw(
            `excluded.${scoreSnapshotTable.personnalisationReponses.name}`
          ),
          referentielVersion: sql.raw(
            `excluded.${scoreSnapshotTable.referentielVersion.name}`
          ),
          modifiedBy: sql.raw(`excluded.${scoreSnapshotTable.modifiedBy.name}`),
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
      .insert(scoreSnapshotTable)
      .values(createScoreSnapshot)
      .onConflictDoUpdate({
        // Only allow to update current score
        target: [
          scoreSnapshotTable.collectiviteId,
          scoreSnapshotTable.referentielId,
        ],
        targetWhere: eq(scoreSnapshotTable.typeJalon, ScoreJalon.SCORE_COURANT),
        set: {
          date: sql.raw(`excluded.${scoreSnapshotTable.date.name}`),
          pointFait: sql.raw(`excluded.${scoreSnapshotTable.pointFait.name}`),
          pointPotentiel: sql.raw(
            `excluded.${scoreSnapshotTable.pointPotentiel.name}`
          ),
          pointProgramme: sql.raw(
            `excluded.${scoreSnapshotTable.pointProgramme.name}`
          ),
          pointPasFait: sql.raw(
            `excluded.${scoreSnapshotTable.pointPasFait.name}`
          ),
          referentielScores: sql.raw(
            `excluded.${scoreSnapshotTable.referentielScores.name}`
          ),
          personnalisationReponses: sql.raw(
            `excluded.${scoreSnapshotTable.personnalisationReponses.name}`
          ),
          referentielVersion: sql.raw(
            `excluded.${scoreSnapshotTable.referentielVersion.name}`
          ),
          modifiedBy: sql.raw(`excluded.${scoreSnapshotTable.modifiedBy.name}`),
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
    const scoreDate = DateTime.fromISO(scoreResponse.date).toJSDate();

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
          ReferentielsScoringSnapshotsService.SCORE_COURANT_SNAPSHOT_REF &&
        scoreResponse.jalon === ScoreJalon.SCORE_COURANT
          ? ScoreJalon.DATE_PERSONNALISEE
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
        const existingSnapshot = await this.getScoreSnapshotInfo(
          createScoreSnapshot.collectiviteId,
          createScoreSnapshot.referentielId as ReferentielType,
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
    scoreResponse.snapshot!.createdAt = scoreSnapshot.createdAt.toISOString();
    scoreResponse.snapshot!.modifiedBy = scoreSnapshot.modifiedBy;
    scoreResponse.snapshot!.modifiedAt = scoreSnapshot.modifiedAt.toISOString();

    return scoreSnapshot;
  }

  async getScoreSnapshots(
    collectiviteId: number,
    referentielId: ReferentielType,
    parameters: GetScoreSnapshotsRequestType
  ): Promise<GetScoreSnapshotsResponseType> {
    const result = await this.databaseService.db
      .select({
        ref: scoreSnapshotTable.ref,
        nom: scoreSnapshotTable.nom,
        date: scoreSnapshotTable.date,
        typeJalon: scoreSnapshotTable.typeJalon,
        pointFait: scoreSnapshotTable.pointFait,
        pointProgramme: scoreSnapshotTable.pointProgramme,
        pointPasFait: scoreSnapshotTable.pointPasFait,
        pointPotentiel: scoreSnapshotTable.pointPotentiel,
        referentielVersion: scoreSnapshotTable.referentielVersion,
        auditId: scoreSnapshotTable.auditId,
        createdAt: scoreSnapshotTable.createdAt,
        createdBy: scoreSnapshotTable.createdBy,
        modifiedAt: scoreSnapshotTable.modifiedAt,
        modifiedBy: scoreSnapshotTable.modifiedBy,
      })
      .from(scoreSnapshotTable)
      .where(
        and(
          eq(scoreSnapshotTable.collectiviteId, collectiviteId),
          eq(scoreSnapshotTable.referentielId, referentielId),
          inArray(scoreSnapshotTable.typeJalon, parameters.typesJalon)
        )
      )
      .orderBy(asc(scoreSnapshotTable.date));

    const getScoreSnapshotsResponseType: GetScoreSnapshotsResponseType = {
      collectiviteId: parseInt(collectiviteId as unknown as string),
      referentielId,
      typesJalon: parameters.typesJalon,
      snapshots: result,
    };
    return getScoreSnapshotsResponseType;
  }

  async getScoreSnapshotInfo(
    collectiviteId: number,
    referentielId: ReferentielType,
    snapshotRef: string,
    doNotThrowIfNotFound = false
  ): Promise<ScoreSnapshotInfoType | null> {
    const result = await this.databaseService.db
      .select({
        ref: scoreSnapshotTable.ref,
        nom: scoreSnapshotTable.nom,
        date: scoreSnapshotTable.date,
        typeJalon: scoreSnapshotTable.typeJalon,
        pointFait: scoreSnapshotTable.pointFait,
        pointProgramme: scoreSnapshotTable.pointProgramme,
        pointPasFait: scoreSnapshotTable.pointPasFait,
        pointPotentiel: scoreSnapshotTable.pointPotentiel,
        referentielVersion: scoreSnapshotTable.referentielVersion,
        auditId: scoreSnapshotTable.auditId,
        createdAt: scoreSnapshotTable.createdAt,
        createdBy: scoreSnapshotTable.createdBy,
        modifiedAt: scoreSnapshotTable.modifiedAt,
        modifiedBy: scoreSnapshotTable.modifiedBy,
      })
      .from(scoreSnapshotTable)
      .where(
        and(
          eq(scoreSnapshotTable.collectiviteId, collectiviteId),
          eq(scoreSnapshotTable.referentielId, referentielId),
          eq(scoreSnapshotTable.ref, snapshotRef)
        )
      );

    if (!result.length && !doNotThrowIfNotFound) {
      throw new NotFoundException(
        `Aucun snapshot de score avec la référence ${snapshotRef} n'a été trouvé pour la collectivité ${collectiviteId} et le referentiel ${referentielId}`
      );
    }
    return result.length ? result[0] : null;
  }

  async getFullScoreSnapshot(
    collectiviteId: number,
    referentielId: ReferentielType,
    snapshotRef: string
  ): Promise<GetReferentielScoresResponseType> {
    const result = (await this.databaseService.db
      .select()
      .from(scoreSnapshotTable)
      .where(
        and(
          eq(scoreSnapshotTable.collectiviteId, collectiviteId),
          eq(scoreSnapshotTable.referentielId, referentielId),
          eq(scoreSnapshotTable.ref, snapshotRef)
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
      createdAt: result[0].createdAt.toISOString(),
      createdBy: result[0].createdBy,
      modifiedAt: result[0].modifiedAt.toISOString(),
      modifiedBy: result[0].modifiedBy,
    };
    return fullScores;
  }

  async deleteScoreSnapshot(
    collectiviteId: number,
    referentielId: ReferentielType,
    snapshotRef: string,
    tokenInfo: AuthUser
  ): Promise<void> {
    await this.authService.verifieAccesAuxCollectivites(
      tokenInfo,
      [collectiviteId],
      NiveauAcces.EDITION
    );

    const snapshotInfo = await this.getScoreSnapshotInfo(
      collectiviteId,
      referentielId,
      snapshotRef
    );
    if (
      !ReferentielsScoringSnapshotsService.USER_DELETION_ALLOWED_SNAPSHOT_TYPES.includes(
        snapshotInfo!.typeJalon
      ) &&
      tokenInfo.role !== AuthRole.SERVICE_ROLE
    ) {
      throw new UnauthorizedException(
        `Uniquement les snaphots de type ${ReferentielsScoringSnapshotsService.USER_DELETION_ALLOWED_SNAPSHOT_TYPES.join(
          ','
        )} peuvent être supprimés par un utilisateur.`
      );
    }

    const result = await this.databaseService.db
      .delete(scoreSnapshotTable)
      .where(
        and(
          eq(scoreSnapshotTable.collectiviteId, collectiviteId),
          eq(scoreSnapshotTable.referentielId, referentielId),
          eq(scoreSnapshotTable.ref, snapshotRef)
        )
      );

    if (result.count === 0) {
      throw new NotFoundException(
        `Aucun snapshot de score avec la référence ${snapshotRef} n'a été trouvé`
      );
    }
  }
}
