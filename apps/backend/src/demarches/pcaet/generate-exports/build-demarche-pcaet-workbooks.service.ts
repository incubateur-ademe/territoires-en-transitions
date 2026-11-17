import { Injectable, Logger } from '@nestjs/common';
import { DemarchePlanActionsRepository } from '@tet/backend/demarches/shared/demarche-plan-actions.repository';
import { exportPlansXLSX } from '@tet/backend/plans/fiches/export/export-plan.xlsx';
import PlanActionsService, {
  type PlanSnapshot,
} from '@tet/backend/plans/fiches/plan-actions.service';
import { Transaction } from '@tet/backend/utils/database/transaction.utils';
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

  async build(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<Result<DemarchePcaetWorkbooks, DemarchePcaetExportError>> {
    try {
      const snapshots = await this.loadPlanSnapshots(
        { demarcheId, collectiviteId },
        tx
      );
      if (!snapshots.success) {
        return snapshots;
      }
      const diagnostic = await this.diagnosticService.loadPayload(
        { demarcheId, collectiviteId },
        tx
      );

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
        indicateurs: hasPcaetDiagnosticData(diagnostic)
          ? toBuffer(await exportDiagnosticXLSX(diagnostic))
          : null,
      });
    } catch (error) {
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
  }

  /** Les plans liés, dans l'ordre de rattachement. */
  private async loadPlanSnapshots(
    {
      demarcheId,
      collectiviteId,
    }: { demarcheId: number; collectiviteId: number },
    tx?: Transaction
  ): Promise<Result<PlanSnapshot[], DemarchePcaetExportError>> {
    const planIds = await this.demarchePlanActionsRepository.listPlanActionIds(
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
