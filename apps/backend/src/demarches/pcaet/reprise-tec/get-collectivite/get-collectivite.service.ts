import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { departementTable } from '@tet/backend/collectivites/shared/models/imports-departement.table';
import { regionTable } from '@tet/backend/collectivites/shared/models/imports-region.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { asc, eq, inArray, sql } from 'drizzle-orm';
import { ListDemarchesPcaetService } from '../../list-demarches-pcaet/list-demarches-pcaet.service';
import { recetteCollectiviteTable } from '../models/recette-collectivite.table';
import { recetteDossierTable } from '../models/recette-dossier.table';
import { isRecetteNonConstruite } from '../shared/is-recette-non-construite';
import {
  GetCollectiviteError,
  GetCollectiviteErrorEnum,
} from './get-collectivite.errors';
import { GetCollectiviteInput } from './get-collectivite.input';
import { RecetteCollectiviteDetail } from './get-collectivite.output';

@Injectable()
export class GetCollectiviteService {
  private readonly logger = new Logger(GetCollectiviteService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
    private readonly listDemarchesPcaetService: ListDemarchesPcaetService
  ) {}

  async getCollectivite(
    { collectiviteId }: GetCollectiviteInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<RecetteCollectiviteDetail, GetCollectiviteError>> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['UTILS.BACKOFFICE.READ'],
      ResourceType.PLATEFORME,
      null,
      tx
    );
    if (!permissionResult.success) {
      return failure(GetCollectiviteErrorEnum.UNAUTHORIZED);
    }

    const recetteResult = await this.loadRecette(collectiviteId, tx);
    if (!recetteResult.success) {
      return recetteResult;
    }
    const { collectivite, tec, dossiers, copies } = recetteResult.data;

    const demarchesResult =
      await this.listDemarchesPcaetService.listDemarchesPcaet(
        { collectiviteId },
        { user, tx }
      );
    if (!demarchesResult.success) {
      return failure(
        demarchesResult.error === 'UNAUTHORIZED'
          ? GetCollectiviteErrorEnum.UNAUTHORIZED
          : GetCollectiviteErrorEnum.SERVER_ERROR
      );
    }
    const statutParDemarche = new Map(
      demarchesResult.data.map((d) => [d.id, d.status])
    );
    const copieParDossier = new Map(
      copies.map((c) => [c.definitifDe, c.tecDossierId])
    );

    return success({
      collectivite,
      tec,
      dossiers: dossiers.map((d) => ({
        tecDossierId: d.tecDossierId,
        tecCollectiviteId: d.tecCollectiviteId,
        nom: d.nom,
        etat: d.etat,
        motif: d.motif,
        copieId: copieParDossier.get(d.tecDossierId) ?? null,
        demarcheId: d.tetDemarcheId,
        statut:
          d.tetDemarcheId === null
            ? null
            : statutParDemarche.get(d.tetDemarcheId) ?? null,
      })),
    });
  }

  private async loadRecette(
    collectiviteId: number,
    tx: ServiceSecondArg['tx']
  ) {
    const db = tx ?? this.databaseService.db;
    try {
      const [collectivite] = await db
        .select({
          id: collectiviteTable.id,
          nom: collectiviteTable.nom,
          siren: collectiviteTable.siren,
          population: collectiviteTable.population,
          region: regionTable.libelle,
          departement: sql<
            string | null
          >`${departementTable.code} || ' - ' || ${departementTable.libelle}`,
        })
        .from(collectiviteTable)
        .leftJoin(
          regionTable,
          eq(regionTable.code, collectiviteTable.regionCode)
        )
        .leftJoin(
          departementTable,
          eq(departementTable.code, collectiviteTable.departementCode)
        )
        .where(eq(collectiviteTable.id, collectiviteId));

      const tec = await db
        .select({
          tecCollectiviteId: recetteCollectiviteTable.tecCollectiviteId,
          nom: recetteCollectiviteTable.nom,
          siren: recetteCollectiviteTable.siren,
          population: recetteCollectiviteTable.population,
          suiviObligation: recetteCollectiviteTable.suiviObligation,
          suiviAvisEtatLe: recetteCollectiviteTable.suiviAvisEtatLe,
          suiviApprobationLe: recetteCollectiviteTable.suiviApprobationLe,
        })
        .from(recetteCollectiviteTable)
        .where(eq(recetteCollectiviteTable.tetCollectiviteId, collectiviteId))
        .orderBy(asc(recetteCollectiviteTable.tecCollectiviteId));

      if (!collectivite || tec.length === 0) {
        return failure(GetCollectiviteErrorEnum.NOT_FOUND);
      }

      const lignes = await db
        .select({
          tecDossierId: recetteDossierTable.tecDossierId,
          tecCollectiviteId: recetteDossierTable.tecCollectiviteId,
          definitifDe: recetteDossierTable.definitifDe,
          nom: recetteDossierTable.nom,
          etat: recetteDossierTable.etat,
          motif: recetteDossierTable.motif,
          tetDemarcheId: recetteDossierTable.tetDemarcheId,
        })
        .from(recetteDossierTable)
        .where(
          inArray(
            recetteDossierTable.tecCollectiviteId,
            tec.map((c) => c.tecCollectiviteId)
          )
        )
        .orderBy(asc(recetteDossierTable.tecDossierId));

      return success({
        collectivite,
        tec,
        dossiers: lignes.filter((d) => d.definitifDe === null),
        copies: lignes.flatMap((d) =>
          d.definitifDe === null
            ? []
            : [{ tecDossierId: d.tecDossierId, definitifDe: d.definitifDe }]
        ),
      });
    } catch (error) {
      if (isRecetteNonConstruite(error)) {
        return failure(GetCollectiviteErrorEnum.RECETTE_NON_CONSTRUITE);
      }
      this.logger.error(error);
      return failure(GetCollectiviteErrorEnum.DATABASE_ERROR);
    }
  }
}
