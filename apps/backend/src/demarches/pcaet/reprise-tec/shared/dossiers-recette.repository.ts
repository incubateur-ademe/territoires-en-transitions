import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { demarcheTable } from '@tet/backend/demarches/shared/models/demarche.table';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type { DemarchePcaetStatus } from '@tet/domain/demarches';
import { asc, eq, sql } from 'drizzle-orm';
import { recetteCollectiviteTable } from '../models/recette-collectivite.table';
import { recetteDossierTable } from '../models/recette-dossier.table';
import { recetteEcartTable } from '../models/recette-ecart.table';
import { isRecetteNonConstruite } from './is-recette-non-construite';

export type DossierRecette = {
  tecDossierId: number;
  collectiviteId: number | null;
  collectiviteNom: string | null;
  etat: string | null;
  motif: string | null;
  statut: DemarchePcaetStatus | null;
  adoptionDecideePar: string | null;
  melange: boolean;
  lanceBrut: string | null;
  oblige: boolean | null;
  transmisLe: string | null;
  transmisDansTec: string | null;
  sirenTec: string | null;
  sirenTet: string | null;
};

export type EcartRecette = {
  tecDossierId: number;
  motif: string;
  precision: string;
  nombre: number;
};

export type DossiersRecetteError = 'RECETTE_NON_CONSTRUITE' | 'DATABASE_ERROR';

@Injectable()
export class DossiersRecetteRepository {
  private readonly logger = new Logger(DossiersRecetteRepository.name);

  constructor(private readonly databaseService: DatabaseService) {}

  async listDossiers(
    tx?: Transaction
  ): Promise<Result<DossierRecette[], DossiersRecetteError>> {
    const db = tx ?? this.databaseService.db;
    return this.read(() =>
      db
        .select({
          tecDossierId: recetteDossierTable.tecDossierId,
          collectiviteId: recetteCollectiviteTable.tetCollectiviteId,
          collectiviteNom: sql<
            string | null
          >`coalesce(${collectiviteTable.nom}, ${recetteCollectiviteTable.nom})`,
          etat: recetteDossierTable.etat,
          motif: recetteDossierTable.motif,
          statut: sql<DemarchePcaetStatus | null>`${demarcheTable.status}`,
          adoptionDecideePar: recetteDossierTable.adoptionDecideePar,
          melange: recetteDossierTable.melange,
          lanceBrut: recetteDossierTable.lanceBrut,
          oblige: recetteDossierTable.oblige,
          transmisLe: sql<
            string | null
          >`${demarcheTable.transmittedAt}::date::text`,
          transmisDansTec: sql<
            string | null
          >`coalesce(${recetteDossierTable.receptionProjetLe}, least(${recetteDossierTable.avisDrealLe}, ${recetteDossierTable.avisCrLe}))::text`,
          sirenTec: recetteCollectiviteTable.siren,
          sirenTet: collectiviteTable.siren,
        })
        .from(recetteDossierTable)
        .leftJoin(
          recetteCollectiviteTable,
          eq(
            recetteCollectiviteTable.tecCollectiviteId,
            recetteDossierTable.tecCollectiviteId
          )
        )
        .leftJoin(
          collectiviteTable,
          eq(collectiviteTable.id, recetteCollectiviteTable.tetCollectiviteId)
        )
        .leftJoin(
          demarcheTable,
          eq(demarcheTable.id, recetteDossierTable.tetDemarcheId)
        )
        .orderBy(asc(recetteDossierTable.tecDossierId))
    );
  }

  async listEcartsDesDossiersRepris(
    tx?: Transaction
  ): Promise<Result<EcartRecette[], DossiersRecetteError>> {
    const db = tx ?? this.databaseService.db;
    return this.read(() =>
      db
        .select({
          tecDossierId: recetteEcartTable.tecDossierId,
          motif: recetteEcartTable.motif,
          precision: recetteEcartTable.precision,
          nombre: recetteEcartTable.nombre,
        })
        .from(recetteEcartTable)
        .innerJoin(
          recetteDossierTable,
          eq(recetteDossierTable.tecDossierId, recetteEcartTable.tecDossierId)
        )
        .where(sql`${recetteDossierTable.tetDemarcheId} is not null`)
        .orderBy(asc(recetteEcartTable.tecDossierId))
    );
  }

  private async read<T>(
    query: () => Promise<T>
  ): Promise<Result<T, DossiersRecetteError>> {
    try {
      return success(await query());
    } catch (error) {
      if (isRecetteNonConstruite(error)) {
        return failure('RECETTE_NON_CONSTRUITE');
      }
      this.logger.error(error);
      return failure('DATABASE_ERROR');
    }
  }
}
