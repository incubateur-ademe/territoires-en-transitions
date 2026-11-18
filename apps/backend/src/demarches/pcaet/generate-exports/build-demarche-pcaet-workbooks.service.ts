import { Injectable, Logger } from '@nestjs/common';
import { DemarchePlanActionsRepository } from '@tet/backend/demarches/shared/demarche-plan-actions.repository';
import { exportPlansXLSX } from '@tet/backend/plans/fiches/export/export-plan.xlsx';
import PlanActionsService, {
  type PlanSnapshot,
} from '@tet/backend/plans/fiches/plan-actions.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { getErrorMessage } from '@tet/domain/utils';
import { DemarchePcaetDiagnosticService } from '../shared/demarche-pcaet-diagnostic.service';
import { hasPcaetDiagnosticData } from './demarche-pcaet-export.rules';
import { exportDiagnosticXLSX } from './export-diagnostic.xlsx';
import {
  DemarchePcaetExportErrorEnum,
  type DemarchePcaetExportError,
} from './generate-demarche-pcaet-exports.errors';

/** Un classeur par type d'export, `null` quand il n'y a rien à figer. */
export type DemarchePcaetWorkbooks = {
  /** Un onglet par plan lié, fiches restreintes comprises. `null` sans plan lié. */
  plan: Buffer | null;
  /** Le même sans les fiches restreintes. `null` si aucun plan n'en compte. */
  plan_expurge: Buffer | null;
  /** `null` si le diagnostic n'a ni valeur ni vulnérabilité renseignée. */
  indicateurs: Buffer | null;
};

/**
 * Construit en mémoire les classeurs d'un dépôt PCAET, sur l'état lu au moment
 * de l'appel. Aucun contrôle d'accès ici : les fiches restreintes sont lues, à
 * l'appelant de choisir la variante qu'il sert.
 */
@Injectable()
export class BuildDemarchePcaetWorkbooksService {
  private readonly logger = new Logger(BuildDemarchePcaetWorkbooksService.name);

  constructor(
    private readonly demarchePlanActionsRepository: DemarchePlanActionsRepository,
    private readonly planActionsService: PlanActionsService,
    private readonly diagnosticService: DemarchePcaetDiagnosticService
  ) {}

