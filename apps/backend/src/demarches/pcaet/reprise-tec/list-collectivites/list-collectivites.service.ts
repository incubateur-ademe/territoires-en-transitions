import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { departementTable } from '@tet/backend/collectivites/shared/models/imports-departement.table';
import { regionTable } from '@tet/backend/collectivites/shared/models/imports-region.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { asc, eq, sql } from 'drizzle-orm';
import { recetteCollectiviteTable } from '../models/recette-collectivite.table';
import { recetteDossierTable } from '../models/recette-dossier.table';
import { isRecetteNonConstruite } from '../shared/is-recette-non-construite';
import {
  ListCollectivitesError,
  ListCollectivitesErrorEnum,
} from './list-collectivites.errors';
import { RecetteCollectivite } from './list-collectivites.output';

@Injectable()
export class ListCollectivitesService {
  private readonly logger = new Logger(ListCollectivitesService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService
  ) {}

  async listCollectivites({
    user,
    tx,
  }: ServiceSecondArg): Promise<
    Result<RecetteCollectivite[], ListCollectivitesError>
  > {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.REPRISE-TEC.READ'],
      ResourceType.PLATEFORME,
      null,
      tx
    );
    if (!permissionResult.success) {
      return failure(ListCollectivitesErrorEnum.UNAUTHORIZED);
    }

    const db = tx ?? this.databaseService.db;
    try {
      const rows = await db
        .select({
          tecCollectiviteId: recetteCollectiviteTable.tecCollectiviteId,
          collectiviteId: recetteCollectiviteTable.tetCollectiviteId,
          nom: recetteCollectiviteTable.nom,
          siren: recetteCollectiviteTable.siren,
          population: recetteCollectiviteTable.population,
          nomTet: collectiviteTable.nom,
          typeTet: collectiviteTable.type,
          natureTet: collectiviteTable.natureInsee,
          region: regionTable.libelle,
          departement: sql<
            string | null
          >`${departementTable.code} || ' - ' || ${departementTable.libelle}`,
        })
        .from(recetteCollectiviteTable)
        .leftJoin(
          collectiviteTable,
          eq(collectiviteTable.id, recetteCollectiviteTable.tetCollectiviteId)
        )
        .leftJoin(
          regionTable,
          eq(regionTable.code, collectiviteTable.regionCode)
        )
        .leftJoin(
          departementTable,
          eq(departementTable.code, collectiviteTable.departementCode)
        )
        .orderBy(asc(recetteCollectiviteTable.nom));
      const dossiers = await db
        .select({
          tecDossierId: recetteDossierTable.tecDossierId,
          tecCollectiviteId: recetteDossierTable.tecCollectiviteId,
          definitifDe: recetteDossierTable.definitifDe,
          demarcheId: recetteDossierTable.tetDemarcheId,
        })
        .from(recetteDossierTable)
        .orderBy(asc(recetteDossierTable.tecDossierId));

      const copieParDossier = new Map(
        dossiers.flatMap((d) =>
          d.definitifDe === null ? [] : [[d.definitifDe, d.tecDossierId]]
        )
      );
      const dossiersParCollectivite = new Map<number | null, typeof dossiers>();
      for (const d of dossiers.filter((d) => d.definitifDe === null)) {
        dossiersParCollectivite.set(d.tecCollectiviteId, [
          ...(dossiersParCollectivite.get(d.tecCollectiviteId) ?? []),
          d,
        ]);
      }
      return success(
        rows.map((c) => ({
          ...c,
          dossiers: (
            dossiersParCollectivite.get(c.tecCollectiviteId) ?? []
          ).map((d) => ({
            tecDossierId: d.tecDossierId,
            demarcheId: d.demarcheId,
            copieId: copieParDossier.get(d.tecDossierId) ?? null,
          })),
        }))
      );
    } catch (error) {
      if (isRecetteNonConstruite(error)) {
        return failure(ListCollectivitesErrorEnum.RECETTE_NON_CONSTRUITE);
      }
      this.logger.error(error);
      return failure(ListCollectivitesErrorEnum.DATABASE_ERROR);
    }
  }
}
