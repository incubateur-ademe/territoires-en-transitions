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
  importReferenceErrors,
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
      return this.reject('INVALID_IMPORT_REFERENCE_URL');
    }
    const permission = await this.permissions.isAllowed(
      user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!permission.success)
      return this.reject('IMPORT_REFERENCE_UNAUTHORIZED');

    try {
      const result = await this.fiches.getFicheById(
        parsed.data.ficheId,
        false,
        user,
        tx
      );
      if (!result.success) return this.reject('FICHE_REFERENCE_UNAVAILABLE');
      const fiche = result.data;
      const scopes = [
        fiche.collectiviteId,
        ...(fiche.sharedWithCollectivites ?? []).map(({ id }) => id),
      ];
      // Une lecture publique ou des droits sur une autre collectivité ne suffisent pas.
      if (
        !scopes.includes(collectiviteId) ||
        !scopes.includes(parsed.data.collectiviteId)
      ) {
        return this.reject('FICHE_REFERENCE_UNAVAILABLE');
      }
      const access = await this.fichePermissions.canWriteFiche(
        fiche.id,
        user,
        tx,
        true
      );
      return access
        ? success({ ficheId: fiche.id })
        : this.reject('FICHE_REFERENCE_UNAVAILABLE');
    } catch (error) {
      if (error instanceof ForbiddenException) {
        return this.reject('FICHE_REFERENCE_UNAVAILABLE');
      }
      this.logger.error('Impossible de résoudre la fiche du lien TeT', error);
      return this.reject('IMPORT_REFERENCE_RESOLUTION_FAILED');
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
      return this.reject('INVALID_IMPORT_REFERENCE_URL');
    }
    const permission = await this.permissions.isAllowed(
      user,
      'plans.fiches.import',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!permission.success)
      return this.reject('IMPORT_REFERENCE_UNAUTHORIZED');

    try {
      // Résoudre dans la collectivité cible : global, propre ou groupement autorisé.
      // Les valeurs de la collectivité présente dans l'URL ne sont jamais lues.
      const result = await this.indicateurs.listIndicateurs(
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
      return result.data.length === 1
        ? success({ indicateurId: result.data[0].id })
        : this.reject('INDICATEUR_REFERENCE_UNAVAILABLE');
    } catch (error) {
      if (error instanceof ForbiddenException) {
        return this.reject('INDICATEUR_REFERENCE_UNAVAILABLE');
      }
      this.logger.error(
        'Impossible de résoudre l’indicateur du lien TeT',
        error
      );
      return this.reject('IMPORT_REFERENCE_RESOLUTION_FAILED');
    }
  }

  private reject(
    code: ImportReferenceErrorCode
  ): Result<never, ImportReport['issues']> {
    return failure([{ code, ...importReferenceErrors[code] }]);
  }
}