  /** Les trois classeurs d'un coup : la génération à la soumission. */
  async build(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<Result<DemarchePcaetWorkbooks, DemarchePcaetExportError>> {
    const plans = await this.buildPlanWorkbooks(
      { demarcheId, collectiviteId },
      tx
    );
    if (!plans.success) {
      return plans;
    }
    const indicateurs = await this.buildIndicateursWorkbook(
      { demarcheId, collectiviteId },
      tx
    );
    if (!indicateurs.success) {
      return indicateurs;
    }
    return success({ ...plans.data, indicateurs: indicateurs.data });
  }

  /**
   * Le plan et sa variante sans fiche restreinte, sans lire le diagnostic :
   * tous les plans liés, la transmission ayant exigé qu'ils soient vérifiés.
   */
  async buildPlanWorkbooks(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<
    Result<
      Pick<DemarchePcaetWorkbooks, 'plan' | 'plan_expurge'>,
      DemarchePcaetExportError
    >
  > {
    try {
      const snapshots = await this.loadPlanSnapshots(
        { demarcheId, collectiviteId, activePlansOnly: false },
        tx
      );
      if (!snapshots.success) {
        return snapshots;
      }

      const hasFicheRestreinte = snapshots.data.some(
        (snapshot) => snapshot.planWithoutFichesRestreintes !== null
      );
      return success({
        plan: snapshots.data.length
          ? toBuffer(
              await exportPlansXLSX(snapshots.data.map(({ plan }) => plan))
            )
          : null,
        // Tous les plans y figurent : un plan sans fiche restreinte est repris
        // tel quel, pour que le lecteur retrouve les mêmes onglets.
        plan_expurge: hasFicheRestreinte
          ? toBuffer(
              await exportPlansXLSX(
                snapshots.data.map(
                  ({ plan, planWithoutFichesRestreintes }) =>
                    planWithoutFichesRestreintes ?? plan
                )
              )
            )
          : null,
      });
    } catch (error) {
      return this.toGenerationFailure(demarcheId, error);
    }
  }

  /**
   * Une seule variante du plan, pour l'export du jour : la variante sans fiche
   * restreinte reprend tels quels les plans qui n'en ont pas, comme dans
   * `buildPlanWorkbooks`. `null` sans plan lié.
   */
  async buildPlanWorkbook(
    {
      demarcheId,
      collectiviteId,
      withoutFichesRestreintes,
    }: {
      demarcheId: number;
      collectiviteId: number;
      withoutFichesRestreintes: boolean;
    },
    tx?: Transaction
  ): Promise<Result<Buffer | null, DemarchePcaetExportError>> {
    try {
      // Plans aboutis seulement, comme la lecture publique : un export figé n'a
      // pas ce cas, la transmission exige des plans vérifiés.
      const snapshots = await this.loadPlanSnapshots(
        { demarcheId, collectiviteId, activePlansOnly: true },
        tx
      );
      if (!snapshots.success) {
        return snapshots;
      }
      if (snapshots.data.length === 0) {
        return success(null);
      }
      return success(
        toBuffer(
          await exportPlansXLSX(
            snapshots.data.map(({ plan, planWithoutFichesRestreintes }) =>
              withoutFichesRestreintes
                ? planWithoutFichesRestreintes ?? plan
                : plan
            )
          )
        )
      );
    } catch (error) {
      return this.toGenerationFailure(demarcheId, error);
    }
  }

  /** Le classeur des indicateurs, sans lire les plans. */
  async buildIndicateursWorkbook(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<
    Result<DemarchePcaetWorkbooks['indicateurs'], DemarchePcaetExportError>
  > {
    try {
      const diagnostic = await this.diagnosticService.loadPayload(
        { demarcheId, collectiviteId },
        tx
      );
      return success(
        hasPcaetDiagnosticData(diagnostic)
          ? toBuffer(await exportDiagnosticXLSX(diagnostic))
          : null
      );
    } catch (error) {
      return this.toGenerationFailure(demarcheId, error);
    }
  }

  /**
   * Le dépôt a-t-il de quoi remplir chaque classeur, sans les construire ? Un
   * plan lié abouti pour le plan, un diagnostic non vide pour les indicateurs :
   * mêmes critères que `buildPlanWorkbook` et `buildIndicateursWorkbook`. Aucun
   * contrôle d'accès ici, à l'appelant de l'avoir fait.
   */
  async hasContent(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    { tx }: ServiceSecondArg
  ): Promise<
    Result<{ plan: boolean; indicateurs: boolean }, 'DATABASE_ERROR'>
  > {
    try {
      const [planIds, diagnostic] = await Promise.all([
        this.demarchePlanActionsRepository.listActivePlanActionIds(
          demarcheId,
          tx
        ),
        this.diagnosticService.loadPayload({ demarcheId, collectiviteId }, tx),
      ]);
      return success({
        plan: planIds.length > 0,
        indicateurs: hasPcaetDiagnosticData(diagnostic),
      });
    } catch (error) {
      this.logger.error(
        `Lecture du contenu de la démarche PCAET ${demarcheId} impossible : ${getErrorMessage(
          error
        )}`
      );
      return failure(
        'DATABASE_ERROR',
        error instanceof Error ? error : undefined
      );
    }
  }

  private toGenerationFailure(
    demarcheId: number,
    error: unknown
  ): Result<never, DemarchePcaetExportError> {
    this.logger.error(
      `Échec de la construction des classeurs de la démarche PCAET ${demarcheId} : ${getErrorMessage(
        error
      )}`
    );
    return failure(
      DemarchePcaetExportErrorEnum.EXPORT_GENERATION_ERROR,
      error instanceof Error ? error : undefined
    );
  }

  /** Les plans liés, dans l'ordre de rattachement. */
  private async loadPlanSnapshots(
    {
      demarcheId,
      collectiviteId,
      activePlansOnly,
    }: { demarcheId: number; collectiviteId: number; activePlansOnly: boolean },
    tx?: Transaction
  ): Promise<Result<PlanSnapshot[], DemarchePcaetExportError>> {
    const planIds = activePlansOnly
      ? await this.demarchePlanActionsRepository.listActivePlanActionIds(
          demarcheId,
          tx
        )
      : await this.demarchePlanActionsRepository.listPlanActionIds(
          demarcheId,
          tx
        );
    const snapshots: PlanSnapshot[] = [];
    // L'un après l'autre : dans une transaction, les lectures partagent une
    // seule connexion.
    for (const planId of planIds) {
      const snapshot = await this.planActionsService.getPlanSnapshot(
        { collectiviteId, planId },
        { tx }
      );
      if (!snapshot.success) {
        this.logger.error(
          `Plan ${planId} illisible pour l'export de la démarche PCAET ${demarcheId} : ${snapshot.error}`
        );
        return failure(
          DemarchePcaetExportErrorEnum.EXPORT_GENERATION_ERROR,
          snapshot.cause
        );
      }
      snapshots.push(snapshot.data);
    }
    return success(snapshots);
  }
}

/** exceljs rend un `Buffer` à lui, qui n'est pas celui de Node. */
const toBuffer = (content: ArrayBuffer | Uint8Array): Buffer =>
  Buffer.from(content as ArrayBuffer);
