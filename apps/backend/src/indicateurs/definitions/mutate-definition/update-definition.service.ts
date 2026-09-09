import { getEffectiveIndicateurPeriodicite } from '@tet/domain/indicateurs';
import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { UpdateIndicateurDefinitionInput } from '@tet/backend/indicateurs/definitions/mutate-definition/mutate-definition.input';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import {
  AuthenticatedUser,
  AuthUser,
} from '@tet/backend/users/models/auth.models';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import { hasPermission, ResourceType } from '@tet/domain/users';
import { GetUserRolesAndPermissionsService } from '../../../users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import { HandleDefinitionFichesService } from '../../indicateurs/handle-definition-fiches/handle-definition-fiches.service';
import { HandleDefinitionPilotesService } from '../../indicateurs/handle-definition-pilotes/handle-definition-pilotes.service';
import { HandleDefinitionServicesService } from '../../indicateurs/handle-definition-services/handle-definition-services.service';
import { HandleDefinitionThematiquesService } from '../../indicateurs/handle-definition-thematiques/handle-definition-thematiques.service';
import { IndicateurDefinitionLockRepository } from '../indicateur-definition-lock.repository';
import { IndicateurPeriodiciteAvailabilityService } from '../indicateur-periodicite-availability.service';
import {
  type DefinitionOwnership,
  MutateDefinitionRepository,
} from './mutate-definition.repository';

@Injectable()
export class UpdateDefinitionService {
  private readonly logger = new Logger(UpdateDefinitionService.name);

  constructor(
    private readonly transactionManager: TransactionManager,
    private readonly repository: MutateDefinitionRepository,
    private readonly getUserPermissionsService: GetUserRolesAndPermissionsService,
    private readonly permissionService: PermissionService,
    private readonly handleDefinitionFichesService: HandleDefinitionFichesService,
    private readonly handleDefinitionPilotesService: HandleDefinitionPilotesService,
    private readonly handleDefinitionServicesService: HandleDefinitionServicesService,
    private readonly handleDefinitionThematiquesService: HandleDefinitionThematiquesService,
    private readonly periodiciteAvailabilityService: IndicateurPeriodiciteAvailabilityService,
    private readonly definitionLockRepository: IndicateurDefinitionLockRepository
  ) {}

