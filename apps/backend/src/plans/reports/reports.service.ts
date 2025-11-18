import { Injectable, Logger } from '@nestjs/common';
import * as path from 'path';
import { Automizer, modify } from 'pptx-automizer';
import ListFichesService from '../fiches/list-fiches/list-fiches.service';
import { ReportGenerationRequest } from './report-generation.request';

@Injectable()
export class ReportsService {
  private readonly logger = new Logger(ReportsService.name);

  constructor(private readonly fichesService: ListFichesService) {}

  async generatePlanReport(request: ReportGenerationRequest): Promise<void> {
    this.logger.log(
      `Generating plan report for collectivité ${request.collectiviteId} and plan ${request.planId}`
    );

    const fiches = await this.fichesService.listFichesQuery(
      request.collectiviteId,
      {
        planActionIds: [request.planId],
      },
      {
        limit: 'all',
      }
    );

    this.logger.log(`Found ${fiches.count} fiches for plan ${request.planId}`);

    const automizer = new Automizer({
      templateDir: path.join(__dirname, 'docs'), // dossier où se trouve ton pptx
      outputDir:
        '/Users/thibautdusanter/Developer/ademe/territoires-en-transitions/', // dossier de sortie
    });

    const presentation = automizer
      .loadRoot('blank.pptx')
      .load('template_bilan.pptx');

    fiches.data.forEach((fiche, index) => {
      presentation
        // 1 = index du slide source (1-based)
        .addSlide('template_bilan.pptx', 13, async (slide) => {
          // Ici tu manipules les shapes du slide
          // L'API exacte de pptx-automizer dépend des versions, mais l’idée ressemble à ceci :

          const textElementIds = await slide.getAllTextElementIds();

          const replacements = [
            {
              // va chercher {{ACTION_TITLE}} dans les zones de texte
              replace: 'ACTION_TITLE',
              by: { text: fiche.titre ?? '' },
            },
            {
              replace: 'ACTION_DESCRIPTION',
              by: { text: fiche.description ?? '' },
            },
          ];

          // On applique les remplacements sur chaque élément texte
          textElementIds.forEach((elementId) => {
            slide.modifyElement(elementId, [
              modify.replaceText(replacements), // remplace les {{...}} dans cet élément :contentReference[oaicite:2]{index=2}
            ]);
          });

          return slide;
        });
    });

    await automizer
      .write('actions-deck.pptx') // nom du fichier de sortie
      .then(() => {
        console.log('Deck généré : actions-deck.pptx');
      });
  }
}
