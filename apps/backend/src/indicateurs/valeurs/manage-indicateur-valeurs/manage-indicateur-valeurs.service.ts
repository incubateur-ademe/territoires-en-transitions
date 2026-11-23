import { isNil, round, uniqBy } from 'es-toolkit';
import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { UpdateIndicateurService } from '@tet/backend/indicateurs/indicateurs/mutate-indicateur/update-indicateur.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  TransactionManager,
  type TransactionOperation,
} from '@tet/backend/utils/transaction/transaction-manager.service';
import {
  IndicateurDetaille,
  IndicateurPeriodiciteEnum,
  IndicateurPredefini,
  IndicateurValeur,
  IndicateurValeurAvecMetadonnesDefinition,
  IndicateurValeurCreate,
  IndicateurValeurWithIdentifiant,
} from '@tet/domain/indicateurs';
import { hasPermission } from '@tet/domain/users';
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
import { DeleteValeursPeriode } from './delete-valeurs-periode.request';
import { IndicateurValeurLockRepository } from '../indicateur-valeur-lock.repository';
import { IndicateurValeursContext } from '../indicateur-valeurs-context.types';
import {
  captureIndicateurValeursResult,
  captureIndicateurValeursResultOf,
  IndicateurValeursError,
  isIndicateurValeursError,
  toIndicateurValeursFailure,
} from '../indicateur-valeurs.errors';
import { GetIndicateursValeursResponse } from '../list-indicateur-valeurs/get-indicateur-valeurs.response';
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

