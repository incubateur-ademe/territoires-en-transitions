import { Injectable, Logger } from '@nestjs/common';
import { collectiviteTable } from '@tet/backend/collectivites/shared/models/collectivite.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { and, asc, eq, sql } from 'drizzle-orm';
import { GetDemarchePcaetService } from '../../get-demarche-pcaet/get-demarche-pcaet.service';
import { recetteCollectiviteTable } from '../models/recette-collectivite.table';
import { recetteDossierTable } from '../models/recette-dossier.table';
import { recetteEcartTable } from '../models/recette-ecart.table';
import { isRecetteNonConstruite } from '../shared/is-recette-non-construite';
import { getSectionDeLEcart } from '../shared/regles.rules';
import { listSpecificites } from '../shared/specificites.rules';
import { GetDossierError, GetDossierErrorEnum } from './get-dossier.errors';
import { GetDossierInput } from './get-dossier.input';
import { RecetteDossierDetail } from './get-dossier.output';

@Injectable()
export class GetDossierService {
  private readonly logger = new Logger(GetDossierService.name);

  constructor(
    private readonly permissionService: PermissionService,
    private readonly databaseService: DatabaseService,
    private readonly getDemarchePcaetService: GetDemarchePcaetService
  ) {}

  async getDossier(
    input: GetDossierInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<RecetteDossierDetail, GetDossierError>> {
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['UTILS.BACKOFFICE.READ'],
      ResourceType.PLATEFORME,
      null,
      tx
    );
    if (!permissionResult.success) {
      return failure(GetDossierErrorEnum.UNAUTHORIZED);
    }

    const recetteResult = await this.loadRecette(input, tx);
    if (!recetteResult.success) {
      return recetteResult;
    }
    const { dossier, copie, ecarts, sirenTet } = recetteResult.data;

    let demarche: RecetteDossierDetail['demarche'] = null;
    if (dossier.tetDemarcheId !== null) {
      const demarcheResult =
        await this.getDemarchePcaetService.getDemarchePcaet(
          {
            collectiviteId: input.collectiviteId,
            demarcheId: dossier.tetDemarcheId,
          },
          { user, tx }
        );
      if (demarcheResult.success) {
        demarche = demarcheResult.data;
      } else if (demarcheResult.error !== 'DEMARCHE_PCAET_NOT_FOUND') {
        return failure(
          demarcheResult.error === 'UNAUTHORIZED'
            ? GetDossierErrorEnum.UNAUTHORIZED
            : GetDossierErrorEnum.SERVER_ERROR
        );
      }
    }

    return success({
      dossier: {
        tecDossierId: dossier.tecDossierId,
        nom: dossier.nom,
        etat: dossier.etat,
        types: dossier.types,
        publie: dossier.publie,
        oblige: dossier.oblige,
        version: dossier.version,
        creeLe: dossier.creeLe,
        lanceLe: dossier.lanceLe,
        receptionProjetLe: dossier.receptionProjetLe,
        avisDrealLe: dossier.avisDrealLe,
        avisCrLe: dossier.avisCrLe,
        depotDefinitifLe: dossier.depotDefinitifLe,
        misAJourLe: dossier.misAJourLe,
        eluReferent: dossier.eluReferent,
        description: dossier.description,
        populationCouverte: dossier.populationCouverte,
        commentaireStatut: dossier.commentaireStatut,
        motif: dossier.motif,
        sectionDuMotif: dossier.motif
          ? getSectionDeLEcart(dossier.motif, '')
          : null,
      },
      suivi: {
        avisEtatLe: dossier.suiviAvisEtatLe,
        approbationLe: dossier.suiviApprobationLe,
      },
      copie: copie ?? null,
      demarche,
      ecarts: ecarts.map((e) => ({
        ...e,
        section: getSectionDeLEcart(e.motif, e.precision),
      })),
      specificites: listSpecificites({
        dossier,
        copieId: copie?.tecDossierId ?? null,
        sirenTec: dossier.siren,
        sirenTet,
        suivi: {
          avisEtatLe: dossier.suiviAvisEtatLe,
          approbationLe: dossier.suiviApprobationLe,
        },
        demarche,
      }),
    });
  }

