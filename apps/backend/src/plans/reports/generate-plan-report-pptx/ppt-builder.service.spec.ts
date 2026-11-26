import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { failure, success } from '@tet/backend/utils/result.type';
import { IndicateurSourceEnum } from '@tet/domain/indicateurs';
import { FicheWithRelations } from '@tet/domain/plans';
import { mkdtempSync, rmSync, writeFileSync } from 'fs';
import { DomUtils, parseDocument } from 'htmlparser2';
import { tmpdir } from 'os';
import * as path from 'path';
import { Automizer } from 'pptx-automizer';
import sharp from 'sharp';
import { onTestFinished } from 'vitest';
import { PptBuilderService } from './ppt-builder.service';
import { ReportTemplateImagesEnum } from './report-template-images.enum';

describe('PptBuilderService', () => {
  let pptBuilderService: PptBuilderService;

  beforeEach(async () => {
    const moduleRef = await Test.createTestingModule({
      providers: [PptBuilderService],
    })
      .useMocker(() => ({}))
      .compile();

    pptBuilderService = moduleRef.get(PptBuilderService);
  });

  it('insère la nouvelle image du graphique dans le PowerPoint généré', async () => {
    const mediaDir = mkdtempSync(path.join(tmpdir(), 'plan-report-'));
    onTestFinished(() => rmSync(mediaDir, { recursive: true, force: true }));
    const imageFile = 'graphique.png';
    const imageBuffer = await sharp({
      create: { width: 2, height: 2, channels: 3, background: '#000091' },
    })
      .png()
      .toBuffer();
    writeFileSync(path.join(mediaDir, imageFile), imageBuffer);

    const presentation = new Automizer({
      templateDir: path.join(__dirname, 'docs'),
      mediaDir,
      removeExistingSlides: true,
      autoImportSlideMasters: true,
      cleanup: true,
      verbosity: 0,
    })
      .loadRoot('template_bilan.pptx')
      .load('template_bilan.pptx', 'bilan')
      .loadMedia(imageFile);
    const imageName = ReportTemplateImagesEnum.IMG_PLAN_PROGRESS_BY_AXE_CHART;

    presentation.addSlide('bilan', 5, async (slide) => {
      pptBuilderService['replaceImageInSlide'](
        slide,
        presentation,
        await slide.getAllElements(),
        imageName,
        imageFile,
        { width: 2, height: 2 },
        'cover'
      );
    });

    // Vérifier le contenu sérialisé : la présence du PNG dans l'archive ne
    // suffit pas si la diapositive référence encore l'image du modèle.
    const archive = await presentation.getJSZip();
    const slides = archive.file(/^ppt\/slides\/slide\d+\.xml$/);
    expect(slides).toHaveLength(1);
    const slide = parseDocument(await slides[0].async('string'), {
      xmlMode: true,
    });
    const image = DomUtils.findOne(
      (element) =>
        element.name === 'p:pic' &&
        DomUtils.findOne(
          (child) =>
            child.name === 'p:cNvPr' && child.attribs.name === imageName,
          element.children
        ) !== null,
      slide.children
    );
    const relationshipId = DomUtils.findOne(
      (element) => element.name === 'a:blip',
      image?.children ?? []
    )?.attribs['r:embed'];
    expect(relationshipId).toBeDefined();

    const relationships = parseDocument(
      (await archive
        .file(`ppt/slides/_rels/${path.basename(slides[0].name)}.rels`)
        ?.async('string')) ?? '',
      { xmlMode: true }
    );
    const target = DomUtils.findOne(
      (element) =>
        element.name === 'Relationship' &&
        element.attribs.Id === relationshipId,
      relationships.children
    )?.attribs.Target;

    expect(target).toBe(`../media/${imageFile}`);
    expect(
      await archive.file(`ppt/media/${imageFile}`)?.async('nodebuffer')
    ).toEqual(imageBuffer);
  });

  it('insère le graphique propre à chaque indicateur dans les diapositives indicateurs de fiche', async () => {
    const mediaDir = mkdtempSync(path.join(tmpdir(), 'plan-report-'));
    onTestFinished(() => rmSync(mediaDir, { recursive: true, force: true }));
    const indicateurImageFiles = [
      { indicateurId: 101, imageFile: 'indicateur_chart_101.png' },
      { indicateurId: 102, imageFile: 'indicateur_chart_102.png' },
    ];
    for (const { imageFile } of indicateurImageFiles) {
      const imageBuffer = await sharp({
        create: {
          width: 2,
          height: 2,
          channels: 3,
          background: imageFile.endsWith('101.png') ? '#000091' : '#e1000f',
        },
      })
        .png()
        .toBuffer();
      writeFileSync(path.join(mediaDir, imageFile), imageBuffer);
    }

    const presentation = new Automizer({
      templateDir: path.join(__dirname, 'docs'),
      mediaDir,
      removeExistingSlides: true,
      autoImportSlideMasters: true,
      cleanup: true,
      verbosity: 0,
    })
      .loadRoot('template_bilan.pptx')
      .load('template_bilan.pptx', 'bilan');
    for (const { imageFile } of indicateurImageFiles) {
      presentation.loadMedia(imageFile);
    }

    pptBuilderService['addFicheIndicateursSlides']({
      presentation,
      planGeneralInfo: {} as never,
      ficheTextReplacementsInfo: {} as never,
      logo: null,
      template: {
        key: 'bilan',
        slides: { fiche_indicateurs_slide: 13 },
        max_fiche_indicateurs_per_slide: 1,
      } as never,
      fiche: {
        indicateurs: indicateurImageFiles.map(({ indicateurId }) => ({
          id: indicateurId,
        })),
      } as never,
      indicateurChartImageFiles: indicateurImageFiles.map((file) => ({
        ...file,
        totalFilledValeursCount: 1,
      })),
    });

    const archive = await presentation.getJSZip();
    const slides = archive.file(/^ppt\/slides\/slide\d+\.xml$/);
    expect(slides).toHaveLength(indicateurImageFiles.length);

    const slideTargets = await Promise.all(
      slides.map(async (slideFile) => {
        const slideXml = parseDocument(await slideFile.async('string'), {
          xmlMode: true,
        });
        const image = DomUtils.findOne(
          (element) =>
            element.name === 'p:pic' &&
            DomUtils.findOne(
              (child) =>
                child.name === 'p:cNvPr' &&
                child.attribs.name ===
                  `${ReportTemplateImagesEnum.IMG_FICHE_INDICATEUR_CHART_}1`,
              element.children
            ) !== null,
          slideXml.children
        );
        const relationshipId = DomUtils.findOne(
          (element) => element.name === 'a:blip',
          image?.children ?? []
        )?.attribs['r:embed'];
        const relationships = parseDocument(
          (await archive
            .file(`ppt/slides/_rels/${path.basename(slideFile.name)}.rels`)
            ?.async('string')) ?? '',
          { xmlMode: true }
        );
        return DomUtils.findOne(
          (element) =>
            element.name === 'Relationship' &&
            element.attribs.Id === relationshipId,
          relationships.children
        )?.attribs.Target;
      })
    );

    expect([...slideTargets].sort()).toEqual(
      indicateurImageFiles.map(({ imageFile }) => `../media/${imageFile}`)
    );
  });

  describe('sortFichesForReport', () => {
    const fiche = (
      overrides: Partial<FicheWithRelations>
    ): FicheWithRelations =>
      ({
        titre: null,
        parentId: null,
        createdAt: '2024-01-01T00:00:00.000Z',
        ...overrides,
      } as FicheWithRelations);

    it('trie les actions de premier niveau par titre, alphabétiquement', () => {
      const fiches = [
        fiche({ id: 1, titre: 'Action C' }),
        fiche({ id: 2, titre: 'Action A' }),
        fiche({ id: 3, titre: 'Action B' }),
      ];

      const result = (pptBuilderService as any).sortFichesForReport(fiches);

      expect(result.map((f: FicheWithRelations) => f.id)).toEqual([2, 3, 1]);
    });

    it('place chaque sous-action juste après sa fiche parente, triées par date de création (pas par titre)', () => {
      const fiches = [
        fiche({ id: 1, titre: 'Action A' }),
        fiche({ id: 2, titre: 'Action B' }),
        // Sous-actions de l'action B, volontairement pas dans l'ordre alphabétique ni d'insertion
        fiche({
          id: 21,
          titre: 'Z sous-action',
          parentId: 2,
          createdAt: '2024-01-02T00:00:00.000Z',
        }),
        fiche({
          id: 22,
          titre: 'A sous-action',
          parentId: 2,
          createdAt: '2024-01-01T00:00:00.000Z',
        }),
      ];

      const result = (pptBuilderService as any).sortFichesForReport(fiches);

      expect(result.map((f: FicheWithRelations) => f.id)).toEqual([
        1, 2, 22, 21,
      ]);
    });

    it('inclut les sous-actions orphelines (dont la fiche parente est absente de la liste)', () => {
      const fiches = [
        fiche({ id: 1, titre: 'Action A' }),
        fiche({ id: 99, titre: 'Sous-action orpheline', parentId: 999 }),
      ];

      const result = (pptBuilderService as any).sortFichesForReport(fiches);

      expect(result.map((f: FicheWithRelations) => f.id)).toEqual([1, 99]);
    });
  });

  describe('données territoriales : source de la trajectoire', () => {
    type ChartArgs = {
      identifiantReferentiel: string;
      sources: { sourceId: string }[];
      trajectoireSnbc3Enabled?: boolean;
    };

    /** Arguments de chaque lecture de graphe des données territoriales. */
    const chartCalls = async (isSnbc3Enabled: boolean) => {
      const service = pptBuilderService as any;
      const isEnabled = vi.fn().mockResolvedValue(isSnbc3Enabled);
      service.trajectoireSnbc3FeatureFlag.isTrajectoireSnbc3EnabledForUserId =
        isEnabled;
      const getChartData = vi
        .fn()
        .mockResolvedValue(success({ chartData: {} }));
      service.indicateurChartService.getIndicateurValeursAndChartData =
        getChartData;
      vi.spyOn(service, 'addSlide').mockImplementation(() => undefined);
      vi.spyOn(service, 'addIndicateurTerritorialSlide').mockImplementation(
        () => undefined
      );

      await service.addDonneesTerritorialesSlides({
        collectivite: { id: 42 },
        userId: 'user-id',
      });

      expect(isEnabled).toHaveBeenCalledWith('user-id', 42);
      return getChartData.mock.calls.map(([args]) => args as ChartArgs);
    };

    it.each([
      [true, [IndicateurSourceEnum.SNBC, IndicateurSourceEnum.SNBC3]],
      [false, [IndicateurSourceEnum.SNBC]],
    ])(
      'flag %s : cae_1.a et cae_2.a montrent les trajectoires %j, comme les graphes de l’app',
      async (isSnbc3Enabled, trajectoires) => {
        const calls = await chartCalls(isSnbc3Enabled);
        const trajectoiresParIndicateur = Object.fromEntries(
          calls.map((c) => [
            c.identifiantReferentiel,
            c.sources
              .map((s) => s.sourceId)
              .filter((id) => id.startsWith(IndicateurSourceEnum.SNBC)),
          ])
        );

        expect(trajectoiresParIndicateur).toEqual({
          'cae_1.a': trajectoires,
          'cae_2.a': trajectoires,
          'cae_3.a': [],
        });
        // La lecture des valeurs n'a pas d'utilisateur : la décision du flag
        // lui est transmise, sinon elle retirerait les valeurs snbc3.
        for (const call of calls) {
          expect(call.trajectoireSnbc3Enabled).toBe(isSnbc3Enabled);
        }
      }
    );
  });

  describe('échec de lecture du graphique d’indicateur', () => {
    it('relance un refus de lecture en ForbiddenException dans les données territoriales', async () => {
      const service = pptBuilderService as any;
      service.trajectoireSnbc3FeatureFlag.isTrajectoireSnbc3EnabledForUserId =
        vi.fn().mockResolvedValue(false);
      service.indicateurChartService.getIndicateurValeursAndChartData = vi
        .fn()
        .mockResolvedValue(
          failure('UNAUTHORIZED', new Error('Droits insuffisants'))
        );
      vi.spyOn(service, 'addSlide').mockImplementation(() => undefined);

      await expect(
        service.addDonneesTerritorialesSlides({
          collectivite: { id: 42 },
          userId: 'user-id',
        })
      ).rejects.toEqual(
        expect.objectContaining({
          constructor: ForbiddenException,
          message: 'Droits insuffisants',
        })
      );
    });

    it('relance une lecture en échec en InternalServerErrorException pour le graphique d’une fiche', async () => {
      const service = pptBuilderService as any;
      const cause = new Error('connexion perdue');
      service.indicateurChartService.getIndicateurValeursAndChartData = vi
        .fn()
        .mockResolvedValue(failure('DATABASE_ERROR', cause));

      await expect(
        service.writeIndicateurChartImageFileAndLoadMedia({
          indicateurId: 10,
          collectivite: { id: 42 },
          personnalisationReponses: {},
          chartSize: { width: 100, height: 100 },
        })
      ).rejects.toEqual(
        expect.objectContaining({
          constructor: InternalServerErrorException,
          message: 'connexion perdue',
          cause,
        })
      );
    });

    it('remonte PPT_BUILDER_ERROR avec l’exception relancée quand le graphique échoue pendant la génération', async () => {
      const service = pptBuilderService as any;
      const mediaDir = mkdtempSync(path.join(tmpdir(), 'plan-report-'));
      const outputDir = mkdtempSync(path.join(tmpdir(), 'plan-report-out-'));
      onTestFinished(() => {
        rmSync(mediaDir, { recursive: true, force: true });
        rmSync(outputDir, { recursive: true, force: true });
      });
      vi.spyOn(service, 'getPlanData').mockResolvedValue(
        success({
          plan: { id: 1, type: { type: service.PCAET_TYPE } },
          axes: [],
          sousAxesByAxe: {},
          fiches: [],
          planGeneralInfo: {},
          collectivite: { id: 42 },
          personnalisationReponses: {},
        })
      );
      vi.spyOn(service, 'loadCollectiviteLogo').mockResolvedValue(
        success(null)
      );
      vi.spyOn(service, 'addSlide').mockImplementation(() => undefined);
      vi.spyOn(service, 'addPlanSummarySlide').mockResolvedValue(undefined);
      vi.spyOn(service, 'addPlanProgressSlide').mockResolvedValue([]);
      service.trajectoireSnbc3FeatureFlag.isTrajectoireSnbc3EnabledForUserId =
        vi.fn().mockResolvedValue(false);
      service.indicateurChartService.getIndicateurValeursAndChartData = vi
        .fn()
        .mockResolvedValue(
          failure('UNAUTHORIZED', new Error('Droits insuffisants'))
        );

      const result = await pptBuilderService.buildPresentation({
        mediaDir,
        outputDir,
        reportName: 'rapport.pptx',
        templateConfig: {
          templatePath: 'template_bilan.pptx',
          key: 'bilan',
        } as never,
        request: { planId: 1 } as never,
        userId: 'user-id',
      });

      expect(result).toEqual({
        success: false,
        error: 'PPT_BUILDER_ERROR',
        cause: expect.objectContaining({
          constructor: ForbiddenException,
          message: 'Droits insuffisants',
        }),
      });
    });
  });
});
