import { AuthenticatedUser } from '@/backend/users/models/auth.models';
import { EchartsService } from '@/backend/utils/echarts/echarts.service';
import { getHorizontalStackedBarChartOption } from '@/backend/utils/echarts/get-horizontal-stackedbar-chart-option.utils';
import { getPieChartOption } from '@/backend/utils/echarts/get-pie-chart-option.utils';
import { MethodResult } from '@/backend/utils/result.type';
import { Injectable, Logger } from '@nestjs/common';
import { mkdirSync, writeFileSync } from 'fs';
import * as path from 'path';
import { Automizer, ISlide, modify } from 'pptx-automizer';
import { CountByService } from '../../fiches/count-by/count-by.service';
import { FicheWithRelations } from '../../fiches/list-fiches/fiche-action-with-relations.dto';
import ListFichesService from '../../fiches/list-fiches/list-fiches.service';
import { StatutEnum } from '../../fiches/shared/models/fiche-action.table';
import { Plan } from '../plans.schema';
import { PlanService } from '../plans.service';
import { GenerateReportErrorType } from './generate-report.errors';
import { ReportGenerationRequest } from './generate-report.request';
import { ReportPlanGeneralInfo } from './report-plan-general-info.dto';
import { ReportTemplateConfig } from './report-template-config.dto';
import { ReportTemplatesType } from './report-templates.enum';
@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  private readonly LOCALE = 'fr-FR';
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
    private readonly planService: PlanService
  ) {}

  private async replaceTextInSlide(slide: ISlide, replacementsObj: object) {
    const textElementIds = await slide.getAllTextElementIds();

    const replacements = Object.entries(replacementsObj).map(
      ([key, value]) => ({
        replace: key,
        by: { text: value.toString() },
      })
    );
    console.log('replacements', replacements);

    // On applique les remplacements sur chaque élément texte
    textElementIds.forEach((elementId) => {
      slide.modifyElement(elementId, [
        modify.replaceText(replacements), // remplace les {{...}} dans cet élément :contentReference[oaicite:2]{index=2}
      ]);
    });
  }

  async getPlanData(
    planId: number,
    user: AuthenticatedUser
  ): Promise<
    MethodResult<
      {
        plan: Plan;
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

    const planGeneralInfo: ReportPlanGeneralInfo = {
      PLAN_NOM: plan.data.nom || '',
      PLAN_TYPE: plan.data.type?.type || '',
      REPORT_DATE: new Intl.DateTimeFormat(this.LOCALE, {
        day: 'numeric',
        month: 'long',
        year: 'numeric',
      }).format(new Date()),
      INDICATEURS_COUNT: indicateursCount,
      FICHE_COUNT: fiches.count,
      AXES_COUNT: plan.data.axes.filter((axe) => axe.parent === planId).length,
    };

    this.logger.log(`Plan general info: ${JSON.stringify(planGeneralInfo)}`);

    return {
      success: true,
      data: {
        plan: plan.data,
        fiches: fiches.data,
        planGeneralInfo,
      },
    };
  }

  async generatePlanReport(
    request: ReportGenerationRequest,
    user: AuthenticatedUser
  ): Promise<MethodResult<void, GenerateReportErrorType>> {
    let mediaDir = '';
    this.logger.log(
      `Generating plan report for collectivité ${request.collectiviteId} and plan ${request.planId} with template ${request.templateKey}`
    );

    const templateConfig = this.SLIDE_TEMPLATES_CONFIG[request.templateKey];

    const planDataResult = await this.getPlanData(request.planId, user);
    if (!planDataResult.success) {
      return {
        success: false,
        error: planDataResult.error,
      };
    }

    const { plan, fiches, planGeneralInfo } = planDataResult.data;

    const generationId = crypto.randomUUID();
    mediaDir = path.join(__dirname, `media/${generationId}`);
    mkdirSync(mediaDir, { recursive: true });

    const statutCountByForEachAxe =
      await this.countByService.countByPropertyForEachAxeWithFiches(
        request.planId,
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

    const statutCountBy = await this.countByService.countByPropertyWithFiches(
      fiches,
      'statut',
      {}
    );

    const statutPieChartOption = getPieChartOption({
      displayItemsLabel: true,
      countByResponse: statutCountBy,
    });

    const buffer = await this.echartsService.renderToPngBuffer({
      name: 'test',
      format: 'png',
      width: 1200,
      height: 600,
      options: statutCountByForEachAxeChartOption,
    });
    const imageFile = `test.png`;
    writeFileSync(`${mediaDir}/${imageFile}`, buffer as Uint8Array);

    const automizer = new Automizer({
      templateDir: path.join(__dirname, 'docs'), // dossier où se trouve ton pptx
      outputDir:
        '/Users/thibautdusanter/Developer/ademe/territoires-en-transitions/', // dossier de sortie
      mediaDir,
    });

    const presentation = automizer
      .loadRoot('blank.pptx')
      .load(templateConfig.templatePath, templateConfig.key)
      .loadMedia(imageFile);

    presentation
      // 1 = index du slide source (1-based)
      .addSlide(
        templateConfig.key,
        templateConfig.slides.title_slide,
        async (slide) => {
          await this.replaceTextInSlide(slide, planGeneralInfo);
        }
      );

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

    fiches.forEach((fiche, index) => {
      presentation
        // 1 = index du slide source (1-based)
        .addSlide(templateConfig.key, 18, async (slide) => {
          const txtElementIds = await slide.getAllTextElementIds();
          await this.replaceTextInSlide(slide, {
            ...planGeneralInfo,
            FICHE_TITRE: fiche.titre ?? '',
          });

          slide.removeElement('Textfeld 5');

          const statusElementsToHide = Object.keys(StatutEnum)
            .filter(
              (key) =>
                StatutEnum[key as keyof typeof StatutEnum] !== fiche.statut
            )
            .map((key) => `txt_fiche_statut_${key}`);
          console.log('statusElementToHide', statusElementsToHide);
          statusElementsToHide.forEach((statusElementToHide) => {
            if (txtElementIds.includes(statusElementToHide)) {
              slide.removeElement(statusElementToHide);
            }
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
    });

    await automizer
      .write('actions-deck.pptx') // nom du fichier de sortie
      .then(() => {
        console.log('Deck généré : actions-deck.pptx');
      });

    return {
      success: true,
      data: undefined,
    };
  }
}
