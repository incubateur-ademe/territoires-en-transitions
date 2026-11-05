import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { groupementCollectiviteTable } from '@tet/backend/collectivites/shared/models/groupement-collectivite.table';
import { groupementTable } from '@tet/backend/collectivites/shared/models/groupement.table';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { indicateurValeurTable } from '@tet/backend/indicateurs/valeurs/indicateur-valeur.table';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { LlmRepository } from '@tet/backend/utils/llm/repositories/llm.repository';
import {
  ElectrificationEngagementsConfig,
  electrificationEngagementsConfig,
  Engagement,
  engagementSchema,
  StatutEnum,
} from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { count, eq } from 'drizzle-orm';
import assert from 'node:assert';
import { randomUUID } from 'node:crypto';
import {
  afterAll,
  afterEach,
  beforeAll,
  beforeEach,
  describe,
  expect,
  test,
} from 'vitest';
import { GenerateImportDraftWorker } from '../generate-import-draft/generate-import-draft.worker';
import { ELECTRIFICATION_ENGAGEMENTS_CONFIG } from '../ai-plan-import.constants';
import {
  EngagementCibleImport,
  EngagementImport,
  engagementImportSchema,
} from '../models/engagement-import.schema';
import { ImportSource } from '../models/import-source.schema';
import {
  ElectrificationEngagementsInput,
  ElectrificationIssue,
} from './electrification-engagements.schema';
import { ResolveElectrificationEngagementsService } from './resolve-electrification-engagements.service';

class ReadOnlyLlmRepository extends LlmRepository {
  readonly maxConcurrentCalls = 1;
  readonly maxInputTokensPerMinute = null;
  readonly maxRequestsPerMinute = null;
  readonly capabilities = { ocr: false, strategy: 'whole-document' as const };
  maxInputTokensFor() {
    return 60_000;
  }
  modelFor() {
    return 'fake-model';
  }
  async complete(): Promise<never> {
    throw new Error('La résolution des engagements ne doit pas appeler le LLM');
  }
}

const source = (key: string): ImportSource => ({
  key,
  location: `Annexe 3, ${key}`,
});
const engagement = (
  code: string,
  cibles: EngagementCibleImport[] = []
): EngagementImport => ({ code, source: source(code), cibles });
const cible = (
  key = 'principale',
  valeur: number | null = 40,
  unite: string | null = '%',
  annee: number | null = 2030
): EngagementCibleImport => ({
  key,
  valeur,
  unite,
  annee,
  source: source(`cible-${key}`),
});
const axe = (
  numero: number | null,
  key = `axe-${numero}`,
  sousAxes: ElectrificationEngagementsInput['axes'][number]['sousAxes'] = []
) => ({ numero, titre: 'Titre fourni', source: source(key), sousAxes });
const sousAxe = (numero: string | null) => ({
  numero,
  titre: 'Sous-axe fourni',
  source: source(`sous-axe-${numero}`),
});

