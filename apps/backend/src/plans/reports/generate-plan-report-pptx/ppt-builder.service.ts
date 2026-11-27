import { Injectable, Logger } from '@nestjs/common';
import PersonnalisationsService from '@tet/backend/collectivites/personnalisations/services/personnalisations-service';
import CollectivitesService from '@tet/backend/collectivites/services/collectivites.service';
import { getIndicateurChartDataOrThrow } from '@tet/backend/indicateurs/charts/indicateur-chart.errors';
import { IndicateurChartService } from '@tet/backend/indicateurs/charts/indicateur-chart.service';
import { TrajectoireSnbc3FeatureFlagService } from '@tet/backend/indicateurs/trajectoires/trajectoire-snbc3-feature-flag.service';
import { EchartsService } from '@tet/backend/utils/echarts/echarts.service';
import { getHorizontalStackedBarChartOption } from '@tet/backend/utils/echarts/get-horizontal-stackedbar-chart-option.utils';
import { getPieChartOption } from '@tet/backend/utils/echarts/get-pie-chart-option.utils';
import { isErrorWithCause } from '@tet/backend/utils/nest/errors.utils';
import { failure, Result, success } from '@tet/backend/utils/result.type';
import {
  CollectiviteAvecType,
  PersonnalisationReponsesPayload,
} from '@tet/domain/collectivites';
import {
  IndicateurSourceEnum,
  IndicateurValeurTypeEnum,
} from '@tet/domain/indicateurs';
import {
  FicheInformationsMode,
  FicheWithRelations,
  GenerateReportInput,
  isFicheOnTime,
  Plan,
  PlanNode,
  Statut,
  StatutEnum,
} from '@tet/domain/plans';
import {
  CountByForEntityResponseType,
  getErrorMessage,
} from '@tet/domain/utils';
import { EChartsOption } from 'echarts/types/dist/echarts';
import { chunk, isNil } from 'es-toolkit';
import { writeFileSync } from 'fs';
import { convert } from 'html-to-text';
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
import sharp, { type Metadata } from 'sharp';
import { CountByService } from '../../fiches/count-by/count-by.service';
import ListFichesService from '../../fiches/list-fiches/list-fiches.service';
import { ComputeBudgetRules } from '../../plans/compute-budget/compute-budget.rules';
import { GetPlanService } from '../../plans/get-plan/get-plan.service';
import { PlanProgressRules } from '../../plans/progress/plan-progress.rules';
import GetPlanUrlService from '../../utils/get-plan-url.service';
import { GenerateReportErrorEnum } from './generate-reports.errors';
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
export class PptBuilderService {
  private readonly logger = new Logger(PptBuilderService.name);

  /** PowerPoint EMU precision (1 px = 9525 EMU) */
  private readonly EMU_PER_PX = 914400 / 96;

  private readonly INDICATEUR_CHART_IMAGE_FILES_CHUNK_LIMIT = 10;

  /** Convert EMU → pixels */
  private emuToPx(emu: number): number {
    return Math.round(emu / this.EMU_PER_PX);
  }

