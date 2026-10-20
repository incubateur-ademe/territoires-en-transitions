import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { categorieTagTable } from '@tet/backend/collectivites/tags/categorie-tag.table';
import { getAuthUserFromUserCredentials, getTestApp } from '@tet/backend/test';
import { AuthenticatedUser } from '@tet/backend/users/models/auth.models';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { TrpcRouter } from '@tet/backend/utils/trpc/trpc.router';
import { IndicateurPeriodiciteEnum } from '@tet/domain/indicateurs';
import { CollectiviteRole } from '@tet/domain/users';
import { loadImage } from 'canvas';
import { and, eq, inArray, isNull } from 'drizzle-orm';
import { init, type LineSeriesOption, type SeriesModel } from 'echarts';
import type { EChartsOption } from 'echarts/types/dist/echarts';
import { randomUUID } from 'node:crypto';
import request from 'supertest';
import { IndicateurChartService } from '../charts/indicateur-chart.service';
import { indicateurCategorieTagTable } from '../definitions/indicateur-categorie-tag.table';
import { indicateurDefinitionTable } from '../definitions/indicateur-definition.table';
import { indicateurGroupeTable } from '../shared/models/indicateur-groupe.table';
import { indicateurObjectifTable } from '../shared/models/indicateur-objectif.table';
import { indicateurSourceMetadonneeTable } from '../shared/models/indicateur-source-metadonnee.table';
import { indicateurSourceTable } from '../shared/models/indicateur-source.table';
import { indicateurValeurTable } from './indicateur-valeur.table';

