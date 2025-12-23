import { Injectable, Logger } from '@nestjs/common';
import PersonnalisationsService from '@tet/backend/collectivites/personnalisations/services/personnalisations-service';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { IndicateurChartService } from '@tet/backend/indicateurs/charts/indicateur-chart.service';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { ResourceType } from '@tet/backend/users/authorizations/resource-type.enum';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { EchartsService } from '@tet/backend/utils/echarts/echarts.service';
import { getHorizontalStackedBarChartOption } from '@tet/backend/utils/echarts/get-horizontal-stackedbar-chart-option.utils';
import { getPieChartOption } from '@tet/backend/utils/echarts/get-pie-chart-option.utils';
import GetUrlService from '@tet/backend/utils/get-url.service';
import { MethodResult } from '@tet/backend/utils/result.type';
import {
  CollectiviteAvecType,
  PersonnalisationReponsesPayload,
} from '@tet/domain/collectivites';
import {
  IndicateurSourceEnum,
  IndicateurValeurTypeEnum,
} from '@tet/domain/indicateurs';
import {
  FicheWithRelations,
  Plan,
  PlanNode,
  ReportGenerationInput,
  ReportTemplatesType,
  Statut,
  StatutEnum,
} from '@tet/domain/plans';
import { PermissionOperationEnum } from '@tet/domain/users';
import {
  CountByForEntityResponseType,
  getErrorMessage,
} from '@tet/domain/utils';
import { EChartsOption } from 'echarts/types/dist/echarts';
import { chunk, isNil } from 'es-toolkit';
import { Response } from 'express';
import { mkdirSync, rmSync, writeFileSync } from 'fs';
import { imageSizeFromFile } from 'image-size/fromFile';
import { DateTime } from 'luxon';
import * as path from 'path';
import {
  Automizer,
  ISlide,
  modify,
  ModifyImageHelper,
  ModifyShapeHelper,
  StatusTracker,
} from 'pptx-automizer';
import { ElementInfo, XmlElement } from 'pptx-automizer/dist/types/xml-types';
import slugify from 'slugify';
import { CountByService } from '../../fiches/count-by/count-by.service';
import ListFichesService from '../../fiches/list-fiches/list-fiches.service';
import { ComputeBudgetRules } from '../compute-budget/compute-budget.rules';
import { PlanService } from '../plans.service';
import { PlanProgressRules } from '../progress/plan-progress.rules';
import { GenerateReportErrorType } from './generate-report.errors';
import { IndicateurTerritorialSlideConfiguration } from './indicateur-territorial-slide-configuration.dto';
import { ReportAxeGeneralInfo } from './report-axe-general-info.dto';
import { ReportFicheInfo } from './report-fiche-info.dto';
import { ReportPlanGeneralInfo } from './report-plan-general-info.dto';
import { ReportTemplateConfig } from './report-template-config.dto';
import { ReportTemplateGroupsEnum } from './report-template-groups.enum';
import {
  ReportTemplateImagesEnum,
  ReportTemplateImagesType,
} from './report-template-images.enum';
import { ReportTemplateSlidesEnum } from './report-template-slides.enum';
import { ReportTemplateTextsEnum } from './report-template-texts.enum';
import { SlideGenerationArgs } from './slide-generation-args.dto';

@Injectable()
export class GenerateReportsService {
  private readonly logger = new Logger(GenerateReportsService.name);

  /** PowerPoint EMU precision (1 px = 9525 EMU) */
  private readonly EMU_PER_PX = 914400 / 96; // 9525

  private logTiming(operation: string, startTime: number, details?: object) {
    const duration = performance.now() - startTime;
    const message = `[TIMING] ${operation} took ${duration.toFixed(2)}ms`;
    if (details) {
      this.logger.log(`${message} - ${JSON.stringify(details)}`);
    } else {
      this.logger.log(message);
    }
  }

  /** Convert EMU → pixels */
  private emuToPx(emu: number): number {
    return Math.round(emu / this.EMU_PER_PX);
  }
  private readonly DONNEES_TERRITORIALES_INDICATEURS: IndicateurTerritorialSlideConfiguration[] =
    [
      {
        imageId: ReportTemplateImagesEnum.IMG_EMISSION_GES_CHART,
        identifiantReferentiel: 'cae_1.a',
        slideId: ReportTemplateSlidesEnum.EMISSIONS_GES_SLIDE,
        sources: [
          {
            sourceId: IndicateurSourceEnum.RARE,
            valeurTypes: [IndicateurValeurTypeEnum.RESULTAT],
          },
          {
            sourceId: IndicateurSourceEnum.SNBC,
            valeurTypes: [IndicateurValeurTypeEnum.OBJECTIF],
          },
          {
            sourceId: IndicateurSourceEnum.COLLECTIVITE,
            valeurTypes: [IndicateurValeurTypeEnum.RESULTAT],
          },
        ],
        segmentation: {
          source: 'rare',
          valeurType: IndicateurValeurTypeEnum.RESULTAT,
        },
      },
      {
        imageId: ReportTemplateImagesEnum.IMG_CONSOMMATION_FINALE_CHART,
        identifiantReferentiel: 'cae_2.a',
        slideId: ReportTemplateSlidesEnum.CONSOMMATIONS_FINALES_SLIDE,
        sources: [
          {
            sourceId: IndicateurSourceEnum.RARE,
            valeurTypes: [IndicateurValeurTypeEnum.RESULTAT],
          },
          {
            sourceId: IndicateurSourceEnum.SNBC,
            valeurTypes: [IndicateurValeurTypeEnum.OBJECTIF],
          },
          {
            sourceId: IndicateurSourceEnum.COLLECTIVITE,
            valeurTypes: [IndicateurValeurTypeEnum.RESULTAT],
          },
        ],
        segmentation: {
          source: 'rare',
          valeurType: IndicateurValeurTypeEnum.RESULTAT,
        },
      },
      {
        imageId: ReportTemplateImagesEnum.IMG_PRODUCTION_RENOUVELABLE_CHART,
        identifiantReferentiel: 'cae_3.a',
        slideId: ReportTemplateSlidesEnum.PRODUCTION_RENOUVELABLE_SLIDE,
        sources: [
          {
            sourceId: IndicateurSourceEnum.RARE,
            valeurTypes: [IndicateurValeurTypeEnum.RESULTAT],
          },
          {
            sourceId: IndicateurSourceEnum.COLLECTIVITE,
            valeurTypes: [
              IndicateurValeurTypeEnum.RESULTAT,
              IndicateurValeurTypeEnum.OBJECTIF,
            ],
          },
        ],
        segmentation: {
          source: 'rare',
          valeurType: IndicateurValeurTypeEnum.RESULTAT,
        },
      },
    ];
  private readonly LOCALE = 'fr-FR';
  private readonly CHART_SCALE_FACTOR = 2;
  private readonly NOT_DEFINED_VALUE = 'N/D';
  private readonly PCAET_TYPE = 'Plan Climat Air Énergie Territorial';
  private readonly BUDGET_FORMATTER = new Intl.NumberFormat(this.LOCALE, {
    style: 'currency',
    currency: 'EUR',
    notation: 'compact',
  });

