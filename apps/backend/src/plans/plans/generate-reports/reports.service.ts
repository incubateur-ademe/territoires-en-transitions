import { CollectiviteAvecType } from '@/backend/collectivites/identite-collectivite.dto';
import CollectivitesService from '@/backend/collectivites/services/collectivites.service';
import { IndicateurChartService } from '@/backend/indicateurs/charts/indicateur-chart.service';
import CrudValeursService from '@/backend/indicateurs/valeurs/crud-valeurs.service';
import { COLLECTIVITE_SOURCE_ID } from '@/backend/indicateurs/valeurs/valeurs.constants';
import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { EchartsService } from '@/backend/utils/echarts/echarts.service';
import { getHorizontalStackedBarChartOption } from '@/backend/utils/echarts/get-horizontal-stackedbar-chart-option.utils';
import { getPieChartOption } from '@/backend/utils/echarts/get-pie-chart-option.utils';
import { getErrorMessage } from '@/backend/utils/get-error-message';
import { MethodResult } from '@/backend/utils/result.type';
import { Injectable, Logger } from '@nestjs/common';
import { EChartsOption } from 'echarts/types/dist/echarts';
import { Response } from 'express';
import { createWriteStream, mkdirSync, rmSync, writeFileSync } from 'fs';
import { imageSizeFromFile } from 'image-size/fromFile';
import { ISizeCalculationResult } from 'image-size/types/interface';
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
import { Readable } from 'stream';
import { CountByService } from '../../fiches/count-by/count-by.service';
import { FicheWithRelations } from '../../fiches/list-fiches/fiche-action-with-relations.dto';
import ListFichesService from '../../fiches/list-fiches/list-fiches.service';
import { StatutEnum } from '../../fiches/shared/models/fiche-action.table';
import { Plan, PlanNode } from '../plans.schema';
import { PlanService } from '../plans.service';
import { PlanProgressRules } from '../progress/plan-progress.rules';
import { GenerateReportErrorType } from './generate-report.errors';
import { ReportGenerationRequest } from './generate-report.request';
import { ReportPlanGeneralInfo } from './report-plan-general-info.dto';
import { ReportTemplateConfig } from './report-template-config.dto';
import {
  ReportTemplateImagesEnum,
  ReportTemplateImagesType,
} from './report-template-images.enum';
import { ReportTemplateSlidesType } from './report-template-slides.enum';
import { ReportTemplatesType } from './report-templates.enum';
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  /** PowerPoint EMU precision (1 px = 9525 EMU) */
  private readonly EMU_PER_PX = 914400 / 96; // 9525

  /** Convert EMU → pixels */
  private emuToPx(emu: number): number {
    return Math.round(emu / this.EMU_PER_PX);
  }

  private pxToEmu(px: number): number {
    return px * this.EMU_PER_PX;
  }

  private readonly LOCALE = 'fr-FR';
  private readonly CHART_SCALE_FACTOR = 2;
  private readonly LOGO_FILE_NAME = 'logo.png';
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
        summary_slide: 5,
        progression_slide: 6,
        fiche_summary_no_picture_slide: 18,
      },
    },
  };

  constructor(
    private readonly fichesService: ListFichesService,
    private readonly echartsService: EchartsService,
    private readonly countByService: CountByService,
    private readonly planService: PlanService,
    private readonly collectiviteService: CollectivitesService,
    private readonly planProgressRules: PlanProgressRules,
    private readonly indicateurValeursService: CrudValeursService,
    private readonly indicateurChartService: IndicateurChartService
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
    imageElementName: ReportTemplateImagesType,
    chartOption: EChartsOption,
    mode: 'cover' | 'resize'
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
    this.logger.log(`Image element size: ${elementPxWidth}x${elementPxHeight}`);

    const buffer = await this.echartsService.renderToPngBuffer({
      name: ReportTemplateImagesEnum.IMG_PLAN_PROGRESS_BY_AXE_CHART,
      format: 'png',
      width: elementPxWidth,
      height: elementPxHeight,
      options: chartOption,
    });
    const imageFile = `${imageElementName}.png`;
    writeFileSync(`${mediaDir}/${imageFile}`, buffer as Uint8Array);
    presentation.loadMedia(imageFile);

    this.replaceImageInSlide(
      slide,
      presentation,
      allElements,
      imageElementName,
      imageFile,
      { width: elementPxWidth, height: elementPxHeight },
      mode
    );
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
        fiches: FicheWithRelations[];
        planGeneralInfo: ReportPlanGeneralInfo;
      },
      GenerateReportErrorType
    >
  > {
    const plan = await this.planService.findById(planId, user);
    if (!plan.success) {
      return {
        success: false,
        error: 'PLAN_NOT_FOUND',
      };
    }

    const collectivite = await this.collectiviteService.getCollectiviteAvecType(
      plan.data.collectiviteId
    );

    const fiches = await this.fichesService.listFichesQuery(
      plan.data.collectiviteId,
      {
        planActionIds: [planId],
      },
      {
        limit: 'all',
      }
    );

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
      AXES_COUNT: axes.length,
    };

    this.logger.log(`Plan general info: ${JSON.stringify(planGeneralInfo)}`);

    return {
      success: true,
      data: {
        collectivite: collectivite,
        plan: plan.data,
        axes: axes,
        fiches: fiches.data,
        planGeneralInfo,
      },
    };
  }

  /**
   *
   * @param url
   */
  async downloadFile(url: string, targetFilePath: string) {
    const res = await fetch(url);

    if (!res.ok) {
      throw new Error(`HTTP error! ${res.status}`);
    }

    if (!res.body) {
      throw new Error('Response body is null');
    }

    const fileStream = createWriteStream(targetFilePath);

    // Read from web ReadableStream and write to file
    //const reader = res.body.getReader();

    // @ts-ignore: TODO
    Readable.fromWeb(res.body as unknown as ReadableStream<any>).pipe(
      fileStream
    );

    // Wait for file stream to finish
    await new Promise<void>((resolve, reject) => {
      fileStream.on('finish', resolve);
      fileStream.on('error', reject);
    });

    console.log('Download completed!');
  }

  private async loadCollectiviteLogo(
    mediaDir: string,
    presentation: Automizer
  ) {
    const logoFilePath = path.join(mediaDir, this.LOGO_FILE_NAME);
    await this.downloadFile(
      'https://www.agglopolys.fr/images/GBI_AGGLO/logo-agglopolys.png',
      logoFilePath
    );
    presentation.loadMedia(this.LOGO_FILE_NAME);

    const dimensions = await imageSizeFromFile(logoFilePath);
    this.logger.log(`Logo dimensions: ${JSON.stringify(dimensions)}`);
    return dimensions;
  }

  private addSlide(args: {
    presentation: Automizer;
    planGeneralInfo: ReportPlanGeneralInfo;
    template: ReportTemplateConfig;
    slideType: ReportTemplateSlidesType;
    logoDimensions: ISizeCalculationResult;
    callback?: (slide: ISlide) => Promise<void>;
  }) {
    const {
      presentation,
      planGeneralInfo,
      template,
      slideType,
      logoDimensions,
      callback,
    } = args;
    presentation.addSlide(
      template.key,
      template.slides[slideType],
      async (slide) => {
        await callback?.(slide);

        const allElements = await slide.getAllElements();

        this.replaceImageInSlide(
          slide,
          presentation,
          allElements,
          ReportTemplateImagesEnum.IMG_COLLECTIVITE_LOGO,
          this.LOGO_FILE_NAME,
          logoDimensions,
          'resize'
        );

        // End with text replacements
        await this.replaceTextInSlide(slide, planGeneralInfo);
      }
    );
  }

  private async addPlanSummarySlide(args: {
    presentation: Automizer;
    mediaDir: string;
    fiches: FicheWithRelations[];
    planGeneralInfo: ReportPlanGeneralInfo;
    template: ReportTemplateConfig;
    logoDimensions: ISizeCalculationResult;
  }) {
    const {
      presentation,
      mediaDir,
      fiches,
      planGeneralInfo,
      template,
      logoDimensions,
    } = args;

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
      logoDimensions,
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
    logoDimensions: ISizeCalculationResult;
  }) {
    const {
      presentation,
      mediaDir,
      fiches,
      planGeneralInfo,
      template,
      logoDimensions,
    } = args;

    if (!template.slides.progression_slide) {
      return;
    }

    const statutCountByForEachAxe =
      await this.countByService.countByPropertyForEachAxeWithFiches(
        planGeneralInfo.PLAN_ID,
        fiches,
        'statut',
        {}
      );
    const orderedStatuts: string[] = [
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
      logoDimensions,
      slideType: 'progression_slide',
      callback: async (slide) => {
        const allElements = await slide.getAllElements();
        const imageElement = this.getImageElement(
          allElements,
          ReportTemplateImagesEnum.IMG_PLAN_PROGRESS_BY_AXE_CHART
        );
        if (!imageElement) {
          return;
        }

        const elementPxWidth =
          this.emuToPx(imageElement.position.cx) * this.CHART_SCALE_FACTOR;
        const elementPxHeight =
          this.emuToPx(imageElement.position.cy) * this.CHART_SCALE_FACTOR;
        this.logger.log(
          `Image element size: ${elementPxWidth}x${elementPxHeight}`
        );

        const buffer = await this.echartsService.renderToPngBuffer({
          name: ReportTemplateImagesEnum.IMG_PLAN_PROGRESS_BY_AXE_CHART,
          format: 'png',
          width: elementPxWidth,
          height: elementPxHeight,
          options: statutCountByForEachAxeChartOption,
        });
        const imageFile = `${ReportTemplateImagesEnum.IMG_PLAN_PROGRESS_BY_AXE_CHART}.png`;
        writeFileSync(`${mediaDir}/${imageFile}`, buffer as Uint8Array);
        presentation.loadMedia(imageFile);

        this.replaceImageInSlide(
          slide,
          presentation,
          allElements,
          ReportTemplateImagesEnum.IMG_PLAN_PROGRESS_BY_AXE_CHART,
          imageFile,
          { width: elementPxWidth, height: elementPxHeight },
          'cover'
        );
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
    request: ReportGenerationRequest,
    user: AuthenticatedUser,
    res: Response
  ) {
    const reportResult = await this.generatePlanReport(request, user);
    if (!reportResult.success) {
      return reportResult;
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

  async generatePlanReport(
    request: ReportGenerationRequest,
    user: AuthenticatedUser
  ): Promise<
    MethodResult<
      { reportName: string; reportPath: string; outputDir: string },
      GenerateReportErrorType
    >
  > {
    let mediaDir = '';
    let outputDir = '';
    let reportPath = '';
    let reportName = '';
    let error: GenerateReportErrorType | undefined;
    this.logger.log(
      `Generating plan report for collectivité ${request.collectiviteId} and plan ${request.planId} with template ${request.templateKey}`
    );

    try {
      const templateConfig = this.SLIDE_TEMPLATES_CONFIG[request.templateKey];

      const planDataResult = await this.getPlanData(request.planId, user);
      if (!planDataResult.success) {
        return {
          success: false,
          error: planDataResult.error,
        };
      }
      const { axes, fiches, planGeneralInfo } = planDataResult.data;

      const generationId = crypto.randomUUID();
      mediaDir = path.join(__dirname, `media/${generationId}`);
      outputDir = path.join(__dirname, `output/${generationId}`);
      mkdirSync(mediaDir, { recursive: true });
      mkdirSync(outputDir, { recursive: true });

      const automizer = new Automizer({
        templateDir: path.join(__dirname, 'docs'), // dossier où se trouve ton pptx
        autoImportSlideMasters: true,
        outputDir: outputDir,
        //'/Users/thibautdusanter/Developer/ademe/territoires-en-transitions/', // dossier de sortie
        mediaDir,
        removeExistingSlides: true,
        showIntegrityInfo: false, // WARNING: changing this to true throw some weird errors on generated images not beeing found
        assertRelatedContents: true,
        cleanup: true,
        verbosity: 1,
        statusTracker: (status: StatusTracker) => {
          this.logger.log(status.info + ' (' + status.share + '%)');
        },
      });

      const presentation = automizer
        .loadRoot(templateConfig.templatePath)
        .load(templateConfig.templatePath, templateConfig.key);

      const logoDimensions = await this.loadCollectiviteLogo(
        mediaDir,
        presentation
      );

      this.addSlide({
        presentation,
        planGeneralInfo,
        template: templateConfig,
        logoDimensions,
        slideType: 'title_slide',
      });
      this.addSlide({
        presentation,
        planGeneralInfo,
        template: templateConfig,
        logoDimensions,
        slideType: 'table_of_contents_slide',
        callback: async (slide) => {
          await this.replaceTextInSlide(slide, {
            AXE_NOMS: axes.map((axe) => axe.nom ?? '').join('\n'),
          });
        },
      });
      this.addSlide({
        presentation,
        planGeneralInfo,
        template: templateConfig,
        logoDimensions,
        slideType: 'overview_section_slide',
      });

      await this.addPlanSummarySlide({
        presentation,
        mediaDir,
        fiches,
        planGeneralInfo,
        template: templateConfig,
        logoDimensions,
      });

      await this.addPlanProgressSlide({
        presentation,
        mediaDir,
        fiches,
        planGeneralInfo,
        template: templateConfig,
        logoDimensions,
      });

      /*  presentation.addSlide('template_bilan.pptx', 12, async (slide) => {
      const descriptions: string[] = fiches.data
        .filter((fiche) => fiche.description)
        .map((fiche) => fiche.description ?? '');
      const data = {
        body: [
          <TableRow>{
            label: 'item test r1',
            values: [descriptions[0], 10, 16],
            styles: [
              null,
              <TableRowStyle>{
                color: {
                  type: 'srgbClr',
                  value: 'cccccc',
                },
                size: 1400,
              },
            ],
          },
          { label: 'item test r2', values: [descriptions[1], 12, 18] },
          {
            label: 'item test r3',
            values: [descriptions[3], 14, 13],
          },
          {
            label: 'item test 4',
            values: [descriptions[4], 14, 13],
          },
          {
            label: 'item test 5',
            values: [descriptions[5], 14, 13],
          },
        ],
      };

      slide.modifyElement('table_avancement_plan', [
        modify.setTableData(data),
        modify.adjustHeight(data),
        modify.adjustWidth(data),
      ]);
    });*/

      for (const fiche of fiches) {
        const indicateurValeurs = await Promise.all(
          fiche.indicateurs?.map((indicateur) =>
            this.indicateurValeursService
              .getIndicateurValeursGroupees({
                collectiviteId: fiche.collectiviteId,
                indicateurIds: [indicateur.id],
              })
              .then((result) => result.indicateurs[0])
          ) ?? []
        );

        if (indicateurValeurs.length) {
          for (const indicateurValeur of indicateurValeurs) {
            if (
              indicateurValeur.sources[COLLECTIVITE_SOURCE_ID]?.valeurs
                ?.length &&
              indicateurValeur.sources[COLLECTIVITE_SOURCE_ID].valeurs.length >=
                2
            ) {
              this.logger.log(JSON.stringify(indicateurValeur));
              const chartData = await this.indicateurChartService.getChartData(
                indicateurValeur
              );
              this.logger.log(JSON.stringify(chartData));
            }
          }
        }

        presentation
          // 1 = index du slide source (1-based)
          .addSlide(templateConfig.key, 18, async (slide) => {
            const txtElementIds = await slide.getAllTextElementIds();

            const statusElementsToHide = Object.keys(StatutEnum)
              .filter(
                (key) =>
                  StatutEnum[key as keyof typeof StatutEnum] !== fiche.statut
              )
              .map((key) => `txt_fiche_statut_${key}`);

            statusElementsToHide.forEach((statusElementToHide) => {
              if (txtElementIds.includes(statusElementToHide)) {
                slide.removeElement(statusElementToHide);
              }
            });

            // WARNING: we have to do this at the end otherwise removing elements will not work
            await this.replaceTextInSlide(slide, {
              ...planGeneralInfo,
              FICHE_TITRE: fiche.titre ?? '',
            });

            //slide.
            /*
          slide.modifyElement(
            'txt_description',
            modify.setMultiText([
              {
                paragraph: {
                  bullet: true,
                  level: 0,
                  marginLeft: 41338,
                  indent: -87325,
                  alignment: 'l',
                },
                textRuns: [
                  {
                    text: fiche.description ?? '',
                    style: {
                      isItalics: true,
                      color: {
                        type: 'srgbClr',
                        value: 'CCCCCC',
                      },
                    },
                  },
                ],
              },
            ])
          );

          slide.modifyElement('Grafik 5', [
            // Override the original media source of element 'imagePNG'
            // by an imported file:
            // @ts-ignore
            ModifyImageHelper.setRelationTargetCover(imageFile, presentation),
          ]);

          slide.modifyElement(
            'txt_budget_effectif_fill_link',
            modify.addHyperlink(
              `https://app.territoiresentransitions.fr/collectivite/${
                fiche.collectiviteId
              }/plans/${fiche.plans ? fiche.plans[0].id : ''}/fiches/${
                fiche.id
              }`
            )
          );

          slide.generate((pptxGenJSSlide) => {
            pptxGenJSSlide.addText(`External Link`, {
              hyperlink: { url: 'https://github.com' },
              x: 1,
              y: 1,
              w: 2.5,
              h: 0.5,
              fontSize: 12,
            });
          });*/
          });
      }

      reportName = this.getReportName(planGeneralInfo);
      const reportSummary = await automizer.write(reportName);
      this.logger.log(`Report summary: ${JSON.stringify(reportSummary)}`);
      reportPath = path.join(outputDir, reportName);
      this.logger.log(`Report path: ${reportPath}`);
    } catch (error) {
      this.logger.error(`Error generating plan report: ${error}`);
      error = GenerateReportErrorType.SERVER_ERROR;
    } finally {
      if (mediaDir) {
        //rmSync(mediaDir, { recursive: true });
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
