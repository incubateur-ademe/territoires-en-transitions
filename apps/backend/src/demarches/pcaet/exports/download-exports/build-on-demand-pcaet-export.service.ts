import { Injectable } from '@nestjs/common';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { ServiceSecondArg } from '@tet/backend/utils/nest/service-second-arg.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import { BuildDemarchePcaetWorkbooksService } from '../build-workbooks/build-demarche-pcaet-workbooks.service';
import { buildDemarchePcaetExportFilename } from '../demarche-pcaet-export-filename.rules';
import { DemarchePcaetEventEnum } from '../../shared/tracking/demarche-pcaet-tracking.constants';
import { DemarchePcaetTrackingService } from '../../shared/tracking/demarche-pcaet-tracking.service';
import {
  DemarchePcaetExportsError,
  DemarchePcaetExportsErrorEnum,
} from './demarche-pcaet-exports.errors';
import type { DemarchePcaetExportRef } from './demarche-pcaet-exports.input';
import type { DemarchePcaetExportKind } from './resolve-demarche-pcaet-exports.rules';
import { ResolveDemarchePcaetExportsService } from './resolve-demarche-pcaet-exports.service';

export type OnDemandPcaetExportFile = { buffer: Buffer; filename: string };

/**
 * L'export du jour d'un dépôt soumis sans export figé (dépôts antérieurs à la
 * génération à la soumission) : le classeur est construit à la demande, sur
 * l'état lu à l'instant. Refusé dès qu'un export figé existe — c'est lui qui
 * fait foi — et pour un dépôt en élaboration, où rien n'est encore déposé.
 */
@Injectable()
export class BuildOnDemandPcaetExportService {
  constructor(
    private readonly resolveService: ResolveDemarchePcaetExportsService,
    private readonly buildWorkbooksService: BuildDemarchePcaetWorkbooksService,
    private readonly collectivitesService: CollectivitesService,
    private readonly trackingService: DemarchePcaetTrackingService
  ) {}

  async build(
    {
      ref,
      type,
    }: { ref: DemarchePcaetExportRef; type: DemarchePcaetExportKind },
    { user }: ServiceSecondArg
  ): Promise<Result<OnDemandPcaetExportFile, DemarchePcaetExportsError>> {
    const resolved = await this.resolveService.resolve(ref, { user });
    if (!resolved.success) {
      return resolved;
    }
    const { sources, demarcheId, collectiviteId, lectureSeule, dossier } =
      resolved.data;
    if (sources.source !== 'on_demand') {
      return failure(
        DemarchePcaetExportsErrorEnum.ON_DEMAND_EXPORT_NOT_AVAILABLE
      );
    }

    // Hors transaction : une lecture, rien n'est écrit. Seul le classeur
    // demandé est construit.
    const workbook = await this.buildWorkbook({
      demarcheId,
      collectiviteId,
      type,
      lectureSeule,
    });
    if (!workbook.success) {
      return failure(DemarchePcaetExportsErrorEnum.BUILD_EXPORT_ERROR);
    }
    if (workbook.data === null) {
      return failure(DemarchePcaetExportsErrorEnum.EXPORT_NOT_FOUND);
    }

    const collectiviteResult = await this.collectivitesService.getCollectivite(
      collectiviteId
    );
    if (!collectiviteResult.success) {
      return failure(
        DemarchePcaetExportsErrorEnum.BUILD_EXPORT_ERROR,
        collectiviteResult.cause
      );
    }
    const { collectivite } = collectiviteResult.data;

    if (dossier) {
      this.trackingService.trackDossierInstruction(
        DemarchePcaetEventEnum.DOSSIER_TELECHARGE,
        dossier,
        {
          userId: user.id,
          properties: { type: `export_${type}`, source: 'on_demand' },
        }
      );
    }
    return success({
      buffer: workbook.data,
      filename: buildDemarchePcaetExportFilename({
        collectiviteNom: collectivite.nom,
        type,
        date: new Date(),
      }),
    });
  }

  /** Les indicateurs sans lire les plans ; le plan sans lire le diagnostic. */
  private async buildWorkbook({
    demarcheId,
    collectiviteId,
    type,
    lectureSeule,
  }: {
    demarcheId: number;
    collectiviteId: number;
    type: DemarchePcaetExportKind;
    lectureSeule: boolean;
  }) {
    if (type === 'indicateurs') {
      return this.buildWorkbooksService.buildIndicateursWorkbook({
        demarcheId,
        collectiviteId,
      });
    }
    // La variante choisie avant la sérialisation : un seul classeur construit.
    return this.buildWorkbooksService.buildPlanWorkbook({
      demarcheId,
      collectiviteId,
      withoutFichesRestreintes: lectureSeule,
    });
  }
}
