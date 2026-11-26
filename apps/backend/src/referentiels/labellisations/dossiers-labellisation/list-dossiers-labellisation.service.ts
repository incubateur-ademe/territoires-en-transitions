import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  DOSSIER_LABELLISATION_STATUTS_PAR_DEFAUT,
  getDossierLabellisationStatut,
  ReferentielId,
} from '@tet/domain/referentiels';
import { checkLabellisationsAdmin } from './check-labellisations-admin.utils';
import {
  DossiersLabellisationError,
  DossiersLabellisationErrorEnum,
} from './dossiers-labellisation.errors';
import {
  GetActeEngagementDownloadUrlInput,
  ListDossiersLabellisationInput,
} from './dossiers-labellisation.input';
import {
  DossierRow,
  ListDossiersLabellisationRepository,
} from './list-dossiers-labellisation.repository';

@Injectable()
export class ListDossiersLabellisationService {
  constructor(
    private readonly repository: ListDossiersLabellisationRepository,
    private readonly permissionService: PermissionService
  ) {}

  /**
   * Autorise le programme TETE à télécharger l'acte d'engagement d'un dossier,
   * même sans être membre de la collectivité : le fichier doit être rattaché
   * à la demande du dossier.
   */
  async checkActeEngagementOfDossier(
    { auditId, fichierId }: GetActeEngagementDownloadUrlInput,
    { user }: ServiceSecondArg
  ): Promise<Result<{ collectiviteId: number }, DossiersLabellisationError>> {
    const isAllowed = await checkLabellisationsAdmin(
      this.permissionService,
      user
    );
    if (!isAllowed.success) {
      return isAllowed;
    }

    const preuve = await this.repository.getActeEngagementOfDossier({
      auditId,
      fichierId,
    });
    if (!preuve) {
      return failure(DossiersLabellisationErrorEnum.DOSSIER_NOT_FOUND);
    }
    return success({ collectiviteId: preuve.collectiviteId });
  }

  async listDossiers(
    {
      statuts = [...DOSSIER_LABELLISATION_STATUTS_PAR_DEFAUT],
      referentielIds = [],
      sujets = [],
      search,
    }: ListDossiersLabellisationInput,
    { user }: ServiceSecondArg
  ) {
    const isAllowed = await checkLabellisationsAdmin(
      this.permissionService,
      user
    );
    if (!isAllowed.success) {
      return isAllowed;
    }

    const rows = await this.repository.listDossiers({
      includeClosed: !statuts.length || statuts.includes('clos'),
      referentielIds,
      sujets,
      search,
    });

    // ponytail: pas de pagination, quelques centaines de dossiers au plus ; à
    // ajouter si la liste « tous » devient lente.
    // Le statut se déduit de l'audit et de la demande : il se filtre ici.
    return success(
      rows
        .map(toDossier)
        .filter(
          (dossier) => !statuts.length || statuts.includes(dossier.statut)
        )
    );
  }

  async getDossier(
    { auditId }: { auditId: number },
    { user }: ServiceSecondArg
  ) {
    const isAllowed = await checkLabellisationsAdmin(
      this.permissionService,
      user
    );
    if (!isAllowed.success) {
      return isAllowed;
    }

    const row = await this.repository.getDossier(auditId);
    if (!row) {
      return failure(DossiersLabellisationErrorEnum.DOSSIER_NOT_FOUND);
    }
    const dossier = toDossier(row);

    const [historique, labellisations, preuves, cot] = await Promise.all([
      // Audits précédents de la collectivité sur le référentiel : l'ADEME en
      // déduit si un audit COT est initial ou final.
      this.repository
        .listHistorique(dossier)
        .then((rows) => rows.map(toDossier)),
      // Toutes les labellisations, y compris celles sans audit (1ères
      // étoiles, labellisations obtenues hors plateforme).
      this.repository.listLabellisations(dossier),
      row.demandeId ? this.repository.listActesEngagement(row.demandeId) : [],
      this.repository.getCot(dossier.collectiviteId),
    ]);

    return success({
      ...dossier,
      isCotActif: cot?.actif ?? false,
      preuves,
      historique,
      labellisations,
    });
  }

  /** Personnes ayant le rôle auditeur, proposées à l'attribution d'un dossier. */
  async listAuditeurs({ user }: ServiceSecondArg) {
    const isAllowed = await checkLabellisationsAdmin(
      this.permissionService,
      user
    );
    if (!isAllowed.success) {
      return isAllowed;
    }

    return success(await this.repository.listAuditeurs());
  }
}

function toDossier(row: DossierRow) {
  const demande = row.demandeId
    ? { etoiles: row.etoiles, sujet: row.sujet }
    : null;
  return {
    ...row,
    referentielId: row.referentielId as ReferentielId,
    statut: getDossierLabellisationStatut({ audit: row, demande }),
  };
}
