import { isNil, round, uniqBy } from 'es-toolkit';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { UpdateIndicateurService } from '@tet/backend/indicateurs/indicateurs/mutate-indicateur/update-indicateur.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { TransactionManager } from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  IndicateurDetaille,
  IndicateurPeriodiciteEnum,
  IndicateurPredefini,
  IndicateurValeur,
  IndicateurValeurCreate,
} from '@tet/domain/indicateurs';
import { hasPermission, ResourceType } from '@tet/domain/users';
import { GetUserRolesAndPermissionsService } from '../../../users/authorizations/get-user-roles-and-permissions/get-user-roles-and-permissions.service';
import {
  AuthenticatedOrServiceRoleUser,
  AuthenticatedUser,
  AuthUser,
  isAuthenticatedUser,
} from '../../../users/models/auth.models';
import { IndicateurLockRepository } from '../../indicateur/indicateur-lock.repository';
import { ListIndicateursService } from '../../indicateurs/list-indicateurs/list-indicateurs.service';
import { IndicateurValeursRepository } from '../indicateur-valeurs.repository';
import { DeleteIndicateursValeursRequestType } from './delete-indicateur-valeurs.request';
import { DeleteValeurIndicateur } from './delete-valeur-indicateur.request';
import { IndicateurValeurLockRepository } from '../indicateur-valeur-lock.repository';
import { IndicateurValeursContext } from '../indicateur-valeurs-context.types';
import {
  captureIndicateurValeursResult,
  getIndicateurValeursDataOrThrow,
  IndicateurValeursError,
} from '../indicateur-valeurs.errors';
import {
  deduplicateIndicateurValeursBySource,
  groupIndicateurValeurs,
  groupIndicateurValeursBySource,
} from '../list-indicateur-valeurs/indicateur-valeurs-read.adapter';
import { ListIndicateurValeursInput } from '../list-indicateur-valeurs/list-indicateur-valeurs.input';
import { ListIndicateurValeursService } from '../list-indicateur-valeurs/list-indicateur-valeurs.service';
import { ReconcileIndicateurValeursService } from '../reconcile-indicateur-valeurs/reconcile-indicateur-valeurs.service';
import { UpsertValeurIndicateur } from '../write-indicateur-valeurs/upsert-valeur-indicateur.request';
import { assertUserIndicateurValeursAllowed } from '../write-indicateur-valeurs/user-indicateur-valeur.rules';
import { DEFAULT_ROUNDING_PRECISION } from '../valeurs.constants';
import { WriteIndicateurValeursService } from '../write-indicateur-valeurs/write-indicateur-valeurs.service';

/** Émis après qu'une valeur d'indicateur a été enregistrée via `upsertValeur` */
export type IndicateurValeurUpsertedEvent = {
  collectiviteId: number;
  indicateurId: number;
  indicateurValeurId: number;
  user: AuthenticatedUser;
};

/**
 * Écouteur invoqué autour de la suppression d'une valeur d'indicateur via
 * `deleteValeurIndicateur`. La valeur est supprimée avec `ON DELETE CASCADE`
 * sur ses dépendances (ex : sélection pour le score indicatif) :
 * `onWillDelete` est donc appelé AVANT la suppression, pendant que ces
 * dépendances existent encore, et son résultat est retransmis à `onDeleted`
 * une fois la suppression effectuée.
 */
export type IndicateurValeurDeletionListener<TContext = unknown> = {
  onWillDelete: (event: {
    collectiviteId: number;
    indicateurId: number;
    indicateurValeurId: number;
  }) => Promise<TContext>;
  onDeleted: (
    context: TContext,
    event: {
      collectiviteId: number;
      indicateurId: number;
      indicateurValeurId: number;
      user: AuthenticatedUser;
    }
  ) => Promise<void>;
};

/**
 * Application entrypoint for value workflows: permissions, transactions and
 * notifications to dependent domains. Reading, writing and calculation rules
 * live in their feature services; notifications run only after commit.
 */
@Injectable()
export default class ManageIndicateurValeursService {
  private readonly logger = new Logger(ManageIndicateurValeursService.name);
  static DEFAULT_ROUNDING_PRECISION = DEFAULT_ROUNDING_PRECISION;
  private readonly valeurUpsertedListeners: Array<
    (event: IndicateurValeurUpsertedEvent) => Promise<void>
  > = [];

  private readonly valeurDeletionListeners: IndicateurValeurDeletionListener[] =
    [];

  constructor(
    private readonly repository: IndicateurValeursRepository,
    private readonly permissionService: PermissionService,
    private readonly getUserPermissionsService: GetUserRolesAndPermissionsService,
    private readonly listIndicateursService: ListIndicateursService,
    private readonly updateIndicateurService: UpdateIndicateurService,
    private readonly lockRepository: IndicateurValeurLockRepository,
    private readonly indicateurLockRepository: IndicateurLockRepository,
    private readonly transactionManager: TransactionManager,
    private readonly reader: ListIndicateurValeursService,
    private readonly writer: WriteIndicateurValeursService,
    private readonly reconciliation: ReconcileIndicateurValeursService
  ) {}

