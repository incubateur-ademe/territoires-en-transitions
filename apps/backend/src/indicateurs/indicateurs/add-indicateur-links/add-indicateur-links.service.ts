import { Injectable, Logger } from '@nestjs/common';
import { UpsertAxeRepository } from '@tet/backend/plans/axes/upsert-axe/upsert-axe.repository';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { CommonError } from '@tet/backend/utils/trpc/common-errors';
import { isIndicateurPerso } from '@tet/domain/indicateurs';
import { ResourceType } from '@tet/domain/users';
import { asc, inArray } from 'drizzle-orm';
import { IndicateurLockRepository } from '../../indicateur/indicateur-lock.repository';
import { MutateIndicateurRepository } from '../mutate-indicateur/mutate-indicateur.repository';
import { UpdateIndicateurService } from '../mutate-indicateur/update-indicateur.service';
import { UpsertIndicateurFichesRepository } from '../upsert-indicateur-fiches/upsert-indicateur-fiches.repository';

type AddIndicateurLinksInput = {
  collectiviteId: number;
  indicateurId: number;
  axeIds?: number[];
  ficheIds?: number[];
};

type LinkContext = { user: AuthenticatedUser; tx: Transaction };

/** Lie un indicateur sans modifier sa définition, ses valeurs ou ses autres liens. */
@Injectable()
export class AddIndicateurLinksService {
  private readonly logger = new Logger(AddIndicateurLinksService.name);

  constructor(
    private readonly indicateurLocks: IndicateurLockRepository,
    private readonly indicateurs: MutateIndicateurRepository,
    private readonly updateIndicateur: UpdateIndicateurService,
    private readonly permissions: PermissionService,
    private readonly fichePermissions: FicheActionPermissionsService,
    private readonly axes: UpsertAxeRepository,
    private readonly fiches: UpsertIndicateurFichesRepository
  ) {}

  /**
   * L'appelant annule la transaction en cas d'échec.
   * S'il crée aussi des indicateurs, il prend lockForIndicateurMutation avant
   * toute liaison pour éviter une montée du verrou de graphe partagé à exclusif.
   */
  async addLinks(
    {
      collectiviteId,
      indicateurId,
      axeIds = [],
      ficheIds = [],
    }: AddIndicateurLinksInput,
    context: LinkContext
  ): Promise<Result<void, CommonError>> {
    const { user, tx } = context;
    if (
      [collectiviteId, indicateurId, ...axeIds, ...ficheIds].some(
        (id) => !Number.isSafeInteger(id) || id <= 0
      )
    )
      return failure('NOT_FOUND');
    const apiPermission = this.permissions.isApiKeyAllowed(
      user,
      'indicateurs.indicateurs.update'
    );
    if (!apiPermission.success) return apiPermission;

    try {
      const indicateurAccess = await this.validateIndicateur(
        indicateurId,
        collectiviteId,
        context
      );
      if (!indicateurAccess.success) return indicateurAccess;
      const sortedAxeIds = [...new Set(axeIds)].sort((a, b) => a - b);
      const axeAccess = await this.validateAxes(
        sortedAxeIds,
        collectiviteId,
        context
      );
      if (!axeAccess.success) return axeAccess;
      const sortedFicheIds = [...new Set(ficheIds)].sort((a, b) => a - b);
      for (const ficheId of sortedFicheIds) {
        if (
          !(await this.fichePermissions.canLinkFicheToCollectivite(
            ficheId,
            collectiviteId,
            user,
            tx
          ))
        ) {
          return failure('UNAUTHORIZED');
        }
      }

      // Tous les contrôles précèdent la première écriture de relation.
      for (const axeId of sortedAxeIds) {
        await this.axes.addAxeIndicateurs(axeId, [indicateurId], user.id, tx);
      }
      await this.fiches.addIndicateurFiches(
        { indicateurId, ficheIds: sortedFicheIds, createdBy: user.id },
        tx
      );
      return success(undefined);
    } catch (error) {
      this.logger.error(
        'Impossible d’ajouter les liens de l’indicateur',
        error
      );
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : new Error(String(error))
      );
    }
  }

  private async validateIndicateur(
    indicateurId: number,
    collectiviteId: number,
    { user, tx }: LinkContext
  ): Promise<Result<void, CommonError>> {
    const locked = await this.indicateurLocks.lockIndicateurs(
      [indicateurId],
      tx
    );
    if (!locked.success) return locked;
    const indicateur = locked.data[0];
    if (
      !indicateur ||
      (isIndicateurPerso(indicateur) &&
        indicateur.collectiviteId !== collectiviteId)
    ) {
      return failure('NOT_FOUND');
    }
    if (
      indicateur.groupementId !== null &&
      !(await this.indicateurs.lockGroupementMembership(
        {
          groupementId: indicateur.groupementId,
          collectiviteId,
        },
        tx
      ))
    )
      return failure('NOT_FOUND');
    if (
      !(await this.updateIndicateur.canUpdateIndicateur(
        user,
        collectiviteId,
        indicateurId,
        true,
        tx
      ))
    ) {
      return failure('UNAUTHORIZED');
    }
    return success(undefined);
  }

  private async validateAxes(
    axeIds: number[],
    collectiviteId: number,
    { user, tx }: LinkContext
  ): Promise<Result<void, CommonError>> {
    if (axeIds.length === 0) return success(undefined);
    const access = await this.permissions.isAllowed(
      user,
      'plans.mutate',
      ResourceType.COLLECTIVITE,
      { collectiviteId },
      tx
    );
    if (!access.success) return failure('UNAUTHORIZED');
    const axes = await tx
      .select({ id: axeTable.id, collectiviteId: axeTable.collectiviteId })
      .from(axeTable)
      .where(inArray(axeTable.id, axeIds))
      .orderBy(asc(axeTable.id))
      .for('share');
    if (
      axes.length !== axeIds.length ||
      axes.some((axe) => axe.collectiviteId !== collectiviteId)
    ) {
      return failure('UNAUTHORIZED');
    }
    return success(undefined);
  }
}
