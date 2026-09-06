import {
  BadRequestException,
  ForbiddenException,
  Injectable,
} from '@nestjs/common';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import type { Transaction } from '@tet/backend/utils/database/transaction.utils';
import {
  IndicateurDefinition,
  IndicateurValeurCreate,
} from '@tet/domain/indicateurs';
import { PermissionOperationEnum, ResourceType } from '@tet/domain/users';
import { isNil, isNotNil, keyBy } from 'es-toolkit';
import { AuthRole } from '../../users/models/auth.models';
import { IndicateurDefinitionLockRepository } from '../definitions/indicateur-definition-lock.repository';
import { ListCollectiviteDefinitionsRepository } from '../definitions/list-collectivite-definitions/list-collectivite-definitions.repository';
import { CrudValeursRepository } from './crud-valeurs.repository';
import {
  IndicateurValeursContext,
  IndicateurValeursWriteContext,
} from './indicateur-valeurs-context';
import { captureIndicateurValeursResult } from './indicateur-valeurs.errors';
import { assertUserIndicateurValeursAllowed } from './user-indicateur-valeur.rules';

export type PreparedIndicateurValeurs = {
  valeurs: IndicateurValeurCreate[];
  definitions: Partial<Record<number, IndicateurDefinition>>;
};

@Injectable()
export class ValidateIndicateurValeursWriteService {
  constructor(
    private readonly repository: CrudValeursRepository,
    private readonly permissionService: PermissionService,
    private readonly definitionsRepository: ListCollectiviteDefinitionsRepository,
    private readonly definitionLockRepository: IndicateurDefinitionLockRepository
  ) {}

  prepare(
    valeurs: IndicateurValeurCreate[],
    context: IndicateurValeursContext
  ) {
    return captureIndicateurValeursResult(
      async (): Promise<PreparedIndicateurValeurs> => {
        const { user, isUserTrusted = false, tx } = context;
        if (!isUserTrusted && user) {
          for (const collectiviteId of new Set(
            valeurs.map((v) => v.collectiviteId)
          )) {
            await this.permissionService.assertAllowed(
              user,
              PermissionOperationEnum['INDICATEURS.VALEURS.MUTATE'],
              ResourceType.COLLECTIVITE,
              { collectiviteId }
            );
          }
        } else if (!isUserTrusted) {
          throw new ForbiddenException(
            'Un contexte utilisateur ou une capacité interne explicite est requis pour écrire des valeurs'
          );
        }
        const indicateurIds = [...new Set(valeurs.map((v) => v.indicateurId))];
        // Capture the client's interpretation before entering the transaction.
        const definitions = keyBy(
          await this.definitionsRepository.listCollectiviteDefinitions(
            { indicateurIds },
            tx
          ),
          (d) => d.id
        );
        for (const id of indicateurIds) {
          if (!definitions[id])
            throw new BadRequestException(
              `Indicateur definition not found for id ${id}`
            );
        }
        return {
          definitions,
          valeurs: valeurs.map((valeur) =>
            !isUserTrusted && user?.role === AuthRole.AUTHENTICATED && user.id
              ? { ...valeur, createdBy: user.id, modifiedBy: user.id }
              : valeur
          ),
        };
      }
    );
  }

  validate(
    input: PreparedIndicateurValeurs,
    context: IndicateurValeursWriteContext
  ) {
    return captureIndicateurValeursResult(async () => {
      const { tx, user, isUserTrusted = false } = context;
      const indicateurIds = [
        ...new Set(input.valeurs.map((v) => v.indicateurId)),
      ];
      const definitions = await this.definitionLockRepository.lockDefinitions(
        indicateurIds,
        tx
      );
      const definitionsById = keyBy(definitions, (d) => d.id);
      const enforceUserRules =
        !isUserTrusted && user?.role === AuthRole.AUTHENTICATED;
      if (enforceUserRules) assertUserIndicateurValeursAllowed(definitions);
      await this.assertIndicateurValeursAvailableForWrite(
        input.valeurs,
        definitionsById,
        enforceUserRules,
        tx
      );
      for (const id of indicateurIds) {
        const definition = definitionsById[id];
        const requested = input.definitions[id];
        if (!definition || !requested)
          throw new BadRequestException(
            `Indicateur definition not found for id ${id}`
          );
        if (definition.periodicite !== requested.periodicite) {
          throw new BadRequestException(
            `La périodicité de l'indicateur ${id} a changé de ${requested.periodicite} à ${definition.periodicite} pendant l'écriture`
          );
        }
      }
      return definitionsById;
    });
  }
  private async assertIndicateurValeursAvailableForWrite(
    valeurs: IndicateurValeurCreate[],
    definitionsById: Partial<Record<number, IndicateurDefinition>>,
    enforceGroupementMembership: boolean,
    tx: Transaction
  ): Promise<void> {
    const groupementScopes: Array<{
      indicateurId: number;
      groupementId: number;
      collectiviteId: number;
    }> = [];

    for (const valeur of valeurs) {
      const definition = definitionsById[valeur.indicateurId];
      if (!definition) {
        throw new BadRequestException(
          `Indicateur definition not found for id ${valeur.indicateurId}`
        );
      }
      if (
        isNil(definition.groupementId) &&
        isNotNil(definition.collectiviteId) &&
        definition.collectiviteId !== valeur.collectiviteId
      ) {
        throw new BadRequestException(
          `Indicateur ${valeur.indicateurId} non disponible pour la collectivité ${valeur.collectiviteId}`
        );
      }
      if (enforceGroupementMembership && isNotNil(definition.groupementId)) {
        groupementScopes.push({
          indicateurId: valeur.indicateurId,
          groupementId: definition.groupementId,
          collectiviteId: valeur.collectiviteId,
        });
      }
    }

    if (groupementScopes.length === 0) return;

    const memberships = await this.repository.lockGroupementMemberships(
      groupementScopes.map(({ groupementId, collectiviteId }) => ({
        groupementId,
        collectiviteId,
      })),
      tx
    );
    const memberCollectiviteIdsByGroupementId = new Map<number, Set<number>>();
    for (const membership of memberships) {
      if (isNil(membership.groupementId) || isNil(membership.collectiviteId)) {
        continue;
      }
      const collectiviteIds =
        memberCollectiviteIdsByGroupementId.get(membership.groupementId) ??
        new Set<number>();
      collectiviteIds.add(membership.collectiviteId);
      memberCollectiviteIdsByGroupementId.set(
        membership.groupementId,
        collectiviteIds
      );
    }

    for (const scope of groupementScopes) {
      if (
        !memberCollectiviteIdsByGroupementId
          .get(scope.groupementId)
          ?.has(scope.collectiviteId)
      ) {
        throw new BadRequestException(
          `Indicateur ${scope.indicateurId} non disponible pour la collectivité ${scope.collectiviteId}`
        );
      }
    }
  }
}
