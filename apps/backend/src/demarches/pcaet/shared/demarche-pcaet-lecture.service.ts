import { Injectable } from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TrackingService } from '@tet/backend/utils/tracking/tracking.service';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { DemarchePcaetPerimetreRepository } from './demarche-pcaet-perimetre.repository';

/**
 * Qui lit une démarche dans les écrans d'édition : qui en édite les démarches,
 * ou, en lecture seule, un membre d'un EPCI que couvre le dépôt d'un Supra.
 *
 * Distincte de la lecture publique (statuts publics seulement, écrans de
 * consultation) et de l'instruction (services de l'État).
 */
@Injectable()
export class DemarchePcaetLectureService {
  constructor(
    private readonly permissionService: PermissionService,
    private readonly perimetreRepository: DemarchePcaetPerimetreRepository,
    private readonly trackingService: TrackingService
  ) {}

  async canRead(
    {
      collectiviteId,
      demarcheId,
    }: { collectiviteId: number; demarcheId: number },
    { user, tx }: ServiceSecondArg
  ): Promise<Result<{ lectureSeule: boolean }, 'UNAUTHORIZED'>> {
    const editionResult = await this.permissionService.isAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.PCAET.MUTATE'],
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (editionResult.success) {
      return success({ lectureSeule: false });
    }

    if (
      await this.canReadParCouverture(
        { collectiviteId, demarcheId },
        { user, tx }
      )
    ) {
      return success({ lectureSeule: true });
    }
    return failure('UNAUTHORIZED');
  }

  /** Les dépôts qui couvrent une collectivité se lisent par ses membres. */
  async canListCouvrants(
    collectiviteId: number,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, 'UNAUTHORIZED'>> {
    const autorise =
      this.isLectureAutoriseeParCle(user) &&
      (await this.isSupraEnabled(user.id, collectiviteId)) &&
      (await this.perimetreRepository.isMembreActif(
        { collectiviteId, userId: user.id },
        tx
      ));
    return autorise ? success(undefined) : failure('UNAUTHORIZED');
  }

  private async canReadParCouverture(
    {
      collectiviteId,
      demarcheId,
    }: { collectiviteId: number; demarcheId: number },
    { user, tx }: ServiceSecondArg
  ): Promise<boolean> {
    return (
      this.isLectureAutoriseeParCle(user) &&
      (await this.isSupraEnabled(user.id, collectiviteId)) &&
      this.perimetreRepository.isMembreDUneCollectiviteCouverte(
        { demarcheId, porteurId: collectiviteId, userId: user.id },
        tx
      )
    );
  }

  /**
   * Une clé d'API restreinte porte la liste de ses opérations : la lecture par
   * couverture ne passe pas par `isAllowed`, qui la vérifierait. Sans rôle exigé
   * sur le porteur, que les membres couverts n'ont pas.
   */
  private isLectureAutoriseeParCle(user: ServiceSecondArg['user']): boolean {
    return this.permissionService.isApiKeyAllowed(
      user,
      PermissionOperationEnum['DEMARCHES.PCAET.READ']
    ).success;
  }

  private isSupraEnabled(
    userId: string,
    collectiviteId: number
  ): Promise<boolean> {
    return this.trackingService.isFeatureEnabled(
      'is-pcaet-supra-enabled',
      userId,
      collectiviteId
    );
  }
}
