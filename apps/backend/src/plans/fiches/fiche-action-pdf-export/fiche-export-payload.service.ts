import { Injectable, Logger } from '@nestjs/common';
import { ListCollectiviteIndicateursRepository } from '@tet/backend/indicateurs/indicateurs/list-collectivite-indicateurs/list-collectivite-indicateurs.repository';
import { GetAxeService } from '@tet/backend/plans/axes/get-axe/get-axe.service';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { FicheAnnexesService } from '@tet/backend/plans/fiches/fiche-annexes/fiche-annexes.service';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { ActionDefinitionsRepository } from '@tet/backend/referentiels/action-definitions/action-definitions.repository';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import {
  catchDatabaseFailure,
  toDatabaseFailure,
} from '@tet/backend/utils/database/catch-database-failure';
import {
  failure,
  getDataOrThrow,
  Result,
  success,
} from '@tet/backend/utils/result.type';
import { isIndicateurPerso } from '@tet/domain/indicateurs';
import type {
  AnnexeDocument,
  AxeLight,
  FicheBudget,
  FicheWithRelations,
} from '@tet/domain/plans';
import type {
  FicheActionPdfExtendedProps,
  PdfIndicateur,
  PdfLinkedAction,
} from '@tet/pdf-components';

export type FicheExportPayloadError = 'FICHE_UNAVAILABLE' | 'DATABASE_ERROR';

@Injectable()
export class FicheExportPayloadService {
  private readonly logger = new Logger(FicheExportPayloadService.name);

  constructor(
    private readonly listFichesService: ListFichesService,
    private readonly getAxeService: GetAxeService,
    private readonly actionDefinitionsRepository: ActionDefinitionsRepository,
    private readonly listCollectiviteIndicateursRepository: ListCollectiviteIndicateursRepository,
    private readonly fichePermissions: FicheActionPermissionsService,
    private readonly ficheAnnexesService: FicheAnnexesService
  ) {}

  async buildFicheExportPayload({
    ficheId,
    user,
  }: {
    ficheId: number;
    user: AuthenticatedUser;
  }): Promise<Result<FicheActionPdfExtendedProps, FicheExportPayloadError>> {
    return catchDatabaseFailure(async () => {
      const ficheResult = await this.listFichesService.getFicheById(
        { ficheId },
        { user }
      );
      if (!ficheResult.success) {
        if (ficheResult.error === 'DATABASE_ERROR') {
          return toDatabaseFailure(ficheResult);
        }
        const reason =
          ficheResult.error === 'UNAUTHORIZED'
            ? `Accès refusé sur la fiche ${ficheId}`
            : ficheResult.cause?.message ?? ficheResult.error;
        return failure(
          'FICHE_UNAVAILABLE',
          new Error(`Fiche ${ficheId} : ${reason}`)
        );
      }

      const fiche = ficheResult.data;

      const [chemins, fichesLiees, indicateursResult, actionsLiees, annexes] =
        await Promise.all([
          this.loadChemins({ fiche, user }),
          this.loadFichesLiees({ fiche, user }),
          this.loadIndicateurs({ fiche }),
          this.loadActionsLiees({ fiche }),
          this.loadAnnexes({ fiche, user }),
        ]);
      if (!indicateursResult.success) return indicateursResult;

      return success({
        fiche,
        chemins,
        indicateursListe: indicateursResult.data,
        fichesLiees,
        actionsLiees,
        annexes: annexes.length > 0 ? annexes : undefined,
        notes: fiche.notes ?? undefined,
        budgets: this.mapBudgets(fiche.budgets),
      });
    });
  }

  private async loadChemins({
    fiche,
    user,
  }: {
    fiche: FicheWithRelations;
    user: AuthenticatedUser;
  }): Promise<AxeLight[][]> {
    const axeIds = (fiche.axes ?? []).map((axe) => axe.id);
    if (axeIds.length === 0) {
      return [];
    }

    const result = await this.getAxeService.getAxesChemins(axeIds, { user });
    if (!result.success) {
      this.logger.warn(
        `Impossible de charger les chemins pour la fiche ${fiche.id} : ${result.error}`
      );
      return [];
    }

    return axeIds
      .map((axeId) => result.data[axeId] ?? [])
      .filter((chemin) => chemin.length > 0);
  }

  private async loadFichesLiees({
    fiche,
    user,
  }: {
    fiche: FicheWithRelations;
    user: AuthenticatedUser;
  }): Promise<FicheWithRelations[]> {
    try {
      const { data } = getDataOrThrow(
        await this.listFichesService.listFichesQuery({
          collectiviteId: fiche.collectiviteId,
          filters: { linkedFicheIds: [fiche.id] },
        })
      );
      return this.filterReadableFiches(data, user);
    } catch (error) {
      this.logger.warn(
        `Impossible de charger les fiches liées pour la fiche ${fiche.id} : ${error}`
      );
      return [];
    }
  }

  private async filterReadableFiches(
    fiches: FicheWithRelations[],
    user: AuthenticatedUser
  ): Promise<FicheWithRelations[]> {
    const accessResults = await Promise.all(
      fiches.map((fiche) =>
        this.fichePermissions
          .canReadFicheObject(fiche, user, true)
          .then((access) => ({ fiche, access }))
      )
    );
    return accessResults.flatMap(({ fiche, access }) =>
      access !== null ? [fiche] : []
    );
  }

  private mapBudgets(
    budgets: FicheWithRelations['budgets']
  ): FicheBudget[] | undefined {
    if (!budgets || budgets.length === 0) return undefined;
    return budgets.map((budget) => ({
      ...budget,
      annee: budget.annee ?? null,
      budgetPrevisionnel: budget.budgetPrevisionnel ?? null,
      budgetReel: budget.budgetReel ?? null,
    }));
  }

  private async loadIndicateurs({
    fiche,
  }: {
    fiche: FicheWithRelations;
  }): Promise<Result<PdfIndicateur[], 'DATABASE_ERROR'>> {
    const indicateurIds = (fiche.indicateurs ?? []).map((i) => i.id);
    if (indicateurIds.length === 0) {
      return success([]);
    }
    const indicateursResult =
      await this.listCollectiviteIndicateursRepository.listCollectiviteIndicateurs(
        { indicateurIds }
      );
    if (!indicateursResult.success) return toDatabaseFailure(indicateursResult);
    return success(
      indicateursResult.data.map((indicateur) => ({
        ...indicateur,
        estPerso: isIndicateurPerso(indicateur),
        hasOpenData: false,
      }))
    );
  }

  private async loadActionsLiees({
    fiche,
  }: {
    fiche: FicheWithRelations;
  }): Promise<PdfLinkedAction[]> {
    const actionIds = (fiche.mesures ?? []).map((m) => m.id);
    const actions = await this.actionDefinitionsRepository.listByActionIds(
      actionIds
    );
    return actions;
  }

  private async loadAnnexes({
    fiche,
    user,
  }: {
    fiche: FicheWithRelations;
    user: AuthenticatedUser;
  }): Promise<AnnexeDocument[]> {
    const result = await this.ficheAnnexesService.listForFiches(
      {
        collectiviteId: fiche.collectiviteId,
        ficheIds: [fiche.id],
      },
      { user }
    );
    if (!result.success) {
      this.logger.warn(
        `Annexes ignorées pour la fiche ${fiche.id} : ${result.error}`
      );
      return [];
    }
    return result.data;
  }
}