  /**
   * Graphes des données territoriales. Si le flag
   * `is-trajectoire-snbc3-enabled` est actif pour l'auteur du rapport et la
   * collectivité du plan, ils montrent la SNBC 2 et la SNBC 3, comme les
   * graphes de l'app pendant la transition ; sinon, la SNBC 2 seule.
   */
  private getDonneesTerritorialesIndicateurs(
    isSnbc3Enabled: boolean
  ): IndicateurTerritorialSlideConfiguration[] {
    const trajectoires = (
      isSnbc3Enabled
        ? [IndicateurSourceEnum.SNBC, IndicateurSourceEnum.SNBC3]
        : [IndicateurSourceEnum.SNBC]
    ).map((sourceId) => ({
      sourceId,
      valeurTypes: [IndicateurValeurTypeEnum.OBJECTIF],
    }));

    return [
      {
        imageId: ReportTemplateImagesEnum.IMG_EMISSION_GES_CHART,
        identifiantReferentiel: 'cae_1.a',
        slideId: ReportTemplateSlidesEnum.EMISSIONS_GES_SLIDE,
        sources: [
          {
            sourceId: IndicateurSourceEnum.RARE,
            valeurTypes: [IndicateurValeurTypeEnum.RESULTAT],
          },
          ...trajectoires,
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
      {
        imageId: ReportTemplateImagesEnum.IMG_CONSOMMATION_FINALE_CHART,
        identifiantReferentiel: 'cae_2.a',
        slideId: ReportTemplateSlidesEnum.CONSOMMATIONS_FINALES_SLIDE,
        sources: [
          {
            sourceId: IndicateurSourceEnum.RARE,
            valeurTypes: [IndicateurValeurTypeEnum.RESULTAT],
          },
          ...trajectoires,
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
  }

  private readonly LOCALE = 'fr-FR';
  private readonly CHART_SCALE_FACTOR = 2;
  private readonly NOT_DEFINED_VALUE = 'N/D';
  private readonly LAST_NOTE_TITLE = 'Dernière note';
  private readonly PCAET_TYPE = 'Plan Climat Air Énergie Territorial';
  // Longueurs qui tiennent dans les cadres de la slide « Sous-actions » :
  // une ligne pour le titre, deux pour la description.
  private readonly SOUS_ACTION_TITRE_MAX_LENGTH = 70;
  private readonly SOUS_ACTION_DESCRIPTION_MAX_LENGTH = 170;
  /** Le cadre des pilotes d'une sous-action ne tient que sur une ligne. */
  private readonly SOUS_ACTION_PILOTES_MAX_COUNT = 2;
  // rouge « erreur » du DSFR, comme la date de fin dépassée dans l'app
  private readonly LATE_DATE_COLOR = 'CE0500';
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

  private readonly SUPPORTED_IMAGE_MIME_TYPES_TO_EXTENSION: Record<
    string,
    string
  > = {
    'image/png': 'png',
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/gif': 'gif',
  };

  constructor(
    private readonly echartsService: EchartsService,
    private readonly countByService: CountByService,
    private readonly planProgressRules: PlanProgressRules,
    private readonly indicateurChartService: IndicateurChartService,
    private readonly computeBudgetRules: ComputeBudgetRules,
    private readonly getPlanUrlService: GetPlanUrlService,
    private readonly planService: GetPlanService,
    private readonly collectiviteService: CollectivitesService,
    private readonly personnalisationsService: PersonnalisationsService,
    private readonly fichesService: ListFichesService,
    private readonly trajectoireSnbc3FeatureFlag: TrajectoireSnbc3FeatureFlagService
  ) {}

  async buildPresentation(args: {
    mediaDir: string;
    outputDir: string;
    reportName: string;
    templateConfig: ReportTemplateConfig;
    request: GenerateReportInput;
    /** Auteur du rapport : le flag SNBC 3 est évalué pour lui. */
    userId: string;
  }): Promise<
    Result<
      {
        reportPath: string;
      },
      | typeof GenerateReportErrorEnum.PLAN_NOT_FOUND
      | typeof GenerateReportErrorEnum.NOT_FOUND
      | typeof GenerateReportErrorEnum.DATABASE_ERROR
      | typeof GenerateReportErrorEnum.PPT_BUILDER_ERROR
      | typeof GenerateReportErrorEnum.INVALID_COLLECTIVITE_LOGO
    >
  > {
    const { mediaDir, outputDir, reportName, templateConfig, request, userId } =
      args;
    const planDataResult = await this.getPlanData(request.planId);
    if (!planDataResult.success) {
      return {
        success: false,
        error: planDataResult.error,
        cause: planDataResult.cause,
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

    try {
      const automizer = new Automizer({
        templateDir: path.join(__dirname, 'docs'),
        autoImportSlideMasters: true,
        outputDir: outputDir,
        mediaDir,
        removeExistingSlides: true,
        showIntegrityInfo: false, // WARNING: changing this to true throw some weird errors on generated images not beeing found
        assertRelatedContents: true,
        cleanup: true,
        compression: 7,
        verbosity: 1,
        statusTracker: (status: StatusTracker) => {
          this.logger.log(status.info + ' (' + status.share + '%)');
        },
      });

      const presentation = automizer
        .loadRoot(templateConfig.templatePath)
        .load(templateConfig.templatePath, templateConfig.key);

      const logoResult = await this.loadCollectiviteLogo(
        mediaDir,
        presentation,
        request.logoFile
      );
      if (!logoResult.success) {
        return {
          success: false,
          error: logoResult.error,
          cause: logoResult.cause,
        };
      }
      const logo = logoResult.data;

      const slideGenerationArgs: Omit<SlideGenerationArgs, 'slideType'> = {
        presentation,
        planGeneralInfo,
        template: templateConfig,
        logo,
      };

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

      // Les comptes et graphiques du plan ne portent que sur les actions : une
      // sous-action est rattachée à son action parente, pas comptée à part.
      const actions = fiches.filter((fiche) => !fiche.parentId);

      await this.addPlanSummarySlide({
        ...slideGenerationArgs,
        mediaDir,
        fiches: actions,
      });

      const statutCountByForEachAxe = await this.addPlanProgressSlide({
        ...slideGenerationArgs,
        mediaDir,
        fiches: actions,
      });

      if (
        statutCountByForEachAxe.find(
          (countBy) => countBy.id === this.countByService.NO_AXE_ID
        )
      ) {
        axes.push({
          id: this.countByService.NO_AXE_ID,
          nom: this.countByService.NO_AXE_NOM,
          parent: plan.id,
          fiches: actions
            .filter(
              (fiche) =>
                !fiche.axes?.some((axe) => axe.parentId === request.planId)
            )
            .map((fiche) => fiche.id),
          depth: 0,
        });
        this.logger.log(JSON.stringify(axes, null, 2));
      }

      if (plan.type?.type === this.PCAET_TYPE) {
        await this.addDonneesTerritorialesSlides({
          ...slideGenerationArgs,
          mediaDir,
          collectivite,
          personnalisationReponses,
          userId,
        });
      }

      this.addSlide({
        ...slideGenerationArgs,
        slideType: 'axes_section_slide',
      });

      // Les actions choisies emmènent leurs sous-actions avec elles.
      const selectedFicheIds = request.ficheIds
        ? new Set(request.ficheIds)
        : null;
      const filteredFiches = selectedFicheIds
        ? fiches.filter(
            (fiche) =>
              selectedFicheIds.has(fiche.id) ||
              (fiche.parentId !== null && selectedFicheIds.has(fiche.parentId))
          )
        : fiches;
      this.logger.log(
        `Fiches to be included in the report: ${filteredFiches.length}`
      );

      // Seules les actions ont une slide d'indicateurs.
      const filteredFichesIndicateurs = Array.from(
        new Set(
          filteredFiches
            .filter((fiche) => !fiche.parentId)
            .map(
              (fiche) =>
                fiche.indicateurs?.map((indicateur) => indicateur.id) || []
            )
            .flat()
        )
      );
      // Get the size of the indicateur chart to be used
      // Allow to parallelize the writing of the indicateur chart image files
      const indicateurChartSize = await this.getIndicateurChartSize(
        templateConfig,
        outputDir,
        mediaDir
      );

      const indicateurChartImageFiles: {
        indicateurId: number;
        imageFile: string;
        totalFilledValeursCount: number;
      }[] = [];
      if (request.includeFicheIndicateursSlides && indicateurChartSize) {
        this.logger.log(
          `Writing indicateur chart image files for ${filteredFichesIndicateurs.length} indicateurs`
        );
        const filteredFicheIndicateurChunks = chunk(
          filteredFichesIndicateurs,
          this.INDICATEUR_CHART_IMAGE_FILES_CHUNK_LIMIT
        );
        for (const filteredFichesIndicateurChunk of filteredFicheIndicateurChunks) {
          const indicateurChartImageFilesChunk = await Promise.all(
            filteredFichesIndicateurChunk.map((indicateurId) =>
              this.writeIndicateurChartImageFileAndLoadMedia({
                indicateurId,
                collectivite,
                personnalisationReponses,
                presentation,
                mediaDir,
                chartSize: indicateurChartSize,
              })
            )
          );
          indicateurChartImageFiles.push(...indicateurChartImageFilesChunk);
        }
      }
      // Une sous-action suit les axes de son action parente (ses propres
      // lignes d'axe sont ignorées, comme dans les filtres de listFiches).
      const fichesById = new Map(fiches.map((fiche) => [fiche.id, fiche]));
      const isInAxe = (fiche: FicheWithRelations, axeId: number) => {
        const owner = fiche.parentId ? fichesById.get(fiche.parentId) : fiche;
        if (!owner) {
          return false;
        }
        return axeId === this.countByService.NO_AXE_ID
          ? !owner.axes?.some((a) => a.parentId === plan.id)
          : owner.axes?.some((a) => a.id === axeId) ?? false;
      };

      for (const axe of axes) {
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

        const axeFiches = filteredFiches.filter((fiche) =>
          isInAxe(fiche, axe.id)
        );
        // Une sous-action n'a pas de slide d'action : elle figure dans la
        // slide « Sous-actions » de son action parente.
        for (const { action, sousActions } of this.groupFichesForReport(
          axeFiches
        )) {
          const ficheTextReplacementsInfo = this.getFicheTextReplacementsInfos(
            action,
            request.ficheInformationsMode
          );

          this.addFicheInfosSlides({
            ...slideGenerationArgs,
            ficheTextReplacementsInfo,
            fiche: action,
          });

          if (request.includeFicheIndicateursSlides) {
            this.addFicheIndicateursSlides({
              ...slideGenerationArgs,
              ficheTextReplacementsInfo,
              fiche: action,
              indicateurChartImageFiles,
            });
          }

          this.addFicheSousActionsSlides({
            ...slideGenerationArgs,
            ficheTextReplacementsInfo,
            sousActions,
          });
        }
      }

      if (plan.type?.type === this.PCAET_TYPE) {
        this.addSlide({
          ...slideGenerationArgs,
          slideType: 'ressources_slide',
        });
      }

      const reportSummary = await automizer.write(reportName);
      this.logger.log(`Report summary: ${JSON.stringify(reportSummary)}`);
      const reportPath = path.join(outputDir, reportName);
      this.logger.log(`Report path: ${reportPath}`);

      return {
        success: true,
        data: {
          reportPath,
        },
      };
    } catch (error) {
      this.logger.error(error);
      if (isErrorWithCause(error)) {
        this.logger.error(
          `Error cause: ${error.cause.message} (${error.cause.code}, ${error.cause.constraint}), Stack ${error.cause.stack}`
        );
      }
      this.logger.error(
        `Error building presentation: ${getErrorMessage(error)}`
      );
      return {
        success: false,
        error: 'PPT_BUILDER_ERROR',
        cause:
          error instanceof Error ? error : new Error(getErrorMessage(error)),
      };
    }
  }

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
    const newWidth =
      (imageElement.position.cy * imageDimensions.width) /
      imageDimensions.height;
    const diffWidth = newWidth - imageElement.position.cx;

    slide.modifyElement(
      imageElement.name,
      mode === 'cover'
        ? [
            (element: XmlElement, relation?: XmlElement) => {
              if (!relation) {
                return;
              }
              return ModifyImageHelper.setRelationTargetCover(
                imageMediaKey,
                presentation
              )(element, relation);
            },
          ]
        : [
            ModifyShapeHelper.updatePosition({
              w: diffWidth,
              x: (-1 * diffWidth) / 2,
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
      `Image element ${imageElementName} size: ${elementPxWidth}x${elementPxHeight} pixels (EMU: ${imageElement.position.cx}x${imageElement.position.cy})`
    );

    adjustChartOptionWithSize?.(chartOption, elementPxWidth, elementPxHeight);

    const buffer = await this.echartsService.renderToPngBuffer({
      width: elementPxWidth,
      height: elementPxHeight,
      options: chartOption,
    });
    const imageFile = `${
      imageFilePrefix ? `${imageFilePrefix}_` : ''
    }${imageElementName}.png`;
    writeFileSync(`${mediaDir}/${imageFile}`, buffer as Uint8Array);
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

  async getPlanData(planId: number): Promise<
    Result<
      {
        plan: Plan;
        collectivite: CollectiviteAvecType;
        axes: PlanNode[];
        sousAxesByAxe: Record<number, PlanNode[]>;
        fiches: FicheWithRelations[];
        planGeneralInfo: ReportPlanGeneralInfo;
        personnalisationReponses: PersonnalisationReponsesPayload;
      },
      | typeof GenerateReportErrorEnum.PLAN_NOT_FOUND
      | typeof GenerateReportErrorEnum.NOT_FOUND
      | typeof GenerateReportErrorEnum.DATABASE_ERROR
    >
  > {
    try {
      const plan = await this.planService.getPlanWithoutPermissionCheck({
        planId,
      });
      if (!plan.success) {
        return {
          success: false,
          error: 'PLAN_NOT_FOUND',
        };
      }

      const collectiviteResult =
        await this.collectiviteService.getCollectiviteAvecType(
          plan.data.collectiviteId
        );
      if (!collectiviteResult.success) {
        return failure(collectiviteResult.error, collectiviteResult.cause);
      }
      const collectivite = collectiviteResult.data;

      const personnalisationReponses =
        await this.personnalisationsService.getPersonnalisationReponses(
          plan.data.collectiviteId
        );

      const fichesResult = await this.fichesService.listFichesQuery({
        collectiviteId: plan.data.collectiviteId,
        filters: {
          planActionIds: [planId],
          withChildren: true,
          withAxesAncestors: true,
        },
        queryOptions: {
          limit: 'all',
        },
      });
      if (!fichesResult.success) {
        return failure(fichesResult.error, fichesResult.cause);
      }
      const fiches = fichesResult.data;

      this.logger.log(`Found ${fiches.count} fiches for plan ${planId}`);

      // Les comptes du plan ne portent que sur les actions, comme ceux de
      // chaque axe (`getAxeGeneralInfo`).
      const actions = fiches.data.filter((fiche) => !fiche.parentId);

      const indicateurs = Array.from(
        new Set(
          actions
            .map((fiche) =>
              fiche.indicateurs?.map((indicateur) => indicateur.id)
            )
            .filter((indicateur) => indicateur)
            .flat()
        )
      );

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

      const budget = this.computeBudgetRules.computeBudget(actions);
      const planGeneralInfo: ReportPlanGeneralInfo = {
        PLAN_ID: planId,
        PLAN_PROGRESS: this.planProgressRules.computeProgress(actions),
        COLLECTIVITE_NOM: collectivite.nom || '',
        PLAN_NOM: plan.data.nom || '',
        PLAN_TYPE: plan.data.type?.type || '',
        REPORT_DATE: new Intl.DateTimeFormat(this.LOCALE, {
          day: 'numeric',
          month: 'long',
          year: 'numeric',
        }).format(new Date()),
        INDICATEURS_COUNT: indicateurs.length,
        FICHES_COUNT: actions.length,
        SOUS_FICHES_COUNT: this.countSousActions(actions, fiches.data),
        AXES_COUNT: axes.length,
        PLAN_BUDGET_FONCTIONNEMENT: this.formatBudget(
          budget.fonctionnement.HT.budgetPrevisionnel.total
        ),
        PLAN_BUDGET_INVESTISSEMENT: this.formatBudget(
          budget.investissement.HT.budgetPrevisionnel.total
        ),
        PLAN_BUDGET_TOTAL: this.formatBudget(
          budget.total.HT.budgetPrevisionnel.total
        ),
      };

      this.logger.log(`Plan general info: ${JSON.stringify(planGeneralInfo)}`);

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
    } catch (error) {
      this.logger.error(`Error getting plan data: ${getErrorMessage(error)}`);
      return {
        success: false,
        error: 'DATABASE_ERROR',
      };
    }
  }

  private async loadCollectiviteLogo(
    mediaDir: string,
    presentation: Automizer,
    logoFileBase64?: string
  ): Promise<
    Result<
      {
        dimensions: { width: number; height: number };
        fileName: string;
      } | null,
      typeof GenerateReportErrorEnum.INVALID_COLLECTIVITE_LOGO
    >
  > {
    if (!logoFileBase64) {
      return success(null);
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

    let metadata: Metadata;
    try {
      metadata = await sharp(logoFilePath).metadata();
    } catch (err) {
      return failure(
        GenerateReportErrorEnum.INVALID_COLLECTIVITE_LOGO,
        new Error(
          `Logo collectivité invalide ou corrompu (fichier: ${logoFileName}). ` +
            `Détail: ${getErrorMessage(err)}`
        )
      );
    }
    const width = metadata.width;
    const height = metadata.height;
    if (width == null || height == null) {
      return failure(
        GenerateReportErrorEnum.INVALID_COLLECTIVITE_LOGO,
        new Error(
          `Impossible de lire les dimensions du logo collectivité (fichier: ${logoFileName}). ` +
            `Largeur: ${width ?? 'indéfinie'}, hauteur: ${
              height ?? 'indéfinie'
            }. ` +
            'Vérifiez que le fichier est une image valide (PNG, JPEG, etc.).'
        )
      );
    }
    const dimensions = { width, height };
    this.logger.log(`Logo dimensions: ${JSON.stringify(dimensions)}`);
    return success({ dimensions, fileName: logoFileName });
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

    const statutCountBy = await this.countByService.countByPropertyWithFiches(
      fiches,
      'statut',
      {}
    );
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

    const statutCountByForEachAxe =
      await this.countByService.countByPropertyForEachAxeWithFiches(
        planGeneralInfo.PLAN_ID,
        fiches,
        'statut',
        {}
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

    const axeGeneralInfo = this.getAxeGeneralInfo(
      planGeneralInfo.PLAN_ID,
      axe,
      sousAxes,
      fiches
    );

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

  private getLastNote(notes: FicheWithRelations['notes']) {
    if (!notes?.length) {
      return null;
    }
    const sortedNotes = [...notes].sort((a, b) =>
      b.dateNote.localeCompare(a.dateNote)
    );
    const lastNote = sortedNotes[0];
    return lastNote;
  }

  private buildFicheInformations(
    mode: FicheInformationsMode,
    fiche: Pick<FicheWithRelations, 'notes'>,
    missingInfo: string
  ): {
    ficheInformations: string;
    ficheInformationsTitle: string;
    missingInfo: string;
  } {
    if (mode !== 'auto_last_note') {
      return {
        ficheInformations:
          "Remplissez ici les informations importantes concernant l'action",
        ficheInformationsTitle: 'Informations importantes',
        missingInfo,
      };
    }

    const lastNote = this.getLastNote(fiche.notes);
    if (!lastNote) {
      return {
        ficheInformations: this.NOT_DEFINED_VALUE,
        ficheInformationsTitle: this.LAST_NOTE_TITLE,
        missingInfo: [missingInfo, this.LAST_NOTE_TITLE]
          .filter(Boolean)
          .join(', '),
      };
    }

    const plainTextNote = this.htmlToPlainText(lastNote.note);
    if (!plainTextNote) {
      return {
        ficheInformations: this.NOT_DEFINED_VALUE,
        ficheInformationsTitle: this.LAST_NOTE_TITLE,
        missingInfo: [missingInfo, this.LAST_NOTE_TITLE]
          .filter(Boolean)
          .join(', '),
      };
    }

    return {
      ficheInformations: this.htmlToPlainText(lastNote.note),
      ficheInformationsTitle: `${
        this.LAST_NOTE_TITLE
      } (${lastNote.dateNote.substring(0, 4)})`,
      missingInfo,
    };
  }

  private getFicheTextReplacementsInfos(
    fiche: FicheWithRelations,
    ficheInformationsMode: FicheInformationsMode
  ): ReportFicheInfo {
    const dateDebut =
      this.formatDate(fiche.dateDebut) ?? this.NOT_DEFINED_VALUE;
    const dateFin = this.formatDate(fiche.dateFin) ?? this.NOT_DEFINED_VALUE;

    const budget = this.computeBudgetRules.computeBudget([fiche]);

    let missingInfo = Object.entries(this.FICHE_PROPERTIES_TO_CHECK)
      .filter(([key, _]) => {
        if (isNil(fiche[key as keyof FicheWithRelations])) {
          return true;
        }
        return false;
      })
      .map(([_, value]) => `${value}`)
      .join(', ');

    const ficheInfoResult = this.buildFicheInformations(
      ficheInformationsMode,
      fiche,
      missingInfo
    );
    missingInfo = ficheInfoResult.missingInfo;

    return {
      FICHE_TITRE: fiche.titre ?? '',
      FICHE_PILOTES: fiche.pilotes
        ? this.formatPilotes(fiche.pilotes)
        : this.NOT_DEFINED_VALUE,
      FICHE_PERIODE: `${dateDebut} -> ${dateFin}`,
      FICHE_DATE_DEBUT: dateDebut,
      FICHE_DATE_FIN: dateFin,
      FICHE_BUDGET_TOTAL: this.formatBudget(
        budget.total.HT.budgetPrevisionnel.total
      ),
      FICHE_BUDGET_FONCTIONNEMENT: this.formatBudget(
        budget.fonctionnement.HT.budgetPrevisionnel.total
      ),
      FICHE_BUDGET_INVESTISSEMENT: this.formatBudget(
        budget.investissement.HT.budgetPrevisionnel.total
      ),
      FICHE_INFORMATIONS_TITLE: ficheInfoResult.ficheInformationsTitle,
      FICHE_INFORMATIONS: ficheInfoResult.ficheInformations,
      MISSING_INFO: missingInfo,
    };
  }

  private formatDate(isoDate: string | null | undefined): string | null {
    return isoDate
      ? DateTime.fromISO(isoDate)
          .setLocale(this.LOCALE)
          .toLocaleString(DateTime.DATE_SHORT)
      : null;
  }

  /**
   * « M. Bouvier » pour un utilisateur, le nom du tag sinon. Au-delà de
   * `maxCount` pilotes, les suivants sont résumés en « +N ».
   */
  private formatPilotes(
    pilotes: NonNullable<FicheWithRelations['pilotes']>,
    maxCount = Infinity
  ): string {
    const names = pilotes
      .slice(0, maxCount)
      .map((pilote) =>
        pilote.prenom && pilote.nomFamille
          ? `${pilote.prenom.substring(0, 1).toUpperCase()}. ${
              pilote.nomFamille
            }`
          : pilote.nom ?? ''
      )
      .join(', ');
    const hiddenCount = pilotes.length - maxCount;
    return hiddenCount > 0 ? `${names} +${hiddenCount}` : names;
  }

  /** Coupe un texte trop long pour son cadre, en finissant par « … ». */
  private truncate(text: string, maxLength: number): string {
    const singleLine = text.replace(/\s+/g, ' ').trim();
    return singleLine.length > maxLength
      ? `${singleLine.substring(0, maxLength - 1).trimEnd()}…`
      : singleLine;
  }

  private htmlToPlainText(html: string): string {
    return convert(html, {
      wordwrap: false,
      selectors: [
        { selector: 'a', options: { ignoreHref: true } },
        { selector: 'img', format: 'skip' },
      ],
    }).trim();
  }

  /**
   * Regroupe les fiches d'un axe comme dans l'app : les actions par ordre
   * alphabétique de titre, chacune avec ses sous-actions triées par date de
   * création. Une sous-action dont l'action parente n'est pas dans la liste
   * n'est pas reprise : elle n'est affichée que sous son action parente.
   */
  private groupFichesForReport(
    fiches: FicheWithRelations[]
  ): { action: FicheWithRelations; sousActions: FicheWithRelations[] }[] {
    const actions = fiches
      .filter((fiche) => !fiche.parentId)
      .sort((a, b) =>
        (a.titre ?? '').localeCompare(b.titre ?? '', this.LOCALE, {
          sensitivity: 'base',
          numeric: true,
        })
      );

    const sousActionsByParentId = new Map<number, FicheWithRelations[]>();
    for (const fiche of fiches) {
      if (fiche.parentId) {
        const siblings = sousActionsByParentId.get(fiche.parentId) ?? [];
        siblings.push(fiche);
        sousActionsByParentId.set(fiche.parentId, siblings);
      }
    }

    return actions.map((action) => ({
      action,
      sousActions: (sousActionsByParentId.get(action.id) ?? []).sort(
        (a, b) =>
          new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime()
      ),
    }));
  }

  /** Nombre de sous-actions de `fiches` rattachées à l'une des `actions`. */
  private countSousActions(
    actions: FicheWithRelations[],
    fiches: FicheWithRelations[]
  ): number {
    const actionIds = new Set(actions.map((action) => action.id));
    return fiches.filter(
      (fiche) => fiche.parentId !== null && actionIds.has(fiche.parentId)
    ).length;
  }

  private getAxeGeneralInfo(
    planId: number,
    axe: PlanNode,
    sousAxes: PlanNode[] | undefined,
    fiches: FicheWithRelations[]
  ): ReportAxeGeneralInfo {
    const axeFilteredFiches = fiches.filter(
      (fiche) =>
        !fiche.parentId &&
        fiche.axes?.some((a) =>
          axe.id === this.countByService.NO_AXE_ID
            ? !fiche.axes?.some((a) => a.parentId === planId)
            : a.id === axe.id
        )
    );
    this.logger.log(`Axe ${axe.nom} has ${axeFilteredFiches.length} fiches`);
    const indicateursCount = new Set(
      axeFilteredFiches
        .map((fiche) => fiche.indicateurs?.map((indicateur) => indicateur.id))
        .filter((indicateur) => indicateur)
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
      SOUS_FICHES_COUNT: this.countSousActions(axeFilteredFiches, fiches),
      AXE_BUDGET_TOTAL: this.formatBudget(
        budget.total.HT.budgetPrevisionnel.total
      ),
      AXE_BUDGET_FONCTIONNEMENT: this.formatBudget(
        budget.fonctionnement.HT.budgetPrevisionnel.total
      ),
      AXE_BUDGET_INVESTISSEMENT: this.formatBudget(
        budget.investissement.HT.budgetPrevisionnel.total
      ),
    };
  }

  /**
   * Le template empile un badge par statut (`<prefix><STATUT>`) : on ne garde
   * que celui du statut de la fiche.
   */
  private deleteNotNeededFicheStatus(
    slide: ISlide,
    allElements: ElementInfo[],
    statut: Statut | null,
    statutElementPrefix: string = ReportTemplateTextsEnum.TXT_FICHE_STATUT_
  ) {
    const allStatuts = {
      ...StatutEnum,
      SANS_STATUT: null,
    };
    const statutElementsToDelete = [...Object.keys(allStatuts)]
      .filter((key) => allStatuts[key as keyof typeof StatutEnum] !== statut)
      .map((key) => `${statutElementPrefix}${key}`);

    statutElementsToDelete.forEach((statutElementToDelete) => {
      if (
        allElements.find((element) => element.name === statutElementToDelete)
      ) {
        slide.removeElement(statutElementToDelete);
      }
    });
  }

  private addFicheInfosSlides(
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
            const ficheUrl = this.getPlanUrlService.getFicheUrl({
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

  /**
   * Slides « Sous-actions » d'une action : `max_sous_actions_per_slide` lignes
   * par slide, « (1/2) » ajouté au titre quand il en faut plusieurs. Les
   * lignes `grp_sous_action_N` inutilisées sont retirées.
   */
  private addFicheSousActionsSlides(
    args: Omit<SlideGenerationArgs, 'slideType'> & {
      ficheTextReplacementsInfo: ReportFicheInfo;
      sousActions: FicheWithRelations[];
    }
  ) {
    const {
      presentation,
      planGeneralInfo,
      ficheTextReplacementsInfo,
      logo,
      template,
      sousActions,
    } = args;
    if (!template.slides.fiche_sous_actions_slide || !sousActions.length) {
      return;
    }

    const rowsPerSlide = template.max_sous_actions_per_slide;
    const sousActionsChunks = chunk(sousActions, rowsPerSlide);

    sousActionsChunks.forEach((sousActionsChunk, iChunk) => {
      const ficheTitre =
        sousActionsChunks.length > 1
          ? `${ficheTextReplacementsInfo.FICHE_TITRE} (${iChunk + 1}/${
              sousActionsChunks.length
            })`
          : ficheTextReplacementsInfo.FICHE_TITRE;

      this.addSlide({
        presentation,
        template,
        planGeneralInfo,
        logo,
        slideType: 'fiche_sous_actions_slide',
        extraTextReplacements: {
          ...ficheTextReplacementsInfo,
          FICHE_TITRE: ficheTitre,
          ...this.getSousActionsTextReplacements(
            sousActionsChunk,
            rowsPerSlide
          ),
        },
        callback: async (slide) => {
          const allElements = await slide.getAllElements();

          for (let row = 1; row <= rowsPerSlide; row++) {
            const sousAction = sousActionsChunk[row - 1];
            if (sousAction) {
              this.deleteNotNeededFicheStatus(
                slide,
                allElements,
                sousAction.statut,
                `${ReportTemplateTextsEnum.TXT_SOUS_ACTION_}${row}_statut_`
              );
              if (!isFicheOnTime(sousAction)) {
                slide.modifyElement(
                  `${ReportTemplateTextsEnum.TXT_SOUS_ACTION_}${row}_date_fin`,
                  this.setTextColor(this.LATE_DATE_COLOR)
                );
              }
              continue;
            }

            const grpElementName = `${ReportTemplateGroupsEnum.GRP_SOUS_ACTION_}${row}`;
            if (this.getElementByName(allElements, grpElementName)) {
              slide.removeElement(grpElementName);
            } else {
              this.logger.log(
                `Sous-action group element not found for ${grpElementName}`
              );
            }
          }
        },
      });
    });
  }

  /** Remplace la couleur de tous les runs d'une forme texte. */
  private setTextColor(hexColor: string) {
    return (element: XmlElement) => {
      const document = element.ownerDocument;
      for (const tagName of ['a:rPr', 'a:endParaRPr']) {
        const runProperties = Array.from(element.getElementsByTagName(tagName));
        for (const runProperty of runProperties) {
          for (const fill of Array.from(
            runProperty.getElementsByTagName('a:solidFill')
          )) {
            runProperty.removeChild(fill);
          }
          const fill = document.createElement('a:solidFill');
          const color = document.createElement('a:srgbClr');
          color.setAttribute('val', hexColor);
          fill.appendChild(color);
          // a:solidFill précède a:latin, a:ea… dans le schéma
          runProperty.insertBefore(fill, runProperty.firstChild);
        }
      }
    };
  }

  /**
   * Textes `{{SOUS_ACTION_N_…}}` des lignes d'une slide « Sous-actions ». Les
   * lignes sans sous-action reçoivent des textes vides (leur groupe est retiré).
   * Titre et description sont coupés pour tenir dans leur cadre (1 et 2 lignes).
   */
  private getSousActionsTextReplacements(
    sousActions: FicheWithRelations[],
    rowsPerSlide: number
  ): Record<string, string> {
    const replacements: Record<string, string> = {};
    for (let row = 1; row <= rowsPerSlide; row++) {
      const sousAction = sousActions[row - 1];
      const prefix = `SOUS_ACTION_${row}_`;
      replacements[`${prefix}TITRE`] = sousAction
        ? this.truncate(
            sousAction.titre || 'Sans titre',
            this.SOUS_ACTION_TITRE_MAX_LENGTH
          )
        : '';
      replacements[`${prefix}DESCRIPTION`] = sousAction?.description
        ? this.truncate(
            this.htmlToPlainText(sousAction.description),
            this.SOUS_ACTION_DESCRIPTION_MAX_LENGTH
          )
        : '';
      replacements[`${prefix}PILOTES`] = sousAction?.pilotes
        ? this.formatPilotes(
            sousAction.pilotes,
            this.SOUS_ACTION_PILOTES_MAX_COUNT
          )
        : '';
      replacements[`${prefix}DATE_FIN`] =
        this.formatDate(sousAction?.dateFin) ?? '';
    }
    return replacements;
  }

  private addFicheIndicateursSlides(
    args: Omit<SlideGenerationArgs, 'slideType'> & {
      ficheTextReplacementsInfo: ReportFicheInfo;
      fiche: FicheWithRelations;
      indicateurChartImageFiles: {
        indicateurId: number;
        imageFile: string;
        totalFilledValeursCount: number;
      }[];
    }
  ) {
    const {
      presentation,
      planGeneralInfo,
      ficheTextReplacementsInfo,
      logo,
      template,
      fiche,
      indicateurChartImageFiles,
    } = args;
    if (!template.slides.fiche_indicateurs_slide) {
      return;
    }

    const ficheIndicateurChartImageFiles =
      fiche.indicateurs
        ?.map((indicateur) => {
          const imageFile = indicateurChartImageFiles.find(
            (imageFile) => imageFile.indicateurId === indicateur.id
          );
          if (!imageFile) {
            this.logger.error(
              `Image file not found for indicateur ${indicateur.id}`
            );
            return null;
          }
          return imageFile;
        })
        .filter((imageFile) => imageFile !== null) ?? [];
    if (ficheIndicateurChartImageFiles.length) {
      const ficheIndicateurChartImageFilesChunks = chunk(
        ficheIndicateurChartImageFiles,
        template.max_fiche_indicateurs_per_slide
      );

      for (const ficheIndicateurChartImageFilesChunk of ficheIndicateurChartImageFilesChunks) {
        this.addSlide({
          presentation,
          template,
          planGeneralInfo,
          logo,
          slideType: 'fiche_indicateurs_slide',
          extraTextReplacements: ficheTextReplacementsInfo,
          callback: async (slide) => {
            const allElements = await slide.getAllElements();

            ficheIndicateurChartImageFilesChunk.forEach(
              (ficheIndicateurChartImageFile, iIndicateur) => {
                const imageName = `${
                  ReportTemplateImagesEnum.IMG_FICHE_INDICATEUR_CHART_
                }${iIndicateur + 1}`;
                const imageElement = this.getImageElement(
                  allElements,
                  imageName
                );
                if (!imageElement) {
                  this.logger.error(`Image element not found for ${imageName}`);
                  return;
                }
                slide.modifyElement(imageName, [
                  (element: XmlElement, relation?: XmlElement) => {
                    if (!relation) {
                      return;
                    }
                    return ModifyImageHelper.setRelationTargetCover(
                      ficheIndicateurChartImageFile.imageFile,
                      presentation
                    )(element, relation);
                  },
                ]);

                if (ficheIndicateurChartImageFile.totalFilledValeursCount > 0) {
                  const noDataTextElementName = `${
                    ReportTemplateTextsEnum.TXT_FICHE_INDICATEUR_NO_DATA_
                  }${iIndicateur + 1}`;
                  const noDataTextElement = this.getElementByName(
                    allElements,
                    noDataTextElementName
                  );
                  if (noDataTextElement) {
                    slide.removeElement(noDataTextElementName);
                  }
                }
              }
            );

            for (
              let iIndicateur = ficheIndicateurChartImageFilesChunk.length;
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
      userId: string;
    }
  ) {
    this.addSlide({
      ...args,
      slideType: 'donnees_territoriales_section_slide',
    });

    const isSnbc3Enabled =
      await this.trajectoireSnbc3FeatureFlag.isTrajectoireSnbc3EnabledForUserId(
        args.userId,
        args.collectivite.id
      );
    const charts = await Promise.all(
      this.getDonneesTerritorialesIndicateurs(isSnbc3Enabled).map(
        async (configuration) => {
          const { chartData } = getIndicateurChartDataOrThrow(
            await this.indicateurChartService.getIndicateurValeursAndChartData({
              collectiviteId: args.collectivite.id,
              identifiantReferentiel: configuration.identifiantReferentiel,
              sources: configuration.sources,
              includeSegmentation: configuration.segmentation,
              trajectoireSnbc3Enabled: isSnbc3Enabled,
            })
          );
          return {
            configuration,
            chartData,
          };
        }
      )
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

  private async getIndicateurChartSize(
    templateConfig: ReportTemplateConfig,
    outputDir: string,
    mediaDir: string
  ): Promise<{ width: number; height: number } | null> {
    if (!templateConfig.slides['fiche_indicateurs_slide']) {
      return null;
    }
    // TODO: find a better way to get the size of the indicateur chart size to be used
    // For now, we generate a temporary presentation to get the size of the indicateur chart

    const automizer = new Automizer({
      templateDir: path.join(__dirname, 'docs'),
      autoImportSlideMasters: false,
      outputDir: outputDir,
      mediaDir,
      removeExistingSlides: true,
      showIntegrityInfo: false,
      assertRelatedContents: true,
      cleanup: false,
      compression: 7,
    });

    let indicateurChartSize: { width: number; height: number } | null = null;

    const presentation = automizer
      .loadRoot(templateConfig.templatePath)
      .load(templateConfig.templatePath, templateConfig.key)
      .addSlide(
        templateConfig.key,
        templateConfig.slides['fiche_indicateurs_slide'],
        async (slide) => {
          const allElements = await slide.getAllElements();
          const firstIndicateurImageName = `${ReportTemplateImagesEnum.IMG_FICHE_INDICATEUR_CHART_}1`;
          const imageElement = this.getImageElement(
            allElements,
            firstIndicateurImageName
          );
          if (!imageElement) {
            this.logger.error(
              `Image element not found ${firstIndicateurImageName}`
            );
            return null;
          }
          indicateurChartSize = {
            width:
              this.emuToPx(imageElement.position.cx ?? 0) *
              this.CHART_SCALE_FACTOR,
            height:
              this.emuToPx(imageElement.position.cy ?? 0) *
              this.CHART_SCALE_FACTOR,
          };
          this.logger.log(
            `Indicateur chart size: ${indicateurChartSize.width}x${indicateurChartSize.height} pixels`
          );
        }
      );

    await presentation.write('indicateurs.pptx');
    return indicateurChartSize;
  }

  private async writeIndicateurChartImageFileAndLoadMedia(args: {
    presentation: Automizer;
    mediaDir: string;
    indicateurId: number;
    collectivite: CollectiviteAvecType;
    personnalisationReponses: PersonnalisationReponsesPayload;
    chartSize: { width: number; height: number };
  }): Promise<{
    indicateurId: number;
    imageFile: string;
    totalFilledValeursCount: number;
  }> {
    const {
      presentation,
      mediaDir,
      indicateurId,
      collectivite,
      personnalisationReponses,
      chartSize,
    } = args;

    const { chartData, indicateurValeurs } = getIndicateurChartDataOrThrow(
      await this.indicateurChartService.getIndicateurValeursAndChartData({
        collectiviteId: collectivite.id,
        indicateurId,
        collectiviteAvecType: collectivite,
        personnalisationReponses,
        includeReferenceValeurs: true,
        includeMoyenne: false,
        includeSegmentation: {},
        chartSize,
      })
    );

    const buffer = await this.echartsService.renderToPngBuffer({
      width: chartSize.width,
      height: chartSize.height,
      options: chartData,
    });
    const imageFile = `indicateur_chart_${indicateurId}.png`;
    writeFileSync(`${mediaDir}/${imageFile}`, buffer as Uint8Array);

    presentation.loadMedia(imageFile);

    return {
      indicateurId,
      imageFile,
      totalFilledValeursCount: indicateurValeurs.totalFilledValeursCount,
    };
  }
}
