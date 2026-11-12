import { Injectable } from '@nestjs/common';
import { CollectiviteCompetencesRepository } from '@tet/backend/collectivites/shared/collectivite-competences.repository';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import {
  COMPETENCE_BANATIC_SCOT,
  estNatureSupraPcaet,
} from '@tet/domain/demarches';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DemarchePcaetPerimetreRepository } from '../shared/demarche-pcaet-perimetre.repository';
import {
  GetDepotContextError,
  GetDepotContextErrorEnum,
} from './get-depot-context.errors';
import { GetDepotContextInput } from './get-depot-context.input';
import { DepotContext } from './get-depot-context.output';

/**
 * Ce que les écrans de dépôt doivent savoir de la collectivité elle-même, et
 * qui ne se lit pas sur la démarche : l'écran de démarrage pour décider quelles
 * questions poser, l'en-tête du dossier pour décider lesquelles restent
 * corrigeables.
 */
@Injectable()
export class GetDepotContextService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly competencesRepository: CollectiviteCompetencesRepository,
    private readonly perimetreRepository: DemarchePcaetPerimetreRepository,
    private readonly trackingService: TrackingService
  ) {}

  async getDepotContext(
    input: GetDepotContextInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<DepotContext, GetDepotContextError>> {
    // Même permission que la création elle-même : ce contexte ne se lit que
    // par qui peut déposer.
    const permissionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId: input.collectiviteId },
      tx
    );
    if (!permissionResult.success) {
      return failure(GetDepotContextErrorEnum.UNAUTHORIZED);
    }

    const [peutDeclarerScotAec, natureInsee, isSupraEnabled] =
      await Promise.all([
        this.competencesRepository.hasCompetence(
          input.collectiviteId,
          COMPETENCE_BANATIC_SCOT,
          tx
        ),
        this.perimetreRepository.getNatureInsee(input.collectiviteId, tx),
        // Flag inactif : le Supra dépose comme toute collectivité, sans périmètre.
        this.trackingService.isFeatureEnabled(
          'is-pcaet-supra-enabled',
          user.id,
          input.collectiviteId
        ),
      ]);

    const estSupra = isSupraEnabled && estNatureSupraPcaet(natureInsee);
    if (!estSupra) {
      return success({
        peutDeclarerScotAec,
        estSupra,
        epciCandidats: [],
        perimetrePrecedent: [],
      });
    }

    const [epciCandidats, perimetrePrecedent] = await Promise.all([
      this.perimetreRepository.listEpciCandidats(input.collectiviteId, tx),
      this.perimetreRepository.getPerimetrePrecedent(input.collectiviteId, tx),
    ]);

    return success({
      peutDeclarerScotAec,
      estSupra,
      epciCandidats,
      perimetrePrecedent,
    });
  }
}