  private async loadRecette(
    { collectiviteId, tecDossierId }: GetDossierInput,
    tx: ServiceSecondArg['tx']
  ) {
    const db = tx ?? this.databaseService.db;
    try {
      const [dossier] = await db
        .select({
          tecDossierId: recetteDossierTable.tecDossierId,
          nom: recetteDossierTable.nom,
          etat: recetteDossierTable.etat,
          types: recetteDossierTable.types,
          publie: recetteDossierTable.publie,
          oblige: recetteDossierTable.oblige,
          version: recetteDossierTable.version,
          creeLe: recetteDossierTable.creeLe,
          lanceLe: recetteDossierTable.lanceLe,
          lanceBrut: recetteDossierTable.lanceBrut,
          receptionProjetLe: recetteDossierTable.receptionProjetLe,
          avisDrealLe: recetteDossierTable.avisDrealLe,
          avisCrLe: recetteDossierTable.avisCrLe,
          depotDefinitifLe: recetteDossierTable.depotDefinitifLe,
          misAJourLe: recetteDossierTable.misAJourLe,
          eluReferent: recetteDossierTable.eluReferent,
          description: recetteDossierTable.description,
          populationCouverte: recetteDossierTable.populationCouverte,
          commentaireStatut: recetteDossierTable.commentaireStatut,
          motif: recetteDossierTable.motif,
          melange: recetteDossierTable.melange,
          tetDemarcheId: recetteDossierTable.tetDemarcheId,
          adoptionDecideePar: recetteDossierTable.adoptionDecideePar,
          siren: recetteCollectiviteTable.siren,
          suiviAvisEtatLe: recetteCollectiviteTable.suiviAvisEtatLe,
          suiviApprobationLe: recetteCollectiviteTable.suiviApprobationLe,
        })
        .from(recetteDossierTable)
        .innerJoin(
          recetteCollectiviteTable,
          eq(
            recetteCollectiviteTable.tecCollectiviteId,
            recetteDossierTable.tecCollectiviteId
          )
        )
        .where(
          and(
            eq(recetteDossierTable.tecDossierId, tecDossierId),
            eq(recetteCollectiviteTable.tetCollectiviteId, collectiviteId)
          )
        );
      if (!dossier) {
        return failure(GetDossierErrorEnum.NOT_FOUND);
      }

      const [copie] = await db
        .select({
          tecDossierId: recetteDossierTable.tecDossierId,
          etat: recetteDossierTable.etat,
        })
        .from(recetteDossierTable)
        .where(eq(recetteDossierTable.definitifDe, tecDossierId));

      const ecarts = await db
        .select({
          tableSource: recetteEcartTable.tableSource,
          motif: recetteEcartTable.motif,
          precision: recetteEcartTable.precision,
          nombre: sql<number>`sum(${recetteEcartTable.nombre})::int`,
        })
        .from(recetteEcartTable)
        .where(eq(recetteEcartTable.tecDossierId, tecDossierId))
        .groupBy(
          recetteEcartTable.tableSource,
          recetteEcartTable.motif,
          recetteEcartTable.precision
        )
        .orderBy(
          asc(recetteEcartTable.tableSource),
          asc(recetteEcartTable.motif),
          asc(recetteEcartTable.precision)
        );

      const [collectivite] = await db
        .select({ siren: collectiviteTable.siren })
        .from(collectiviteTable)
        .where(eq(collectiviteTable.id, collectiviteId));

      return success({
        dossier,
        copie,
        ecarts,
        sirenTet: collectivite?.siren ?? null,
      });
    } catch (error) {
      if (isRecetteNonConstruite(error)) {
        return failure(GetDossierErrorEnum.RECETTE_NON_CONSTRUITE);
      }
      this.logger.error(error);
      return failure(GetDossierErrorEnum.DATABASE_ERROR);
    }
  }
}