  /**
   * Permet à un autre domaine (ex : le score indicatif des référentiels) de
   * réagir à la mise à jour d'une valeur d'indicateur, sans que ce service
   * n'ait à connaître ce qui en dépend.
   */
  registerValeurUpsertedListener(
    listener: (event: IndicateurValeurUpsertedEvent) => Promise<void>
  ) {
    // Keep it simple: listeners are stored for the lifetime of the service instance
    // (Nest providers are singletons by default).
    this.valeurUpsertedListeners.push(listener);
  }

  /**
   * Permet à un autre domaine de réagir à la suppression d'une valeur
   * d'indicateur via `deleteValeurIndicateur`, sans que ce service n'ait à
   * connaître ce qui en dépend.
   */
  registerValeurDeletionListener<TContext>(
    listener: IndicateurValeurDeletionListener<TContext>
  ) {
    this.valeurDeletionListeners.push(
      listener as IndicateurValeurDeletionListener<unknown>
    );
  }

  /**
   * Émet un `IndicateurValeurUpsertedEvent` pour chaque valeur
   * ajoutée/modifiée, dédupliquée par id.
   */
  async publishValeurUpsertedEvents(
    valeurs: Pick<IndicateurValeur, 'id' | 'collectiviteId' | 'indicateurId'>[],
    user: AuthenticatedUser
  ): Promise<void> {
    if (!this.valeurUpsertedListeners.length || !valeurs.length) {
      return;
    }
    const uniqueValeurs = uniqBy(valeurs, (v) => v.id);
    await Promise.all(
      uniqueValeurs.flatMap((v) => {
        const event: IndicateurValeurUpsertedEvent = {
          collectiviteId: v.collectiviteId,
          indicateurId: v.indicateurId,
          indicateurValeurId: v.id,
          user,
        };
        return this.valeurUpsertedListeners.map((listener) => listener(event));
      })
    );
  }

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
    const saved = getIndicateurValeursDataOrThrow(
      await this.reconciliation.upsert(valeurs, context)
    );
    if (!context.tx && context.user && isAuthenticatedUser(context.user)) {
      await this.publishValeurUpsertedEvents(saved, context.user);
    }
    return saved;
  }

  /**
   * Remplace, pour des collectivités, les valeurs importées d'une métadonnée,
   * dans une seule transaction :
   * - une valeur identique à celle en base (objectif arrondi à la précision de
   *   l'indicateur, et commentaire) n'est pas réécrite, et ses totaux ne sont
   *   donc pas recalculés ;
   * - une valeur modifiée est mise à jour en place (son `id` est conservé) ;
   * - une valeur importée absente de `valeurs` est supprimée ;
   * - les totaux calculés suivent les écritures et les suppressions.
   *
   * Les compteurs ne portent que sur les valeurs importées : `deleted` ne
   * compte pas les totaux supprimés à leur suite.
   *
   * Réservé aux imports de source déjà autorisés par l'appelant. Ne porte que
   * sur les objectifs : les résultats ne sont pas comparés.
   */
  async replaceMetadonneeValeurs({
    collectiviteIds,
    metadonneeId,
    valeurs,
  }: {
    collectiviteIds: number[];
    metadonneeId: number;
    valeurs: IndicateurValeurCreate[];
  }): Promise<
    Result<
      { created: number; updated: number; unchanged: number; deleted: number },
      IndicateurValeursError
    >
  > {
    const scope = new Set(collectiviteIds);
    const outOfScope = valeurs.filter(
      (v) => !scope.has(v.collectiviteId) || v.metadonneeId !== metadonneeId
    );
    if (outOfScope.length) {
      return failure(
        'INVALID_VALUE',
        new Error(
          `${outOfScope.length} valeurs hors des collectivités ou de la métadonnée ${metadonneeId}`
        )
      );
    }

    return captureIndicateurValeursResult(() =>
      this.executeTransaction(async (tx) => {
        // Même ordre de verrous que `deleteIndicateurValeurs` : graphe, puis table.
        await this.indicateurLockRepository.lockForValueWrite(tx);

        const existing = await this.repository.listMetadonneeSourceValeurs(
          { collectiviteIds, metadonneeId },
          tx
        );
        const key = (
          v: Pick<
            IndicateurValeurCreate,
            'collectiviteId' | 'indicateurId' | 'dateValeur' | 'periodicite'
          >
        ) =>
          `${v.collectiviteId}:${v.indicateurId}:${v.dateValeur}:${
            v.periodicite ?? IndicateurPeriodiciteEnum.ANNUELLE
          }`;
        const existingByKey = new Map(existing.map((v) => [key(v), v]));
        const precisions = await this.repository.listPrecisions(
          [...new Set(valeurs.map(({ indicateurId }) => indicateurId))],
          tx
        );

        const keptIds = new Set<number>();
        const toWrite: IndicateurValeurCreate[] = [];
        let updated = 0;
        for (const valeur of valeurs) {
          const stored = existingByKey.get(key(valeur));
          if (!stored) {
            toWrite.push(valeur);
            continue;
          }
          keptIds.add(stored.id);
          const objectif = isNil(valeur.objectif)
            ? null
            : round(
                valeur.objectif,
                precisions.get(valeur.indicateurId) ??
                  DEFAULT_ROUNDING_PRECISION
              );
          const unchanged =
            stored.objectif === objectif &&
            (stored.objectifCommentaire ?? null) ===
              (valeur.objectifCommentaire ?? null);
          if (!unchanged) {
            toWrite.push(valeur);
            updated++;
          }
        }

        getIndicateurValeursDataOrThrow(
          await this.reconciliation.upsert(toWrite, { isUserTrusted: true, tx })
        );

        const stale = existing.filter(({ id }) => !keptIds.has(id));
        if (stale.length) {
          await this.lockRepository.lock(stale, tx);
          const deleted = await this.repository.deleteByIds(
            stale.map(({ id }) => id),
            tx
          );
          getIndicateurValeursDataOrThrow(
            await this.reconciliation.propagateDeleted(deleted, {
              isUserTrusted: true,
              tx,
            })
          );
        }

        return {
          created: toWrite.length - updated,
          updated,
          unchanged: valeurs.length - toWrite.length,
          // `stale` exclut les totaux calculés (`listMetadonneeSourceValeurs`).
          deleted: stale.length,
        };
      })
    );
  }

  async reconcileCollectiviteCalculatedIndicateurValeurs(
    collectiviteId: number,
    indicateursPredefinis: IndicateurPredefini[],
    tx: Transaction
  ) {
    return getIndicateurValeursDataOrThrow(
      await this.reconciliation.reconcileCollectivite(
        { collectiviteId, indicateurs: indicateursPredefinis },
        { isUserTrusted: true, tx }
      )
    );
  }

  async recomputeAllCalculatedIndicateurValeurs(
    onlyForCollectiviteId: number | undefined,
    user: AuthUser | null,
    options: {
      indicateurs?: IndicateurPredefini[];
      skipPermissionCheck?: boolean;
    } = {}
  ) {
    if (!options.skipPermissionCheck)
      this.permissionService.hasServiceRole(user);
    return getIndicateurValeursDataOrThrow(
      await this.reconciliation.recomputeAll(
        {
          collectiviteId: onlyForCollectiviteId,
          indicateurs: options.indicateurs,
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
    indicateur: IndicateurDetaille
  ): Promise<boolean> {
    await this.canMutateValeurs(user, collectiviteId, [indicateur]);
    return true;
  }
  async canMutateValeurs(
    user: AuthenticatedUser,
    collectiviteId: number,
    indicateurs: IndicateurDetaille[]
  ): Promise<void> {
    // `authedProcedure` also accepts API-key JWTs whose permissions claim can
    // deliberately be narrower than the owner's collectivity role.
    const apiKeyPermissionResult = this.permissionService.isApiKeyAllowed(
      user,
      'indicateurs.valeurs.mutate'
    );
    if (!apiKeyPermissionResult.success) {
      throw new ForbiddenException(
        "Droits insuffisants, la clé d'api n'a pas l'autorisation indicateurs.valeurs.mutate."
      );
    }
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
    const indicateur = await this.listIndicateursService.getIndicateur({
      collectiviteId,
      indicateurId,
    });
    await this.canMutateValeur(user, collectiviteId, indicateur);
    const changed: IndicateurValeur[] = [];
    const saved = await this.executeTransaction(async (tx) => {
      const saved = getIndicateurValeursDataOrThrow(
        await this.writer.saveSingle({ data }, { user, tx })
      );
      if (!saved) return undefined;
      const calculated = getIndicateurValeursDataOrThrow(
        await this.reconciliation.propagateUpdated([saved], {
          isUserTrusted: true,
          tx,
        })
      );
      await this.updateIndicateurService.updateIndicateurModifiedFields(
        { indicateurId, collectiviteId, user },
        tx
      );
      changed.push(saved, ...calculated);
      return saved;
    });
    await this.publishValeurUpsertedEvents(changed, user);
    return saved;
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
    const contexts = await Promise.all(
      this.valeurDeletionListeners.map((listener) =>
        listener.onWillDelete({
          collectiviteId,
          indicateurId,
          indicateurValeurId: id,
        })
      )
    );

    await this.executeTransaction(async (tx) => {
      await this.indicateurLockRepository.lockForValueWrite(tx);

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

      await this.updateIndicateurService.updateIndicateurModifiedFields(
        { indicateurId, collectiviteId, user },
        tx
      );
    });
    await Promise.all(
      this.valeurDeletionListeners.map((listener, index) =>
        listener.onDeleted(contexts[index], {
          collectiviteId,
          indicateurId,
          indicateurValeurId: id,
          user,
        })
      )
    );
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
      await this.indicateurLockRepository.lockForValueWrite(tx);

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
