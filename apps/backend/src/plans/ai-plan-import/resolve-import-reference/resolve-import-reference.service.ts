import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { ListIndicateursService } from '@tet/backend/indicateurs/indicateurs/list-indicateurs/list-indicateurs.service';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import ConfigurationService from '@tet/backend/utils/config/configuration.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { ResourceType } from '@tet/domain/users';
import { ImportReport } from '../models/import-report';
import {
  ImportReferenceErrorCode,
  ImportReferenceErrors as Errors,
} from './import-reference.errors';
import { ImportReferenceRules } from './import-reference.rules';

/** Résout uniquement les identités : les objets désignés par URL restent inchangés. */
@Injectable()
export class ResolveImportReferenceService {
  private readonly logger = new Logger(ResolveImportReferenceService.name);

  constructor(
    private readonly configuration: ConfigurationService,
    private readonly permissions: PermissionService,
    private readonly fiches: ListFichesService,
    private readonly fichePermissions: FicheActionPermissionsService,
    private readonly indicateurs: ListIndicateursService
  ) {}

  async resolveFiche(
    reference: string,
    collectiviteId: number,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<{ ficheId: number }, ImportReport['issues']>> {
    const parsed = ImportReferenceRules.parse(
      reference,
      this.configuration.get('APP_URL')
    );
    if (!parsed.success) return parsed;
    if (parsed.data.kind !== 'fiche') {
      return this.reject('INVALID_IMPORT_REFERENCE_URL', reference);
    }
    const permission = await this.permissions.isAllowed(
      user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!permission.success)
      return this.reject('IMPORT_REFERENCE_UNAUTHORIZED', reference);

    // Le diagnostic utilise seulement la collectivité déjà visible dans l'URL.
    // Une action partagée reste autorisée, même si son lien vient d'ailleurs.
    const unavailable = () =>
      this.reject(
        parsed.data.collectiviteId === collectiviteId
          ? 'FICHE_REFERENCE_UNAVAILABLE'
          : 'FICHE_REFERENCE_OTHER_COLLECTIVITE',
        reference
      );
    try {
      const result = await this.fiches.getFicheById(
        { ficheId: parsed.data.ficheId },
        { user, tx }
      );
      if (!result.success) {
        if (result.error !== 'DATABASE_ERROR') return unavailable();
        this.logger.error(
          'Impossible de résoudre la fiche action du lien TeT',
          result.cause
        );
        return this.reject('IMPORT_REFERENCE_RESOLUTION_FAILED', reference);
      }
      const fiche = result.data;
      const scopes = [
        fiche.collectiviteId,
        ...(fiche.sharedWithCollectivites ?? []).map(({ id }) => id),
      ];
      // Une lecture publique ou des droits sur une autre collectivité ne suffisent pas.
      if (!scopes.includes(parsed.data.collectiviteId)) {
        return unavailable();
      }
      const access = await this.fichePermissions.canLinkFicheToCollectivite(
        fiche.id,
        collectiviteId,
        user,
        tx
      );
      return access ? success({ ficheId: fiche.id }) : unavailable();
    } catch (error) {
      if (error instanceof ForbiddenException) {
        return unavailable();
      }
      this.logger.error(
        'Impossible de résoudre la fiche action du lien TeT',
        error
      );
      return this.reject('IMPORT_REFERENCE_RESOLUTION_FAILED', reference);
    }
  }

  async resolveIndicateur(
    reference: string,
    collectiviteId: number,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<{ indicateurId: number }, ImportReport['issues']>> {
    const parsed = ImportReferenceRules.parse(
      reference,
      this.configuration.get('APP_URL')
    );
    if (!parsed.success) return parsed;
    if (parsed.data.kind !== 'indicateur') {
      return this.reject('INVALID_IMPORT_REFERENCE_URL', reference);
    }
    const permission = await this.permissions.isAllowed(
      user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!permission.success)
      return this.reject('IMPORT_REFERENCE_UNAUTHORIZED', reference);

    // Résoudre dans la collectivité cible : global, propre ou groupement autorisé.
    // Les valeurs de la collectivité présente dans l'URL ne sont jamais lues.
    const listResult = await this.indicateurs.listIndicateurs(
      {
        collectiviteId,
        filters:
          parsed.data.indicateurId !== undefined
            ? { indicateurIds: [parsed.data.indicateurId] }
            : {
                identifiantsReferentiel: [parsed.data.identifiantReferentiel],
              },
        queryOptions: { page: 1, limit: 2 },
      },
      user
    );
    if (!listResult.success) {
      if (listResult.error === 'UNAUTHORIZED') {
        return this.reject('INDICATEUR_REFERENCE_UNAVAILABLE', reference);
      }
      this.logger.error(
        'Impossible de résoudre l’indicateur du lien TeT',
        listResult.cause
      );
      return this.reject('IMPORT_REFERENCE_RESOLUTION_FAILED', reference);
    }
    return listResult.data.data.length === 1
      ? success({ indicateurId: listResult.data.data[0].id })
      : this.reject('INDICATEUR_REFERENCE_UNAVAILABLE', reference);
  }

  private reject(
    code: ImportReferenceErrorCode,
    reference: string
  ): Result<never, ImportReport['issues']> {
    return failure([Errors.issue(code, reference)]);
  }
}