describe('Régressions de la saisie annuelle des indicateurs', () => {
  let app: INestApplication;
  let router: TrpcRouter;
  let databaseService: DatabaseService;
  let authenticatedUser: AuthenticatedUser;
  let collectiviteId: number;
  let cleanupFixture: (() => Promise<void>) | undefined;

  beforeAll(async () => {
    app = await getTestApp();
    router = app.get(TrpcRouter);
    databaseService = app.get(DatabaseService);
    const fixture = await addTestCollectiviteAndUser(databaseService, {
      user: { role: CollectiviteRole.ADMIN },
    });
    cleanupFixture = fixture.cleanup;
    collectiviteId = fixture.collectivite.id;
    authenticatedUser = getAuthUserFromUserCredentials(fixture.user);
  });

  afterAll(async () => {
    try {
      await cleanupFixture?.();
    } finally {
      await app?.close();
    }
  });

  const insertAnnualIndicateur = async ({
    sansValeurUtilisateur = false,
  } = {}) => {
    const [definition] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values({
        collectiviteId,
        titre: 'Indicateur annuel de test',
        unite: 'MWh',
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        sansValeurUtilisateur,
      })
      .returning();
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurObjectifTable)
        .where(eq(indicateurObjectifTable.indicateurId, definition.id));
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(eq(indicateurDefinitionTable.id, definition.id));
    });
    return definition.id;
  };

  const renderChart = (option: EChartsOption) => {
    const chart = init(null, null, {
      renderer: 'svg',
      ssr: true,
      width: 600,
      height: 400,
    });
    onTestFinished(() => chart.dispose());
    chart.setOption({ ...option, animation: false });
    return (
      chart as unknown as { getModel(): SeriesModel['ecModel'] }
    ).getModel();
  };

  const createSegmentedChart = async (
    segments: {
      dateValeur: string;
      resultat?: number | null;
      objectif?: number | null;
      metadonneeId?: number;
    }[][],
    source?: string
  ) => {
    const parentId = await insertAnnualIndicateur();
    const [categorie] = await databaseService.db
      .select()
      .from(categorieTagTable)
      .where(
        and(
          eq(categorieTagTable.nom, 'agregation'),
          isNull(categorieTagTable.collectiviteId)
        )
      );
    assert.isDefined(categorie);
    await databaseService.db.insert(indicateurCategorieTagTable).values({
      indicateurId: parentId,
      categorieTagId: categorie.id,
    });
    const caller = router.createCaller({ user: authenticatedUser });
    const enfantIds: number[] = [];
    for (const valeurs of segments) {
      const enfantId = await insertAnnualIndicateur();
      enfantIds.push(enfantId);
      await databaseService.db
        .insert(indicateurGroupeTable)
        .values({ parent: parentId, enfant: enfantId });
      for (const valeur of valeurs) {
        const input = { collectiviteId, indicateurId: enfantId, ...valeur };
        if (valeur.metadonneeId !== undefined) {
          // Les données externes sont importées, pas saisies par l'utilisateur.
          await databaseService.db.insert(indicateurValeurTable).values(input);
        } else {
          await caller.indicateurs.valeurs.upsert(input);
        }
      }
    }
    const chart = await app
      .get(IndicateurChartService)
      .getIndicateurValeursAndChartData(
        {
          collectiviteId,
          indicateurId: parentId,
          includeSegmentation: { source },
        },
        authenticatedUser
      );
    return { ...chart, enfantIds };
  };

  test('Le graphique empile les valeurs enregistrées sur les mêmes années malgré les observations absentes', async () => {
    const { chartData, enfantIds } = await createSegmentedChart([
      [
        { dateValeur: '2024-01-01', resultat: 10 },
        { dateValeur: '2025-01-01', resultat: null },
        { dateValeur: '2026-01-01', resultat: 10 },
      ],
      [
        { dateValeur: '2026-01-01', resultat: 20 },
        { dateValeur: '2024-01-01', resultat: 20 },
      ],
    ]);
    const model = renderChart(chartData);
    const series = model.getSeries();
    expect(series).toHaveLength(2);
    const data = series[1].getData();
    const lastIndex = data.count() - 1;
    expect(data.getRawDataItem(lastIndex)).toMatchObject({
      dateValeur: '2026-01-01',
    });
    expect(data.get(data.getCalculationInfo('stackResultDimension'), 0)).toBe(
      30
    );
    expect(
      data.get(data.getCalculationInfo('stackResultDimension'), lastIndex)
    ).toBe(30);
    expect(chartData.dataset).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: [
            { dateValeur: '2024-01-01', valeur: 20 },
            { dateValeur: '2025-01-01', valeur: null },
            { dateValeur: '2026-01-01', valeur: 20 },
          ],
        }),
      ])
    );
    // Le trou est ajouté pour l'affichage, sans créer une observation en base.
    const caller = router.createCaller({ user: authenticatedUser });
    const saved = await caller.indicateurs.valeurs.list({
      collectiviteId,
      indicateurIds: [enfantIds[1]],
    });
    expect(saved.indicateurs[0].sources.collectivite.valeurs).toHaveLength(2);
  });

  test('Le graphique sépare les versions annuelles retenues et leurs trous sans perdre les zéros', async () => {
    const sourceId = `test-versions-${randomUUID()}`;
    await databaseService.db.insert(indicateurSourceTable).values({
      id: sourceId,
      libelle: 'Inventaire annuel',
    });
    onTestFinished(async () => {
      const metadonnees = await databaseService.db
        .select({ id: indicateurSourceMetadonneeTable.id })
        .from(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.sourceId, sourceId));
      if (metadonnees.length) {
        await databaseService.db.delete(indicateurValeurTable).where(
          inArray(
            indicateurValeurTable.metadonneeId,
            metadonnees.map(({ id }) => id)
          )
        );
      }
      await databaseService.db
        .delete(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.sourceId, sourceId));
      await databaseService.db
        .delete(indicateurSourceTable)
        .where(eq(indicateurSourceTable.id, sourceId));
    });
    const [ancienneVersion, nouvelleVersion] = await databaseService.db
      .insert(indicateurSourceMetadonneeTable)
      .values(
        ['2025-01-01', '2026-01-01'].map((dateVersion) => ({
          sourceId,
          dateVersion,
        }))
      )
      .returning();
    const { chartData, enfantIds } = await createSegmentedChart(
      [
        [
          {
            dateValeur: '2024-01-01',
            resultat: 0,
            metadonneeId: ancienneVersion.id,
          },
          {
            dateValeur: '2026-01-01',
            resultat: 3,
            metadonneeId: ancienneVersion.id,
          },
          {
            dateValeur: '2027-01-01',
            resultat: 999,
            metadonneeId: ancienneVersion.id,
          },
          // Pour une même année, seule la version la plus récente est lue.
          {
            dateValeur: '2027-01-01',
            resultat: 100,
            metadonneeId: nouvelleVersion.id,
          },
        ],
        [
          {
            dateValeur: '2025-01-01',
            resultat: 2,
            metadonneeId: ancienneVersion.id,
          },
          {
            dateValeur: '2028-01-01',
            resultat: 200,
            metadonneeId: nouvelleVersion.id,
          },
        ],
      ],
      sourceId
    );
    const series = renderChart(chartData).getSeries();
    expect(series).toHaveLength(4);
    for (const { version, observations } of [
      {
        version: ancienneVersion,
        observations: [
          { dateValeur: '2024-01-01', valeur: 0 },
          { dateValeur: '2025-01-01', valeur: null },
          { dateValeur: '2026-01-01', valeur: 3 },
        ],
      },
      {
        version: nouvelleVersion,
        observations: [
          { dateValeur: '2027-01-01', valeur: 100 },
          { dateValeur: '2028-01-01', valeur: null },
        ],
      },
    ]) {
      const stack = `${sourceId}:annuelle:${version.id}`;
      const versionSeries = series.filter(
        (serie) => (serie.option as LineSeriesOption).stack === stack
      );
      expect(versionSeries).toHaveLength(2);
      const firstSegment = versionSeries.find(
        (serie) =>
          (serie.option as LineSeriesOption).datasetId ===
          `${enfantIds[0]}-resultat-${sourceId}-annuelle-${version.id}`
      );
      assert.isDefined(firstSegment);
      expect(firstSegment.option).toMatchObject({ connectNulls: false });
      const data = firstSegment.getData();
      expect(
        Array.from({ length: data.count() }, (_, index) =>
          data.getRawDataItem(index)
        )
      ).toEqual(observations);
      // Le zéro et le point de la seconde version sont effectivement dessinés.
      const point = data.getItemGraphicEl(0).getBoundingRect();
      expect(point.width).toBeGreaterThan(0);
      expect(point.height).toBeGreaterThan(0);
    }
    const saved = await router
      .createCaller({ user: authenticatedUser })
      .indicateurs.valeurs.list({
        collectiviteId,
        indicateurIds: [enfantIds[0]],
      });
    const source = saved.indicateurs[0].sources[sourceId];
    expect(source.metadonnees.map(({ id }) => id).sort()).toEqual(
      [ancienneVersion.id, nouvelleVersion.id].sort()
    );
    expect(source.valeurs).toHaveLength(3);
    expect(source.valeurs).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          metadonneeId: ancienneVersion.id,
          resultat: 0,
        }),
        expect.objectContaining({
          metadonneeId: nouvelleVersion.id,
          resultat: 100,
        }),
      ])
    );
  });

  test.each([
    { valeurs: [10, null, 0], visibleIndexes: [0, 2] },
    { valeurs: [0], visibleIndexes: [0] },
    { valeurs: [10, 20, null, 0], visibleIndexes: [3] },
  ])(
    'Le graphique rend les points isolés enregistrés $valeurs sans masquer zéro',
    async ({ valeurs, visibleIndexes }) => {
      const { chartData } = await createSegmentedChart([
        valeurs.map((resultat, index) => ({
          dateValeur: `${2024 + index}-01-01`,
          resultat,
        })),
      ]);
      const serie = renderChart(chartData).getSeriesByIndex(0);
      const data = serie.getData();
      expect(
        valeurs.flatMap((_, index) =>
          data.getItemGraphicEl(index) ? [index] : []
        )
      ).toEqual(visibleIndexes);
      expect(serie.option).toMatchObject({ connectNulls: false });
      for (const index of visibleIndexes) {
        const bounds = data.getItemGraphicEl(index).getBoundingRect();
        expect(bounds.width).toBeGreaterThan(0);
        expect(bounds.height).toBeGreaterThan(0);
      }
    }
  );

  test('Le graphique conserve les trous, le seuil zéro et le dernier objectif de chaque année', async () => {
    const indicateurId = await insertAnnualIndicateur();
    await databaseService.db
      .update(indicateurDefinitionTable)
      .set({ exprSeuil: '0' })
      .where(eq(indicateurDefinitionTable.id, indicateurId));
    const objectifs = [
      { indicateurId, dateValeur: '2030-12-31', formule: '0' },
      { indicateurId, dateValeur: '2025-06-01', formule: '5' },
      { indicateurId, dateValeur: '2030-01-01', formule: '2' },
    ];
    await databaseService.db.insert(indicateurObjectifTable).values(objectifs);
    const caller = router.createCaller({ user: authenticatedUser });
    for (const [index, resultat] of [10, null, 0].entries()) {
      await caller.indicateurs.valeurs.upsert({
        collectiviteId,
        indicateurId,
        dateValeur: `${2024 + index}-01-01`,
        resultat,
      });
    }
    const service = app.get(IndicateurChartService);
    const { chartData } = await service.getIndicateurValeursAndChartData(
      {
        collectiviteId,
        indicateurId,
        includeReferenceValeurs: true,
      },
      authenticatedUser
    );
    expect(chartData.dataset).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          source: [
            { dateValeur: '2024-01-01', valeur: 10 },
            { dateValeur: '2025-01-01', valeur: null },
            { dateValeur: '2026-01-01', valeur: 0 },
          ],
        }),
        expect.objectContaining({
          id: 'seuil',
          source: [expect.objectContaining({ valeur: 0 })],
        }),
        expect.objectContaining({
          id: 'cible-objectifs',
          source: [
            { date: '2025-01-01', valeur: 5 },
            { date: '2030-01-01', valeur: 0 },
          ],
        }),
      ])
    );
    expect(renderChart(chartData).getSeriesByIndex(0).option).toMatchObject({
      connectNulls: false,
    });
    for (const width of [0, 100, Number.NaN]) {
      service.adjustOptionsWithWidth(chartData, width);
      const grid = Array.isArray(chartData.grid)
        ? chartData.grid[0]
        : chartData.grid;
      expect(Number.isFinite(grid?.bottom)).toBe(true);
      expect(grid?.bottom).toBeGreaterThanOrEqual(0);
      expect(chartData.title).toMatchObject({
        textStyle: {
          width: Number.isFinite(width) ? Math.max(width - 56, 0) : 0,
        },
      });
    }
    const saved = await databaseService.db
      .select()
      .from(indicateurObjectifTable)
      .where(eq(indicateurObjectifTable.indicateurId, indicateurId));
    expect(saved).toEqual(expect.arrayContaining(objectifs));
    expect(saved).toHaveLength(3);
  });

  test('Le graphique choisit les objectifs les plus renseignés et tolère une source absente', async () => {
    const segments = [
      [
        { dateValeur: '2024-01-01', resultat: 10, objectif: 1 },
        { dateValeur: '2025-01-01', resultat: null, objectif: 2 },
        { dateValeur: '2026-01-01', resultat: 0, objectif: 3 },
      ],
    ];
    const { indicateurSegmentation } = await createSegmentedChart(segments);
    expect(indicateurSegmentation).toMatchObject({
      source: 'collectivite',
      valeurType: 'objectif',
    });
    const absent = await createSegmentedChart(segments, 'absente');
    expect(absent.indicateurSegmentation).toMatchObject({ source: 'absente' });
    expect(absent.chartData.series).toEqual([]);
  });

  test.each(['png', 'svg'] as const)(
    'Exporte par HTTP les objectifs segmentés avec leurs motifs au format %s',
    async (format) => {
      const { chartData, indicateurSegmentation } = await createSegmentedChart([
        [
          { dateValeur: '2025-01-01', objectif: 10 },
          { dateValeur: '2026-01-01', objectif: 20 },
        ],
        [
          { dateValeur: '2025-01-01', objectif: 15 },
          { dateValeur: '2026-01-01', objectif: 25 },
        ],
      ]);
      expect(indicateurSegmentation).toMatchObject({
        source: 'collectivite',
        valeurType: 'objectif',
      });

      const width = 320;
      const height = 200;
      const response = await request(app.getHttpServer())
        .post('/charts/render')
        .set('Authorization', `Bearer ${process.env.SUPABASE_ANON_KEY}`)
        .send({ format, width, height, options: chartData })
        .expect(200)
        .expect(
          'Content-Type',
          format === 'png' ? /image\/png/ : /application\/xml/
        )
        .responseType('blob');

      if (format === 'png') {
        expect(response.body.subarray(0, 8)).toEqual(
          Buffer.from([137, 80, 78, 71, 13, 10, 26, 10])
        );
        const image = await loadImage(response.body);
        expect(image.width).toBe(width * 3);
        expect(image.height).toBe(height * 3);
      } else {
        const svg = response.body.toString();
        expect(svg).toContain('<svg');
        expect(svg).toContain(`width="${width}"`);
        expect(svg).toContain(`height="${height}"`);
        expect(svg).toContain('<pattern');
      }
    }
  );

  test("L'upsert historique applique aussi l'interdiction de saisie utilisateur", async () => {
    const protectedIndicateurId = await insertAnnualIndicateur({
      sansValeurUtilisateur: true,
    });
    const caller = router.createCaller({ user: authenticatedUser });

    await expect(
      caller.indicateurs.valeurs.upsert({
        collectiviteId,
        indicateurId: protectedIndicateurId,
        dateValeur: '2026-01-01',
        resultat: 1,
      })
    ).rejects.toThrow(/n'accepte.*pas de valeur utilisateur/);
  });

  test("L'upsert historique remplace un calcul automatique par une saisie manuelle", async () => {
    const annualIndicateurId = await insertAnnualIndicateur();
    const [existing] = await databaseService.db
      .insert(indicateurValeurTable)
      .values({
        indicateurId: annualIndicateurId,
        collectiviteId,
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        dateValeur: '2026-01-01',
        resultat: 10,
        objectif: 12,
        calculAuto: true,
        calculAutoIdentifiantsManquants: ['source_manquante'],
      })
      .returning();
    const caller = router.createCaller({ user: authenticatedUser });

    await caller.indicateurs.valeurs.upsert({
      collectiviteId,
      indicateurId: annualIndicateurId,
      id: existing.id,
      resultat: null,
    });

    const [saved] = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(eq(indicateurValeurTable.id, existing.id));
    expect(saved).toMatchObject({
      resultat: null,
      objectif: 12,
      calculAuto: false,
      calculAutoIdentifiantsManquants: null,
    });
  });

  test('La suppression conserve une valeur open-data', async () => {
    const annualIndicateurId = await insertAnnualIndicateur();
    const sourceId = `test-${randomUUID()}`;
    await databaseService.db.insert(indicateurSourceTable).values({
      id: sourceId,
      libelle: 'Source de test',
    });
    const [metadonnee] = await databaseService.db
      .insert(indicateurSourceMetadonneeTable)
      .values({
        sourceId,
        dateVersion: '2026-01-01T00:00:00.000Z',
      })
      .returning();
    const [openDataValeur] = await databaseService.db
      .insert(indicateurValeurTable)
      .values({
        indicateurId: annualIndicateurId,
        collectiviteId,
        periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        dateValeur: '2026-01-01',
        resultat: 10,
        metadonneeId: metadonnee.id,
      })
      .returning();
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurValeurTable)
        .where(eq(indicateurValeurTable.id, openDataValeur.id));
      await databaseService.db
        .delete(indicateurSourceMetadonneeTable)
        .where(eq(indicateurSourceMetadonneeTable.id, metadonnee.id));
      await databaseService.db
        .delete(indicateurSourceTable)
        .where(eq(indicateurSourceTable.id, sourceId));
    });
    const caller = router.createCaller({ user: authenticatedUser });

    await caller.indicateurs.valeurs.delete({
      collectiviteId,
      indicateurId: annualIndicateurId,
      id: openDataValeur.id,
    });

    const [saved] = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(eq(indicateurValeurTable.id, openDataValeur.id));
    expect(saved).toMatchObject({ id: openDataValeur.id, resultat: 10 });
  });

  test('La suppression propage la disparition des lignes calculées A → B → C', async () => {
    const suffix = randomUUID().replaceAll('-', '');
    const [sourceA, calculatedB, calculatedC] = await databaseService.db
      .insert(indicateurDefinitionTable)
      .values([
        {
          collectiviteId: null,
          identifiantReferentiel: `test_${suffix}_a`,
          titre: 'Source A',
          unite: 'MWh',
          periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
        },
        {
          collectiviteId: null,
          identifiantReferentiel: `test_${suffix}_b`,
          titre: 'Calcul B',
          unite: 'MWh',
          periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
          // Les formules sont insensibles à la casse : la découverte SQL des
          // dépendants doit suivre le même contrat que le parseur/évaluateur.
          valeurCalcule: `val(TEST_${suffix.toUpperCase()}_A)`,
          sansValeurUtilisateur: true,
        },
        {
          collectiviteId: null,
          identifiantReferentiel: `test_${suffix}_c`,
          titre: 'Calcul C',
          unite: 'MWh',
          periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
          valeurCalcule: `val(test_${suffix}_b)`,
          sansValeurUtilisateur: true,
        },
      ])
      .returning();
    onTestFinished(async () => {
      await databaseService.db
        .delete(indicateurDefinitionTable)
        .where(
          inArray(indicateurDefinitionTable.id, [
            sourceA.id,
            calculatedB.id,
            calculatedC.id,
          ])
        );
    });
    const caller = router.createCaller({ user: authenticatedUser });
    const savedA = await caller.indicateurs.valeurs.upsert({
      collectiviteId,
      indicateurId: sourceA.id,
      dateValeur: '2026-01-01',
      resultat: 1,
    });
    assert.isDefined(savedA);

    const calculatedBeforeDeletion = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          inArray(indicateurValeurTable.indicateurId, [
            calculatedB.id,
            calculatedC.id,
          ]),
          eq(indicateurValeurTable.dateValeur, '2026-01-01')
        )
      );
    expect(calculatedBeforeDeletion).toHaveLength(2);
    expect(calculatedBeforeDeletion).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          indicateurId: calculatedB.id,
          resultat: 1,
          calculAuto: true,
        }),
        expect.objectContaining({
          indicateurId: calculatedC.id,
          resultat: 1,
          calculAuto: true,
        }),
      ])
    );

    await caller.indicateurs.valeurs.delete({
      collectiviteId,
      indicateurId: sourceA.id,
      id: savedA.id,
    });

    const persistedValeurs = await databaseService.db
      .select()
      .from(indicateurValeurTable)
      .where(
        and(
          eq(indicateurValeurTable.collectiviteId, collectiviteId),
          inArray(indicateurValeurTable.indicateurId, [
            sourceA.id,
            calculatedB.id,
            calculatedC.id,
          ]),
          eq(indicateurValeurTable.dateValeur, '2026-01-01')
        )
      );
    expect(persistedValeurs).toEqual([]);
  });
});
