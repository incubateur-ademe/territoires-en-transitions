import { BadRequestException, Injectable, Logger } from '@nestjs/common';
import { AuthUser } from '@tet/backend/users/models/auth.models';
import {
  CollectiviteAvecType,
  PersonnalisationReponsesPayload,
} from '@tet/domain/collectivites';
import { IndicateurAvecValeursParSource } from '@tet/domain/indicateurs';
import { EChartsOption } from 'echarts/types/dist/echarts';
import { IndicateurListItem } from '../indicateurs/list-indicateurs/list-indicateurs.output';
import { ListIndicateursService } from '../indicateurs/list-indicateurs/list-indicateurs.service';
import CrudValeursService from '../valeurs/crud-valeurs.service';
import ValeursMoyenneService from '../valeurs/valeurs-moyenne.service';
import { ValeursReferenceDTO } from '../valeurs/valeurs-reference.dto';
import ValeursReferenceService from '../valeurs/valeurs-reference.service';
import { IndicateurChartBuilder } from './indicateur-chart.builder';
import {
  IndicateurChartInput,
  IndicateurChartSegmentation,
  IndicateurChartSegmentationWithValeurs,
} from './indicateur-chart.input';
import {
  groupIndicateursByOrderedSegmentation,
  selectBestIndicateurSourceValeurType,
} from './indicateur-chart-segmentation.rules';

@Injectable()
export class IndicateurChartService {
  private readonly logger = new Logger(IndicateurChartService.name);

  constructor(
    private readonly listIndicateursService: ListIndicateursService,
    private readonly indicateurValeursService: CrudValeursService,
    private readonly valeurReferenceService: ValeursReferenceService,
    private readonly valeursMoyenneService: ValeursMoyenneService,
    private readonly chartBuilder: IndicateurChartBuilder
  ) {}

  adjustOptionsWithWidth(chartOption: EChartsOption, width: number): void {
    this.chartBuilder.adjustOptionsWithWidth(chartOption, width);
  }

  private async getIndicateursSegmentationValeurs(
    collectiviteId: number,
    definition: IndicateurListItem,
    segmentation: IndicateurChartSegmentation
  ): Promise<IndicateurChartSegmentationWithValeurs | null> {
    const indicateursEnfantIds =
      definition.estAgregation && definition.enfants?.length
        ? definition.enfants.map((e) => e.id)
        : [];
    if (!indicateursEnfantIds.length) {
      return null;
    }
    const indicateursEnfantDefinitions =
      await this.listIndicateursService.listIndicateurs({
        collectiviteId,
        filters: {
          indicateurIds: indicateursEnfantIds,
        },
        queryOptions: {
          page: 1,
          limit: indicateursEnfantIds.length,
        },
      });

    const { orderedAvailableSegmentations, indicateursBySegmentation } =
      groupIndicateursByOrderedSegmentation(indicateursEnfantDefinitions.data);

    if (!segmentation.type) {
      this.logger.log(
        `No segmentation provided, using first one in : ${orderedAvailableSegmentations.join(
          ', '
        )}`
      );
    }
    const segmentationType = segmentation.type
      ? segmentation.type
      : orderedAvailableSegmentations[0];

    const segmentatedIndicateursEnfantIds =
      indicateursBySegmentation[segmentationType];
    if (!segmentatedIndicateursEnfantIds?.length) {
      return null;
    }

    const indicateursEnfantValeurs = (
      await this.indicateurValeursService.listIndicateurValeurs(
        {
          collectiviteId,
          indicateurIds: segmentatedIndicateursEnfantIds,
        },
        { isUserTrusted: true }
      )
    ).indicateurs;

    const sourceAndValeurType =
      segmentation.source && segmentation.valeurType
        ? {
            source: segmentation.source,
            valeurType: segmentation.valeurType,
          }
        : selectBestIndicateurSourceValeurType(
            indicateursEnfantValeurs,
            segmentation.source,
            segmentation.valeurType
          );
    if (!sourceAndValeurType) {
      return null;
    }

    return {
      type: segmentationType,
      indicateursEnfantValeurs,
      ...sourceAndValeurType,
    };
  }

  async getIndicateurValeursAndChartData(
    args: IndicateurChartInput & {
      collectiviteAvecType?: CollectiviteAvecType;
      personnalisationReponses?: PersonnalisationReponsesPayload;
      chartSize?: { width: number; height: number };
    },
    user?: AuthUser
  ): Promise<{
    indicateurValeurs: IndicateurAvecValeursParSource;
    indicateurSegmentation?: IndicateurChartSegmentationWithValeurs | null;
    valeursReference?: ValeursReferenceDTO | null;
    chartData: EChartsOption;
  }> {
    const {
      collectiviteId,
      indicateurId,
      identifiantReferentiel,
      sources,
      collectiviteAvecType,
      personnalisationReponses,
      includeReferenceValeurs,
      includeMoyenne,
      includeSegmentation,
      chartSize,
    } = args;

    if (!indicateurId && !identifiantReferentiel) {
      // TODO: use result
      throw new BadRequestException(
        'Either indicateurId or identifiantReferentiel must be provided'
      );
    }

    const definition = indicateurId
      ? await this.listIndicateursService.getIndicateur({
          indicateurId,
          collectiviteId,
        })
      : await this.listIndicateursService.getIndicateurByIdentifiantReferentiel(
          {
            identifiantReferentiel: identifiantReferentiel ?? '',
            collectiviteId,
          }
        );

    // Parallelize all independent queries
    const [
      indicateurValeurs,
      valeursReference,
      valeursMoyenneCollectivites,
      indicateurSegmentation,
    ] = await Promise.all([
      // Always fetch indicateur valeurs
      this.indicateurValeursService
        .listIndicateurValeurs(
          {
            collectiviteId,
            indicateurIds: [definition.id],
            sources: sources?.map((s) => s.sourceId),
          },
          { isUserTrusted: true }
        )
        .then((result) => result.indicateurs[0]),
      // Conditionally fetch reference valeurs
      includeReferenceValeurs
        ? this.valeurReferenceService.getValeursReferenceForDefinition({
            collectiviteId,
            definition,
            collectiviteAvecType,
            personnalisationReponses,
          })
        : Promise.resolve(null),
      // Conditionally fetch moyenne collectivites
      includeMoyenne
        ? this.valeursMoyenneService.getMoyenneCollectivites(
            {
              collectiviteId,
              indicateurId: definition.id,
            },
            user
          )
        : Promise.resolve(null),
      // Conditionally fetch segmentation
      includeSegmentation
        ? this.getIndicateursSegmentationValeurs(
            collectiviteId,
            definition,
            includeSegmentation
          )
        : Promise.resolve(null),
    ]);

    const chartData = this.chartBuilder.build({
      indicateurValeurs,
      valeursReference,
      valeursMoyenneCollectivites,
      sourcesFilter: sources,
      segmentation: indicateurSegmentation,
    });

    if (chartSize?.width) {
      this.chartBuilder.adjustOptionsWithWidth(chartData, chartSize.width);
    }

    return {
      indicateurValeurs,
      indicateurSegmentation,
      valeursReference,
      chartData,
    };
  }
}
