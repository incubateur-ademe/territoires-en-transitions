import { ForbiddenException, Injectable, Logger } from '@nestjs/common';
import { IndicateurDefinitionsRepository } from '@tet/backend/indicateurs/indicateur-definitions/indicateur-definitions.repository';
import { GetAxeService } from '@tet/backend/plans/axes/get-axe/get-axe.service';
import FicheActionPermissionsService from '@tet/backend/plans/fiches/fiche-action-permissions.service';
import { FicheAnnexesService } from '@tet/backend/plans/fiches/fiche-annexes/fiche-annexes.service';
import ListFichesService from '@tet/backend/plans/fiches/list-fiches/list-fiches.service';
import { ActionDefinitionsRepository } from '@tet/backend/referentiels/action-definitions/action-definitions.repository';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import type { AnnexeInfo } from '@tet/domain/collectivites';
import type {
  AxeLight,
  FicheBudget,
  FicheWithRelations,
} from '@tet/domain/plans';
import type {
  FicheActionPdfExtendedProps,
  PdfIndicateurDefinition,
  PdfLinkedAction,
} from '@tet/pdf-components';

@Injectable()
export class FicheExportPayloadService {
  private readonly logger = new Logger(FicheExportPayloadService.name);

  constructor(
    private readonly listFichesService: ListFichesService,
    private readonly getAxeService: GetAxeService,
    private readonly actionDefinitionsRepository: ActionDefinitionsRepository,
    private readonly indicateurDefinitionsRepository: IndicateurDefinitionsRepository,
    private readonly fichePermissions: FicheActionPermissionsService,
    private readonly ficheAnnexesService: FicheAnnexesService
  ) {}

  async buildFicheExportPayload({
    ficheId,
    user,
  }: {
    ficheId: number;
    user: AuthenticatedUser;
  }): Promise<Result<FicheActionPdfExtendedProps, string>> {
    const ficheResult = await this.listFichesService
      .getFicheById(ficheId, false, user)
      .catch((error) => {
        if (error instanceof ForbiddenException) {
          return failure(`Accès refusé sur la fiche ${ficheId}`);
        }
        throw error;
      });
    if (!ficheResult.success) {
      return failure(`Fiche ${ficheId} : ${ficheResult.error}`);
    }

    const fiche = ficheResult.data;

    const [chemins, fichesLiees, indicateursListe, actionsLiees, annexes] =
      await Promise.all([
        this.loadChemins({ fiche, user }),
        this.loadFichesLiees({ fiche, user }),
        this.loadIndicateurs({ fiche }),
        this.loadActionsLiees({ fiche }),
        this.loadAnnexes({ fiche, user }),
      ]);

    return success({
      fiche,
      chemins,
      indicateursListe,
      fichesLiees,
      actionsLiees,
      annexes: annexes.length > 0 ? annexes : undefined,
      notes: fiche.notes ?? undefined,
      budgets: this.mapBudgets(fiche.budgets),
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

    const result = await this.getAxeService.getAxesChemins(axeIds, user);
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
    const linkedIds = (fiche.fichesLiees ?? []).map((f) => f.id);
    if (linkedIds.length === 0) {
      return [];
    }

    try {
      const { data } = await this.listFichesService.listFichesQuery(null, {
        ficheIds: linkedIds,
        withChildren: true,
      });
      const accessResults = await Promise.all(
        data.map((ficheLiee) =>
          this.fichePermissions
            .canReadFicheObject(ficheLiee, user, true)
            .then((access) => ({ ficheLiee, access }))
        )
      );
      return accessResults.flatMap(({ ficheLiee, access }) =>
        access !== null ? [ficheLiee] : []
      );
    } catch (error) {
      this.logger.warn(
        `Impossible de charger les fiches liées pour la fiche ${fiche.id} : ${error}`
      );
      return [];
    }
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
  }): Promise<PdfIndicateurDefinition[]> {
    const indicateurIds = (fiche.indicateurs ?? []).map((i) => i.id);
    const definitions = await this.indicateurDefinitionsRepository.listByIds(
      indicateurIds
    );
    return definitions.map((definition) => ({
      ...definition,
      estPerso: definition.identifiantReferentiel === null,
      hasOpenData: false,
    }));
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
  }): Promise<AnnexeInfo[]> {
    const result = await this.ficheAnnexesService.listForFiche(fiche, user);
    if (!result.success) {
      this.logger.warn(
        `Annexes ignorées pour la fiche ${fiche.id} : ${result.error}`
      );
      return [];
    }
    return result.data;
  }
}
