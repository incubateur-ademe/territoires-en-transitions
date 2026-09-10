import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { UpdateDefinitionService } from '@tet/backend/indicateurs/definitions/mutate-definition/update-definition.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  IndicateurDefinition,
  IndicateurValeurCreate,
} from '@tet/domain/indicateurs';
import { hasPermission, ResourceType } from '@tet/domain/users';
import { GetUserRolesAndPermissionsService } from '../../users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import {
  AuthenticatedOrServiceRoleUser,
  AuthenticatedUser,
  AuthUser,
} from '../../users/models/auth.models';
import { IndicateurDefinitionLockRepository } from '../definitions/indicateur-definition-lock.repository';
import { IndicateurListItem } from '../indicateurs/list-indicateurs/list-indicateurs.output';
import { ListIndicateursService } from '../indicateurs/list-indicateurs/list-indicateurs.service';
import { CrudValeursRepository } from './crud-valeurs.repository';
import { DeleteIndicateursValeursRequestType } from './delete-indicateur-valeurs.request';
import { DeleteValeurIndicateur } from './delete-valeur-indicateur.request';
import { IndicateurValeurLockRepository } from './indicateur-valeur-lock.repository';
import { IndicateurValeursContext } from './indicateur-valeurs-context';
import { getIndicateurValeursDataOrThrow } from './indicateur-valeurs.errors';
import {
  deduplicateIndicateurValeursBySource,
  groupIndicateurValeurs,
  groupIndicateurValeursBySource,
} from './indicateur-valeurs-read.adapter';
import { ListIndicateurValeursInput } from './list-indicateur-valeurs.input';
import { ListIndicateurValeursService } from './list-indicateur-valeurs.service';
import { ReconcileIndicateurValeursService } from './reconcile-indicateur-valeurs.service';
import { UpsertValeurIndicateur } from './upsert-valeur-indicateur.request';
import { assertUserIndicateurValeursAllowed } from './user-indicateur-valeur.rules';
import { DEFAULT_ROUNDING_PRECISION } from './valeurs.constants';
import { WriteIndicateurValeursService } from './write-indicateur-valeurs.service';

/** Compatibility facade: preserves the historical API while delegating cohesive workflows. */
@Injectable()
export default class CrudValeursService {
  private readonly logger = new Logger(CrudValeursService.name);
  static DEFAULT_ROUNDING_PRECISION = DEFAULT_ROUNDING_PRECISION;
  constructor(
    private readonly repository: CrudValeursRepository,
    private readonly permissionService: PermissionService,
    private readonly getUserPermissionsService: GetUserRolesAndPermissionsService,
    private readonly listIndicateursService: ListIndicateursService,
    private readonly updateIndicateurService: UpdateDefinitionService,
    private readonly lockRepository: IndicateurValeurLockRepository,
    private readonly definitionLockRepository: IndicateurDefinitionLockRepository,
    private readonly transactionManager: TransactionManager,
    private readonly reader: ListIndicateurValeursService,
    private readonly writer: WriteIndicateurValeursService,
    private readonly reconciliation: ReconcileIndicateurValeursService
  ) {}

  dedoublonnageIndicateurValeursParSource =
    deduplicateIndicateurValeursBySource;
  groupeIndicateursValeursParIndicateur = groupIndicateurValeurs;
  groupeIndicateursValeursParIndicateurEtSource =
    groupIndicateurValeursBySource;

  async getIndicateursValeurs(
    options: ListIndicateurValeursInput,
    ignoreDedoublonnage?: boolean,
    tx?: Transaction
  ) {
    return getIndicateurValeursDataOrThrow(
      await this.reader.get(
        { ...options, ignoreDedoublonnage },
        { isUserTrusted: true, tx }
      )
    );
  }

  async listIndicateurValeurs(
    options: ListIndicateurValeursInput,
    context: IndicateurValeursContext
  ) {
    return getIndicateurValeursDataOrThrow(
      await this.reader.list(options, context)
    );
  }

  async upsertIndicateurValeurs(
    valeurs: IndicateurValeurCreate[],
    context: IndicateurValeursContext<AuthenticatedOrServiceRoleUser>
  ) {
    return getIndicateurValeursDataOrThrow(
      await this.reconciliation.upsert(valeurs, context)
    );
  }

  async reconcileCollectiviteCalculatedIndicateurValeurs(
    collectiviteId: number,
    definitions: IndicateurDefinition[],
    tx: Transaction
  ) {
    return getIndicateurValeursDataOrThrow(
      await this.reconciliation.reconcileCollectivite(
        { collectiviteId, definitions },
        { isUserTrusted: true, tx }
      )
    );
  }