type PeriodeDeletion = Readonly<{
  deletedValeurs: readonly IndicateurValeur[];
  contextsByValeurId: ReadonlyMap<number, readonly unknown[]>;
}>;

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

  getIndicateursValeurs(
    options: ListIndicateurValeursInput,
    ignoreDedoublonnage?: boolean,
    tx?: Transaction
  ): Promise<
    Result<IndicateurValeurAvecMetadonnesDefinition[], IndicateurValeursError>
  > {
    return this.reader.get(
      { ...options, ignoreDedoublonnage },
      { isUserTrusted: true, tx }
    );
  }

  listIndicateurValeurs(
    options: ListIndicateurValeursInput,
    context: IndicateurValeursContext
  ): Promise<Result<GetIndicateursValeursResponse, IndicateurValeursError>> {
    return this.reader.list(options, context);
  }

  async upsertIndicateurValeurs(
    valeurs: IndicateurValeurCreate[],
    context: IndicateurValeursContext<AuthenticatedOrServiceRoleUser>
  ): Promise<
    Result<IndicateurValeurWithIdentifiant[], IndicateurValeursError>
  > {
    const result = await this.reconciliation.upsert(valeurs, context);
    const canPublishEvents =
      result.success &&
      !context.tx &&
      context.user &&
      isAuthenticatedUser(context.user);
    if (canPublishEvents) {
      await this.publishValeurUpsertedEvents(result.data, context.user);
    }
    return result;
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

    return this.runInTransaction(async (tx) => {
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
              precisions.get(valeur.indicateurId) ?? DEFAULT_ROUNDING_PRECISION
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

      const upsertResult = await this.reconciliation.upsert(toWrite, {
        isUserTrusted: true,
        tx,
      });
      if (!upsertResult.success) return upsertResult;

      const stale = existing.filter(({ id }) => !keptIds.has(id));
      if (stale.length) {
        await this.lockRepository.lock(stale, tx);
        const deleted = await this.repository.deleteByIds(
          stale.map(({ id }) => id),
          tx
        );
        const propagation = await this.reconciliation.propagateDeleted(
          deleted,
          { isUserTrusted: true, tx }
        );
        if (!propagation.success) return propagation;
      }

      return success({
        created: toWrite.length - updated,
        updated,
        unchanged: valeurs.length - toWrite.length,
        // `stale` exclut les totaux calculés (`listMetadonneeSourceValeurs`).
        deleted: stale.length,
      });
    });
  }

  async reconcileCollectiviteCalculatedIndicateurValeurs(
    collectiviteId: number,
    indicateursPredefinis: IndicateurPredefini[],
    tx: Transaction
  ) {
    return this.reconciliation.reconcileCollectivite(
      { collectiviteId, indicateurs: indicateursPredefinis },
      { isUserTrusted: true, tx }
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
    if (!options.skipPermissionCheck) {
      const serviceRoleCheck = await captureIndicateurValeursResult(async () =>
        this.permissionService.hasServiceRole(user)
      );
      if (!serviceRoleCheck.success) return serviceRoleCheck;
    }
    return this.reconciliation.recomputeAll(
      {
        collectiviteId: onlyForCollectiviteId,
        indicateurs: options.indicateurs,
      },
      { isUserTrusted: true }
    );
  }
  private async runInTransaction<T>(
    operation: TransactionOperation<T, IndicateurValeursError>
  ): Promise<Result<T, IndicateurValeursError>> {
    const result = await this.transactionManager.executeSingle<
      T,
      IndicateurValeursError | Error
    >(operation);
    if (result.success) return result;
    return isIndicateurValeursError(result.error)
      ? failure(result.error, result.cause)
      : toIndicateurValeursFailure(result.error);
  }

  async canMutateValeur(
    user: AuthenticatedUser,
    collectiviteId: number,
    indicateur: IndicateurDetaille
  ): Promise<Result<void, IndicateurValeursError>> {
    return this.canMutateValeurs(user, collectiviteId, [indicateur]);
  }

  async canMutateValeurs(
    user: AuthenticatedUser,
    collectiviteId: number,
    indicateurs: IndicateurDetaille[]
  ): Promise<Result<void, IndicateurValeursError>> {
    // `authedProcedure` also accepts API-key JWTs whose permissions claim can
    // deliberately be narrower than the owner's collectivity role.
    const apiKeyPermissionResult = this.permissionService.isApiKeyAllowed(
      user,
      'indicateurs.valeurs.mutate'
    );
    if (!apiKeyPermissionResult.success) {
      return failure(
        'UNAUTHORIZED',
        new ForbiddenException(
          "Droits insuffisants, la clé d'api n'a pas l'autorisation indicateurs.valeurs.mutate."
        )
      );
    }
    const userValeursAllowed = await captureIndicateurValeursResult(async () =>
      assertUserIndicateurValeursAllowed(indicateurs)
    );
    if (!userValeursAllowed.success) return userValeursAllowed;

    const userPermissionsResult =
      await this.getUserPermissionsService.getUserRolesAndPermissions({
        userId: user.id,
      });

    if (!userPermissionsResult.success) {
      return failure(
        'UNAUTHORIZED',
        new ForbiddenException(
          `Droits insuffisants, l'utilisateur ${user.id} n'a pas les droits pour muter les valeurs d'indicateur de la collectivité ${collectiviteId}`
        )
      );
    }

    const userPermissions = userPermissionsResult.data;

    if (
      hasPermission(userPermissions, 'indicateurs.valeurs.mutate', {
        collectiviteId,
      })
    ) {
      return success(undefined);
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
      return success(undefined);
    }

    return failure(
      'UNAUTHORIZED',
      new ForbiddenException(
        `Droits insuffisants, l'utilisateur ${user.id} n'a pas l'autorisation indicateurs.valeurs.mutate sur la collectivité ${collectiviteId}`
      )
    );
  }

  upsertValeur(
    data: UpsertValeurIndicateur,
    user: AuthenticatedUser
  ): Promise<Result<IndicateurValeur | undefined, IndicateurValeursError>> {
    return captureIndicateurValeursResultOf(() =>
      this.executeUpsertValeur(data, user)
    );
  }

  private async executeUpsertValeur(
    data: UpsertValeurIndicateur,
    user: AuthenticatedUser
  ): Promise<Result<IndicateurValeur | undefined, IndicateurValeursError>> {
    const { collectiviteId, indicateurId } = data;
    const indicateurResult = await this.getIndicateur({
      collectiviteId,
      indicateurId,
    });
    if (!indicateurResult.success) return indicateurResult;
    const canMutate = await this.canMutateValeur(
      user,
      collectiviteId,
      indicateurResult.data
    );
    if (!canMutate.success) return canMutate;

    const changed: IndicateurValeur[] = [];
    const saveResult = await this.runInTransaction(async (tx) => {
      const savedResult = await this.writer.saveSingle({ data }, { user, tx });
      if (!savedResult.success) return savedResult;
      const savedValeur = savedResult.data;
      if (!savedValeur) return success(undefined);
      const calculatedResult = await this.reconciliation.propagateUpdated(
        [savedValeur],
        { isUserTrusted: true, tx }
      );
      if (!calculatedResult.success) return calculatedResult;
      await this.updateIndicateurService.updateIndicateurModifiedFields(
        { indicateurId, collectiviteId, user },
        tx
      );
      changed.push(savedValeur, ...calculatedResult.data);
      return success(savedValeur);
    });
    if (!saveResult.success) return saveResult;
    await this.publishValeurUpsertedEvents(changed, user);
    return saveResult;
  }

  deleteValeurIndicateur(
    data: DeleteValeurIndicateur,
    user: AuthenticatedUser
  ): Promise<Result<void, IndicateurValeursError>> {
    return captureIndicateurValeursResultOf(() =>
      this.executeDeleteValeurIndicateur(data, user)
    );
  }

  private async executeDeleteValeurIndicateur(
    data: DeleteValeurIndicateur,
    user: AuthenticatedUser
  ): Promise<Result<void, IndicateurValeursError>> {
    const { collectiviteId, indicateurId, id } = data;

    const indicateurResult = await this.getIndicateur({
      indicateurId,
      collectiviteId,
    });
    if (!indicateurResult.success) return indicateurResult;
    const canMutate = await this.canMutateValeur(
      user,
      collectiviteId,
      indicateurResult.data
    );
    if (!canMutate.success) return canMutate;

    const contexts = await Promise.all(
      this.valeurDeletionListeners.map((listener) =>
        listener.onWillDelete({
          collectiviteId,
          indicateurId,
          indicateurValeurId: id,
        })
      )
    );

    const deletion = await this.runInTransaction(async (tx) => {
      await this.indicateurLockRepository.lockForValueWrite(tx);

      const existing = await this.repository.findUserValeur(
        { collectiviteId, indicateurId, id },
        tx
      );
      if (!existing) return success(undefined);

      await this.lockRepository.lock([existing], tx);
      const deleted = await this.repository.deleteUserValeur(
        { collectiviteId, indicateurId, id },
        tx
      );
      if (!deleted) return success(undefined);

      const propagation = await this.reconciliation.propagateDeleted(
        [deleted],
        { isUserTrusted: true, tx }
      );
      if (!propagation.success) return propagation;

      await this.updateIndicateurService.updateIndicateurModifiedFields(
        { indicateurId, collectiviteId, user },
        tx
      );
      return success(undefined);
    });
    if (!deletion.success) return deletion;

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
    return success(undefined);
  }

  private getIndicateur(
    scope: Parameters<ListIndicateursService['getIndicateur']>[0]
  ): Promise<Result<IndicateurDetaille, IndicateurValeursError>> {
    return captureIndicateurValeursResult(() =>
      this.listIndicateursService.getIndicateur(scope)
    );
  }

  deleteValeursPeriode(
    periode: DeleteValeursPeriode,
    user: AuthenticatedUser
  ): Promise<Result<void, IndicateurValeursError>> {
    return captureIndicateurValeursResultOf(() =>
      this.executeDeleteValeursPeriode(periode, user)
    );
  }

  private async executeDeleteValeursPeriode(
    requestedPeriode: DeleteValeursPeriode,
    user: AuthenticatedUser
  ): Promise<Result<void, IndicateurValeursError>> {
    const periode: DeleteValeursPeriode = {
      ...requestedPeriode,
      indicateurIds: [...new Set(requestedPeriode.indicateurIds)],
    };
    const canMutate = await this.canMutateIndicateurs({ periode, user });
    if (!canMutate.success) return canMutate;

    const deletion = await this.deleteValeursOfPeriode({ periode, user });
    if (!deletion.success) return deletion;

    await this.notifyValeursDeleted({
      collectiviteId: periode.collectiviteId,
      ...deletion.data,
      user,
    });
    return success(undefined);
  }

  private async canMutateIndicateurs({
    periode: { collectiviteId, indicateurIds },
    user,
  }: {
    periode: DeleteValeursPeriode;
    user: AuthenticatedUser;
  }): Promise<Result<void, IndicateurValeursError>> {
    const indicateursResult = await captureIndicateurValeursResult(() =>
      this.listIndicateursService.listIndicateurs(
        {
          collectiviteId,
          filters: { indicateurIds },
          queryOptions: { page: 1, limit: indicateurIds.length },
        },
        user
      )
    );
    if (!indicateursResult.success) return indicateursResult;

    const { data: indicateurs } = indicateursResult.data;
    const hasUnavailableIndicateur =
      indicateurs.length !== indicateurIds.length;
    if (hasUnavailableIndicateur) return failure('INDICATEUR_NOT_AVAILABLE');
    return this.canMutateValeurs(user, collectiviteId, indicateurs);
  }

  private async listDeletionContexts(
    { collectiviteId }: DeleteValeursPeriode,
    valeurs: IndicateurValeur[]
  ) {
    return new Map(
      await Promise.all(
        valeurs.map(async ({ id, indicateurId }) => {
          const contexts = await Promise.all(
            this.valeurDeletionListeners.map((listener) =>
              listener.onWillDelete({
                collectiviteId,
                indicateurId,
                indicateurValeurId: id,
              })
            )
          );
          return [id, contexts] as const;
        })
      )
    );
  }

  private deleteValeursOfPeriode({
    periode,
    user,
  }: {
    periode: DeleteValeursPeriode;
    user: AuthenticatedUser;
  }) {
    const { collectiviteId, dateValeur } = periode;
    return this.runInTransaction<PeriodeDeletion>(async (tx) => {
      await this.indicateurLockRepository.lockForValueWrite(tx);
      await this.lockRepository.lock([{ collectiviteId, dateValeur }], tx);

      const valeursToDelete = await this.repository.listUserValeursAtDate(
        periode,
        tx
      );
      const hasNothingToDelete = valeursToDelete.length === 0;
      if (hasNothingToDelete) {
        return success({ deletedValeurs: [], contextsByValeurId: new Map() });
      }

      const contextsByValeurId = await this.listDeletionContexts(
        periode,
        valeursToDelete
      );
      const deletedValeurs = await this.repository.deleteUserValeurs(
        { collectiviteId, ids: valeursToDelete.map(({ id }) => id) },
        tx
      );
      const propagation = await this.reconciliation.propagateDeleted(
        deletedValeurs,
        { isUserTrusted: true, tx }
      );
      if (!propagation.success) return propagation;

      await this.updateIndicateurService.updateIndicateursModifiedFields(
        {
          indicateurIds: deletedValeurs.map(({ indicateurId }) => indicateurId),
          collectiviteId,
          user,
        },
        tx
      );
      return success({ deletedValeurs, contextsByValeurId });
    });
  }

  private async notifyValeursDeleted({
    collectiviteId,
    deletedValeurs,
    contextsByValeurId,
    user,
  }: PeriodeDeletion & {
    collectiviteId: number;
    user: AuthenticatedUser;
  }) {
    await Promise.all(
      deletedValeurs.flatMap(({ id, indicateurId }) =>
        this.valeurDeletionListeners.map((listener, index) =>
          listener.onDeleted(contextsByValeurId.get(id)?.[index], {
            collectiviteId,
            indicateurId,
            indicateurValeurId: id,
            user,
          })
        )
      )
    );
  }

  deleteIndicateurValeurs(
    options: DeleteIndicateursValeursRequestType
  ): Promise<
    Result<
      { indicateurValeurIdsSupprimes: { id: number }[] },
      IndicateurValeursError
    >
  > {
    return captureIndicateurValeursResultOf(() =>
      this.executeDeleteIndicateurValeurs(options)
    );
  }

  private async executeDeleteIndicateurValeurs(
    options: DeleteIndicateursValeursRequestType
  ): Promise<
    Result<
      { indicateurValeurIdsSupprimes: { id: number }[] },
      IndicateurValeursError
    >
  > {
    this.logger.log(
      `Suppression des valeurs des indicateurs selon ces options : ${JSON.stringify(
        options
      )}`
    );

    const deletion = await this.runInTransaction(async (tx) => {
      // Le trigger statement-level arrive trop tard pour imposer l'ordre
      // graphe -> table : PostgreSQL a déjà pris le verrou de table du DELETE.
      await this.indicateurLockRepository.lockForValueWrite(tx);

      const candidates = await this.repository.listValeursToDelete(options, tx);
      if (candidates.length === 0) return success([]);

      // Une suppression en masse participe au même protocole par période que
      // les upserts. Supprimer les ids découverts donne une sémantique de
      // snapshot claire : une insertion concurrente postérieure est conservée.
      await this.lockRepository.lock(candidates, tx);
      const deleted = await this.repository.deleteByIds(
        candidates.map(({ id }) => id),
        tx
      );

      const propagation = await this.reconciliation.propagateDeleted(deleted, {
        isUserTrusted: true,
        tx,
      });
      if (!propagation.success) return propagation;

      return success(deleted.map(({ id }) => ({ id })));
    });
    if (!deletion.success) return deletion;
    this.logger.log(
      `${deletion.data.length} valeurs d'indicateurs ont été supprimées`
    );
    return success({ indicateurValeurIdsSupprimes: deletion.data });
  }
}