describe('Résolution des engagements Électrification', () => {
  let app: INestApplication;
  let db: DatabaseService;
  let service: ResolveElectrificationEngagementsService;
  const catalogue = structuredClone(electrificationEngagementsConfig);
  let fixture: ElectrificationEngagementsConfig;
  let context: Awaited<ReturnType<typeof createContext>>;
  let input: ElectrificationEngagementsInput;

  const createContext = async (
    role: CollectiviteRole = CollectiviteRole.EDITION
  ) => {
    const { collectivite, user } = await addTestCollectiviteAndUser(db, {
      user: { role },
      collectivite: { accesRestreint: true },
    });
    return {
      collectiviteId: collectivite.id,
      user: getAuthUserFromUserCredentials(user),
    };
  };
  const mapping = () => catalogue.engagements[0].cibles[0];
  const resolve = () => service.resolve(input, { user: context.user });
  const expectIssue = async (
    code: string,
    kind: ElectrificationIssue['kind'] = 'document-error'
  ) => {
    const result = await resolve();
    expect(result.success).toBe(false);
    assert(!result.success);
    expect(result.error).toContainEqual(
      expect.objectContaining({ code, kind })
    );
  };

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder
          .overrideProvider(LlmService)
          .useValue(new LlmService(new ReadOnlyLlmRepository()));
        builder.overrideProvider(GenerateImportDraftWorker).useValue({});
        builder
          .overrideProvider(ELECTRIFICATION_ENGAGEMENTS_CONFIG)
          .useValue(catalogue);
      },
    });
    db = await getTestDatabase(app);
    service = app.get(ResolveElectrificationEngagementsService);
    fixture = structuredClone(electrificationEngagementsConfig);
    fixture.sousAxes = [
      { numero: '1.1', axeNumero: 1, titre: 'Sous-axe catalogue' },
    ];
    for (const definition of fixture.engagements.flatMap(
      ({ cibles }) => cibles
    )) {
      definition.identifiantReferentiel = `test-electrification-${randomUUID()}`;
      definition.validation = 'validated';
      definition.periodicite = 'annuelle';
      await db.db.insert(indicateurDefinitionTable).values({
        identifiantReferentiel: definition.identifiantReferentiel,
        titre: 'Indicateur synthétique Électrification',
        unite: definition.unite,
        periodicite: 'annuelle',
      });
    }
  });
  beforeEach(async () => {
    Object.assign(catalogue, structuredClone(fixture));
    context = await createContext();
    input = {
      collectiviteId: context.collectiviteId,
      catalogueVersion: catalogue.version,
      engagements: [],
      axes: [],
    };
  });
  afterEach(async () => {
    // Le service prépare un résultat : même un succès ne crée rien en base.
    const counts = await Promise.all([
      db.db
        .select({ count: count() })
        .from(axeTable)
        .where(eq(axeTable.collectiviteId, context.collectiviteId)),
      db.db
        .select({ count: count() })
        .from(ficheActionTable)
        .where(eq(ficheActionTable.collectiviteId, context.collectiviteId)),
      db.db
        .select({ count: count() })
        .from(indicateurValeurTable)
        .where(
          eq(indicateurValeurTable.collectiviteId, context.collectiviteId)
        ),
    ]);
    expect(counts).toEqual([[{ count: 0 }], [{ count: 0 }], [{ count: 0 }]]);
  });
  afterAll(async () => {
    await app?.close();
  });

  test('partage l’axe E01/E02, conserve les axes B et les homonymes libres, prépare E03/E12', async () => {
    input.engagements = ['E01', 'E02', 'E03', 'E12'].map((code) =>
      engagement(code)
    );
    input.axes = [
      axe(1, 'fiche-B-1', [sousAxe('1.1')]),
      axe(2),
      axe(null, 'libre-A', [
        { ...sousAxe(null), source: source('libre-enfant-A') },
      ]),
      axe(null, 'libre-B', [
        { ...sousAxe(null), source: source('libre-enfant-B') },
      ]),
    ];
    const result = await resolve();
    assert(result.success);
    expect(result.data.axes).toHaveLength(9);
    expect(result.data.axes.find(({ key }) => key === 'axe:1')).toMatchObject({
      titre: `Axe 1. ${catalogue.axes[0].titre}`,
      sources: [source('E01'), source('E02'), source('fiche-B-1')],
    });
    expect(
      result.data.axes.find(({ key }) => key === 'sous-axe:1.1')
    ).toMatchObject({ parentKey: 'axe:1', titre: 'Sous-axe catalogue' });
    expect(result.data.engagements.map(({ code }) => code)).toEqual([
      'E01',
      'E02',
      'E03',
      'E12',
    ]);
    expect(
      result.data.axes
        .filter(({ numero }) => numero === null)
        .map(({ key, parentKey }) => ({ key, parentKey }))
    ).toEqual([
      { key: 'libre:libre-A', parentKey: null },
      { key: 'libre:libre-enfant-A', parentKey: 'libre:libre-A' },
      { key: 'libre:libre-B', parentKey: null },
      { key: 'libre:libre-enfant-B', parentKey: 'libre:libre-B' },
    ]);
    expect(result.data.fiches).toEqual(
      ['E03', 'E12'].map((code) =>
        expect.objectContaining({
          engagementCode: code,
          statut: StatutEnum.A_VENIR,
          titre: catalogue.engagements.find((entry) => entry.code === code)
            ?.actionTitre,
        })
      )
    );
    expect(result.data.cibles.map(({ objectif }) => objectif)).toEqual([
      null,
      null,
    ]);
  });

  test('garde les deux cibles E07 distinctes et distingue zéro d’une cible vide', async () => {
    input.engagements = [
      engagement('E07', [
        cible('total', 0, 'Nombre de bornes'),
        cible('rapides', null, null, null),
      ]),
    ];
    const result = await resolve();
    assert(result.success);
    expect(result.data.cibles).toEqual([
      expect.objectContaining({
        key: 'engagement:E07:total',
        objectif: 0,
        dateValeur: '2030-01-01',
        periodicite: 'annuelle',
      }),
      expect.objectContaining({
        key: 'engagement:E07:rapides',
        objectif: null,
      }),
    ]);
    expect(
      new Set(result.data.cibles.map(({ indicateurId }) => indicateurId)).size
    ).toBe(2);
    expect(result.data.report.issues).toEqual([
      expect.objectContaining({
        code: 'EMPTY_ENGAGEMENT_TARGET',
        kind: 'warning',
        location: source('cible-rapides').location,
      }),
    ]);
  });

  test('résout E06/E08 par leurs références explicites, sans déduction depuis le titre', async () => {
    expect(
      electrificationEngagementsConfig.engagements
        .filter(({ code }) => ['E06', 'E08'].includes(code))
        .map(({ cibles }) => cibles[0].identifiantReferentiel)
    ).toEqual(['v_particulier_elec', 'autobus_autocar_elec']);
    input.engagements = ['E06', 'E08'].map((code) =>
      engagement(code, [{ ...cible(), source: source(`${code}-cible`) }])
    );
    const result = await resolve();
    assert(result.success);
    expect(
      result.data.cibles.map(
        ({ identifiantReferentiel }) => identifiantReferentiel
      )
    ).toEqual(
      catalogue.engagements
        .filter(({ code }) => ['E06', 'E08'].includes(code))
        .map(({ cibles }) => cibles[0].identifiantReferentiel)
    );
  });

  test('accepte un engagement sans contexte d’import dans le domaine puis applique les règles Électrification', async () => {
    const engagementMetier: Engagement = engagementSchema.parse({
      code: 'ENGAGEMENT-AUTRE',
      cibles: [
        { key: 'principale', valeur: 40, unite: '%', annee: 2040 },
        { key: 'complementaire', valeur: null, unite: null, annee: null },
      ],
    });
    input.engagements = [
      engagementImportSchema.parse({
        ...engagementMetier,
        source: source(engagementMetier.code),
        cibles: engagementMetier.cibles.map((target) => ({
          ...target,
          source: source(`cible-${target.key}`),
        })),
      }),
    ];
    await expectIssue('UNKNOWN_ENGAGEMENT');
  });

  test.each<[string, (draft: ElectrificationEngagementsInput) => void]>([
    [
      'UNKNOWN_AXIS',
      (draft) => {
        draft.axes = [axe(99)];
      },
    ],
    [
      'UNKNOWN_SUB_AXIS',
      (draft) => {
        draft.axes = [axe(1, 'axe', [sousAxe('1.99')])];
      },
    ],
    [
      'INVALID_SUB_AXIS_PARENT',
      (draft) => {
        draft.axes = [axe(2, 'axe', [sousAxe('1.1')])];
      },
    ],
    [
      'DUPLICATE_SOURCE_KEY',
      (draft) => {
        draft.axes = [axe(null, 'identique'), axe(null, 'identique')];
      },
    ],
    [
      'DUPLICATE_ENGAGEMENT',
      (draft) => {
        draft.engagements = [
          engagement('E03'),
          { ...engagement('E03'), source: source('autre') },
        ];
      },
    ],
    [
      'DUPLICATE_TARGET_KEY',
      (draft) => {
        draft.engagements = [
          engagement('E01', [cible(), { ...cible(), source: source('autre') }]),
        ];
      },
    ],
    [
      'UNKNOWN_TARGET_KEY',
      (draft) => {
        draft.engagements = [engagement('E01', [cible('inconnue')])];
      },
    ],
    [
      'INVALID_ELECTRIFICATION_INPUT',
      (draft) => {
        draft.engagements = [
          engagement('E01', [cible('principale', Number.NaN)]),
        ];
      },
    ],
    [
      'INVALID_ELECTRIFICATION_INPUT',
      (draft) => {
        draft.engagements = [
          engagement('E01', [cible('principale', Number.POSITIVE_INFINITY)]),
        ];
      },
    ],
    [
      'INVALID_ELECTRIFICATION_INPUT',
      (draft) => {
        draft.engagements = [
          engagement('E01', [cible('principale', 40, '%', 2030.5)]),
        ];
      },
    ],
    [
      'INVALID_ELECTRIFICATION_INPUT',
      (draft) => {
        draft.engagements = [Object.assign(engagement('E01'), { id: 1 })];
      },
    ],
    [
      'INVALID_ELECTRIFICATION_INPUT',
      (draft) => {
        draft.engagements = [
          engagement('E01', [Object.assign(cible(), { indicateurId: 1 })]),
        ];
      },
    ],
  ])('refuse une erreur de document : %s', async (code, mutate) => {
    mutate(input);
    await expectIssue(code);
  });

  test.each([
    [
      'unité incohérente',
      cible('principale', 40, 'MWh'),
      'INVALID_ENGAGEMENT_UNIT',
    ],
    [
      'unité absente',
      cible('principale', 40, null),
      'INVALID_ENGAGEMENT_PERIOD',
    ],
    [
      'année absente',
      cible('principale', 40, '%', null),
      'INVALID_ENGAGEMENT_PERIOD',
    ],
    [
      'autre échéance',
      cible('principale', 40, '%', 2029),
      'INVALID_ENGAGEMENT_PERIOD',
    ],
    ['valeur négative', cible('principale', -1), 'INVALID_ENGAGEMENT_VALUE'],
    [
      'pourcentage supérieur à 100',
      cible('principale', 101),
      'INVALID_ENGAGEMENT_VALUE',
    ],
  ] as const)('refuse une cible avec %s', async (_name, target, code) => {
    input.engagements = [
      engagementImportSchema.parse(engagement('E01', [target])),
    ];
    await expectIssue(code);
  });

  test('refuse plus de bornes rapides que de bornes au total', async () => {
    input.engagements = [
      engagement('E07', [
        cible('total', 1, 'Nombre de bornes'),
        cible('rapides', 2, 'Nombre de bornes'),
      ]),
    ];
    await expectIssue('INCONSISTENT_E07_TARGETS');
  });

  test.each(['absente', 'version incompatible'] as const)(
    'refuse une configuration %s',
    async (scenario) => {
      if (scenario === 'absente')
        Reflect.deleteProperty(catalogue, 'engagements');
      else input.catalogueVersion = 'unknown-version';
      await expectIssue(
        'UNSUPPORTED_ELECTRIFICATION_CATALOGUE',
        'configuration-error'
      );
    }
  );

  test.each<
    [string, string, (config: ElectrificationEngagementsConfig) => void]
  >([
    [
      'numéro d’axe répété',
      'DUPLICATE_CATALOGUE_REFERENCE',
      (config) => {
        config.axes.push({ ...config.axes[0] });
      },
    ],
    [
      'code d’engagement répété',
      'DUPLICATE_CATALOGUE_REFERENCE',
      (config) => {
        config.engagements.push(structuredClone(config.engagements[0]));
      },
    ],
    [
      'parent inconnu',
      'INVALID_CATALOGUE_PARENT',
      (config) => {
        config.engagements[0].axeNumero = 99;
      },
    ],
    [
      'action et cibles simultanées',
      'INVALID_ENGAGEMENT_MAPPING',
      (config) => {
        config.engagements[0].actionTitre = 'Action incompatible';
      },
    ],
    [
      'même indicateur pour les deux cibles E07',
      'DUPLICATE_CATALOGUE_REFERENCE',
      (config) => {
        const e07 = config.engagements.find(({ code }) => code === 'E07');
        assert(e07);
        e07.cibles[1].identifiantReferentiel =
          e07.cibles[0].identifiantReferentiel;
      },
    ],
  ])('refuse une correspondance ambiguë : %s', async (_name, code, mutate) => {
    mutate(catalogue);
    await expectIssue(code, 'configuration-error');
  });

  test('bloque un sous-axe numéroté tant que sa correspondance n’est pas livrée', async () => {
    catalogue.sousAxes = null;
    input.axes = [axe(1, 'axe', [sousAxe('1.1')])];
    await expectIssue('SUB_AXES_CATALOGUE_UNAVAILABLE', 'configuration-error');
  });

  test('la configuration livrée garde les définitions non validées bloquantes', async () => {
    expect(
      electrificationEngagementsConfig.engagements
        .flatMap(({ cibles }) => cibles)
        .every(
          ({ validation, periodicite }) =>
            validation === 'pending' && periodicite === null
        )
    ).toBe(true);
    mapping().validation = 'pending';
    mapping().periodicite = null;
    input.engagements = [engagement('E01', [cible()])];
    await expectIssue(
      'UNVALIDATED_ENGAGEMENT_INDICATEUR',
      'configuration-error'
    );
  });

  test.each([
    'définition absente',
    'unité de définition',
    'périodicité de définition',
    'périodicité du catalogue',
  ] as const)('bloque une configuration invalide : %s', async (scenario) => {
    input.engagements = [engagement('E01', [cible()])];
    mapping().identifiantReferentiel = `test-electrification-${randomUUID()}`;
    if (scenario !== 'définition absente') {
      await db.db.insert(indicateurDefinitionTable).values({
        titre: 'Définition synthétique incompatible',
        identifiantReferentiel: mapping().identifiantReferentiel,
        unite: scenario === 'unité de définition' ? 'MWh' : '%',
        periodicite:
          scenario === 'périodicité de définition' ? 'mensuelle' : 'annuelle',
      });
    }
    if (scenario === 'périodicité du catalogue')
      mapping().periodicite = 'mensuelle';
    await expectIssue(
      scenario === 'définition absente'
        ? 'MISSING_ENGAGEMENT_INDICATEUR'
        : 'INCOMPATIBLE_ENGAGEMENT_INDICATEUR',
      'configuration-error'
    );
  });

  test('ne résout pas un indicateur réservé à un autre groupement de collectivités', async () => {
    const other = await createContext();
    const [groupement] = await db.db
      .insert(groupementTable)
      .values({ nom: `Électrification ${randomUUID()}` })
      .returning();
    await db.db.insert(groupementCollectiviteTable).values({
      groupementId: groupement.id,
      collectiviteId: other.collectiviteId,
    });
    mapping().identifiantReferentiel = `test-electrification-${randomUUID()}`;
    await db.db.insert(indicateurDefinitionTable).values({
      titre: 'Indicateur réservé',
      identifiantReferentiel: mapping().identifiantReferentiel,
      unite: '%',
      groupementId: groupement.id,
    });
    input.engagements = [engagement('E01', [cible()])];
    await expectIssue('MISSING_ENGAGEMENT_INDICATEUR', 'configuration-error');
  });

  test.each(['lecture seule', 'autre collectivité'] as const)(
    'refuse les droits insuffisants : %s',
    async (scenario) => {
      const other = await createContext(
        scenario === 'lecture seule'
          ? CollectiviteRole.LECTURE
          : CollectiviteRole.EDITION
      );
      const result = await service.resolve(
        {
          ...input,
          collectiviteId:
            scenario === 'lecture seule'
              ? other.collectiviteId
              : context.collectiviteId,
        },
        { user: other.user }
      );
      expect(result).toMatchObject({
        success: false,
        error: [
          expect.objectContaining({
            kind: 'processing-error',
            code: 'UNAUTHORIZED',
          }),
        ],
      });
    }
  );
});