  async recomputeAllCalculatedIndicateurValeurs(
    onlyForCollectiviteId: number | undefined,
    user: AuthUser | null,
    options: {
      definitions?: IndicateurDefinition[];
      skipPermissionCheck?: boolean;
    } = {}
  ) {
    if (!options.skipPermissionCheck)
      this.permissionService.hasServiceRole(user);
    return getIndicateurValeursDataOrThrow(
      await this.reconciliation.recomputeAll(
        {
          collectiviteId: onlyForCollectiviteId,
          definitions: options.definitions,
        },
        { isUserTrusted: true }
      )
    );
  }
  private async executeTransaction<T>(
    operation: (tx: Transaction) => Promise<T>
  ): Promise<T> {
    const result = await this.transactionManager.executeSingle<T, unknown>(
      async (tx) => success(await operation(tx))
    );
    if (!result.success) {
      throw result.cause ?? result.error;
    }
    return result.data;
  }
  async canMutateValeur(
    user: AuthenticatedUser,
    collectiviteId: number,
    indicateur: IndicateurListItem
  ): Promise<boolean> {
    await this.canMutateValeurs(user, collectiviteId, [indicateur]);
    return true;
  }
  async canMutateValeurs(
    user: AuthenticatedUser,
    collectiviteId: number,
    indicateurs: IndicateurListItem[]
  ): Promise<void> {
    // `authedProcedure` also accepts API-key JWTs whose permissions claim can
    // deliberately be narrower than the owner's collectivity role.
    this.permissionService.assertApiKeyPermission(
      user,
      'indicateurs.valeurs.mutate'
    );
    assertUserIndicateurValeursAllowed(indicateurs);

    const userPermissionsResult =
      await this.getUserPermissionsService.getUserRolesAndPermissions({
        userId: user.id,
      });

    if (!userPermissionsResult.success) {
      throw new ForbiddenException(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas les droits pour muter les valeurs d'indicateur de la collectivité ${collectiviteId}`
      );
    }

    const userPermissions = userPermissionsResult.data;

    if (
      hasPermission(userPermissions, 'indicateurs.valeurs.mutate', {
        collectiviteId,
      })
    ) {
      return;
    }

    if (
      hasPermission(
        userPermissions,
        'indicateurs.valeurs.mutate_piloted_by_me',
        { collectiviteId }
      ) &&
      indicateurs.every((indicateur) =>
        indicateur.pilotes?.some((p) => p.userId === user.id)
      )
    ) {
      return;
    }

    this.permissionService.throwForbiddenException(
      user,
      'indicateurs.valeurs.mutate',
      ResourceType.COLLECTIVITE,
      { collectiviteId }
    );
  }

  async upsertValeur(data: UpsertValeurIndicateur, user: AuthenticatedUser) {
    const { collectiviteId, indicateurId } = data;
    const definition = await this.listIndicateursService.getIndicateur({
      collectiviteId,
      indicateurId,
    });
    await this.canMutateValeur(user, collectiviteId, definition);
    return this.executeTransaction(async (tx) => {
      const saved = getIndicateurValeursDataOrThrow(
        await this.writer.saveSingle({ data, definition }, { user, tx })
      );
      if (!saved) return undefined;
      getIndicateurValeursDataOrThrow(
        await this.reconciliation.propagateUpdated([saved], {
          isUserTrusted: true,
          tx,
        })
      );
      await this.updateIndicateurService.updateDefinitionModifiedFields(
        { indicateurId, collectiviteId, user },
        tx
      );
      return saved;
    });
  }

  async deleteValeurIndicateur(
    data: DeleteValeurIndicateur,
    user: AuthenticatedUser
  ) {
    const { collectiviteId, indicateurId, id } = data;

    const indicateur = await this.listIndicateursService.getIndicateur({
      indicateurId,
      collectiviteId,
    });

    await this.canMutateValeur(user, collectiviteId, indicateur);

    await this.executeTransaction(async (tx) => {
      await this.definitionLockRepository.lockForValueWrite(tx);

      const existing = await this.repository.findUserValeur(
        { collectiviteId, indicateurId, id },
        tx
      );
      if (!existing) return;

      await this.lockRepository.lock([existing], tx);
      const deleted = await this.repository.deleteUserValeur(
        { collectiviteId, indicateurId, id },
        tx
      );
      if (!deleted) return;

      getIndicateurValeursDataOrThrow(
        await this.reconciliation.propagateDeleted([deleted], {
          isUserTrusted: true,
          tx,
        })
      );

      await this.updateIndicateurService.updateDefinitionModifiedFields(
        { indicateurId, collectiviteId, user },
        tx
      );
    });
  }
  async deleteIndicateurValeurs(options: DeleteIndicateursValeursRequestType) {
    this.logger.log(
      `Suppression des valeurs des indicateurs selon ces options : ${JSON.stringify(
        options
      )}`
    );

    const deletedIds = await this.executeTransaction(async (tx) => {
      // Le trigger statement-level arrive trop tard pour imposer l'ordre
      // graphe -> table : PostgreSQL a déjà pris le verrou de table du DELETE.
      await this.definitionLockRepository.lockForValueWrite(tx);

      const candidates = await this.repository.listValeursToDelete(options, tx);
      if (candidates.length === 0) return [];

      // Une suppression en masse participe au même protocole par période que
      // les upserts. Supprimer les ids découverts donne une sémantique de
      // snapshot claire : une insertion concurrente postérieure est conservée.
      await this.lockRepository.lock(candidates, tx);
      const deleted = await this.repository.deleteByIds(
        candidates.map(({ id }) => id),
        tx
      );

      getIndicateurValeursDataOrThrow(
        await this.reconciliation.propagateDeleted(deleted, {
          isUserTrusted: true,
          tx,
        })
      );

      return deleted.map(({ id }) => ({ id }));
    });
    this.logger.log(
      `${deletedIds.length} valeurs d'indicateurs ont été supprimées`
    );
    return { indicateurValeurIdsSupprimes: deletedIds };
  }
}
