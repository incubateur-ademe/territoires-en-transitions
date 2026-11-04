import {
  BadRequestException,
  ForbiddenException,
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
import { success, type Result } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  type IndicateurNatureFields,
  isIndicateurPerso,
  isIndicateurPredefini,
} from '@tet/domain/indicateurs';
import { hasPermission, ResourceType } from '@tet/domain/users';
import { GetUserRolesAndPermissionsService } from '../../../users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import { UpsertIndicateurFichesService } from '../upsert-indicateur-fiches/upsert-indicateur-fiches.service';
import { UpsertIndicateurPilotesService } from '../upsert-indicateur-pilotes/upsert-indicateur-pilotes.service';
import { UpsertIndicateurServicesService } from '../upsert-indicateur-services/upsert-indicateur-services.service';
import { UpsertIndicateurThematiquesService } from '../upsert-indicateur-thematiques/upsert-indicateur-thematiques.service';
import { MutateIndicateurRepository } from './mutate-indicateur.repository';

const isOwnedByCollectivite = (
  definition: IndicateurNatureFields,
  collectiviteId: number
): boolean =>
  isIndicateurPerso(definition) && definition.collectiviteId === collectiviteId;

const isInCollectiviteScope = (
  definition: IndicateurNatureFields,
  collectiviteId: number
): boolean =>
  isIndicateurPredefini(definition) ||
  isOwnedByCollectivite(definition, collectiviteId);

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
    private readonly upsertIndicateurThematiquesService: UpsertIndicateurThematiquesService
  ) {}

  async canUpdateIndicateur(
    user: AuthenticatedUser,
    collectiviteId: number,
    indicateurId: number,
    doNotThrow?: boolean,
    tx?: Transaction
  ): Promise<boolean> {
    const userPermissionsResult =
      await this.getUserPermissionsService.getUserRolesAndPermissions({
        userId: user.id,
        tx,
      });

    if (!userPermissionsResult.success) {
      if (!doNotThrow) {
        throw new ForbiddenException(
          `Droits insuffisants, l'utilisateur ${user.id} n'a pas les droits pour mettre à jour l'indicateur ${indicateurId} de la collectivité ${collectiviteId}`
        );
      }

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

    if (
      hasPermission(
        userPermissions,
        'indicateurs.indicateurs.update_piloted_by_me',
        { collectiviteId }
      )
    ) {
      const pilotes =
        await this.upsertIndicateurPilotesService.listIndicateurPilotes(
          { indicateurId, collectiviteId, user },
          tx
        );

      if (pilotes.some((p) => p.userId === user.id)) {
        return true;
      }
    }

    if (!doNotThrow) {
      this.permissionService.throwForbiddenException(
        user,
        'indicateurs.indicateurs.update',
        ResourceType.COLLECTIVITE,
        { collectiviteId }
      );
    }
    return false;
  }

  private assertIndicateurInCollectiviteScope(
    definition: IndicateurNatureFields | null,
    requestedCollectiviteId: number,
    indicateurId: number
  ): asserts definition is IndicateurNatureFields {
    if (
      !definition ||
      !isInCollectiviteScope(definition, requestedCollectiviteId)
    ) {
      throw new NotFoundException(
        `Indicateur ${indicateurId} non trouvé pour la collectivité ${requestedCollectiviteId}`
      );
    }
  }

  private async assertMemberOfIndicateurGroupement(
    definition: IndicateurNatureFields,
    collectiviteId: number,
    indicateurId: number,
    tx: Transaction
  ): Promise<void> {
    if (
      !isIndicateurPredefini(definition) ||
      definition.groupementId === null
    ) {
      return;
    }
    const isMember = await this.repository.lockGroupementMembership(
      { groupementId: definition.groupementId, collectiviteId },
      tx
    );
    if (!isMember) {
      throw new NotFoundException(
        `Indicateur ${indicateurId} non trouvé pour la collectivité ${collectiviteId}`
      );
    }
  }

  private assertRequestedFieldsAreMutable(
    definition: IndicateurNatureFields,
    collectiviteId: number,
    indicateurId: number,
    indicateurFields: UpdateIndicateurInput['indicateurFields']
  ): void {
    if (indicateurFields.periodicite !== undefined) {
      throw new BadRequestException(
        'La périodicité est fixée à la création de l’indicateur'
      );
    }
    if (isOwnedByCollectivite(definition, collectiviteId)) {
      return;
    }

    const { titre, unite, thematiques } = indicateurFields;
    const updatesGlobalDefinitionFields =
      titre !== undefined || unite !== undefined || thematiques !== undefined;
    if (updatesGlobalDefinitionFields) {
      throw new BadRequestException(
        `Les champs globaux de l'indicateur ${indicateurId} ne peuvent être modifiés que par sa collectivité propriétaire`
      );
    }
  }

  async updateIndicateur(
    { indicateurId, collectiviteId, indicateurFields }: UpdateIndicateurInput,
    { user, tx }: ServiceSecondArg
  ): Promise<Result<void, 'UNAUTHORIZED'>> {
    const apiKeyPermissionResult = this.permissionService.isApiKeyAllowed(
      user,
      'indicateurs.indicateurs.update'
    );
    if (!apiKeyPermissionResult.success) {
      return apiKeyPermissionResult;
    }

    const definition = await this.repository.getIndicateurNature(indicateurId);
    this.assertIndicateurInCollectiviteScope(
      definition,
      collectiviteId,
      indicateurId
    );

    await this.canUpdateIndicateur(user, collectiviteId, indicateurId);

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
      isApplicable,
      ficheIds,
      pilotes,
      services,
      thematiques,
    } = indicateurFields;

    this.assertRequestedFieldsAreMutable(
      definition,
      collectiviteId,
      indicateurId,
      indicateurFields
    );

    const transactionResult = await this.transactionManager.executeSingle<
      void,
      unknown
    >(async (tx) => {
      const lockedDefinition = await this.repository.lockIndicateurNature(
        indicateurId,
        tx
      );
      this.assertIndicateurInCollectiviteScope(
        lockedDefinition,
        collectiviteId,
        indicateurId
      );
      this.assertRequestedFieldsAreMutable(
        lockedDefinition,
        collectiviteId,
        indicateurId,
        indicateurFields
      );

      await this.assertMemberOfIndicateurGroupement(
        lockedDefinition,
        collectiviteId,
        indicateurId,
        tx
      );
      await this.canUpdateIndicateur(
        user,
        collectiviteId,
        indicateurId,
        false,
        tx
      );

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

      if (titre !== undefined || unite !== undefined) {
        const updated = await this.repository.updateIndicateurPerso(
          {
            indicateurId,
            collectiviteId,
            titre,
            unite,
          },
          tx
        );

        if (!updated) {
          throw new NotFoundException(
            `Indicateur ${indicateurId} non trouvé pour la collectivité ${collectiviteId}`
          );
        }
      }

      if (ficheIds !== undefined) {
        await this.upsertIndicateurFichesService.upsertIndicateurFiches(
          {
            indicateurId,
            collectiviteId,
            ficheIds,
          },
          { user, tx }
        );
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
        titre !== undefined ||
        unite !== undefined ||
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

    if (!transactionResult.success) {
      throw transactionResult.cause ?? transactionResult.error;
    }
    return success(undefined);
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