  private readonly FICHE_PROPERTIES_TO_CHECK: {
    [ficheKey in keyof FicheWithRelations]?: string;
  } = {
    titre: 'Titre',
    dateDebut: 'Date de début',
    dateFin: 'Date de fin',
    budgets: 'Budgets',
    pilotes: 'Pilotes',
    statut: 'Statut',
  };

  /**
   * TODO: to be moved to another package in order to use it in the frontend
   */
  private readonly SUPPORTED_IMAGE_MIME_TYPES_TO_EXTENSION: Record<
    string,
    string
  > = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
  };

  private readonly SLIDE_TEMPLATES_CONFIG: {
    [key in ReportTemplatesType]: ReportTemplateConfig;
  } = {
    general_bilan_template: {
      key: 'general_bilan_template',
      templatePath: 'template_bilan.pptx',
      title: 'Template de présentation de bilans annuels',
      default: true,
      slides: {
        title_slide: 1,
        table_of_contents_slide: 2,
        overview_section_slide: 3,
        summary_slide: 4,
        progression_slide: 5,
        donnees_territoriales_section_slide: 6,
        emissions_ges_slide: 7,
        consommations_finales_slide: 8,
        production_renouvelable_slide: 9,
        axes_section_slide: 10,
        axe_summary_slide: 11,
        fiche_summary_slide: 12,
        fiche_indicateurs_slide: 13,
        ressources_slide: 14,
      },
      max_fiche_indicateurs_per_slide: 3,
    },
  };

  constructor(
    private readonly fichesService: ListFichesService,
    private readonly echartsService: EchartsService,
    private readonly countByService: CountByService,
    private readonly planService: PlanService,
    private readonly collectiviteService: CollectivitesService,
    private readonly planProgressRules: PlanProgressRules,
    private readonly indicateurChartService: IndicateurChartService,
    private readonly personnalisationsService: PersonnalisationsService,
    private readonly computeBudgetRules: ComputeBudgetRules,
    private readonly permissionService: PermissionService,
    private readonly getUrlService: GetUrlService
  ) {}

  private async replaceTextInSlide(
    slide: ISlide,
    replacementsObj: object,
    textElementIds?: string[]
  ) {
    textElementIds = textElementIds ?? (await slide.getAllTextElementIds());

    const replacements = Object.entries(replacementsObj).map(
      ([key, value]) => ({
        replace: key,
        by: { text: value.toString() },
      })
    );

    // On applique les remplacements sur chaque élément texte
    textElementIds.forEach((elementId) => {
      slide.modifyElement(elementId, [
        modify.replaceText(replacements), // remplace les {{...}} dans cet élément :contentReference[oaicite:2]{index=2}
      ]);
    });
  }

  private replaceImageInSlide(
    slide: ISlide,
    presentation: Automizer,
    allElements: ElementInfo[],
    imageElementName: string,
    imageMediaKey: string,
    imageDimensions: { width: number; height: number },
    mode: 'cover' | 'resize'
  ) {
    const imageElement = this.getImageElement(allElements, imageElementName);
    if (!imageElement) {
      this.logger.log(
        `Image element ${imageElementName} not found in slide ${slide.sourceNumber}`
      );
      return;
    }
    const newHeight =
      (imageElement.position.cx * imageDimensions.height) /
      imageDimensions.width;
    const diffHeight = newHeight - imageElement.position.cy;

    slide.modifyElement(
      imageElement.name,
      mode === 'cover'
        ? [
            (element: XmlElement, relation?: XmlElement) => {
              if (!relation) {
                return;
              }
              ModifyImageHelper.setRelationTargetCover(
                imageMediaKey,
                presentation
              )(element, relation);
            },
          ]
        : [
            ModifyShapeHelper.updatePosition({
              h: diffHeight,
              y: (-1 * diffHeight) / 2,
            }),
            (element: XmlElement, relation?: XmlElement) => {
              if (!relation) {
                return;
              }

              ModifyImageHelper.setRelationTarget(imageMediaKey)(
                element,
                relation
              );
            },
          ]
    );
  }

  private async renderChartToImageInSlide(
    slide: ISlide,
    presentation: Automizer,
    mediaDir: string,
    allElements: ElementInfo[],
    imageElementName: ReportTemplateImagesType | string,
    chartOption: EChartsOption,
    mode: 'cover' | 'resize',
    imageFilePrefix?: string,
    adjustChartOptionWithSize?: (
      chartOption: EChartsOption,
      width: number,
      height: number
    ) => void
  ) {
    const imageElement = this.getImageElement(allElements, imageElementName);
    if (!imageElement) {
      this.logger.log(
        `Image element ${imageElementName} not found in slide ${slide.sourceNumber}`
      );
      return;
    }

    const elementPxWidth =
      this.emuToPx(imageElement.position.cx) * this.CHART_SCALE_FACTOR;
    const elementPxHeight =
      this.emuToPx(imageElement.position.cy) * this.CHART_SCALE_FACTOR;
    this.logger.log(
      `Image element ${imageElementName} size: ${elementPxWidth}x${elementPxHeight}`
    );

    adjustChartOptionWithSize?.(chartOption, elementPxWidth, elementPxHeight);

    const chartRenderStartTime = performance.now();
    const buffer = await this.echartsService.renderToPngBuffer({
      width: elementPxWidth,
      height: elementPxHeight,
      options: chartOption,
    });
    this.logTiming(
      `Chart rendering to PNG (${imageElementName})`,
      chartRenderStartTime,
      {
        width: elementPxWidth,
        height: elementPxHeight,
      }
    );
    const imageFile = `${
      imageFilePrefix ? `${imageFilePrefix}_` : ''
    }${imageElementName}.png`;
    const fileWriteStartTime = performance.now();
    writeFileSync(`${mediaDir}/${imageFile}`, buffer as Uint8Array);
    this.logTiming(`Image file write (${imageFile})`, fileWriteStartTime);
    presentation.loadMedia(imageFile);
    this.logger.log(`Image file loaded: ${imageFile}`);

    this.replaceImageInSlide(
      slide,
      presentation,
      allElements,
      imageElementName,
      imageFile,
      { width: elementPxWidth, height: elementPxHeight },
      mode
    );
    this.logger.log(`Image file replaced in slide for ${imageElementName}`);
  }

  private formatBudget(budget?: number): string {
    return budget
      ? this.BUDGET_FORMATTER.format(budget)
      : this.NOT_DEFINED_VALUE;
  }

  private async getPlanData(
    planId: number,
    user: AuthenticatedUser
  ): Promise<
    MethodResult<
      {
        plan: Plan;
        collectivite: CollectiviteAvecType;
        axes: PlanNode[];
        sousAxesByAxe: Record<number, PlanNode[]>;
        fiches: FicheWithRelations[];
        planGeneralInfo: ReportPlanGeneralInfo;
        personnalisationReponses: PersonnalisationReponsesPayload;
      },
      GenerateReportErrorType
    >
  > {
    const getPlanDataStartTime = performance.now();
    const planStartTime = performance.now();
    const plan = await this.planService.findById(planId, user);
    this.logTiming('Plan findById', planStartTime);
    if (!plan.success) {
      return {
        success: false,
        error: 'PLAN_NOT_FOUND',
      };
    }

    const collectiviteStartTime = performance.now();
    const collectivite = await this.collectiviteService.getCollectiviteAvecType(
      plan.data.collectiviteId
    );
    this.logTiming(
      'Collectivite getCollectiviteAvecType',
      collectiviteStartTime
    );

    const personnalisationsStartTime = performance.now();
    const personnalisationReponses =
      await this.personnalisationsService.getPersonnalisationReponses(
        plan.data.collectiviteId
      );
    this.logTiming(
      'Personnalisations getPersonnalisationReponses',
      personnalisationsStartTime
    );

    const fichesStartTime = performance.now();
    const fiches = await this.fichesService.listFichesQuery(
      plan.data.collectiviteId,
      {
        planActionIds: [planId],
        withChildren: true,
      },
      {
        limit: 'all',
      }
    );
    this.logTiming('Fiches listFichesQuery', fichesStartTime, {
      count: fiches.count,
    });
    this.logger.log(`Found ${fiches.count} fiches for plan ${planId}`);

    const indicateursCount = new Set(
      fiches.data
        .map((fiche) => fiche.indicateurs?.map((indicateur) => indicateur.id))
        .flat()
    ).size;

    const axes = plan.data.axes
      .filter((axe) => axe.parent === planId)
      .sort((a, b) =>
        (a.nom ?? '').localeCompare(b.nom ?? '', this.LOCALE, {
          sensitivity: 'base',
          numeric: true,
        })
      );

    const sousAxesByAxe = plan.data.axes.reduce<Record<number, PlanNode[]>>(
      (acc, axe) => {
        if (axe.parent && axes.some((a) => a.id === axe.parent)) {
          acc[axe.parent] = (acc[axe.parent] ?? []).concat(axe);
        }
        return acc;
      },
      {}
    );

    const budget = this.computeBudgetRules.computeBudget(fiches.data);
    const planGeneralInfo: ReportPlanGeneralInfo = {
      PLAN_ID: planId,
      PLAN_PROGRESS: this.planProgressRules.computeProgress(fiches.data),
      COLLECTIVITE_NOM: collectivite.nom || '',
      PLAN_NOM: plan.data.nom || '',
      PLAN_TYPE: plan.data.type?.type || '',
      REPORT_DATE: new Intl.DateTimeFormat(this.LOCALE, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
      INDICATEURS_COUNT: indicateursCount,
      FICHES_COUNT: fiches.count,
      SOUS_FICHES_COUNT: 0,
      AXES_COUNT: axes.length,
      PLAN_BUDGET_FONCTIONNEMENT: this.formatBudget(
        budget.fonctionnement.HT.budgetPrevisionnel
      ),
      PLAN_BUDGET_INVESTISSEMENT: this.formatBudget(
        budget.investissement.HT.budgetPrevisionnel
      ),
      PLAN_BUDGET_TOTAL: this.formatBudget(budget.total.HT.budgetPrevisionnel),
    };

    this.logger.log(`Plan general info: ${JSON.stringify(planGeneralInfo)}`);
    this.logTiming('getPlanData total', getPlanDataStartTime, {
      fichesCount: fiches.count,
      axesCount: axes.length,
    });

    return {
      success: true,
      data: {
        collectivite,
        personnalisationReponses,
        plan: plan.data,
        axes,
        sousAxesByAxe,
        fiches: fiches.data,
        planGeneralInfo,
      },
    };
  }

  private async loadCollectiviteLogo(
    mediaDir: string,
    presentation: Automizer,
    logoFileBase64?: string
  ) {
    if (!logoFileBase64) {
      return null;
    }

    let mimeType = 'image/png'; // default
    let base64Data = logoFileBase64;

    if (logoFileBase64.startsWith('data:')) {
      const [header, data] = logoFileBase64.split(',');
      base64Data = data;
      const mimeMatch = header.match(/data:([^;]+)/);
      if (mimeMatch) {
        mimeType = mimeMatch[1];
      }
    }

    const extension =
      this.SUPPORTED_IMAGE_MIME_TYPES_TO_EXTENSION[mimeType] || 'png';
    const logoFileName = `${ReportTemplateImagesEnum.IMG_COLLECTIVITE_LOGO}.${extension}`;
    const logoFilePath = path.join(mediaDir, logoFileName);

    const buffer = Buffer.from(base64Data, 'base64');
    writeFileSync(logoFilePath, new Uint8Array(buffer));
    this.logger.log(`Logo saved from base64 data`);

    presentation.loadMedia(logoFileName);

    const dimensions = await imageSizeFromFile(logoFilePath);
    this.logger.log(`Logo dimensions: ${JSON.stringify(dimensions)}`);
    return { dimensions, fileName: logoFileName };
  }

  private addSlide(args: SlideGenerationArgs) {
    const {
      presentation,
      planGeneralInfo,
      extraTextReplacements,
      template,
      slideType,
      logo,
      callback,
    } = args;
    if (!template.slides[slideType]) {
      this.logger.log(
        `Slide type ${slideType} not found in template ${template.key}, ignoring slide addition`
      );
      return;
    }

    presentation.addSlide(
      template.key,
      template.slides[slideType],
      async (slide) => {
        await callback?.(slide);

        const allElements = await slide.getAllElements();

        if (logo) {
          this.replaceImageInSlide(
            slide,
            presentation,
            allElements,
            ReportTemplateImagesEnum.IMG_COLLECTIVITE_LOGO,
            logo.fileName,
            logo.dimensions,
            'resize'
          );
        } else {
          const imageElement = this.getImageElement(
            allElements,
            ReportTemplateImagesEnum.IMG_COLLECTIVITE_LOGO
          );
          if (imageElement) {
            slide.removeElement(ReportTemplateImagesEnum.IMG_COLLECTIVITE_LOGO);
          }
        }

        // End with text replacements
        await this.replaceTextInSlide(slide, {
          ...planGeneralInfo,
          ...(extraTextReplacements ?? {}),
        });
      }
    );
  }

  private async addPlanSummarySlide(
    args: Omit<SlideGenerationArgs, 'slideType'> & {
      mediaDir: string;
      fiches: FicheWithRelations[];
    }
  ) {
    const { presentation, mediaDir, fiches, planGeneralInfo, template, logo } =
      args;

    const countByStartTime = performance.now();
    const statutCountBy = await this.countByService.countByPropertyWithFiches(
      fiches,
      'statut',
      {}
    );
    this.logTiming('Plan summary: countBy statut', countByStartTime);
    const statutPieChartOption = getPieChartOption({
      displayItemsLabel: true,
      countByResponse: statutCountBy,
    });

    this.addSlide({
      presentation,
      planGeneralInfo,
      template,
      logo,
      slideType: 'summary_slide',
      callback: async (slide) => {
        const allElements = await slide.getAllElements();

        await this.renderChartToImageInSlide(
          slide,
          presentation,
          mediaDir,
          allElements,
          ReportTemplateImagesEnum.IMG_PLAN_COUNT_BY_STATUT_PIE,
          statutPieChartOption,
          'cover'
        );
      },
    });
  }

  private getElementByName(allElements: ElementInfo[], elementName: string) {
    return allElements.find((element) => element.name === elementName);
  }

  private getImageElement(
    allElements: ElementInfo[],
    imageElementName: string
  ) {
    return allElements.find(
      (element) => element.type === 'pic' && element.name === imageElementName
    );
  }

  private async addPlanProgressSlide(args: {
    presentation: Automizer;
    mediaDir: string;
    fiches: FicheWithRelations[];
    planGeneralInfo: ReportPlanGeneralInfo;
    template: ReportTemplateConfig;
    logo: {
      dimensions: { width: number; height: number };
      fileName: string;
    } | null;
  }): Promise<CountByForEntityResponseType[]> {
    const { presentation, mediaDir, fiches, planGeneralInfo, template, logo } =
      args;

    const countByForEachAxeStartTime = performance.now();
    const statutCountByForEachAxe =
      await this.countByService.countByPropertyForEachAxeWithFiches(
        planGeneralInfo.PLAN_ID,
        fiches,
        'statut',
        {}
      );
    this.logTiming(
      'Plan progress: countByForEachAxe statut',
      countByForEachAxeStartTime
    );

    if (!template.slides.progression_slide) {
      return statutCountByForEachAxe;
    }

    const orderedStatuts: (Statut | 'null')[] = [
      'null', // pour les fiches sans statut
      StatutEnum.A_DISCUTER,
      StatutEnum.A_VENIR,
      StatutEnum.EN_COURS,
      StatutEnum.EN_PAUSE,
      StatutEnum.ABANDONNE,
      StatutEnum.BLOQUE,
      StatutEnum.EN_RETARD,
      StatutEnum.REALISE,
    ];
    const statutCountByForEachAxeChartOption =
      getHorizontalStackedBarChartOption({
        countByResponses: statutCountByForEachAxe,
        orderedStackedKeys: orderedStatuts,
      });

    this.addSlide({
      presentation,
      planGeneralInfo,
      template,
      logo,
      slideType: 'progression_slide',
      callback: async (slide) => {
        const allElements = await slide.getAllElements();

        await this.renderChartToImageInSlide(
          slide,
          presentation,
          mediaDir,
          allElements,
          ReportTemplateImagesEnum.IMG_PLAN_PROGRESS_BY_AXE_CHART,
          statutCountByForEachAxeChartOption,
          'cover',
          undefined,
          (chartOption, width) => {
            // Adjust with for the plan axes labels
            const axisLabelWidth = Math.round(width * 0.35);
            const firstYAxis = Array.isArray(chartOption.yAxis)
              ? chartOption.yAxis[0]
              : chartOption.yAxis;
            if (firstYAxis && firstYAxis.axisLabel) {
              firstYAxis.axisLabel.width = axisLabelWidth;
            }
          }
        );
      },
    });

    return statutCountByForEachAxe;
  }

  private async addAxesSummarySlide(args: {
    presentation: Automizer;
    mediaDir: string;
    axe: PlanNode;
    sousAxes: PlanNode[];
    statutCountBy: CountByForEntityResponseType | undefined;
    fiches: FicheWithRelations[];
    planGeneralInfo: ReportPlanGeneralInfo;
    template: ReportTemplateConfig;
    logo: {
      dimensions: { width: number; height: number };
      fileName: string;
    } | null;
  }) {
    const {
      presentation,
      mediaDir,
      axe,
      sousAxes,
      statutCountBy,
      fiches,
      planGeneralInfo,
      template,
      logo,
    } = args;

    if (!template.slides.axe_summary_slide) {
      return;
    }

    const axeGeneralInfo = this.getAxeGeneralInfo(axe, sousAxes, fiches);

    this.logger.log(
      `Axe ${axe.nom} general info: ${JSON.stringify(axeGeneralInfo)}`
    );

    this.addSlide({
      presentation,
      planGeneralInfo,
      template,
      logo,
      slideType: 'axe_summary_slide',
      extraTextReplacements: axeGeneralInfo,
      callback: async (slide) => {
        const allElements = await slide.getAllElements();

        if (statutCountBy) {
          const noFicheInfoTextElement = this.getElementByName(
            allElements,
            ReportTemplateTextsEnum.TXT_AXE_NO_FICHE_INFO
          );
          if (noFicheInfoTextElement) {
            slide.removeElement(ReportTemplateTextsEnum.TXT_AXE_NO_FICHE_INFO);
          }

          const statutPieChartOption = getPieChartOption({
            displayItemsLabel: true,
            countByResponse: statutCountBy,
          });

          await this.renderChartToImageInSlide(
            slide,
            presentation,
            mediaDir,
            allElements,
            ReportTemplateImagesEnum.IMG_AXE_COUNT_BY_STATUT_PIE,
            statutPieChartOption,
            'cover',
            `axe_${axe.id}`
          );
        } else {
          const imageElement = this.getImageElement(
            allElements,
            ReportTemplateImagesEnum.IMG_AXE_COUNT_BY_STATUT_PIE
          );
          if (imageElement) {
            slide.removeElement(
              ReportTemplateImagesEnum.IMG_AXE_COUNT_BY_STATUT_PIE
            );
          }
        }
      },
    });
  }

  private getReportName(planGeneralInfo: ReportPlanGeneralInfo): string {
    return `${slugify(
      `Rapport_${planGeneralInfo.COLLECTIVITE_NOM}_${planGeneralInfo.PLAN_NOM}`,
      {
        replacement: ' ',
        remove: /[*+~.()'"!:@]/g,
      }
    )}.pptx`;
  }

  async generateAndDownloadPlanReport(
    request: ReportGenerationInput,
    user: AuthenticatedUser,
    res: Response
  ) {
    const reportResult = await this.generatePlanReport(request, user);
    if (!reportResult.success) {
      const status =
        reportResult.error === GenerateReportErrorType.UNAUTHORIZED ? 403 : 500;
      res.status(status).json(reportResult);
      return;
    }

    res.attachment(reportResult.data.reportName);
    res.set('Access-Control-Expose-Headers', 'Content-Disposition');
    res.sendFile(reportResult.data.reportPath, (error) => {
      if (error) {
        this.logger.error(`Error sending file: ${getErrorMessage(error)}`);
      } else {
        this.logger.log(`Report sent successfully`);
      }
      if (reportResult.data.outputDir) {
        this.logger.log(
          `Removing output directory: ${reportResult.data.outputDir}`
        );
        rmSync(reportResult.data.outputDir, { recursive: true });
      }
    });
  }

  private getFicheTextReplacementsInfos(
    fiche: FicheWithRelations
  ): ReportFicheInfo {
    const dateDebut = fiche.dateDebut
      ? DateTime.fromISO(fiche.dateDebut)
          .setLocale(this.LOCALE)
          .toLocaleString(DateTime.DATE_SHORT)
      : this.NOT_DEFINED_VALUE;
    const dateFin = fiche.dateFin
      ? DateTime.fromISO(fiche.dateFin)
          .setLocale(this.LOCALE)
          .toLocaleString(DateTime.DATE_SHORT)
      : this.NOT_DEFINED_VALUE;

    const budget = this.computeBudgetRules.computeBudget([fiche]);

    const missingInfo = Object.entries(this.FICHE_PROPERTIES_TO_CHECK)
      .filter(([key, _]) => {
        if (isNil(fiche[key as keyof FicheWithRelations])) {
          return true;
        }
        return false;
      })
      .map(([_, value]) => `${value}`)
      .join(', ');

    return {
      FICHE_TITRE: fiche.titre ?? '',
      FICHE_PILOTES:
        fiche.pilotes?.map((pilote) => pilote.nom ?? '').join(', ') ??
        this.NOT_DEFINED_VALUE,
      FICHE_PERIODE: `${dateDebut} -> ${dateFin}`,
      FICHE_DATE_DEBUT: dateDebut,
      FICHE_DATE_FIN: dateFin,
      FICHE_BUDGET_TOTAL: this.formatBudget(budget.total.HT.budgetPrevisionnel),
      FICHE_BUDGET_FONCTIONNEMENT: this.formatBudget(
        budget.fonctionnement.HT.budgetPrevisionnel
      ),
      FICHE_BUDGET_INVESTISSEMENT: this.formatBudget(
        budget.investissement.HT.budgetPrevisionnel
      ),
      MISSING_INFO: missingInfo,
    };
  }

  private getAxeGeneralInfo(
    axe: PlanNode,
    sousAxes: PlanNode[] | undefined,
    fiches: FicheWithRelations[]
  ): ReportAxeGeneralInfo {
    const axeFilteredFiches = fiches.filter(
      (fiche) => !fiche.parentId && fiche.axes?.some((a) => a.id === axe.id)
    );
    this.logger.log(`Axe ${axe.nom} has ${axeFilteredFiches.length} fiches`);
    const indicateursCount = new Set(
      axeFilteredFiches
        .map((fiche) => fiche.indicateurs?.map((indicateur) => indicateur.id))
        .flat()
    ).size;

    const budget = this.computeBudgetRules.computeBudget(axeFilteredFiches);

    return {
      AXE_ID: axe.id,
      AXE_NOM: axe.nom?.startsWith('Axe') ? axe.nom : `Axe ${axe.nom ?? ''}`,
      SOUS_AXES_COUNT: sousAxes?.length ?? 0,
      AXE_PROGRESS: this.planProgressRules.computeProgress(axeFilteredFiches),
      INDICATEURS_COUNT: indicateursCount,
      FICHES_COUNT: axeFilteredFiches.length,
      SOUS_FICHES_COUNT: 0,
      AXE_BUDGET_TOTAL: this.formatBudget(budget.total.HT.budgetPrevisionnel),
      AXE_BUDGET_FONCTIONNEMENT: this.formatBudget(
        budget.fonctionnement.HT.budgetPrevisionnel
      ),
      AXE_BUDGET_INVESTISSEMENT: this.formatBudget(
        budget.investissement.HT.budgetPrevisionnel
      ),
    };
  }

  private deleteNotNeededFicheStatus(
    slide: ISlide,
    allElements: ElementInfo[],
    statut: Statut | null
  ) {
    const allStatuts = {
      ...StatutEnum,
      SANS_STATUT: null,
    };
    const statutElementsToDelete = [...Object.keys(allStatuts)]
      .filter((key) => allStatuts[key as keyof typeof StatutEnum] !== statut)
      .map((key) => `${ReportTemplateTextsEnum.TXT_FICHE_STATUT_}${key}`);

    statutElementsToDelete.forEach((statutElementToDelete) => {
      if (
        allElements.find((element) => element.name === statutElementToDelete)
      ) {
        slide.removeElement(statutElementToDelete);
      }
    });
  }

  private async addFicheInfosSlides(
    args: Omit<SlideGenerationArgs, 'slideType'> & {
      ficheTextReplacementsInfo: ReportFicheInfo;
      fiche: FicheWithRelations;
    }
  ) {
    const {
      presentation,
      planGeneralInfo,
      ficheTextReplacementsInfo,
      fiche,
      logo,
      template,
    } = args;

    if (!template.slides.fiche_summary_slide) {
      return;
    }

    this.addSlide({
      presentation,
      template,
      planGeneralInfo,
      logo,
      slideType: 'fiche_summary_slide',
      extraTextReplacements: ficheTextReplacementsInfo,
      callback: async (slide) => {
        const allElements = await slide.getAllElements();
        this.deleteNotNeededFicheStatus(slide, allElements, fiche.statut);

        if (ficheTextReplacementsInfo.MISSING_INFO) {
          const fillFicheElement = this.getElementByName(
            allElements,
            ReportTemplateTextsEnum.TXT_FICHE_FILL_MISSING_INFO_LINK
          );
          if (fillFicheElement) {
            const ficheUrl = this.getUrlService.getFicheUrl({
              collectiviteId: fiche.collectiviteId,
              planId: planGeneralInfo.PLAN_ID,
              ficheId: fiche.id,
              parentId: fiche.parentId,
            });
            slide.modifyElement(
              ReportTemplateTextsEnum.TXT_FICHE_FILL_MISSING_INFO_LINK,
              modify.setHyperlinkTarget(ficheUrl)
            );
          } else {
            this.logger.log(`Fill missing info link text element not found`);
          }
        } else {
          const foundGrpElement = this.getElementByName(
            allElements,
            ReportTemplateGroupsEnum.GRP_FICHE_MISSING_INFO
          );
          if (foundGrpElement) {
            slide.removeElement(
              ReportTemplateGroupsEnum.GRP_FICHE_MISSING_INFO
            );
          } else {
            this.logger.log(`Missing info group element not found`);
          }
        }
      },
    });
  }

  private async addFicheIndicateursSlides(
    args: Omit<SlideGenerationArgs, 'slideType'> & {
      collectivite: CollectiviteAvecType;
      personnalisationReponses: PersonnalisationReponsesPayload;
      mediaDir: string;
      ficheTextReplacementsInfo: ReportFicheInfo;
      fiche: FicheWithRelations;
    }
  ) {
    const {
      presentation,
      collectivite,
      planGeneralInfo,
      personnalisationReponses,
      ficheTextReplacementsInfo,
      logo,
      template,
      mediaDir,
      fiche,
    } = args;
    if (!template.slides.fiche_indicateurs_slide) {
      return;
    }

    const indicateursDataStartTime = performance.now();
    const indicateurWithValeursAndChartData = await Promise.all(
      fiche.indicateurs?.map((indicateur) =>
        this.indicateurChartService.getIndicateurValeursAndChartData({
          collectiviteId: fiche.collectiviteId,
          indicateurId: indicateur.id,
          collectiviteAvecType: collectivite,
          personnalisationReponses,
          includeReferenceValeurs: true,
          includeMoyenne: false,
          includeSegmentation: {},
        })
      ) ?? []
    );
    this.logTiming(
      `Fiche indicateurs: chart data retrieval for ${fiche.titre}`,
      indicateursDataStartTime,
      {
        indicateursCount: indicateurWithValeursAndChartData.length,
      }
    );

    if (indicateurWithValeursAndChartData.length) {
      const indicateurWithValeursAndChartDataChunks = chunk(
        indicateurWithValeursAndChartData,
        template.max_fiche_indicateurs_per_slide
      );

      for (const indicateurWithValeursAndChartDataChunk of indicateurWithValeursAndChartDataChunks) {
        this.addSlide({
          presentation,
          template,
          planGeneralInfo,
          logo,
          slideType: 'fiche_indicateurs_slide',
          extraTextReplacements: ficheTextReplacementsInfo,
          callback: async (slide) => {
            const allElements = await slide.getAllElements();

            await Promise.all(
              indicateurWithValeursAndChartDataChunk.map(
                (indicateurWithValeursAndChartData, iIndicateur) => {
                  const imageName = `${
                    ReportTemplateImagesEnum.IMG_FICHE_INDICATEUR_CHART_
                  }${iIndicateur + 1}`;
                  return this.renderChartToImageInSlide(
                    slide,
                    presentation,
                    mediaDir,
                    allElements,
                    imageName,
                    indicateurWithValeursAndChartData.chartData,
                    'cover',
                    `fiche_${fiche.id}_chart_${indicateurWithValeursAndChartData.indicateurValeurs.definition.id}`,
                    (chartOption, width) => {
                      this.indicateurChartService.adjustOptionsWithWidth(
                        chartOption,
                        width
                      );
                    }
                  );
                }
              )
            );

            for (
              let iIndicateur = indicateurWithValeursAndChartDataChunk.length;
              iIndicateur < template.max_fiche_indicateurs_per_slide;
              iIndicateur++
            ) {
              const grpElementName = `${
                ReportTemplateGroupsEnum.GRP_FICHE_INDICATEUR_CHART_
              }${iIndicateur + 1}`;
              const foundGrpElement = this.getElementByName(
                allElements,
                grpElementName
              );
              if (foundGrpElement) {
                slide.removeElement(grpElementName);
              } else {
                this.logger.log(
                  `Indicateur group element not found for ${grpElementName}`
                );
              }
            }
          },
        });
      }
    }
  }

  private async addDonneesTerritorialesSlides(
    args: Omit<SlideGenerationArgs, 'slideType'> & {
      mediaDir: string;
      collectivite: CollectiviteAvecType;
      personnalisationReponses: PersonnalisationReponsesPayload;
    }
  ) {
    this.addSlide({
      ...args,
      slideType: 'donnees_territoriales_section_slide',
    });

    const chartsDataStartTime = performance.now();
    const charts = await Promise.all(
      this.DONNEES_TERRITORIALES_INDICATEURS.map(async (configuration) => {
        const chartDataStartTime = performance.now();
        const { chartData } =
          await this.indicateurChartService.getIndicateurValeursAndChartData({
            collectiviteId: args.collectivite.id,
            identifiantReferentiel: configuration.identifiantReferentiel,
            sources: configuration.sources,
            includeSegmentation: configuration.segmentation,
          });
        this.logTiming(
          `Données territoriales: chart data for ${configuration.identifiantReferentiel}`,
          chartDataStartTime
        );
        return {
          configuration,
          chartData,
        };
      })
    );
    this.logTiming(
      'Données territoriales: all charts data retrieval',
      chartsDataStartTime,
      {
        count: charts.length,
      }
    );
    this.logger.log(`Retrieved charts data for donnees territoriales`);

    charts.forEach((chart) => {
      this.addIndicateurTerritorialSlide({
        ...args,
        configuration: chart.configuration,
        chartData: chart.chartData,
      });
    });
  }

  private addIndicateurTerritorialSlide(
    args: Omit<SlideGenerationArgs, 'slideType'> & {
      mediaDir: string;
      chartData: EChartsOption;
      configuration: IndicateurTerritorialSlideConfiguration;
    }
  ) {
    const { presentation, mediaDir, chartData, configuration } = args;
    this.addSlide({
      ...args,
      slideType: args.configuration.slideId,
      callback: async (slide) => {
        const allElements = await slide.getAllElements();
        const imageElement = this.getImageElement(
          allElements,
          configuration.imageId
        );
        if (!imageElement) {
          this.logger.error(
            `Image element not found for ${args.configuration.imageId}`
          );
          return;
        }

        await this.renderChartToImageInSlide(
          slide,
          presentation,
          mediaDir,
          allElements,
          configuration.imageId,
          chartData,
          'resize',
          undefined,
          (chartOption, width) => {
            this.indicateurChartService.adjustOptionsWithWidth(
              chartOption,
              width
            );
          }
        );
      },
    });
  }

  async generatePlanReport(
    request: ReportGenerationInput,
    user: AuthenticatedUser
  ): Promise<
    MethodResult<
      { reportName: string; reportPath: string; outputDir: string },
      GenerateReportErrorType
    >
  > {
    const overallStartTime = performance.now();
    let mediaDir = '';
    let outputDir = '';
    let reportPath = '';
    let reportName = '';
    let error: GenerateReportErrorType | undefined;
    this.logger.log(
      `Generating plan report for plan ${request.planId} with template ${request.templateKey}`
    );

    try {
      const templateConfigStartTime = performance.now();
      const templateConfig = this.SLIDE_TEMPLATES_CONFIG[request.templateKey];
      this.logTiming('Template config retrieval', templateConfigStartTime);

      const planDataStartTime = performance.now();
      const planDataResult = await this.getPlanData(request.planId, user);
      this.logTiming('Plan data retrieval', planDataStartTime);
      if (!planDataResult.success) {
        return {
          success: false,
          error: planDataResult.error,
        };
      }
      const {
        plan,
        axes,
        sousAxesByAxe,
        fiches,
        planGeneralInfo,
        collectivite,
        personnalisationReponses,
      } = planDataResult.data;

      const permissionStartTime = performance.now();
      const isAllowed = await this.permissionService.isAllowed(
        user,
        PermissionOperationEnum['PLANS.READ'],
        ResourceType.COLLECTIVITE,
        plan.collectiviteId,
        true
      );
      this.logTiming('Permission check', permissionStartTime);
      if (!isAllowed) {
        return {
          success: false,
          error: 'UNAUTHORIZED',
        };
      }

      const setupStartTime = performance.now();
      const generationId = crypto.randomUUID();
      mediaDir = path.join(__dirname, `media/${generationId}`);
      outputDir = path.join(__dirname, `output/${generationId}`);
      mkdirSync(mediaDir, { recursive: true });
      mkdirSync(outputDir, { recursive: true });
      this.logTiming('Directory setup', setupStartTime);

      const automizerStartTime = performance.now();
      const automizer = new Automizer({
        templateDir: path.join(__dirname, 'docs'),
        autoImportSlideMasters: true,
        outputDir: outputDir,
        mediaDir,
        removeExistingSlides: true,
        showIntegrityInfo: false, // WARNING: changing this to true throw some weird errors on generated images not beeing found
        assertRelatedContents: true,
        cleanup: true,
        compression: 9,
        verbosity: 1,
        statusTracker: (status: StatusTracker) => {
          this.logger.log(status.info + ' (' + status.share + '%)');
        },
      });

      const presentation = automizer
        .loadRoot(templateConfig.templatePath)
        .load(templateConfig.templatePath, templateConfig.key);
      this.logTiming('Automizer initialization', automizerStartTime);

      const logoStartTime = performance.now();
      const logo = await this.loadCollectiviteLogo(
        mediaDir,
        presentation,
        request.logoFile
      );
      this.logTiming('Logo loading', logoStartTime);

      const slideGenerationArgs: Omit<SlideGenerationArgs, 'slideType'> = {
        presentation,
        planGeneralInfo,
        template: templateConfig,
        logo,
      };

      const initialSlidesStartTime = performance.now();
      this.addSlide({
        ...slideGenerationArgs,
        slideType: 'title_slide',
      });
      this.addSlide({
        ...slideGenerationArgs,
        slideType: 'table_of_contents_slide',
        callback: async (slide) => {
          await this.replaceTextInSlide(slide, {
            AXE_NOMS: axes.map((axe) => axe.nom ?? '').join('\n'),
          });
        },
      });
      this.addSlide({
        ...slideGenerationArgs,
        slideType: 'overview_section_slide',
      });
      this.logTiming(
        'Initial slides (title, TOC, overview)',
        initialSlidesStartTime
      );

      const planSummaryStartTime = performance.now();
      await this.addPlanSummarySlide({
        ...slideGenerationArgs,
        mediaDir,
        fiches,
      });
      this.logTiming('Plan summary slide', planSummaryStartTime);

      const planProgressStartTime = performance.now();
      const statutCountByForEachAxe = await this.addPlanProgressSlide({
        ...slideGenerationArgs,
        mediaDir,
        fiches,
      });
      this.logTiming('Plan progress slide', planProgressStartTime);

      if (plan.type?.type === this.PCAET_TYPE) {
        const donneesTerritorialesStartTime = performance.now();
        await this.addDonneesTerritorialesSlides({
          ...slideGenerationArgs,
          mediaDir,
          collectivite,
          personnalisationReponses,
        });
        this.logTiming(
          'Données territoriales slides',
          donneesTerritorialesStartTime
        );
      }

      const axesSectionStartTime = performance.now();
      this.addSlide({
        ...slideGenerationArgs,
        slideType: 'axes_section_slide',
      });
      this.logTiming('Axes section slide', axesSectionStartTime);

      const filteredFiches = request.ficheIds
        ? fiches.filter((fiche) => request.ficheIds?.includes(fiche.id))
        : fiches;
      this.logger.log(
        `Fiches to be included in the report: ${filteredFiches.length}`
      );

      const axesAndFichesStartTime = performance.now();
      for (const axe of axes) {
        const axeSlideStartTime = performance.now();
        await this.addAxesSummarySlide({
          presentation,
          mediaDir,
          axe,
          sousAxes: sousAxesByAxe[axe.id],
          statutCountBy: statutCountByForEachAxe.find(
            (countBy) => countBy.id === axe.id
          ),
          fiches: fiches,
          planGeneralInfo,
          template: templateConfig,
          logo,
        });
        this.logTiming(`Axe summary slide for ${axe.nom}`, axeSlideStartTime);

        const axeFilteredFiches = filteredFiches.filter((fiche) =>
          fiche.axes?.some((a) => a.id === axe.id)
        );
        const fichesForAxeStartTime = performance.now();
        for (const fiche of axeFilteredFiches) {
          const ficheInfoStartTime = performance.now();
          const ficheTextReplacementsInfo =
            this.getFicheTextReplacementsInfos(fiche);

          await this.addFicheInfosSlides({
            ...slideGenerationArgs,
            ficheTextReplacementsInfo,
            fiche,
          });
          this.logTiming(
            `Fiche info slide for ${fiche.titre}`,
            ficheInfoStartTime
          );

          if (request.includeFicheIndicateursSlides) {
            const ficheIndicateursStartTime = performance.now();
            await this.addFicheIndicateursSlides({
              ...slideGenerationArgs,
              collectivite,
              personnalisationReponses,
              ficheTextReplacementsInfo,
              mediaDir,
              fiche,
            });
            this.logTiming(
              `Fiche indicateurs slides for ${fiche.titre}`,
              ficheIndicateursStartTime
            );
          }
        }
        this.logTiming(
          `All fiches for axe ${axe.nom} (${axeFilteredFiches.length} fiches)`,
          fichesForAxeStartTime
        );
      }
      this.logTiming(
        `All axes and fiches slides (${axes.length} axes)`,
        axesAndFichesStartTime
      );

      const ressourcesSlideStartTime = performance.now();
      this.addSlide({
        ...slideGenerationArgs,
        slideType: 'ressources_slide',
      });
      this.logTiming('Ressources slide', ressourcesSlideStartTime);

      const writeReportStartTime = performance.now();
      reportName = this.getReportName(planGeneralInfo);
      const reportSummary = await automizer.write(reportName);
      this.logTiming('Report file writing', writeReportStartTime, {
        reportName,
      });
      this.logger.log(`Report summary: ${JSON.stringify(reportSummary)}`);
      reportPath = path.join(outputDir, reportName);
      this.logger.log(`Report path: ${reportPath}`);
      this.logTiming('Total report generation', overallStartTime);
    } catch (err) {
      this.logger.error(
        `Error generating plan report: ${getErrorMessage(err)}`
      );
      this.logTiming('Total report generation (failed)', overallStartTime);
      error = GenerateReportErrorType.SERVER_ERROR;
    } finally {
      if (mediaDir) {
        rmSync(mediaDir, { recursive: true });
      }
    }

    return error
      ? {
          success: false,
          error: error,
        }
      : {
          success: true,
          data: { reportName, reportPath, outputDir },
        };
  }
}