  private async canUpdateDefinition(
    user: AuthenticatedUser,
    collectiviteId: number,
    indicateurId: number,
    doNotThrow?: boolean
  ): Promise<boolean> {
    const userPermissionsResult =
      await this.getUserPermissionsService.getUserRolesAndPermissions({
        userId: user.id,
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
        await this.handleDefinitionPilotesService.listIndicateurPilotes({
          indicateurId,
          collectiviteId,
          user,
        });

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

  private assertDefinitionInCollectiviteScope(
    definition: DefinitionOwnership | null,
    requestedCollectiviteId: number,
    indicateurId: number
  ): asserts definition is DefinitionOwnership {
    if (
      !definition ||
      (definition.collectiviteId !== null &&
        definition.collectiviteId !== requestedCollectiviteId)
    ) {
      throw new NotFoundException(
        `Indicateur ${indicateurId} non trouvé pour la collectivité ${requestedCollectiviteId}`
      );
    }
  }

  private assertRequestedFieldsAreMutable(
    definition: DefinitionOwnership,
    indicateurId: number,
    indicateurFields: UpdateIndicateurDefinitionInput['indicateurFields']
  ): void {
    if (
      indicateurFields.periodicite !== undefined &&
      definition.periodiciteMode === 'imposee'
    ) {
      throw new BadRequestException(
        'La périodicité de cet indicateur est imposée et ne peut pas être personnalisée'
      );
    }
    if (definition.collectiviteId !== null) {
      return;
    }

    const { titre, unite, thematiques } = indicateurFields;
    const updatesGlobalDefinitionFields =
      titre !== undefined || unite !== undefined || thematiques !== undefined;
    if (updatesGlobalDefinitionFields) {
      throw new BadRequestException(
        `Les champs globaux de l'indicateur prédéfini ${indicateurId} ne peuvent pas être modifiés depuis une collectivité`
      );
    }
  }

  async updateDefinition(
    {
      indicateurId,
      collectiviteId,
      indicateurFields,
    }: UpdateIndicateurDefinitionInput,
    user: AuthenticatedUser
  ): Promise<void> {
    this.permissionService.assertApiKeyPermission(
      user,
      'indicateurs.indicateurs.update'
    );

    const definition = await this.repository.getDefinitionOwnership(
      indicateurId
    );
    this.assertDefinitionInCollectiviteScope(
      definition,
      collectiviteId,
      indicateurId
    );

    const authorizationCollectiviteId =
      definition.collectiviteId ?? collectiviteId;
    await this.canUpdateDefinition(
      user,
      authorizationCollectiviteId,
      indicateurId
    );

    this.logger.log(
      `Mise à jour de l'indicateur dont l'id est ${indicateurId}`
    );

    const {
      commentaire,
      estConfidentiel,
      estFavori,
      titre,
      unite,
      periodicite,
      ficheIds,
      pilotes,
      services,
      thematiques,
    } = indicateurFields;

    this.assertRequestedFieldsAreMutable(
      definition,
      indicateurId,
      indicateurFields
    );

    let expectedPeriodicite: typeof periodicite;
    if (periodicite !== undefined) {
      expectedPeriodicite = definition.periodicite;
      const availability =
        await this.periodiciteAvailabilityService.checkAssignmentAvailable(
          {
            periodicite: getEffectiveIndicateurPeriodicite(
              definition,
              periodicite
            ),
            current: expectedPeriodicite,
            collectiviteId,
          },
          { user }
        );
      if (!availability.success) {
        if (availability.error === 'PERIODICITE_UNAVAILABLE') {
          throw new BadRequestException(availability.cause?.message);
        }
        throw availability.cause ?? new Error(availability.error);
      }
    }

    const transactionResult = await this.transactionManager.executeSingle<
      void,
      unknown
    >(async (tx) => {
      if (periodicite !== undefined) {
        // Keep the global graph lock before the row lock to preserve the lock
        // order shared with value writes and formula reconciliation.
        await this.definitionLockRepository.lockForDefinitionMutation(tx);
      }
      const lockedDefinition = await this.repository.lockDefinitionOwnership(
        indicateurId,
        tx
      );
      this.assertDefinitionInCollectiviteScope(
        lockedDefinition,
        collectiviteId,
        indicateurId
      );
      this.assertRequestedFieldsAreMutable(
        lockedDefinition,
        indicateurId,
        indicateurFields
      );

      if (periodicite !== undefined) {
        const lockedPeriodicite = lockedDefinition.periodicite;

        if (lockedPeriodicite !== expectedPeriodicite) {
          throw new ConflictException(
            `La périodicité de l'indicateur ${indicateurId} a été modifiée simultanément, veuillez réessayer`
          );
        }
      }

      if (
        commentaire !== undefined ||
        estConfidentiel !== undefined ||
        estFavori !== undefined ||
        periodicite !== undefined
      ) {
        await this.repository.upsertCollectiviteFields(
          {
            indicateurId,
            collectiviteId,
            commentaire,
            periodicite,
            confidentiel: estConfidentiel,
            favoris: estFavori,
            modifiedBy: user.id,
          },
          tx
        );
      }

      if (titre !== undefined || unite !== undefined) {
        const updated = await this.repository.updatePersonalizedDefinition(
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
        await this.handleDefinitionFichesService.upsertIndicateurFiches(
          {
            indicateurId,
            collectiviteId,
            ficheIds,
          },
          tx
        );
      }

      if (pilotes !== undefined) {
        await this.handleDefinitionPilotesService.upsertIndicateurPilotes(
          {
            indicateurId,
            collectiviteId,
            pilotes,
          },
          tx
        );
      }

      if (services !== undefined) {
        await this.handleDefinitionServicesService.upsertIndicateurServices(
          {
            indicateurId,
            collectiviteId,
            serviceIds: services.map((s) => s.id),
          },
          tx
        );
      }

      if (thematiques !== undefined) {
        await this.handleDefinitionThematiquesService.upsertIndicateurThematiques(
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
        await this.updateDefinitionModifiedFields(
          {
            indicateurId,
            collectiviteId,
            user,
          },
          tx
        );
      }

      return success(undefined);
    });

    if (!transactionResult.success) {
      throw transactionResult.cause ?? transactionResult.error;
    }
  }

  async updateDefinitionModifiedFields(
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
    await this.updateDefinitionsModifiedFields(
      { indicateurIds: [indicateurId], collectiviteId, user },
      tx
    );
  }

  async updateDefinitionsModifiedFields(
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

    await this.repository.touchDefinitions(
      {
        indicateurIds: sortedIndicateurIds,
        collectiviteId,
        modifiedBy: user.id,
      },
      tx
    );
  }
}
