import {
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  AuthenticatedUser,
  AuthUser,
} from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { FicheEtape, FicheEtapeCreate } from '@tet/domain/plans';
import { and, eq, gt, gte, lt, lte, sql } from 'drizzle-orm';
import FicheActionPermissionsService from '../fiche-action-permissions.service';
import {
  FicheActionEtapeError,
  FicheActionEtapeErrorEnum,
} from './fiche-action-etape.errors';
import { ficheActionEtapeTable } from './fiche-action-etape.table';

type EtapeTransactionFailure = {
  reason: 'FICHE_ACTION_ETAPE_TRANSACTION_FAILURE';
  result: Result<unknown, FicheActionEtapeError>;
};

const isEtapeTransactionFailure = (
  error: unknown
): error is EtapeTransactionFailure =>
  typeof error === 'object' &&
  error !== null &&
  (error as EtapeTransactionFailure).reason ===
    'FICHE_ACTION_ETAPE_TRANSACTION_FAILURE';

@Injectable()
export class FicheActionEtapeService {
  private readonly logger = new Logger(FicheActionEtapeService.name);

  constructor(
    private readonly databaseService: DatabaseService,
    private readonly ficheService: FicheActionPermissionsService
  ) {}

  /**
   * Ajoute ou modifie une étape d'une fiche
   * et réorganise les autres étapes en fonction
   * @param etape
   * @param tokenInfo
   */
  async upsertEtape(
    etape: FicheEtapeCreate,
    tokenInfo: AuthenticatedUser
  ): Promise<Result<FicheEtape, FicheActionEtapeError>> {
    const { id, ficheId, nom, ordre, realise = false } = etape;
    const permissionResult = await this.checkCanWriteFiche(ficheId, tokenInfo);
    if (!permissionResult.success) return permissionResult;

    const userId = tokenInfo?.id;

    try {
      return await this.databaseService.db.transaction(async (trx) => {
        if (id) {
          // Si on déplace une étape existante (drag and drop)
          const currentEtape = await trx
            .select({
              ordre: ficheActionEtapeTable.ordre,
            })
            .from(ficheActionEtapeTable)
            .where(
              and(
                eq(ficheActionEtapeTable.id, id),
                eq(ficheActionEtapeTable.ficheId, ficheId)
              )
            )
            .limit(1);

          if (currentEtape.length === 0) {
            throw {
              reason: 'FICHE_ACTION_ETAPE_TRANSACTION_FAILURE',
              result: failure(FicheActionEtapeErrorEnum.ETAPE_NOT_FOUND),
            } satisfies EtapeTransactionFailure;
          }

          const currentOrdre = currentEtape[0].ordre;

          if (currentOrdre !== ordre) {
            if (currentOrdre < ordre) {
              // Si l'étape descend (ex : de 2 à 4)
              await trx
                .update(ficheActionEtapeTable)
                .set({ ordre: sql`${ficheActionEtapeTable.ordre} - 1` })
                .where(
                  and(
                    eq(ficheActionEtapeTable.ficheId, ficheId),
                    gt(ficheActionEtapeTable.ordre, currentOrdre),
                    lte(ficheActionEtapeTable.ordre, ordre)
                  )
                );
            } else {
              // Si l'étape monte (ex : de 4 à 2)
              await trx
                .update(ficheActionEtapeTable)
                .set({ ordre: sql`${ficheActionEtapeTable.ordre} + 1` })
                .where(
                  and(
                    eq(ficheActionEtapeTable.ficheId, ficheId),
                    gte(ficheActionEtapeTable.ordre, ordre),
                    lt(ficheActionEtapeTable.ordre, currentOrdre)
                  )
                );
            }
          }
        } else {
          // Si on insère une nouvelle étape
          await trx
            .update(ficheActionEtapeTable)
            .set({ ordre: sql`${ficheActionEtapeTable.ordre} + 1` })
            .where(
              and(
                eq(ficheActionEtapeTable.ficheId, ficheId),
                gte(ficheActionEtapeTable.ordre, ordre)
              )
            );
        }

        // Insertion ou mise à jour de l'étape avec `RETURNING`
        const [result] = await trx
          .insert(ficheActionEtapeTable)
          .values({
            id, // Si `id` est défini, mise à jour via `onConflict`
            ficheId,
            nom,
            ordre,
            realise,
            createdBy: userId,
            modifiedBy: userId,
            createdAt: new Date().toISOString(),
            modifiedAt: new Date().toISOString(),
          })
          .onConflictDoUpdate({
            target: [ficheActionEtapeTable.id],
            set: {
              nom,
              ordre,
              realise,
              modifiedBy: userId,
              modifiedAt: new Date().toISOString(),
            },
          })
          .returning();

        // Met à jour la table fiche action
        await trx
          .update(ficheActionTable)
          .set({ modifiedBy: userId, modifiedAt: new Date().toISOString() })
          .where(eq(ficheActionTable.id, ficheId));

        return success(result);
      });
    } catch (error) {
      if (isEtapeTransactionFailure(error)) {
        return error.result as Result<FicheEtape, FicheActionEtapeError>;
      }
      this.logger.error(
        `Échec de l'upsert des étapes pour la fiche ${ficheId}`,
        error
      );
      return failure(
        FicheActionEtapeErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Supprime une étape d'une fiche et réorganise les autres étapes en fonction
   * @param etapeId
   * @param tokenInfo
   */
  async deleteEtape(
    etapeId: number,
    tokenInfo: AuthenticatedUser
  ): Promise<Result<undefined, FicheActionEtapeError>> {
    try {
      return await this.databaseService.db.transaction(async (trx) => {
        // Récupérer l'ordre et la fiche de l'étape à supprimer
        const stepToDelete = await trx
          .select({
            ordre: ficheActionEtapeTable.ordre,
            ficheId: ficheActionEtapeTable.ficheId,
          })
          .from(ficheActionEtapeTable)
          .where(eq(ficheActionEtapeTable.id, etapeId))
          .then((res) => res[0]);

        if (!stepToDelete) {
          throw {
            reason: 'FICHE_ACTION_ETAPE_TRANSACTION_FAILURE',
            result: failure(FicheActionEtapeErrorEnum.ETAPE_NOT_FOUND),
          } satisfies EtapeTransactionFailure;
        }

        const { ordre: deletedOrder, ficheId } = stepToDelete;
        const permissionResult = await this.checkCanWriteFiche(
          ficheId,
          tokenInfo,
          trx
        );
        if (!permissionResult.success) {
          throw {
            reason: 'FICHE_ACTION_ETAPE_TRANSACTION_FAILURE',
            result: permissionResult,
          } satisfies EtapeTransactionFailure;
        }

        // Supprimer l'étape
        await trx
          .delete(ficheActionEtapeTable)
          .where(eq(ficheActionEtapeTable.id, etapeId));

        // Réorganiser les étapes après celle supprimée
        await trx
          .update(ficheActionEtapeTable)
          .set({ ordre: sql`${ficheActionEtapeTable.ordre} - 1` })
          .where(
            and(
              eq(ficheActionEtapeTable.ficheId, ficheId),
              gte(ficheActionEtapeTable.ordre, deletedOrder)
            )
          );

        // Met à jour la table fiche action
        await trx
          .update(ficheActionTable)
          .set({
            modifiedBy: tokenInfo?.id,
            modifiedAt: new Date().toISOString(),
          })
          .where(eq(ficheActionTable.id, ficheId));

        return success(undefined);
      });
    } catch (error) {
      if (isEtapeTransactionFailure(error)) {
        return error.result as Result<undefined, FicheActionEtapeError>;
      }
      this.logger.error(`Échec de la suppression de l'étape ${etapeId}`, error);
      return failure(
        FicheActionEtapeErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  /**
   * Récupère les étapes d'une fiche
   * @param ficheId
   * @param tokenInfo
   */
  async getEtapesByFicheId(
    ficheId: number,
    tokenInfo: AuthUser
  ): Promise<Result<FicheEtape[], FicheActionEtapeError>> {
    const permissionResult = await this.checkCanReadFiche(ficheId, tokenInfo);
    if (!permissionResult.success) return permissionResult;

    try {
      return success(
        await this.databaseService.db
          .select()
          .from(ficheActionEtapeTable)
          .where(eq(ficheActionEtapeTable.ficheId, ficheId))
          .orderBy(ficheActionEtapeTable.ordre)
      );
    } catch (error) {
      this.logger.error(
        `Échec de la lecture des étapes pour la fiche ${ficheId}`,
        error
      );
      return failure(
        FicheActionEtapeErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private async checkCanWriteFiche(
    ficheId: number,
    tokenInfo: AuthenticatedUser,
    tx?: Transaction
  ): Promise<Result<undefined, FicheActionEtapeError>> {
    try {
      await this.ficheService.canWriteFiche(ficheId, tokenInfo, tx);
      return success(undefined);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return failure(FicheActionEtapeErrorEnum.FICHE_NOT_FOUND, error);
      }
      if (error instanceof ForbiddenException) {
        return failure(FicheActionEtapeErrorEnum.UNAUTHORIZED, error);
      }
      this.logger.error(
        `Échec du contrôle d'écriture sur la fiche ${ficheId}`,
        error
      );
      return failure(
        FicheActionEtapeErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private async checkCanReadFiche(
    ficheId: number,
    tokenInfo: AuthUser
  ): Promise<Result<undefined, FicheActionEtapeError>> {
    try {
      await this.ficheService.canReadFiche(ficheId, tokenInfo);
      return success(undefined);
    } catch (error) {
      if (error instanceof NotFoundException) {
        return failure(FicheActionEtapeErrorEnum.FICHE_NOT_FOUND, error);
      }
      if (error instanceof ForbiddenException) {
        return failure(FicheActionEtapeErrorEnum.UNAUTHORIZED, error);
      }
      this.logger.error(
        `Échec du contrôle de lecture sur la fiche ${ficheId}`,
        error
      );
      return failure(
        FicheActionEtapeErrorEnum.DATABASE_ERROR,
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }
}
