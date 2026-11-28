import {
  ForbiddenException,
  InternalServerErrorException,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { failure, success } from '@tet/backend/utils/result.type';
import { IndicateurSourceEnum } from '@tet/domain/indicateurs';
import { FicheWithRelations, StatutEnum } from '@tet/domain/plans';
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

  const fiche = (overrides: Partial<FicheWithRelations>): FicheWithRelations =>
    ({
      titre: null,
      description: null,
      parentId: null,
      statut: null,
      pilotes: [],
      dateFin: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      ...overrides,
    } as FicheWithRelations);

  describe('groupFichesForReport', () => {
    const groupIds = (fiches: FicheWithRelations[]) =>
      (pptBuilderService as any)
        .groupFichesForReport(fiches)
        .map(
          ({
            action,
            sousActions,
          }: {
            action: FicheWithRelations;
            sousActions: FicheWithRelations[];
          }) => [action.id, sousActions.map((sousAction) => sousAction.id)]
        );

    it('trie les actions par titre, alphabétiquement', () => {
      expect(
        groupIds([
          fiche({ id: 1, titre: 'Action C' }),
          fiche({ id: 2, titre: 'Action A' }),
          fiche({ id: 3, titre: 'Action B' }),
        ])
      ).toEqual([
        [2, []],
        [3, []],
        [1, []],
      ]);
    });

    it('range les sous-actions sous leur action, par date de création (pas par titre)', () => {
      expect(
        groupIds([
          fiche({ id: 1, titre: 'Action A' }),
          fiche({ id: 2, titre: 'Action B' }),
          // ni dans l'ordre alphabétique, ni dans l'ordre d'insertion
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
        ])
      ).toEqual([
        [1, []],
        [2, [22, 21]],
      ]);
    });

    it("ne fait jamais d'une sous-action une action, même sans son action parente", () => {
      expect(
        groupIds([
          fiche({ id: 1, titre: 'Action A' }),
          fiche({ id: 99, titre: 'Sous-action orpheline', parentId: 999 }),
        ])
      ).toEqual([[1, []]]);
    });
  });

  describe('slides « Sous-actions »', () => {
    const ROWS_PER_SLIDE = 5;

    /** Génère les slides « Sous-actions » d'une action avec le vrai template. */
    const renderSousActionsSlides = async (
      sousActions: FicheWithRelations[]
    ) => {
      const mediaDir = mkdtempSync(path.join(tmpdir(), 'plan-report-'));
      onTestFinished(() => rmSync(mediaDir, { recursive: true, force: true }));
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

      (pptBuilderService as any).addFicheSousActionsSlides({
        presentation,
        planGeneralInfo: { PLAN_NOM: 'Plan Climat', PLAN_TYPE: 'PCAET' },
        logo: null,
        template: {
          key: 'bilan',
          slides: { fiche_sous_actions_slide: 14 },
          max_sous_actions_per_slide: ROWS_PER_SLIDE,
        },
        ficheTextReplacementsInfo: { FICHE_TITRE: '1.1. Construire' },
        sousActions,
      });

      const archive = await presentation.getJSZip();
      const slideFiles = archive
        .file(/^ppt\/slides\/slide\d+\.xml$/)
        .sort((a, b) => a.name.localeCompare(b.name, 'en', { numeric: true }));

      return Promise.all(
        slideFiles.map(async (file) => {
          const slide = parseDocument(await file.async('string'), {
            xmlMode: true,
          });
          // le remplacement découpe un texte en plusieurs runs : on les recolle
          const texts = (node: { children: any[] }) =>
            DomUtils.findAll((el) => el.name === 'a:t', node.children)
              .map((el) => DomUtils.textContent(el))
              .join('');
          const fieldShape = (node: { children: any[] }, suffix: string) =>
            DomUtils.findOne(
              (el) =>
                el.name === 'p:sp' &&
                (
                  DomUtils.findOne((c) => c.name === 'p:cNvPr', el.children)
                    ?.attribs.name ?? ''
                ).endsWith(`_${suffix}`),
              node.children
            );
          const field = (node: { children: any[] }, suffix: string) => {
            const shape = fieldShape(node, suffix);
            return shape ? texts(shape) : undefined;
          };
          /** Couleurs des runs qui portent du texte (srgb, ou nom du thème). */
          const textColors = (node: { children: any[] }, suffix: string) => {
            const shape = fieldShape(node, suffix);
            const colors = DomUtils.findAll(
              (el) =>
                el.name === 'a:r' && DomUtils.textContent(el).trim() !== '',
              shape?.children ?? []
            ).map((run) => {
              const color = DomUtils.findOne(
                (el) => el.name === 'a:srgbClr' || el.name === 'a:schemeClr',
                run.children
              );
              return color?.attribs.val;
            });
            return [...new Set(colors)];
          };
          const groups = DomUtils.findAll(
            (el) =>
              el.name === 'p:grpSp' &&
              /^grp_sous_action_\d+$/.test(
                DomUtils.findOne((c) => c.name === 'p:cNvPr', el.children)
                  ?.attribs.name ?? ''
              ),
            slide.children
          );
          const rows = groups.map((row) => ({
            badges: DomUtils.findAll(
              (el) =>
                el.name === 'p:cNvPr' &&
                el.attribs.name.startsWith('txt_sous_action_') &&
                el.attribs.name.includes('_statut_'),
              row.children
            ).map((el) => el.attribs.name),
            titre: field(row, 'titre'),
            description: field(row, 'description'),
            pilotes: field(row, 'pilotes'),
            dateFin: field(row, 'date_fin'),
          }));
          return {
            text: texts(slide),
            rows,
            dateFinColors: groups.map((row) => textColors(row, 'date_fin')),
          };
        })
      );
    };

    it('liste titre, description, pilotes, date de fin et statut de chaque sous-action', async () => {
      const [slide, ...autres] = await renderSousActionsSlides([
        fiche({
          id: 11,
          titre: 'Organiser la réunion de lancement',
          description: '<p>Envoyer une proposition de créneaux</p>',
          statut: StatutEnum.REALISE,
          pilotes: [
            { prenom: 'Marie', nomFamille: 'Bouvier', nom: 'Marie Bouvier' },
            { nom: 'Service mobilité' },
          ] as FicheWithRelations['pilotes'],
          dateFin: '2026-02-22',
        }),
        fiche({ id: 12, titre: 'Valider une première version' }),
      ]);

      expect(autres).toHaveLength(0);
      expect(slide.text).toContain('Sous-actions : 1.1. Construire');
      expect(slide.text).not.toContain('{{');
      expect(slide.rows).toEqual([
        {
          badges: ['txt_sous_action_1_statut_REALISE'],
          titre: 'Organiser la réunion de lancement',
          description: 'Envoyer une proposition de créneaux',
          pilotes: 'M. Bouvier, Service mobilité',
          dateFin: '22/02/2026',
        },
        {
          badges: ['txt_sous_action_2_statut_SANS_STATUT'],
          titre: 'Valider une première version',
          description: '',
          pilotes: '',
          dateFin: '',
        },
      ]);
    });

    it(`répartit les sous-actions par ${ROWS_PER_SLIDE} et numérote les slides dans le titre`, async () => {
      const slides = await renderSousActionsSlides(
        Array.from({ length: ROWS_PER_SLIDE + 2 }, (_, i) =>
          fiche({ id: i + 1, titre: `Sous-action ${i + 1}` })
        )
      );

      expect(slides.map((slide) => slide.rows.length)).toEqual([
        ROWS_PER_SLIDE,
        2,
      ]);
      expect(slides[0].text).toContain('1.1. Construire (1/2)');
      expect(slides[1].text).toContain('1.1. Construire (2/2)');
      expect(slides[1].rows.map((row) => row.titre)).toEqual([
        `Sous-action ${ROWS_PER_SLIDE + 1}`,
        `Sous-action ${ROWS_PER_SLIDE + 2}`,
      ]);
    });

    it("met en rouge la date de fin dépassée d'une sous-action ni réalisée ni abandonnée", async () => {
      const [slide] = await renderSousActionsSlides([
        fiche({
          id: 1,
          titre: 'En retard',
          statut: StatutEnum.EN_COURS,
          dateFin: '2020-01-31',
        }),
        fiche({
          id: 2,
          titre: 'Réalisée après la date',
          statut: StatutEnum.REALISE,
          dateFin: '2020-01-31',
        }),
        fiche({ id: 3, titre: 'À venir', dateFin: '2999-12-31' }),
      ]);

      expect(slide.rows.map((row) => row.dateFin)).toEqual([
        '31/01/2020',
        '31/01/2020',
        '31/12/2999',
      ]);
      expect(slide.dateFinColors).toEqual([['CE0500'], ['dk1'], ['dk1']]);
    });

    it("n'ajoute aucune slide à une action sans sous-action", async () => {
      expect(await renderSousActionsSlides([])).toEqual([]);
    });

    it('résume en « +N » les pilotes au-delà des deux premiers', async () => {
      const [slide] = await renderSousActionsSlides([
        fiche({
          id: 1,
          titre: 'Coordonner',
          pilotes: [
            { prenom: 'Marie', nomFamille: 'Bouvier', nom: 'Marie Bouvier' },
            { nom: 'Service mobilité' },
            { nom: 'Service voirie' },
            { nom: 'Service urbanisme' },
          ] as FicheWithRelations['pilotes'],
        }),
      ]);

      expect(slide.rows[0].pilotes).toBe('M. Bouvier, Service mobilité +2');
    });

    it('coupe une description trop longue pour ses deux lignes', async () => {
      const [slide] = await renderSousActionsSlides([
        fiche({ id: 1, titre: 'Publier', description: 'mot '.repeat(100) }),
      ]);

      const description = slide.rows[0].description ?? '';
      expect(description.length).toBeLessThanOrEqual(170);
      expect(description.endsWith('…')).toBe(true);
    });
  });

  describe('SOUS_FICHES_COUNT', () => {
    it('compte les sous-actions des actions données', () => {
      const actions = [fiche({ id: 1 }), fiche({ id: 2 })];
      const fiches = [
        ...actions,
        fiche({ id: 11, parentId: 1 }),
        fiche({ id: 12, parentId: 1 }),
        fiche({ id: 21, parentId: 2 }),
        fiche({ id: 31, parentId: 3 }),
      ];

      expect((pptBuilderService as any).countSousActions(actions, fiches)).toBe(
        3
      );
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
