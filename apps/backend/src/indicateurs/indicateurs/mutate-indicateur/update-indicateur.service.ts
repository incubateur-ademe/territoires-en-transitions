import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UpdateIndicateurInput } from '@tet/backend/indicateurs/indicateurs/mutate-indicateur/mutate-indicateur.input';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import {
  AuthenticatedUser,
  AuthUser,
} from '@tet/backend/users/models/auth.models';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import type { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { CommonErrorEnum } from '@tet/backend/utils/trpc/common-errors';
import {
  canChangeIndicateurUnite,
  type IndicateurInGroup,
  type IndicateurNatureFields,
  isIndicateurPerso,
  isIndicateurPredefini,
} from '@tet/domain/indicateurs';
import { hasPermission, ResourceType } from '@tet/domain/users';
import { GetUserRolesAndPermissionsService } from '../../../users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import { IndicateurLockRepository } from '../../indicateur/indicateur-lock.repository';
import { UpsertIndicateurFichesService } from '../upsert-indicateur-fiches/upsert-indicateur-fiches.service';
import { UpsertIndicateurPilotesService } from '../upsert-indicateur-pilotes/upsert-indicateur-pilotes.service';
import { UpsertIndicateurServicesService } from '../upsert-indicateur-services/upsert-indicateur-services.service';
import { UpsertIndicateurThematiquesService } from '../upsert-indicateur-thematiques/upsert-indicateur-thematiques.service';
import { MutateIndicateurRepository } from './mutate-indicateur.repository';
import {
  UpdateIndicateurError,
  UpdateIndicateurErrorEnum,
} from './update-indicateur.errors';

type UpdateIndicateurAccess = {
  user: AuthenticatedUser;
  collectiviteId: number;
  indicateurId: number;
};

const isOwnedByCollectivite = (
  indicateur: IndicateurNatureFields,
  collectiviteId: number
): boolean =>
  isIndicateurPerso(indicateur) && indicateur.collectiviteId === collectiviteId;

const isInCollectiviteScope = (
  indicateur: IndicateurNatureFields,
  collectiviteId: number
): boolean =>
  isIndicateurPredefini(indicateur) ||
  isOwnedByCollectivite(indicateur, collectiviteId);

const hasDefinitionFieldsToUpdate = ({
  titre,
  unite,
  totalEstCumulDesSousIndicateurs,
}: Pick<
  UpdateIndicateurInput['indicateurFields'],
  'titre' | 'unite' | 'totalEstCumulDesSousIndicateurs'
>): boolean =>
  titre !== undefined ||
  unite !== undefined ||
  totalEstCumulDesSousIndicateurs !== undefined;

const getUniteToPropagate = ({
  indicateurInGroup,
  unite,
}: {
  indicateurInGroup: IndicateurInGroup | null;
  unite?: string;
}): string | null => {
  const isRootWithSousIndicateurs =
    indicateurInGroup !== null &&
    indicateurInGroup.parentId === null &&
    indicateurInGroup.hasChildren;
  if (unite === undefined || !isRootWithSousIndicateurs) {
    return null;
  }
  return unite;
};

const isUniteLocked = ({
  indicateurInGroup,
  unite,
}: {
  indicateurInGroup: IndicateurInGroup | null;
  unite?: string;
}): boolean =>
  unite !== undefined &&
  indicateurInGroup !== null &&
  !canChangeIndicateurUnite({ indicateur: indicateurInGroup, unite });

@Injectable()
export class UpdateIndicateurService {
  private readonly logger = new Logger(UpdateIndicateurService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly repository: MutateIndicateurRepository,
    private readonly getUserPermissionsService: GetUserRolesAndPermissionsService,
    private readonly permissionService: PermissionService,
    private readonly upsertIndicateurFichesService: UpsertIndicateurFichesService,
    private readonly upsertIndicateurPilotesService: UpsertIndicateurPilotesService,
    private readonly upsertIndicateurServicesService: UpsertIndicateurServicesService,
    private readonly upsertIndicateurThematiquesService: UpsertIndicateurThematiquesService,
    private readonly indicateurLockRepository: IndicateurLockRepository
  ) {}

  async canUpdateIndicateur(
    { user, collectiviteId, indicateurId }: UpdateIndicateurAccess,
    tx?: Transaction
  ): Promise<boolean> {
    const userPermissionsResult =
      await this.getUserPermissionsService.getUserRolesAndPermissions({
        userId: user.id,
        tx,
      });

    if (!userPermissionsResult.success) {
      return false;
    }

    const userPermissions = userPermissionsResult.data;

    if (
      hasPermission(userPermissions, 'indicateurs.indicateurs.update', {
        collectiviteId,
      })
    ) {
      return true;
    }

    const canUpdateWhenPilote = hasPermission(
      userPermissions,
      'indicateurs.indicateurs.update_piloted_by_me',
      { collectiviteId }
    );
    if (!canUpdateWhenPilote) {
      return false;
    }

    return this.isPiloteOfIndicateur(
      { user, collectiviteId, indicateurId },
      tx
    );
  }

  private async isPiloteOfIndicateur(
    { user, collectiviteId, indicateurId }: UpdateIndicateurAccess,
    tx?: Transaction
  ): Promise<boolean> {
    const readPilotesAccess = await this.permissionService.isAllowed(
      user,
      'indicateurs.indicateurs.read_confidentiel',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!readPilotesAccess.success) {
      return false;
    }

    const pilotes =
      await this.upsertIndicateurPilotesService.listIndicateurPilotes(
        { indicateurId, collectiviteId, user },
        tx
      );
    return pilotes.some((pilote) => pilote.userId === user.id);
  }

  private assertIndicateurInCollectiviteScope(
    indicateur: IndicateurNatureFields | null,
    requestedCollectiviteId: number,
    indicateurId: number
  ): asserts indicateur is IndicateurNatureFields {
    if (
      !indicateur ||
      !isInCollectiviteScope(indicateur, requestedCollectiviteId)
    ) {
      throw new NotFoundException(
        `Indicateur ${indicateurId} non trouvé pour la collectivité ${requestedCollectiviteId}`
      );
    }
  }

  private async assertMemberOfIndicateurGroupement(
    indicateur: IndicateurNatureFields,
    collectiviteId: number,
    indicateurId: number,
    tx: Transaction
  ): Promise<void> {
    if (
      !isIndicateurPredefini(indicateur) ||
      indicateur.groupementId === null
    ) {
      return;
    }
    const isMember = await this.repository.lockGroupementMembership(
      { groupementId: indicateur.groupementId, collectiviteId },
      tx
    );
    if (!isMember) {
      throw new NotFoundException(
        `Indicateur ${indicateurId} non trouvé pour la collectivité ${collectiviteId}`
      );
    }
  }

  private assertRequestedFieldsAreMutable(
    indicateur: IndicateurNatureFields,
    collectiviteId: number,
    indicateurId: number,
    indicateurFields: UpdateIndicateurInput['indicateurFields']
  ): void {
    if (indicateurFields.periodicite !== undefined) {
      throw new BadRequestException(
        'La périodicité est fixée à la création de l’indicateur'
      );
    }
    if (isOwnedByCollectivite(indicateur, collectiviteId)) {
      return;
    }

    const { thematiques } = indicateurFields;
    const updatesGlobalDefinitionFields =
      hasDefinitionFieldsToUpdate(indicateurFields) ||
      thematiques !== undefined;
    if (updatesGlobalDefinitionFields) {
      throw new BadRequestException(
        `Les champs globaux de l'indicateur ${indicateurId} ne peuvent être modifiés que par sa collectivité propriétaire`
      );
    }
  }

  async updateIndicateur(
    { indicateurId, collectiviteId, indicateurFields }: UpdateIndicateurInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, UpdateIndicateurError>> {
    const apiKeyPermissionResult = this.permissionService.isApiKeyAllowed(
      user,
      'indicateurs.indicateurs.update'
    );
    if (!apiKeyPermissionResult.success) {
      return apiKeyPermissionResult;
    }

    const indicateur = await this.repository.getIndicateurNature(indicateurId);
    this.assertIndicateurInCollectiviteScope(
      indicateur,
      collectiviteId,
      indicateurId
    );

    const canUpdate = await this.canUpdateIndicateur({
      user,
      collectiviteId,
      indicateurId,
    });
    if (!canUpdate) {
      return failure(CommonErrorEnum.UNAUTHORIZED);
    }

    this.logger.log(
      `Mise à jour de l'indicateur dont l'id est ${indicateurId}`
    );

    const {
      commentaire,
      estConfidentiel,
      estFavori,
      isSuivi,
      titre,
      unite,
      totalEstCumulDesSousIndicateurs,
      isApplicable,
      ficheIds,
      pilotes,
      services,
      thematiques,
    } = indicateurFields;

    this.assertRequestedFieldsAreMutable(
      indicateur,
      collectiviteId,
      indicateurId,
      indicateurFields
    );

    const transactionResult = await this.transactionManager.executeSingle<
      void,
      UpdateIndicateurError | Error
    >(async (tx) => {
      if (unite !== undefined) {
        await this.indicateurLockRepository.lockForIndicateurMutation(tx);
      }
      const lockedIndicateur = await this.repository.lockIndicateurNature(
        indicateurId,
        tx
      );
      this.assertIndicateurInCollectiviteScope(
        lockedIndicateur,
        collectiviteId,
        indicateurId
      );
      this.assertRequestedFieldsAreMutable(
        lockedIndicateur,
        collectiviteId,
        indicateurId,
        indicateurFields
      );

      await this.assertMemberOfIndicateurGroupement(
        lockedIndicateur,
        collectiviteId,
        indicateurId,
        tx
      );
      const canUpdateInTransaction = await this.canUpdateIndicateur(
        { user, collectiviteId, indicateurId },
        tx
      );
      if (!canUpdateInTransaction) {
        return failure(CommonErrorEnum.UNAUTHORIZED);
      }

      const indicateurInGroup = await this.findIndicateurInGroupToChangeUnite(
        { indicateurId, collectiviteId, unite },
        tx
      );
      if (isUniteLocked({ indicateurInGroup, unite })) {
        return failure(UpdateIndicateurErrorEnum.SOUS_INDICATEUR_UNITE_LOCKED);
      }

      if (
        commentaire !== undefined ||
        estConfidentiel !== undefined ||
        estFavori !== undefined ||
        isApplicable !== undefined ||
        isSuivi !== undefined
      ) {
        await this.repository.upsertCollectiviteFields(
          {
            indicateurId,
            collectiviteId,
            commentaire,
            isApplicable,
            isSuivi,
            confidentiel: estConfidentiel,
            favoris: estFavori,
            modifiedBy: user.id,
          },
          tx
        );
      }

      if (hasDefinitionFieldsToUpdate(indicateurFields)) {
        const updated = await this.repository.updateIndicateurPerso(
          {
            indicateurId,
            collectiviteId,
            titre,
            unite,
            totalEstCumulDesSousIndicateurs,
          },
          tx
        );

        if (!updated) {
          throw new NotFoundException(
            `Indicateur ${indicateurId} non trouvé pour la collectivité ${collectiviteId}`
          );
        }
      }

      const uniteToPropagate = getUniteToPropagate({
        indicateurInGroup,
        unite,
      });
      if (uniteToPropagate !== null) {
        await this.repository.updateDescendantsUnite(
          { indicateurId, collectiviteId, unite: uniteToPropagate },
          tx
        );
      }

      if (ficheIds !== undefined) {
        const fichesResult =
          await this.upsertIndicateurFichesService.upsertIndicateurFiches(
            {
              indicateurId,
              collectiviteId,
              ficheIds,
            },
            { user, tx }
          );
        if (!fichesResult.success) {
          return failure(fichesResult.error);
        }
      }

      if (pilotes !== undefined) {
        await this.upsertIndicateurPilotesService.upsertIndicateurPilotes(
          {
            indicateurId,
            collectiviteId,
            pilotes,
          },
          tx
        );
      }

      if (services !== undefined) {
        await this.upsertIndicateurServicesService.upsertIndicateurServices(
          {
            indicateurId,
            collectiviteId,
            serviceIds: services.map((s) => s.id),
          },
          tx
        );
      }

      if (thematiques !== undefined) {
        await this.upsertIndicateurThematiquesService.upsertIndicateurThematiques(
          {
            indicateurId,
            thematiqueIds: thematiques.map((t) => t.id),
          },
          tx
        );
      }

      // Only update modified fields if we have changes that don't affect indicateurCollectiviteTable
      // (since we already handle modifiedBy/modifiedAt in the upsert above)
      const hasNonCollectiviteChanges =
        hasDefinitionFieldsToUpdate(indicateurFields) ||
        ficheIds !== undefined ||
        pilotes !== undefined ||
        services !== undefined ||
        thematiques !== undefined;

      if (hasNonCollectiviteChanges) {
        await this.updateIndicateurModifiedFields(
          {
            indicateurId,
            collectiviteId,
            user,
          },
          tx
        );
      }

      return success(undefined);
    }, tx);

    if (transactionResult.success) {
      return success(undefined);
    }
    if (transactionResult.error instanceof Error) {
      throw transactionResult.cause ?? transactionResult.error;
    }
    return failure(transactionResult.error, transactionResult.cause);
  }

  private async findIndicateurInGroupToChangeUnite(
    {
      indicateurId,
      collectiviteId,
      unite,
    }: { indicateurId: number; collectiviteId: number; unite?: string },
    tx: Transaction
  ): Promise<IndicateurInGroup | null> {
    if (unite === undefined) {
      return null;
    }
    return this.repository.getIndicateurInGroup(
      { indicateurId, collectiviteId },
      tx
    );
  }

  async updateIndicateurModifiedFields(
    {
      indicateurId,
      collectiviteId,
      user,
    }: {
      indicateurId: number;
      collectiviteId: number;
      user: AuthUser;
    },
    tx?: Transaction
  ) {
    await this.updateIndicateursModifiedFields(
      { indicateurIds: [indicateurId], collectiviteId, user },
      tx
    );
  }

  async updateIndicateursModifiedFields(
    {
      indicateurIds,
      collectiviteId,
      user,
    }: {
      indicateurIds: number[];
      collectiviteId: number;
      user: AuthUser;
    },
    tx?: Transaction
  ) {
    const sortedIndicateurIds = [...new Set(indicateurIds)].sort(
      (left, right) => left - right
    );
    if (sortedIndicateurIds.length === 0) {
      return;
    }

    await this.repository.touchIndicateurs(
      {
        indicateurIds: sortedIndicateurIds,
        collectiviteId,
        modifiedBy: user.id,
      },
      tx
    );
  }
}
