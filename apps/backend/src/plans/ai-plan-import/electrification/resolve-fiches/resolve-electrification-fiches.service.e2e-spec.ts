import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { indicateurDefinitionTable } from '@tet/backend/indicateurs/indicateur/indicateur-definition.table';
import { ListIndicateursService } from '@tet/backend/indicateurs/indicateurs/list-indicateurs/list-indicateurs.service';
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
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import { emptyTokenUsage } from '@tet/backend/utils/llm/token-usage';
import { failure, success } from '@tet/backend/utils/result.type';
import {
  Document,
  ExternalHyperlink,
  HeadingLevel,
  Packer,
  Paragraph,
  TextRun,
  Table,
  TableCell,
  TableRow,
} from 'docx';
import {
  ElectrificationConfig,
  electrificationConfig,
  ElectrificationEngagementCodeEnum as EngagementCode,
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
  MockInstance,
  test,
  vi,
} from 'vitest';
import { ELECTRIFICATION_CONFIG } from '../electrification.constants';
import templateData from '../extract-plan/__fixtures__/electrification-v4.template.json';
import { PrepareElectrificationImportService } from '../extract-plan/prepare-electrification-import.service';
import { ReadDocument } from '../../pipeline/document/document-page';
import { readDocument } from '../../pipeline/read-document/read-document';
import { GenerateImportDraftWorker } from '../../generate-import-draft/generate-import-draft.worker';
import { ImportSource } from '../../models/import-source.schema';
import { PrepareFicheRules } from '../../prepare-fiche/prepare-fiche.rules';
import {
  ElectrificationFichesInput,
  ElectrificationIndicateurInput,
} from './electrification-fiches.schema';
import { ResolveElectrificationFichesService } from './resolve-electrification-fiches.service';
import { ResolveElectrificationFichesRules } from './resolve-electrification-fiches.rules';

const source = (key: string): ImportSource => ({
  key,
  location: `Section B, ${key}`,
});
const quantitatif = (
  reference: string | null = null
): Extract<ElectrificationIndicateurInput, { type: 'quantitatif' }> => ({
  type: 'quantitatif',
  source: source('indicateur'),
  reference,
  titre: 'Indicateur du document',
  unite: 'MWh',
  periodicite: 'annuelle',
  resultat: { valeur: 0, periode: '2025' },
  objectif: { valeur: 10, periode: '2030' },
});
const booleen = (): Extract<
  ElectrificationIndicateurInput,
  { type: 'booleen' }
> => ({
  type: 'booleen',
  source: source('indicateur'),
  reference: 'test-B',
  titre: null,
  resultat: false,
  anneeResultat: 2025,
  objectif: true,
  anneeObjectif: 2030,
});

describe('Résolution des fiches actions Électrification', () => {
  const llm = new FakeLlmRepository();
  let app: INestApplication;
  let db: DatabaseService;
  let service: ResolveElectrificationFichesService;
  let context: Awaited<ReturnType<typeof createContext>>;
  let input: ElectrificationFichesInput;
  let indicateurId: number;
  let fixture: ElectrificationConfig;
  let expectedCounts: number[];
  const config = structuredClone(electrificationConfig);
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
  const fiche = () => input.fiches[0];
  const action = () => {
    assert(config.fiches.actions);
    return config.fiches.actions[0];
  };
  const definition = () => {
    assert(config.fiches.indicateurs);
    const result = config.fiches.indicateurs[0];
    assert(result.type === 'quantitatif');
    return result;
  };
  const resolve = () => service.resolve(input, { user: context.user });
  const resolved = async () => {
    const result = await resolve();
    assert(result.success, JSON.stringify(result));
    return result.data;
  };
  const created = async () => {
    const result = (await resolved()).fiches[0];
    assert(result.mode === 'create');
    return result;
  };
  const expectIssue = async (code: string, kind = 'document-error') => {
    const result = await resolve();
    assert(!result.success, JSON.stringify(result));
    expect(result.error).toContainEqual(
      expect.objectContaining({ code, kind })
    );
  };

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder.overrideProvider(LlmService).useValue(new LlmService(llm));
        builder.overrideProvider(GenerateImportDraftWorker).useValue({});
        builder.overrideProvider(ELECTRIFICATION_CONFIG).useValue(config);
      },
    });
    db = await getTestDatabase(app);
    service = app.get(ResolveElectrificationFichesService);
    const identifiantReferentiel = `test-fiches-${randomUUID()}`;
    const [indicateur] = await db.db
      .insert(indicateurDefinitionTable)
      .values({
        identifiantReferentiel,
        titre: 'Titre commun du catalogue TeT',
        unite: 'MWh',
        periodicite: 'annuelle',
      })
      .returning();
    indicateurId = indicateur.id;
    fixture = structuredClone(electrificationConfig);
    fixture.sousAxes = [
      { numero: '1.1', axeNumero: 1, titre: 'Sous-axe validé' },
    ];
    fixture.fiches = {
      actions: [
        {
          code: 'test-A',
          validation: 'validated',
          axeNumero: 1,
          sousAxeNumero: null,
          champs: {
            titre: 'Titre de référence',
            description: 'Description de référence',
            objectifs: 'Objectifs de référence',
          },
          sousActions: [
            {
              code: 'test-SA',
              champs: { titre: 'Sous-action A', description: 'Description A' },
            },
            { code: 'test-SB', champs: { titre: 'Sous-action B' } },
          ],
          indicateurCodes: ['test-I'],
          aides: [],
        },
      ],
      indicateurs: [
        {
          code: 'test-I',
          validation: 'validated',
          type: 'quantitatif',
          identifiantReferentiel,
          unite: 'MWh',
          periodicite: 'annuelle',
        },
        {
          code: 'test-B',
          validation: 'validated',
          type: 'booleen',
          titre: 'Jalon du catalogue',
        },
      ],
    };
  });
  beforeEach(async () => {
    vi.spyOn(llm, 'complete');
    vi.spyOn(llm, 'chat');
    Object.assign(config, structuredClone(fixture));
    context = await createContext();
    expectedCounts = [0, 0, 0];
    input = {
      collectiviteId: context.collectiviteId,
      catalogueVersion: config.version,
      engagements: [],
      axes: [
        {
          source: source('axe'),
          numero: 1,
          titre: 'Titre libre du document',
          sousAxes: [],
        },
      ],
      fiches: [
        {
          source: source('fiche'),
          axeSourceKey: 'axe',
          reference: null,
          champs: { titre: 'Action du document' },
          sousActions: [],
          indicateurs: [],
        },
      ],
    };
  });
  afterEach(async () => {
    expect(llm.complete).not.toHaveBeenCalled();
    expect(llm.chat).not.toHaveBeenCalled();
    vi.restoreAllMocks();
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
    expect(counts.map(([row]) => row.count)).toEqual(expectedCounts);
  });
  afterAll(async () => {
    await app?.close();
  });

  test('prépare une fiche sans configuration métier, complète les absences et conserve les sous-actions libres homonymes', () => {
    const input: Parameters<typeof PrepareFicheRules.prepare>[0] = {
      source: { key: 'action-1', location: 'Document, action 1' },
      axeKey: 'axe-1',
      code: 'action-reference',
      champs: {
        titre: 'Titre documentaire',
        description: null,
        objectifs: 'Objectifs documentaires',
        structures: [],
      },
      defaults: {
        titre: 'Titre de référence',
        description: 'Description de référence',
        objectifs: 'Objectifs de référence',
        structures: ['Structure de référence'],
      },
      sousActions: [
        {
          source: { key: 'enfant-1', location: 'Document, sous-action 1' },
          code: 'sous-action-reference',
          champs: { titre: 'Titre choisi' },
          defaults: { description: 'Description complémentaire' },
        },
        ...['enfant-2', 'enfant-3'].map((key) => ({
          source: { key, location: `Document, ${key}` },
          code: null,
          champs: { titre: 'Même titre' },
          defaults: {},
        })),
      ],
      complements: [
        {
          code: 'sous-action-reference',
          champs: { titre: 'Titre de référence' },
        },
        { code: 'sous-action-complementaire', champs: { titre: 'Complément' } },
      ],
    };
    const original = structuredClone(input);

    const result = PrepareFicheRules.prepare(input);

    assert(result.success, JSON.stringify(result));
    expect(result.data).toMatchObject({
      mode: 'create',
      axeKey: 'axe-1',
      code: 'action-reference',
      champs: {
        titre: 'Titre documentaire',
        description: 'Description de référence',
        objectifs: 'Objectifs documentaires',
        structures: ['Structure de référence'],
      },
    });
    expect(result.data.sousActions).toHaveLength(4);
    expect(result.data.sousActions[0]).toMatchObject({
      code: 'sous-action-reference',
      champs: {
        titre: 'Titre choisi',
        description: 'Description complémentaire',
      },
    });
    expect(
      result.data.sousActions.filter((item) => item.code === null)
    ).toHaveLength(2);
    expect(new Set(result.data.sousActions.map((item) => item.key)).size).toBe(
      4
    );
    expect(input).toEqual(original);
  });

  test('valide le titre et les dates fusionnées sans configuration métier', () => {
    const result = PrepareFicheRules.prepare({
      source: { key: 'action-1', location: 'Document, action 1' },
      axeKey: 'axe-1',
      code: null,
      champs: { titre: '   ', dateFin: '2025-12-31' },
      defaults: { dateDebut: '2026-01-01' },
      sousActions: [],
      complements: [],
    });

    assert(!result.success);
    expect(result.error).toEqual(
      expect.arrayContaining([
        expect.objectContaining({
          code: 'MISSING_FICHE_TITLE',
          kind: 'document-error',
        }),
        expect.objectContaining({
          code: 'INVALID_FICHE_DATES',
          kind: 'document-error',
        }),
      ])
    );
  });

  test.each(['titre absent', 'dates inversées', 'code dupliqué'])(
    'refuse un complément invalide : %s',
    (problem) => {
      const complement: Parameters<
        typeof PrepareFicheRules.prepare
      >[0]['complements'][number] = {
        code: 'complement',
        champs: { titre: 'Sous-action complémentaire' },
      };
      if (problem === 'titre absent') complement.champs.titre = null;
      if (problem === 'dates inversées') {
        complement.champs.dateDebut = '2026-12-31';
        complement.champs.dateFin = '2026-01-01';
      }
      const result = PrepareFicheRules.prepare({
        source: { key: 'action-1', location: 'Document, action 1' },
        axeKey: 'axe-1',
        code: null,
        champs: { titre: 'Action documentaire' },
        defaults: {},
        sousActions: [],
        complements:
          problem === 'code dupliqué'
            ? [complement, structuredClone(complement)]
            : [complement],
      });

      assert(!result.success);
      expect(result.error).toContainEqual(
        expect.objectContaining({
          code: 'INVALID_FICHE_DEFAULTS',
          kind: 'configuration-error',
        })
      );
    }
  );

  test('refuse deux sous-actions documentaires portant le même code sans configuration métier', () => {
    const result = PrepareFicheRules.prepare({
      source: { key: 'action-1', location: 'Document, action 1' },
      axeKey: 'axe-1',
      code: null,
      champs: { titre: 'Action documentaire' },
      defaults: {},
      sousActions: ['enfant-1', 'enfant-2'].map((key) => ({
        source: { key, location: `Document, ${key}` },
        code: 'sous-action-reference',
        champs: { titre: 'Sous-action documentaire' },
        defaults: {},
      })),
      complements: [],
    });

    assert(!result.success);
    expect(result.error).toContainEqual(
      expect.objectContaining({
        code: 'DUPLICATE_FICHE_REFERENCE',
        kind: 'document-error',
      })
    );
  });

  test('prépare un indicateur libre annuel, conserve zéro et sépare résultat et objectif datés', async () => {
    fiche().indicateurs = [quantitatif()];
    const result = await created();
    expect(result.indicateurs).toEqual([
      expect.objectContaining({
        mode: 'create',
        code: null,
        indicateurId: null,
        periodicite: 'annuelle',
        valeurs: [
          { dateValeur: '2025-01-01', resultat: 0, objectif: null },
          { dateValeur: '2030-01-01', resultat: null, objectif: 10 },
        ],
      }),
    ]);
  });

  test('prépare une fiche et un indicateur libres sans correspondances de catalogue livrées', async () => {
    config.fiches = { actions: null, indicateurs: null };
    fiche().indicateurs = [quantitatif()];
    const result = await created();
    expect(result.code).toBeNull();
    expect(result.indicateurs[0]).toMatchObject({ mode: 'create', code: null });
  });

  test('regroupe le résultat et l’objectif de la même période sans transformer les absences en zéro', async () => {
    const indicateur = quantitatif();
    indicateur.objectif.periode = '2025';
    fiche().indicateurs = [indicateur];
    expect((await created()).indicateurs[0]).toMatchObject({
      valeurs: [{ dateValeur: '2025-01-01', resultat: 0, objectif: 10 }],
    });
    indicateur.resultat.valeur = null;
    indicateur.objectif.valeur = null;
    expect((await created()).indicateurs[0]).toMatchObject({ valeurs: [] });
  });

  test('applique les champs documentaires puis les compléments sans doubler sous-actions et indicateurs', async () => {
    fiche().reference = 'test-A';
    fiche().champs = {
      titre: 'Titre choisi',
      description: null,
      objectifs: 'Objectifs choisis',
      structures: ['Structure pilote'],
    };
    fiche().sousActions = [
      {
        source: source('sous-action'),
        reference: 'test-SA',
        champs: { titre: 'Sous-action choisie' },
      },
    ];
    fiche().indicateurs = [quantitatif('test-I')];
    const result = await created();
    expect(result.champs).toMatchObject({
      titre: 'Titre choisi',
      description: 'Description de référence',
      objectifs: 'Objectifs choisis',
      structures: ['Structure pilote'],
    });
    expect(result.sousActions).toHaveLength(2);
    expect(result.sousActions[0]).toMatchObject({
      code: 'test-SA',
      champs: { titre: 'Sous-action choisie', description: 'Description A' },
    });
    expect(result.sousActions[1].code).toBe('test-SB');
    expect(result.indicateurs).toHaveLength(1);
  });

  test('complète les champs absents et les indicateurs de référence sans valeur inventée', async () => {
    fiche().reference = 'test-A';
    fiche().champs = {};
    const result = await created();
    expect(result.champs.titre).toBe('Titre de référence');
    expect(result.indicateurs).toEqual([
      expect.objectContaining({
        mode: 'catalogue',
        indicateurId,
        titre: 'Titre commun du catalogue TeT',
        valeurs: [],
      }),
    ]);
  });

  test('reprend les sous-actions et aides livrées pour le réseau des chauffagistes en conservant le titre documentaire', async () => {
    Object.assign(config, structuredClone(electrificationConfig));
    input.axes[0].sousAxes = [
      {
        source: source('sous-axe'),
        numero: '1.4',
        titre: 'Professionnels du chauffage',
      },
    ];
    fiche().reference = '1.4.1';
    fiche().axeSourceKey = 'sous-axe';
    fiche().champs = {
      titre: 'Mobiliser les chauffagistes de notre territoire',
    };

    const result = await created();

    expect(result.champs.titre).toBe(
      'Mobiliser les chauffagistes de notre territoire'
    );
    expect(result.champs.description).toEqual(expect.any(String));
    expect(result.sousActions.map(({ code }) => code)).toEqual([
      'sous-action-011',
      'sous-action-012',
      'sous-action-013',
    ]);
    expect(result.documents).toEqual(
      expect.arrayContaining([
        { titre: 'CEPAC', url: 'https://cepac-experts.org/' },
        { titre: 'Anah', url: 'https://www.anah.gouv.fr/' },
      ])
    );
    expect(result.indicateurs).toEqual([]);
    expect(ResolveElectrificationFichesRules.validateConfig(config)).toEqual(
      []
    );
    expect(ResolveElectrificationFichesRules.isCatalogueValid(config)).toBe(
      true
    );
  });

  test('conserve le lien livré vers un indicateur non validé et bloque son complément', async () => {
    Object.assign(config, structuredClone(electrificationConfig));
    input.axes[0].sousAxes = [
      {
        source: source('sous-axe'),
        numero: '1.1',
        titre: 'Repérage du territoire',
      },
    ];
    fiche().reference = '1.1.2';
    fiche().axeSourceKey = 'sous-axe';
    const listIndicateurs = vi.spyOn(
      app.get(ListIndicateursService),
      'listIndicateurs'
    );

    await expectIssue('FICHES_CONFIG_UNAVAILABLE', 'configuration-error');

    expect(listIndicateurs).not.toHaveBeenCalled();
  });

  test('prépare les aides du catalogue comme documents sans modifier les moyens humains', async () => {
    fiche().reference = 'test-A';
    fiche().champs.ressources = 'Une personne dédiée';
    action().aides = [
      { titre: '  Aide à la rénovation  ', url: 'https://example.org/aide' },
    ];

    const result = await created();

    expect(result.documents).toEqual([
      { titre: 'Aide à la rénovation', url: 'https://example.org/aide' },
    ]);
    expect(result.champs.ressources).toBe('Une personne dédiée');
  });

  test('omet une aide sans URL avec un avertissement et conserve les aides liées et l’action', async () => {
    fiche().reference = 'test-A';
    action().aides = [
      { titre: 'Aide sans lien', url: null },
      { titre: 'Aide liée', url: 'https://example.org/aide' },
    ];

    const result = await resolved();

    expect(result.fiches).toEqual([
      expect.objectContaining({
        mode: 'create',
        documents: [{ titre: 'Aide liée', url: 'https://example.org/aide' }],
        champs: expect.objectContaining({ titre: fiche().champs.titre }),
      }),
    ]);
    expect(result.report.issues).toContainEqual(
      expect.objectContaining({
        code: 'AIDE_WITHOUT_URL_IGNORED',
        kind: 'warning',
        location: `${fiche().source.location} — Aide "Aide sans lien"`,
      })
    );
  });

  test('crée l’action sans document lorsque toutes ses aides sont sans URL', async () => {
    fiche().reference = 'test-A';
    action().aides = [{ titre: 'Aide sans lien', url: null }];

    const result = await resolved();

    expect(result.fiches).toEqual([
      expect.objectContaining({ mode: 'create', documents: [] }),
    ]);
    expect(result.report.issues).toContainEqual(
      expect.objectContaining({
        code: 'AIDE_WITHOUT_URL_IGNORED',
        kind: 'warning',
      })
    );
  });

  test('une aide sans URL ne bloque pas une fiche qui ne reprend pas cette action', async () => {
    action().aides = [{ titre: 'Aide sans lien', url: null }];
    fiche().reference = null;

    expect(ResolveElectrificationFichesRules.isCatalogueValid(config)).toBe(
      true
    );
    expect((await created()).documents).toEqual([]);
  });

  test.each(['javascript:alert(1)', 'data:text/plain,aide', 'pas-une-url'])(
    "refuse une URL d'aide invalide : %s",
    async (url) => {
      fiche().reference = 'test-A';
      action().aides = [{ titre: 'Aide invalide', url }];
      await expectIssue(
        'UNSUPPORTED_ELECTRIFICATION_CATALOGUE',
        'configuration-error'
      );
    }
  );

  test.each(['fiche', 'sous-action'] as const)(
    'refuse des dates incohérentes après fusion des champs de la %s',
    async (target) => {
      fiche().reference = 'test-A';
      const catalogueFields =
        target === 'fiche' ? action().champs : action().sousActions[0].champs;
      catalogueFields.dateDebut = '2026-01-01';
      catalogueFields.dateFin = '2027-12-31';
      if (target === 'fiche') {
        fiche().champs.dateFin = '2025-12-31';
      } else {
        fiche().sousActions = [
          {
            source: source('sous-action'),
            reference: 'test-SA',
            champs: { dateFin: '2025-12-31' },
          },
        ];
      }
      await expectIssue('INVALID_FICHE_DATES');
    }
  );

  test('rattache une fiche au sous-axe demandé sans créer un engagement implicite', async () => {
    action().sousAxeNumero = '1.1';
    input.axes[0].sousAxes = [
      {
        source: source('sous-axe'),
        numero: '1.1',
        titre: 'Libellé documentaire',
      },
    ];
    fiche().reference = 'test-A';
    fiche().axeSourceKey = 'sous-axe';
    const result = await resolved();
    expect(result.engagements).toEqual([]);
    expect(result.fiches[0].axeKey).toBe(
      result.axes.find((a) => a.numero === '1.1')?.key
    );
  });

  test('refuse une action dont le code appartient à un autre axe', async () => {
    fiche().reference = 'test-A';
    input.axes[0].numero = 2;
    await expectIssue('INVALID_FICHE_AXIS');
  });

  test('refuse un rattachement qui ne désigne aucune source d’axe', async () => {
    fiche().axeSourceKey = 'axe-inexistant';
    await expectIssue('INVALID_FICHE_AXIS');
  });

  test('conserve les fiches libres homonymes et les fiches issues des engagements', async () => {
    input.engagements = ['E03', 'E12'].map((code) => ({
      code,
      cibles: [],
      source: { key: code, location: `Tableau A, ${code}` },
    }));
    input.fiches.push({
      ...structuredClone(fiche()),
      source: source('fiche-2'),
    });
    const result = await resolved();
    expect(result.fiches).toHaveLength(2);
    expect(new Set(result.fiches.map((f) => f.key)).size).toBe(2);
    expect(result.fichesEngagements.map((f) => f.engagementCode)).toEqual([
      'E03',
      'E12',
    ]);
  });

  test.each(['action', 'indicateur'] as const)(
    'distingue le mapping %s indisponible du code inconnu dans un catalogue livré',
    async (type) => {
      if (type === 'action') {
        fiche().reference = 'inconnu';
        config.fiches.actions = null;
      } else {
        fiche().indicateurs = [quantitatif('inconnu')];
        config.fiches.actions = [];
        config.fiches.indicateurs = null;
      }
      await expectIssue('FICHES_CONFIG_UNAVAILABLE', 'configuration-error');
      if (type === 'action') config.fiches.actions = [];
      else config.fiches.indicateurs = [];
      await expectIssue('UNKNOWN_FICHE_REFERENCE');
    }
  );

  test.each(['document', 'complément automatique'] as const)(
    'refuse un indicateur pending sans correspondance TeT dans le %s',
    async (origine) => {
      Object.assign(definition(), {
        validation: 'pending',
        identifiantReferentiel: null,
        unite: null,
        periodicite: null,
      });
      if (origine === 'document') {
        fiche().indicateurs = [quantitatif('test-I')];
      } else {
        fiche().reference = 'test-A';
      }
      const listIndicateurs = vi.spyOn(
        app.get(ListIndicateursService),
        'listIndicateurs'
      );

      await expectIssue('FICHES_CONFIG_UNAVAILABLE', 'configuration-error');

      expect(listIndicateurs).not.toHaveBeenCalled();
    }
  );

  test('signale une configuration manquante pour une sous-action référencée dans une fiche libre', async () => {
    config.fiches.actions = null;
    fiche().sousActions = [
      {
        source: source('sous-action'),
        reference: 'test-SA',
        champs: { titre: 'Sous-action documentaire' },
      },
    ];
    await expectIssue('FICHES_CONFIG_UNAVAILABLE', 'configuration-error');
  });

  test.each(['action', 'indicateur'] as const)(
    'refuse un mapping %s encore en attente de validation',
    async (type) => {
      if (type === 'action') {
        fiche().reference = 'test-A';
        action().validation = 'pending';
      } else {
        fiche().indicateurs = [quantitatif('test-I')];
        definition().validation = 'pending';
      }
      await expectIssue('FICHES_CONFIG_UNAVAILABLE', 'configuration-error');
    }
  );

  test('résout un code sans titre documentaire et conserve le titre commun de l’indicateur TeT', async () => {
    const indicateur = quantitatif('test-I');
    indicateur.titre = null;
    fiche().indicateurs = [indicateur];
    expect((await created()).indicateurs[0]).toMatchObject({
      mode: 'catalogue',
      indicateurId,
      titre: 'Titre commun du catalogue TeT',
    });
  });

  test('refuse une unité documentaire différente de l’unité principale du catalogue', async () => {
    const indicateur = quantitatif('test-I');
    indicateur.unite = 'kWh';
    fiche().indicateurs = [indicateur];
    await expectIssue('INVALID_INDICATEUR_UNIT');
  });

  test.each(['identifiantReferentiel', 'unite', 'periodicite'] as const)(
    'refuse un mapping utilisé sans %s avant toute recherche TeT, sans fermer l’admission',
    async (champ) => {
      definition()[champ] = null;
      fiche().indicateurs = [quantitatif('test-I')];
      const listIndicateurs = vi.spyOn(
        app.get(ListIndicateursService),
        'listIndicateurs'
      );

      await expectIssue('FICHES_CONFIG_UNAVAILABLE', 'configuration-error');

      expect(listIndicateurs).not.toHaveBeenCalled();
      expect(ResolveElectrificationFichesRules.isCatalogueValid(config)).toBe(
        true
      );
    }
  );

  test('respecte la périodicité mensuelle d’un indicateur catalogue et refuse une période annuelle', async () => {
    const identifiantReferentiel = `test-mensuel-${randomUUID()}`;
    const [existing] = await db.db
      .insert(indicateurDefinitionTable)
      .values({
        identifiantReferentiel,
        titre: 'Indicateur mensuel',
        unite: 'MWh',
        periodicite: 'mensuelle',
      })
      .returning();
    definition().identifiantReferentiel = identifiantReferentiel;
    definition().periodicite = 'mensuelle';
    const indicateur = quantitatif('test-I');
    indicateur.periodicite = 'mensuelle';
    indicateur.resultat.periode = '2025-04';
    indicateur.objectif.periode = '2030-06';
    fiche().indicateurs = [indicateur];
    expect((await created()).indicateurs[0]).toMatchObject({
      mode: 'catalogue',
      indicateurId: existing.id,
      periodicite: 'mensuelle',
      valeurs: [
        { dateValeur: '2025-04-01', resultat: 0, objectif: null },
        { dateValeur: '2030-06-01', resultat: null, objectif: 10 },
      ],
    });
    indicateur.resultat.periode = '2025';
    await expectIssue('INVALID_INDICATEUR_PERIOD');
  });

  test.each([
    'absente',
    'unité incompatible',
    'périodicité incompatible',
  ] as const)('refuse une définition TeT %s', async (problem) => {
    fiche().indicateurs = [quantitatif('test-I')];
    if (problem === 'absente')
      definition().identifiantReferentiel = `absent-${randomUUID()}`;
    if (problem === 'unité incompatible') definition().unite = 'kWh';
    if (problem === 'périodicité incompatible')
      definition().periodicite = 'mensuelle';
    await expectIssue('MISSING_FICHE_INDICATEUR', 'configuration-error');
  });

  test('refuse les codes ambigus dans les correspondances du catalogue', async () => {
    assert(config.fiches.indicateurs);
    config.fiches.indicateurs.push(structuredClone(definition()));
    await expectIssue('INVALID_FICHES_CONFIG', 'configuration-error');
  });

  test('ne déduit pas l’unité d’une valeur du document depuis le catalogue', async () => {
    const indicateur = quantitatif('test-I');
    indicateur.unite = null;
    fiche().indicateurs = [indicateur];
    await expectIssue('MISSING_INDICATEUR_UNIT');
  });

  test.each([
    ['absente', 'MISSING_INDICATEUR_YEAR'],
    ['invalide', 'INVALID_INDICATEUR_PERIOD'],
    ['Ponctuelle', 'INVALID_INDICATEUR_PERIODICITY'],
  ] as const)(
    'refuse une période %s sans inventer une date ou une fréquence',
    async (period, code) => {
      const indicateur = quantitatif();
      if (period === 'absente') indicateur.resultat.periode = null;
      if (period === 'invalide') indicateur.resultat.periode = '2025-99';
      if (period === 'Ponctuelle') indicateur.periodicite = 'Ponctuelle';
      fiche().indicateurs = [indicateur];
      await expectIssue(code);
    }
  );

  test('convertit le résultat Non en À venir malgré un objectif Oui, avec une échéance conventionnelle', async () => {
    fiche().indicateurs = [booleen()];
    expect((await created()).indicateurs[0]).toMatchObject({
      mode: 'sous-action',
      titre: 'Jalon du catalogue',
      statut: StatutEnum.A_VENIR,
      dateFin: '2030-12-31',
      observation: {
        resultat: false,
        anneeResultat: 2025,
        objectif: true,
        anneeObjectif: 2030,
      },
    });
  });

  test('seul le résultat Oui rend une sous-action Réalisée', async () => {
    const indicateur = booleen();
    indicateur.resultat = true;
    indicateur.objectif = false;
    fiche().indicateurs = [indicateur];
    expect((await created()).indicateurs[0]).toMatchObject({
      statut: StatutEnum.REALISE,
      observation: { resultat: true, objectif: false },
    });
  });

  test('signale un résultat oui/non absent et conserve les observations sans inventer d’échéance', async () => {
    const indicateur = booleen();
    indicateur.resultat = null;
    indicateur.anneeResultat = null;
    indicateur.objectif = null;
    indicateur.anneeObjectif = null;
    fiche().indicateurs = [indicateur];
    const result = await resolved();
    const prepared = result.fiches[0];
    assert(prepared.mode === 'create');
    expect(prepared.indicateurs[0]).toMatchObject({
      statut: StatutEnum.A_VENIR,
      dateFin: null,
      observation: { resultat: null, objectif: null },
    });
    expect(result.report.issues).toContainEqual(
      expect.objectContaining({ code: 'EMPTY_BOOLEAN_RESULT', kind: 'warning' })
    );
  });

  test('refuse une réponse oui/non renseignée sans son année', async () => {
    const indicateur = booleen();
    indicateur.anneeResultat = null;
    fiche().indicateurs = [indicateur];
    await expectIssue('MISSING_INDICATEUR_YEAR');
  });

  test('applique la limite du titre des fiches actions aux indicateurs oui/non', async () => {
    const indicateur = booleen();
    indicateur.titre = 'a'.repeat(301);
    fiche().indicateurs = [indicateur];
    await expectIssue('INVALID_FICHES_INPUT');
    indicateur.titre = 'a'.repeat(300);
    expect((await created()).indicateurs[0]).toMatchObject({
      titre: indicateur.titre,
    });
  });

  test('signale un titre de jalon catalogue trop long comme erreur de configuration', async () => {
    assert(config.fiches.indicateurs);
    const definition = config.fiches.indicateurs.find(
      (item) => item.type === 'booleen'
    );
    assert(definition);
    definition.titre = 'a'.repeat(301);
    fiche().indicateurs = [booleen()];
    await expectIssue(
      'UNSUPPORTED_ELECTRIFICATION_CATALOGUE',
      'configuration-error'
    );
  });

  test('prépare seulement le lien d’une fiche URL et signale ses champs et enfants non appliqués', async () => {
    const [existing] = await db.db
      .insert(ficheActionTable)
      .values({
        collectiviteId: context.collectiviteId,
        titre: 'Titre conservé',
        description: 'Description conservée',
      })
      .returning();
    expectedCounts[1] = 1;
    fiche().reference = `https://app.territoiresentransitions.fr/collectivite/${context.collectiviteId}/plans/fiches/${existing.id}`;
    fiche().sousActions = [
      {
        source: source('sous-action'),
        reference: 'code-inconnu',
        champs: { titre: 'Non appliqué' },
      },
    ];
    fiche().indicateurs = [quantitatif('code-inconnu')];
    const result = await resolved();
    expect(result.fiches).toEqual([
      {
        key: 'fiche:fiche',
        axeKey: result.axes[0].key,
        source: source('fiche'),
        mode: 'link',
        ficheId: existing.id,
      },
    ]);
    expect(result.report.issues).toContainEqual(
      expect.objectContaining({
        code: 'EXISTING_FICHE_PRESERVED',
        kind: 'preserved-data',
      })
    );
    expect(
      await db.db
        .select()
        .from(ficheActionTable)
        .where(eq(ficheActionTable.id, existing.id))
    ).toEqual([existing]);
  });

  test('prépare seulement le lien d’un indicateur URL sans appliquer titre, unité, fréquence ni valeurs', async () => {
    const [existing] = await db.db
      .insert(indicateurValeurTable)
      .values({
        collectiviteId: context.collectiviteId,
        indicateurId,
        dateValeur: '2025-01-01',
        resultat: 99,
      })
      .returning();
    expectedCounts[2] = 1;
    const indicateur = quantitatif(
      `https://app.territoiresentransitions.fr/collectivite/${
        context.collectiviteId
      }/indicateurs/cae/${definition().identifiantReferentiel}`
    );
    indicateur.titre = null;
    indicateur.unite = 'unité différente';
    indicateur.periodicite = 'Ponctuelle';
    fiche().indicateurs = [indicateur];
    const result = await resolved();
    const prepared = result.fiches[0];
    assert(prepared.mode === 'create');
    expect(prepared.indicateurs).toEqual([
      { mode: 'link', indicateurId, source: source('indicateur') },
    ]);
    expect(result.report.issues).toContainEqual(
      expect.objectContaining({
        code: 'EXISTING_INDICATEUR_PRESERVED',
        kind: 'preserved-data',
      })
    );
    expect(
      await db.db
        .select()
        .from(indicateurValeurTable)
        .where(eq(indicateurValeurTable.id, existing.id))
    ).toEqual([existing]);
  });

  test('ne complète pas un indicateur référencé par URL avec les valeurs de son code catalogue', async () => {
    fiche().reference = 'test-A';
    const indicateur = quantitatif(
      `https://app.territoiresentransitions.fr/collectivite/${context.collectiviteId}/indicateurs/perso/${indicateurId}`
    );
    fiche().indicateurs = [indicateur];
    expect((await created()).indicateurs).toEqual([
      { mode: 'link', indicateurId, source: source('indicateur') },
    ]);
  });

  test('prépare un seul lien pour deux URL désignant le même indicateur', async () => {
    const byId = quantitatif(
      `https://app.territoiresentransitions.fr/collectivite/${context.collectiviteId}/indicateurs/perso/${indicateurId}`
    );
    const byReference = quantitatif(
      `https://app.territoiresentransitions.fr/collectivite/${
        context.collectiviteId
      }/indicateurs/cae/${
        definition().identifiantReferentiel
      }?vue=graphique#objectif`
    );
    byReference.source = source('indicateur-reference');
    fiche().indicateurs = [byId, byReference];
    expect((await created()).indicateurs).toEqual([
      { mode: 'link', indicateurId, source: source('indicateur') },
    ]);
  });

  test.each(['URL avant le code', 'URL après le code'])(
    'préserve les données existantes quand URL et code désignent le même indicateur (%s)',
    async (order) => {
      const code = quantitatif('test-I');
      code.source = source('indicateur-code');
      code.unite = null;
      code.periodicite = 'Ponctuelle';
      const url = quantitatif(
        `https://app.territoiresentransitions.fr/collectivite/${context.collectiviteId}/indicateurs/perso/${indicateurId}`
      );
      fiche().indicateurs =
        order === 'URL avant le code' ? [url, code] : [code, url];
      const result = await resolved();
      const prepared = result.fiches[0];
      assert(prepared.mode === 'create');
      expect(prepared.indicateurs).toEqual([
        { mode: 'link', indicateurId, source: source('indicateur') },
      ]);
      expect(result.report.issues).toContainEqual(
        expect.objectContaining({
          code: 'EXISTING_INDICATEUR_PRESERVED',
          kind: 'preserved-data',
        })
      );
    }
  );

  test.each(['fiche-indicateur', 'axe-fiche', 'axe-sous-action'])(
    'refuse une clé de source dupliquée entre %s',
    async (collision) => {
      if (collision === 'fiche-indicateur') {
        const indicateur = quantitatif();
        indicateur.source = fiche().source;
        fiche().indicateurs = [indicateur];
      } else if (collision === 'axe-fiche') {
        fiche().source = input.axes[0].source;
      } else {
        fiche().sousActions = [
          {
            source: input.axes[0].source,
            reference: null,
            champs: { titre: 'Sous-action documentaire' },
          },
        ];
      }
      await expectIssue('DUPLICATE_SOURCE_KEY');
    }
  );

  test.each(['fiche', 'indicateur'] as const)(
    'rejette un identifiant de base injecté dans une %s documentaire',
    async (target) => {
      if (target === 'fiche') Object.assign(fiche(), { ficheId: 42 });
      else {
        const indicateur = quantitatif();
        Object.assign(indicateur, { indicateurId });
        fiche().indicateurs = [indicateur];
      }
      await expectIssue('INVALID_FICHES_INPUT');
    }
  );

  test('une référence vide devient une fiche libre mais exige un titre', async () => {
    fiche().reference = '   ';
    fiche().champs = {};
    await expectIssue('MISSING_FICHE_TITLE');
  });

  test('refuse deux sous-actions documentaires portant le même code', async () => {
    fiche().reference = 'test-A';
    fiche().sousActions = ['sous-action-1', 'sous-action-2'].map((key) => ({
      source: source(key),
      reference: 'test-SA',
      champs: {},
    }));
    await expectIssue('DUPLICATE_FICHE_REFERENCE');
  });

  test('refuse la résolution aux membres en lecture seule', async () => {
    const viewer = await createContext(CollectiviteRole.LECTURE);
    input.collectiviteId = viewer.collectiviteId;
    const result = await service.resolve(input, { user: viewer.user });
    assert(!result.success);
    expect(result.error).toContainEqual(
      expect.objectContaining({ code: 'UNAUTHORIZED' })
    );
  });

  describe('Extraction du canevas Word et reprise Électrification', () => {
    type Cell = {
      text: string;
      columnSpan?: number;
      rowSpan?: number;
      target?: string;
      prefix?: string;
    };
    type Rows = Cell[][];
    const template: { sections: { heading: string; rows: Rows }[] } =
      templateData;
    const DOCX_MIME =
      'application/vnd.openxmlformats-officedocument.wordprocessingml.document';
    let prepareService: PrepareElectrificationImportService;
    let document: ReadDocument;
    let generate: MockInstance<LlmService['generateStructured']>;
    let expectedInterpretationCalls: number;

    const field = (rows: Rows, label: string): Cell => {
      const row = rows.find((row) => row.length > 1 && row[0].text === label);
      assert(row, `Champ absent du canevas : ${label}`);
      return row[1];
    };
    const ficheRows = (
      values: Record<
        string,
        string | Pick<Cell, 'text' | 'target' | 'prefix'>
      > = {}
    ): Rows => {
      const rows = structuredClone(template.sections[1].rows);
      for (const [label, value] of Object.entries(values)) {
        Object.assign(
          field(rows, label),
          typeof value === 'string' ? { text: value } : value
        );
      }
      return rows;
    };
    const actionRows = (values: Parameters<typeof ficheRows>[0] = {}): Rows =>
      ficheRows({
        Axe: '1',
        "Intitulé de l'action": 'Action du document',
        ...values,
      });
    const table = (rows: Rows) =>
      new Table({
        rows: rows.map(
          (row) =>
            new TableRow({
              children: row.map(
                ({ text, columnSpan, rowSpan, target, prefix }) =>
                  new TableCell({
                    columnSpan,
                    rowSpan,
                    children: text.split('\n').map((text) =>
                      target === undefined
                        ? new Paragraph(text)
                        : new Paragraph({
                            children: [
                              ...(prefix ? [new TextRun(prefix)] : []),
                              new ExternalHyperlink({
                                link: target,
                                children: [new TextRun(text)],
                              }),
                            ],
                          })
                    ),
                  })
              ),
            })
        ),
      });
    const useForm = async ({
      engagements = structuredClone(template.sections[0].rows),
      engagementsHeading = template.sections[0].heading,
      fiches = [actionRows()],
      extra = [],
    }: {
      engagements?: Rows;
      engagementsHeading?: string;
      fiches?: Rows[];
      extra?: (Paragraph | Table)[];
    } = {}) => {
      const buffer = await Packer.toBuffer(
        new Document({
          sections: [
            {
              children: [
                new Paragraph({
                  text: 'Annexe 3 – Plan d’action détaillé',
                  heading: HeadingLevel.HEADING_1,
                }),
                new Paragraph(engagementsHeading),
                table(engagements),
                new Paragraph(template.sections[1].heading),
                table(ficheRows()),
                ...fiches.map(table),
                ...extra,
                new Paragraph(template.sections[2].heading),
                table(template.sections[2].rows),
              ],
            },
          ],
        })
      );
      const result = await readDocument({ buffer, mimeType: DOCX_MIME });
      assert(result.success, JSON.stringify(result));
      document = result.data;
    };
    const prepare = () =>
      prepareService.prepare(
        { collectiviteId: context.collectiviteId, document },
        { user: context.user }
      );
    const prepared = async () => {
      const result = await prepare();
      assert(result.success, JSON.stringify(result));
      return result.data;
    };
    const expectExtractionIssue = async (code: string) => {
      const result = await prepare();
      assert(!result.success, JSON.stringify(result));
      expect(result.error).toContainEqual(expect.objectContaining({ code }));
      return result.error;
    };

    beforeEach(async () => {
      expectedInterpretationCalls = 0;
      prepareService = app.get(PrepareElectrificationImportService);
      generate = vi
        .spyOn(app.get(LlmService), 'generateStructured')
        .mockReset()
        .mockRejectedValue(
          new Error('Cette extraction ne doit pas appeler de modèle')
        );
      await useForm();
    });
    afterEach(() => {
      expect(generate).toHaveBeenCalledTimes(expectedInterpretationCalls);
    });

    test('prépare les engagements A sans cibles numériques depuis le vrai canevas', async () => {
      const engagements = structuredClone(template.sections[0].rows);
      engagements[5][2].text = 'Oui';
      engagements[8][2].text = 'Oui';
      await useForm({ engagements, fiches: [] });
      const result = await prepared();
      expect(result.prepared.engagements.map(({ code }) => code)).toEqual([
        'E03',
        'E12',
      ]);
      expect(
        result.prepared.fichesEngagements.map(
          ({ engagementCode }) => engagementCode
        )
      ).toEqual(['E03', 'E12']);
      expect(result.prepared.fiches).toEqual([]);
      expect(result.prepared.cibles).toEqual([]);
      expect(result.checkpoint).toMatchObject({
        profile: 'annexe-3-electrification',
        schemaVersion: 1,
        catalogueVersion: config.version,
        documentKind: 'docx',
        templateVersion: 'electrification-v4',
        tokens: emptyTokenUsage(),
      });
    });

    test('écarte le modèle B vierge et l’exemple C sans perdre une fiche remplie', async () => {
      const result = await prepared();
      expect(result.prepared.fiches).toHaveLength(1);
      expect(result.prepared.fiches[0]).toMatchObject({
        mode: 'create',
        champs: { titre: 'Action du document' },
      });
      expect(
        result.checkpoint.sources.some(({ text }) => text.includes('X.X.X'))
      ).toBe(false);
      expect(document.pages.map(({ text }) => text).join('\n')).toContain(
        'X.X.X'
      );
      expect(result.checkpoint.response.fiches).toHaveLength(1);
      expect(result.checkpoint.response.fiches[0].source).toMatch(
        /^t\d+:r\d+:c\d+$/
      );
    });

    test('copie les champs renseignés et les paragraphes sans interprétation ni budget', async () => {
      const rows = actionRows({
        "Description de l'action":
          'Première partie.\nDeuxième partie avec un montant de 123 euros.',
        "Objectif(s) de l'action": 'Réduire les émissions de 25 %.',
        'Structure pilote (facultatif)':
          'Direction du patrimoine; Service énergie',
        'Partenaire(s) (parties prenantes) (facultatif)': 'Agence locale',
        'Date de début prévisionnelle': '01/01/2026',
        'Date de fin prévisionnelle': '31/12/2030',
        "État d'avancement au moment de la signature": 'En cours',
      });
      field(rows, 'Budget prévisionnel en € HT (facultatif)').text =
        'Investissement : 100 000';
      await useForm({ fiches: [rows] });
      const result = (await prepared()).prepared.fiches[0];
      assert(result.mode === 'create');
      expect(result.champs).toMatchObject({
        titre: 'Action du document',
        description:
          'Première partie.\nDeuxième partie avec un montant de 123 euros.',
        objectifs: 'Réduire les émissions de 25 %.',
        structures: ['Direction du patrimoine', 'Service énergie'],
        partenaires: ['Agence locale'],
        dateDebut: '2026-01-01',
        dateFin: '2030-12-31',
        statut: StatutEnum.EN_COURS,
      });
      expect(result.champs).not.toHaveProperty('budget');
      expect(result.source.location).toBe(`Action "${result.champs.titre}"`);
    });

    test('garde deux fiches homonymes et leur sous-action respective', async () => {
      const first = actionRows({ "Intitulé de l'action": 'Même titre' });
      first[19][0].text = 'Même sous-action';
      first[19][1].text = '31/12/2030';
      await useForm({ fiches: [first, structuredClone(first)] });
      const result = (await prepared()).prepared;
      expect(result.axes).toHaveLength(1);
      expect(result.fiches).toHaveLength(2);
      expect(new Set(result.fiches.map(({ key }) => key)).size).toBe(2);
      for (const fiche of result.fiches) {
        assert(fiche.mode === 'create');
        expect(fiche.sousActions).toHaveLength(1);
        expect(fiche.sousActions[0].champs).toMatchObject({
          titre: 'Même sous-action',
          dateFin: '2030-12-31',
        });
      }
    });

    test('lit les indicateurs numériques et Oui/Non sans confondre zéro, Non et absence', async () => {
      const rows = actionRows();
      rows.splice(
        23,
        1,
        [
          { text: '' },
          { text: 'Énergie économisée (MWh)', columnSpan: 2 },
          { text: '0 (2025)' },
          { text: '10' },
        ],
        [
          { text: '' },
          { text: 'Jalon documentaire', columnSpan: 2 },
          { text: 'Non (2025)' },
          { text: 'Oui' },
        ]
      );
      await useForm({ fiches: [rows] });
      const fiche = (await prepared()).prepared.fiches[0];
      assert(fiche.mode === 'create');
      expect(fiche.indicateurs).toEqual([
        expect.objectContaining({
          mode: 'create',
          valeurs: [
            { dateValeur: '2025-01-01', resultat: 0, objectif: null },
            { dateValeur: '2030-01-01', resultat: null, objectif: 10 },
          ],
        }),
        expect.objectContaining({
          mode: 'sous-action',
          statut: StatutEnum.A_VENIR,
          observation: {
            resultat: false,
            anneeResultat: 2025,
            objectif: true,
            anneeObjectif: 2030,
          },
        }),
      ]);
    });

    test.each(['31/02/2026', '13/2026', '2026'])(
      'refuse une date invalide ou incomplète : %s',
      async (date) => {
        await useForm({
          fiches: [actionRows({ 'Date de début prévisionnelle': date })],
        });
        const issues = await expectExtractionIssue(
          'INVALID_ELECTRIFICATION_DATE'
        );
        expect(issues[0].location).toBeTruthy();
      }
    );

    test.each([
      ['11/2026', '2026-11-01'],
      ['novembre 2026', '2026-11-01'],
      ['février 2028', '2028-02-01'],
    ])(
      'utilise le premier jour pour un mois renseigné : %s',
      async (date, expected) => {
        await useForm({
          fiches: [actionRows({ 'Date de début prévisionnelle': date })],
        });
        const fiche = (await prepared()).prepared.fiches[0];
        assert(fiche.mode === 'create');
        expect(fiche.champs.dateDebut).toBe(expected);
      }
    );

    test.each(['5 à 6', '1e3', '1e-3', '5à6'])(
      'refuse une valeur ambiguë au lieu de prendre le premier nombre : %s',
      async (value) => {
        const rows = actionRows();
        rows.splice(23, 1, [
          { text: '' },
          { text: 'Énergie économisée (MWh)', columnSpan: 2 },
          { text: `${value} (2025)` },
          { text: '10' },
        ]);
        await useForm({ fiches: [rows] });
        await expectExtractionIssue('INVALID_ELECTRIFICATION_INDICATEUR');
      }
    );

    test('conserve l’unité Nombre quand le titre apporte une précision entre parenthèses', async () => {
      const rows = actionRows();
      rows.splice(23, 1, [
        { text: '' },
        { text: 'Nombre de ménages (dont précaires)', columnSpan: 2 },
        { text: '0 (2025)' },
        { text: '10' },
      ]);
      await useForm({ fiches: [rows] });
      const fiche = (await prepared()).prepared.fiches[0];
      assert(fiche.mode === 'create');
      expect(fiche.indicateurs[0]).toMatchObject({
        mode: 'create',
        unite: 'Nombre',
      });
    });

    test.each([
      'unknown-field',
      'duplicate-field',
      'unknown-table',
      'nested-table',
    ] as const)(
      'refuse une structure ambiguë sans omettre des données : %s',
      async (kind) => {
        const rows = actionRows();
        let extra: (Paragraph | Table)[] = [];
        if (kind === 'unknown-field')
          rows.splice(8, 0, [
            { text: 'Information nouvelle' },
            { text: 'Valeur renseignée', columnSpan: 4 },
          ]);
        if (kind === 'duplicate-field')
          rows.splice(8, 0, [
            { text: "Intitulé de l'action" },
            { text: 'Autre titre', columnSpan: 4 },
          ]);
        if (kind === 'unknown-table')
          extra = [
            table([
              [{ text: 'Colonne inconnue' }, { text: 'Contenu renseigné' }],
            ]),
          ];
        if (kind === 'nested-table')
          extra = [
            new Table({
              rows: [
                new TableRow({
                  children: [
                    new TableCell({
                      children: [table([[{ text: 'Contenu imbriqué' }]])],
                    }),
                  ],
                }),
              ],
            }),
          ];
        await useForm({ fiches: [rows], extra });
        await expectExtractionIssue(
          kind === 'duplicate-field'
            ? 'INVALID_ELECTRIFICATION_FIELD'
            : 'UNSUPPORTED_ELECTRIFICATION_STRUCTURE'
        );
      }
    );

    test('refuse le canevas entièrement vierge sans produire de checkpoint', async () => {
      await useForm({ fiches: [] });
      const onCheckpoint = vi.fn();
      const result = await prepareService.prepare(
        { collectiviteId: context.collectiviteId, document, onCheckpoint },
        { user: context.user }
      );
      assert(!result.success, JSON.stringify(result));
      expect(result.error).toContainEqual(
        expect.objectContaining({ code: 'INVALID_ELECTRIFICATION_DOCUMENT' })
      );
      expect(onCheckpoint).not.toHaveBeenCalled();
    });

    test('refuse le contenu ajouté hors des tableaux B pour éviter une omission', async () => {
      await useForm({
        extra: [new Paragraph('Une autre action à importer hors du tableau')],
      });
      await expectExtractionIssue('UNSUPPORTED_ELECTRIFICATION_STRUCTURE');
    });

    test('refuse une section A non reconnue même si les fiches B sont lisibles', async () => {
      await useForm({
        engagementsHeading:
          'Engagements retenus sans identification de section',
      });
      await expectExtractionIssue('UNSUPPORTED_ELECTRIFICATION_STRUCTURE');
    });

    test.each(['1.2', 'Axe999x'])(
      'refuse un numéro d’axe mal formé : %s',
      async (axe) => {
        await useForm({ fiches: [actionRows({ Axe: axe })] });
        await expectExtractionIssue('INVALID_ELECTRIFICATION_FIELD');
      }
    );

    test('refuse un numéro de sous-axe comportant un niveau supplémentaire', async () => {
      await useForm({
        fiches: [actionRows({ 'Sous-axe (facultatif)': '1.1.2' })],
      });
      await expectExtractionIssue('INVALID_ELECTRIFICATION_FIELD');
    });

    test('refuse un code et un lien réunis dans la même cellule de référence', async () => {
      await useForm({
        fiches: [
          actionRows({
            "Code de l'action de référence ou URL de l'action (facultatif)": {
              prefix: 'test-A ',
              text: 'Fiche existante',
              target: `https://app.territoiresentransitions.fr/collectivite/${context.collectiviteId}/plans/fiches/123`,
            },
          }),
        ],
      });
      await expectExtractionIssue('CONFLICTING_EXTRACTION_REFERENCES');
    });

    test.each(['csv', 'xlsx', 'pdf'] as const)(
      'refuse le format %s pour ce profil',
      async (format) => {
        // La préparation refuse le type avant de consulter le contenu du document.
        document = { ...document, kind: format };
        await expectExtractionIssue('UNSUPPORTED_ELECTRIFICATION_DOCUMENT');
      }
    );

    test.each([
      ['Date de début prévisionnelle', '2026', 'INVALID_ELECTRIFICATION_DATE'],
      [
        "État d'avancement au moment de la signature",
        'Statut inconnu',
        'INVALID_ELECTRIFICATION_FIELD',
      ],
    ])(
      'refuse un champ invalide même pour une fiche référencée par URL : %s',
      async (label, value, code) => {
        const [existing] = await db.db
          .insert(ficheActionTable)
          .values({
            collectiviteId: context.collectiviteId,
            titre: 'Titre conservé',
          })
          .returning();
        expectedCounts[1] = 1;
        await useForm({
          fiches: [
            actionRows({
              "Code de l'action de référence ou URL de l'action (facultatif)": {
                text: 'Fiche existante',
                target: `https://app.territoiresentransitions.fr/collectivite/${context.collectiviteId}/plans/fiches/${existing.id}`,
              },
              [label]: value,
            }),
          ],
        });
        const onCheckpoint = vi.fn();
        const result = await prepareService.prepare(
          { collectiviteId: context.collectiviteId, document, onCheckpoint },
          { user: context.user }
        );
        assert(!result.success, JSON.stringify(result));
        expect(result.error).toContainEqual(
          expect.objectContaining({
            code,
            kind: 'document-error',
            location: expect.any(String),
          })
        );
        expect(onCheckpoint).not.toHaveBeenCalled();
        expect(
          await db.db
            .select()
            .from(ficheActionTable)
            .where(eq(ficheActionTable.id, existing.id))
        ).toEqual([existing]);
      }
    );

    test('utilise la destination du lien Word et conserve la fiche existante à l’identique', async () => {
      const [existing] = await db.db
        .insert(ficheActionTable)
        .values({
          collectiviteId: context.collectiviteId,
          titre: 'Titre conservé',
          description: 'Description conservée',
        })
        .returning();
      expectedCounts[1] = 1;
      await useForm({
        fiches: [
          actionRows({
            "Code de l'action de référence ou URL de l'action (facultatif)": {
              text: 'Fiche existante',
              target: `https://app.territoiresentransitions.fr/collectivite/${context.collectiviteId}/plans/fiches/${existing.id}`,
            },
          }),
        ],
      });
      const result = await prepared();
      expect(result.prepared.fiches[0]).toMatchObject({
        mode: 'link',
        ficheId: existing.id,
      });
      expect(result.checkpoint.response.fiches[0]).not.toHaveProperty(
        'ficheId'
      );
      expect(
        await db.db
          .select()
          .from(ficheActionTable)
          .where(eq(ficheActionTable.id, existing.id))
      ).toEqual([existing]);
      await db.db
        .delete(ficheActionTable)
        .where(eq(ficheActionTable.id, existing.id));
      expectedCounts[1] = 0;
      const resumed = await prepareService.prepare(
        {
          collectiviteId: context.collectiviteId,
          resumeFrom: result.checkpoint,
        },
        { user: context.user }
      );
      assert(!resumed.success, JSON.stringify(resumed));
      expect(resumed.error).toContainEqual(
        expect.objectContaining({ code: 'FICHE_REFERENCE_UNAVAILABLE' })
      );
    });

    test('conserve un checkpoint lorsque la référence documentaire est inconnue', async () => {
      await useForm({
        fiches: [
          actionRows({
            "Code de l'action de référence ou URL de l'action (facultatif)":
              'code-inconnu',
          }),
        ],
      });
      const onCheckpoint = vi.fn();
      const result = await prepareService.prepare(
        { collectiviteId: context.collectiviteId, document, onCheckpoint },
        { user: context.user }
      );
      assert(!result.success, JSON.stringify(result));
      expect(result.error).toContainEqual(
        expect.objectContaining({ code: 'UNKNOWN_FICHE_REFERENCE' })
      );
      expect(onCheckpoint).toHaveBeenCalledTimes(1);
      expect(
        onCheckpoint.mock.calls[0][0].response.fiches[0].reference.value
      ).toBe('code-inconnu');
    });

    test('reprend le checkpoint et revérifie les correspondances du catalogue', async () => {
      await useForm({
        fiches: [
          actionRows({
            "Code de l'action de référence ou URL de l'action (facultatif)":
              'test-A',
          }),
        ],
      });
      const result = await prepared();
      const resumed = await prepareService.prepare(
        {
          collectiviteId: context.collectiviteId,
          resumeFrom: result.checkpoint,
        },
        { user: context.user }
      );
      expect(resumed).toEqual(success(result));
      action().validation = 'pending';
      const changed = await prepareService.prepare(
        {
          collectiviteId: context.collectiviteId,
          resumeFrom: result.checkpoint,
        },
        { user: context.user }
      );
      assert(!changed.success, JSON.stringify(changed));
      expect(changed.error).toContainEqual(
        expect.objectContaining({ code: 'FICHES_CONFIG_UNAVAILABLE' })
      );
    });

    test('refuse la reprise avec les droits d’une autre collectivité', async () => {
      const result = await prepared();
      const other = await createContext();
      const resumed = await prepareService.prepare(
        {
          collectiviteId: context.collectiviteId,
          resumeFrom: result.checkpoint,
        },
        { user: other.user }
      );
      assert(!resumed.success, JSON.stringify(resumed));
      expect(resumed.error).toContainEqual(
        expect.objectContaining({ code: 'UNAUTHORIZED' })
      );
    });

    test.each([
      'profile',
      'schemaVersion',
      'catalogueVersion',
      'templateVersion',
    ] as const)('refuse une reprise incompatible : %s', async (field) => {
      const { checkpoint } = await prepared();
      const incompatible = {
        ...checkpoint,
        [field]: typeof checkpoint[field] === 'number' ? 999 : 'incompatible',
      };
      const result = await prepareService.prepare(
        { collectiviteId: context.collectiviteId, resumeFrom: incompatible },
        { user: context.user }
      );
      assert(!result.success, JSON.stringify(result));
      expect(result.error).toContainEqual(
        expect.objectContaining({
          code: 'INCOMPATIBLE_ELECTRIFICATION_CHECKPOINT',
        })
      );
    });

    test('rejette une source documentaire altérée dans le checkpoint', async () => {
      const { checkpoint } = await prepared();
      checkpoint.response.fiches[0].source = 'source-inventée';
      const result = await prepareService.prepare(
        { collectiviteId: context.collectiviteId, resumeFrom: checkpoint },
        { user: context.user }
      );
      assert(!result.success, JSON.stringify(result));
      expect(result.error).toContainEqual(
        expect.objectContaining({ code: 'INVALID_EXTRACTION_SOURCE' })
      );
    });

    const configureEngagementTargets = async (codes: string[]) => {
      const definitions = config.engagements
        .filter(({ code }) => codes.includes(code))
        .flatMap((engagement) =>
          engagement.cibles.map((cible) => {
            cible.identifiantReferentiel = `test-document-${randomUUID()}`;
            cible.validation = 'validated';
            cible.periodicite = 'annuelle';
            return {
              identifiantReferentiel: cible.identifiantReferentiel,
              titre: `${engagement.code} ${cible.key}`,
              unite: cible.unite,
              periodicite: 'annuelle' as const,
            };
          })
        );
      await db.db.insert(indicateurDefinitionTable).values(definitions);
    };

    describe('Interprétation IA ciblée des valeurs non reconnues', () => {
      const observationText = 'Le résultat atteint 42 MWh en 2025';
      const observationValue = () => ({
        key: 'valeur',
        number: '42',
        unit: 'MWh',
        year: '2025',
        quote: '42 MWh en 2025',
      });
      const useObservation = async (
        text = observationText,
        fields: Parameters<typeof actionRows>[0] = {}
      ) => {
        const rows = actionRows(fields);
        rows.splice(23, 1, [
          { text: '' },
          { text: 'Énergie économisée (MWh)', columnSpan: 2 },
          { text },
          { text: '10' },
        ]);
        await useForm({ fiches: [rows] });
      };
      const targetRows = () => {
        const engagements = structuredClone(template.sections[0].rows);
        engagements[7][2].text = 'Oui';
        engagements[7][3].text = '20 bornes rapides sur un total de 100';
        return engagements;
      };
      const respondWith = (values: unknown[]) => {
        expectedInterpretationCalls = 1;
        generate.mockResolvedValue(
          success({
            data: { values },
            tokens: {
              ...emptyTokenUsage(),
              promptTokens: 12,
              candidatesTokens: 8,
              totalTokens: 20,
            },
          })
        );
      };

      test('conserve les sources des deux cibles interprétées et reprend sans nouvel appel', async () => {
        await configureEngagementTargets(['E07']);
        const engagements = targetRows();
        await useForm({ engagements, fiches: [] });
        const values = [
          {
            key: 'rapides',
            number: '20',
            unit: null,
            year: null,
            quote: '20 bornes rapides',
          },
          {
            key: 'total',
            number: '100',
            unit: null,
            year: null,
            quote: 'un total de 100',
          },
        ];
        respondWith(values);

        const result = await prepared();

        expect(
          result.prepared.cibles.map(({ key, objectif }) => ({ key, objectif }))
        ).toEqual([
          { key: 'engagement:E07:total', objectif: 100 },
          { key: 'engagement:E07:rapides', objectif: 20 },
        ]);
        expect(result.checkpoint.interpretations).toEqual([
          expect.objectContaining({ sourceId: expect.any(String), values }),
        ]);
        const [interpretation] = result.checkpoint.interpretations;
        expect(
          result.checkpoint.sources.find(
            ({ id }) => id === interpretation.sourceId
          )
        ).toMatchObject({ text: engagements[7][3].text });
        expect(result.checkpoint.tokens).toMatchObject({ totalTokens: 20 });

        const resumed = await prepareService.prepare(
          {
            collectiviteId: context.collectiviteId,
            resumeFrom: result.checkpoint,
          },
          { user: context.user }
        );
        expect(resumed).toEqual(success(result));
      });

      test('interprète une observation explicite et conserve son unité et son année', async () => {
        await useObservation();
        respondWith([observationValue()]);

        const result = await prepared();

        const fiche = result.prepared.fiches[0];
        assert(fiche.mode === 'create');
        expect(fiche.indicateurs[0]).toMatchObject({
          mode: 'create',
          unite: 'MWh',
          valeurs: [
            { dateValeur: '2025-01-01', resultat: 42, objectif: null },
            { dateValeur: '2030-01-01', resultat: null, objectif: 10 },
          ],
        });
        expect(result.checkpoint.interpretations).toEqual([
          expect.objectContaining({
            sourceId: expect.any(String),
            values: [observationValue()],
          }),
        ]);
        expect(result.checkpoint.sources).toContainEqual(
          expect.objectContaining({ text: observationText })
        );
        const [request] = generate.mock.calls[0];
        expect(request.prompt).toContain(observationText);
        expect(request.prompt).not.toContain(
          'Annexe 3 – Plan d’action détaillé'
        );
      });

      test('recopie le texte libre sans demander au modèle de le reformuler', async () => {
        await useForm({
          fiches: [actionRows({ "Description de l'action": observationText })],
        });
        const result = await prepared();
        expect(result.prepared.fiches[0]).toMatchObject({
          mode: 'create',
          champs: { description: observationText },
        });
        expect(result.checkpoint.interpretations).toEqual([]);
      });

      test('garde le chemin déterministe pour les valeurs lisibles', async () => {
        await useObservation('42 MWh en 2025');
        const result = await prepared();
        expect(result.checkpoint.interpretations).toEqual([]);
        expect(result.checkpoint.tokens).toEqual(emptyTokenUsage());
      });

      test('ne demande pas au modèle de transformer un nombre en Oui/Non', async () => {
        const rows = actionRows();
        rows.splice(23, 1, [
          { text: '' },
          { text: 'Jalon atteint (Oui/Non)', columnSpan: 2 },
          { text: observationText },
          { text: 'Oui' },
        ]);
        await useForm({ fiches: [rows] });

        await expectExtractionIssue('INVALID_ELECTRIFICATION_INDICATEUR');
      });

      test.each([
        '30 % si financement obtenu',
        "La cible n'est pas 30 %",
        'Environ 30 %',
      ])(
        'ne transforme pas une cible conditionnelle ou incertaine en valeur : %s',
        async (text) => {
          const engagements = structuredClone(template.sections[0].rows);
          engagements[1][2].text = 'Oui';
          engagements[1][3].text = text;
          await useForm({ engagements, fiches: [] });

          await expectExtractionIssue('INVALID_ELECTRIFICATION_TARGET');
        }
      );

      test('valide la date avant une observation à interpréter dans la même fiche', async () => {
        await useObservation(observationText, {
          'Date de début prévisionnelle': '2026',
        });

        await expectExtractionIssue('INVALID_ELECTRIFICATION_DATE');
      });

      test.each([
        [
          'Date de début prévisionnelle',
          '2026',
          'INVALID_ELECTRIFICATION_DATE',
        ],
        [
          "État d'avancement au moment de la signature",
          'Statut inconnu',
          'INVALID_ELECTRIFICATION_FIELD',
        ],
      ])(
        'valide une fiche liée avant toute interprétation des cibles : %s',
        async (label, value, code) => {
          const [existing] = await db.db
            .insert(ficheActionTable)
            .values({
              collectiviteId: context.collectiviteId,
              titre: 'Titre conservé',
            })
            .returning();
          expectedCounts[1] = 1;
          await useForm({
            engagements: targetRows(),
            fiches: [
              actionRows({
                "Code de l'action de référence ou URL de l'action (facultatif)":
                  {
                    text: 'Fiche existante',
                    target: `https://app.territoiresentransitions.fr/collectivite/${context.collectiviteId}/plans/fiches/${existing.id}`,
                  },
                [label]: value,
              }),
            ],
          });

          const result = await prepare();

          assert(!result.success, JSON.stringify(result));
          expect(result.error).toContainEqual(
            expect.objectContaining({ code })
          );
          expect(
            await db.db
              .select()
              .from(ficheActionTable)
              .where(eq(ficheActionTable.id, existing.id))
          ).toEqual([existing]);
        }
      );

      test.each([
        ['Entre 20 et 30 MWh en 2025', 'INVALID_ELECTRIFICATION_INDICATEUR'],
        ['2025', 'MISSING_INDICATEUR_YEAR'],
      ])(
        'ne demande pas à l’IA de compléter une valeur ambiguë ou absente : %s',
        async (text, code) => {
          await useObservation(text);
          const result = await prepare();
          assert(!result.success, JSON.stringify(result));
          expect(result.error).toContainEqual(
            expect.objectContaining({
              code,
              location: expect.any(String),
            })
          );
        }
      );

      test.each([
        ['nombre inventé', { ...observationValue(), number: '99' }],
        [
          'citation inventée',
          { ...observationValue(), quote: '42 MWh durant 2025' },
        ],
        ['clé inconnue', { ...observationValue(), key: 'inventée' }],
        ['année omise', { ...observationValue(), year: null }],
      ])(
        'refuse une interprétation non justifiée : %s',
        async (_reason, value) => {
          await useObservation();
          respondWith([value]);
          const onCheckpoint = vi.fn();

          const result = await prepareService.prepare(
            {
              collectiviteId: context.collectiviteId,
              document,
              onCheckpoint,
            },
            { user: context.user }
          );

          assert(!result.success, JSON.stringify(result));
          expect(result.error).toContainEqual(
            expect.objectContaining({
              code: 'INVALID_ELECTRIFICATION_VALUE_INTERPRETATION',
              kind: 'document-error',
              location: expect.any(String),
            })
          );
          expect(onCheckpoint).not.toHaveBeenCalled();
        }
      );

      test('refuse une interprétation qui omet un autre nombre du champ', async () => {
        await useObservation(`${observationText}, soit 53 unités`);
        respondWith([observationValue()]);
        const result = await prepare();
        assert(!result.success, JSON.stringify(result));
        expect(result.error).toContainEqual(
          expect.objectContaining({
            code: 'INVALID_ELECTRIFICATION_VALUE_INTERPRETATION',
          })
        );
      });

      test.each([null, 'kWh'])(
        'refuse une unité source incompatible même si le modèle renvoie %s',
        async (unit) => {
          await useObservation('Le résultat atteint 42 kWh en 2025');
          respondWith([
            {
              ...observationValue(),
              unit,
              quote: '42 kWh en 2025',
            },
          ]);

          const result = await prepare();

          assert(!result.success, JSON.stringify(result));
          expect(result.error).toContainEqual(
            expect.objectContaining({
              code: 'INVALID_ELECTRIFICATION_VALUE_INTERPRETATION',
              location: expect.any(String),
            })
          );
        }
      );

      test('revérifie les citations du checkpoint sans rappeler le modèle', async () => {
        await useObservation();
        respondWith([observationValue()]);
        const { checkpoint } = await prepared();
        checkpoint.interpretations[0].values[0].quote = '42 MWh durant 2025';
        const onCheckpoint = vi.fn();

        const result = await prepareService.prepare(
          {
            collectiviteId: context.collectiviteId,
            resumeFrom: checkpoint,
            onCheckpoint,
          },
          { user: context.user }
        );

        assert(!result.success, JSON.stringify(result));
        expect(result.error).toContainEqual(
          expect.objectContaining({
            code: 'INCOMPATIBLE_ELECTRIFICATION_CHECKPOINT',
          })
        );
        expect(onCheckpoint).not.toHaveBeenCalled();
      });

      test('respecte une annulation avant tout appel au modèle', async () => {
        await useObservation();
        const controller = new AbortController();
        controller.abort();
        const onCheckpoint = vi.fn();

        await expect(
          prepareService.prepare(
            {
              collectiviteId: context.collectiviteId,
              document,
              signal: controller.signal,
              onCheckpoint,
            },
            { user: context.user }
          )
        ).rejects.toMatchObject({ name: 'AbortError' });
        expect(onCheckpoint).not.toHaveBeenCalled();
      });

      test('conserve un blocage localisé lorsque le modèle ne propose aucune valeur', async () => {
        await useObservation();
        respondWith([]);
        const result = await prepare();
        assert(!result.success, JSON.stringify(result));
        expect(result.error).toContainEqual(
          expect.objectContaining({
            code: 'INVALID_ELECTRIFICATION_VALUE_INTERPRETATION',
            location: expect.any(String),
          })
        );
      });

      test('ne produit pas de checkpoint lorsque le fournisseur échoue', async () => {
        await useObservation();
        expectedInterpretationCalls = 1;
        generate.mockResolvedValue(
          failure({ kind: 'api_error', httpStatus: 503 })
        );
        const onCheckpoint = vi.fn();

        const result = await prepareService.prepare(
          {
            collectiviteId: context.collectiviteId,
            document,
            onCheckpoint,
          },
          { user: context.user }
        );

        assert(!result.success, JSON.stringify(result));
        expect(result.error).toContainEqual(
          expect.objectContaining({
            code: 'AI_VALUE_INTERPRETATION_FAILED',
            kind: 'processing-error',
            location: expect.any(String),
          })
        );
        expect(onCheckpoint).not.toHaveBeenCalled();
      });
    });

    test('lit les cibles A, les cellules fusionnées et les nombres français sans perdre zéro ni absence', async () => {
      await configureEngagementTargets(['E01', 'E02', 'E07', 'E09', 'E10']);
      const engagements = structuredClone(template.sections[0].rows);
      engagements[1][2].text = 'Oui';
      engagements[1][3].text = '0 %';
      // La seconde ligne partage la cellule Axe 1 avec la première.
      engagements[2][1].text = 'Oui';
      engagements[2][2].text = '12,5';
      engagements[7][2].text = 'Oui';
      engagements[7][3].text = '100 bornes publiques dont 20 rapides';
      engagements[10][2].text = 'Oui';
      engagements[11][2].text = 'Oui';
      engagements[11][3].text = '1\u202f200,5 MWh en 2030';
      await useForm({ engagements, fiches: [] });
      const result = await prepared();
      expect(
        result.prepared.cibles.map(({ key, objectif, unite, dateValeur }) => ({
          key,
          objectif,
          unite,
          dateValeur,
        }))
      ).toEqual([
        {
          key: 'engagement:E01:principale',
          objectif: 0,
          unite: '%',
          dateValeur: '2030-01-01',
        },
        {
          key: 'engagement:E02:principale',
          objectif: 12.5,
          unite: '%',
          dateValeur: '2030-01-01',
        },
        {
          key: 'engagement:E07:total',
          objectif: 100,
          unite: 'Nombre de bornes',
          dateValeur: '2030-01-01',
        },
        {
          key: 'engagement:E07:rapides',
          objectif: 20,
          unite: 'Nombre de bornes',
          dateValeur: '2030-01-01',
        },
        {
          key: 'engagement:E09:principale',
          objectif: null,
          unite: 'nb',
          dateValeur: '2030-01-01',
        },
        {
          key: 'engagement:E10:principale',
          objectif: 1200.5,
          unite: 'MWh',
          dateValeur: '2030-01-01',
        },
      ]);
      expect(result.prepared.report.issues).toContainEqual(
        expect.objectContaining({
          code: 'EMPTY_ENGAGEMENT_TARGET',
          kind: 'warning',
        })
      );
    });

    test('adapte le nombre d’artisans en nb à l’extraction et à la reprise du checkpoint documentaire', async () => {
      await configureEngagementTargets([
        EngagementCode.ELECTRIFICATION_ARTISANS,
      ]);
      const engagements = structuredClone(template.sections[0].rows);
      engagements[10][2].text = 'Oui';
      engagements[10][3].text = '40 artisans';
      await useForm({ engagements, fiches: [] });

      const result = await prepared();

      expect(result.checkpoint.response.engagements).toEqual([
        expect.objectContaining({
          code: EngagementCode.ELECTRIFICATION_ARTISANS,
          cibles: [expect.objectContaining({ valeur: 40, unite: 'Nombre' })],
        }),
      ]);
      expect(result.prepared.cibles).toEqual([
        expect.objectContaining({
          engagementCode: EngagementCode.ELECTRIFICATION_ARTISANS,
          objectif: 40,
          unite: 'nb',
          periodicite: 'annuelle',
          dateValeur: '2030-01-01',
        }),
      ]);

      const resumed = await prepareService.prepare(
        {
          collectiviteId: context.collectiviteId,
          resumeFrom: result.checkpoint,
        },
        { user: context.user }
      );

      expect(resumed).toEqual(success(result));
    });

    test.each([
      {
        code: EngagementCode.ELECTRIFICATION_ARTISANS,
        row: 10,
        text: '40 artisans',
        unite: '%',
      },
      {
        code: EngagementCode.SORTIE_FIOUL_LOGEMENTS_PRIVES,
        row: 1,
        text: '40 %',
        unite: 'Nombre',
      },
    ])(
      'refuse l’unité $unite pour $code à la reprise sans normalisation générale',
      async ({ code, row, text, unite }) => {
        await configureEngagementTargets([code]);
        const engagements = structuredClone(template.sections[0].rows);
        engagements[row][2].text = 'Oui';
        engagements[row][3].text = text;
        await useForm({ engagements, fiches: [] });
        const { checkpoint } = await prepared();
        checkpoint.response.engagements[0].cibles[0].unite = unite;

        const result = await prepareService.prepare(
          { collectiviteId: context.collectiviteId, resumeFrom: checkpoint },
          { user: context.user }
        );

        assert(!result.success, JSON.stringify(result));
        expect(result.error).toContainEqual(
          expect.objectContaining({ code: 'INVALID_ENGAGEMENT_UNIT' })
        );
      }
    );

    test.each([
      ['total: 100; rapides: 0', 100, 0],
      ['20 bornes rapides', null, 20],
    ])(
      'conserve les cibles E07 explicitement identifiées : %s',
      async (value, total, rapides) => {
        await configureEngagementTargets(['E07']);
        const engagements = structuredClone(template.sections[0].rows);
        engagements[7][2].text = 'Oui';
        engagements[7][3].text = String(value);
        await useForm({ engagements, fiches: [] });
        expect(
          (await prepared()).prepared.cibles.map(({ objectif }) => objectif)
        ).toEqual([total, rapides]);
      }
    );

    test.each([
      '100;20',
      '100 bornes publiques dont 20 rapides ≥150 kW',
      '100 bornes en 2029',
    ])('refuse une cible E07 ambiguë : %s', async (value) => {
      const engagements = structuredClone(template.sections[0].rows);
      engagements[7][2].text = 'Oui';
      engagements[7][3].text = value;
      await useForm({ engagements, fiches: [] });
      await expectExtractionIssue('INVALID_ELECTRIFICATION_TARGET');
    });

    test.each(['x', ''])(
      'refuse une cible renseignée sans sélection oui/non explicite : "%s"',
      async (value) => {
        const engagements = structuredClone(template.sections[0].rows);
        engagements[1][2].text = value;
        engagements[1][3].text = '15';
        await useForm({ engagements, fiches: [] });
        await expectExtractionIssue('INVALID_ELECTRIFICATION_SELECTION');
      }
    );

    test('conserve le canevas après renommage du titre métier d’un axe', async () => {
      const axe = config.axes.find(({ numero }) => numero === 1);
      assert(axe);
      axe.titre = 'Titre métier renommé';
      await configureEngagementTargets(['E02']);
      const engagements = structuredClone(template.sections[0].rows);
      // E02 hérite de la cellule fusionnée de E01, laissé non sélectionné.
      engagements[2][1].text = 'Oui';
      engagements[2][2].text = '25';
      await useForm({ engagements });

      const result = await prepared();

      expect(result.prepared.axes).toEqual([
        expect.objectContaining({
          numero: '1',
          titre: 'Axe 1. Titre métier renommé',
        }),
      ]);
      expect(result.prepared.engagements).toEqual([
        expect.objectContaining({ code: 'E02', axeKey: 'axe:1' }),
      ]);
      expect(result.prepared.fiches).toEqual([
        expect.objectContaining({ axeKey: 'axe:1' }),
      ]);
      expect(result.checkpoint.sources).toContainEqual(
        expect.objectContaining({
          text: expect.stringContaining('Axe 1. Logements privés'),
        })
      );
    });

    test.each([
      'Axe 4. Titre métier renommé',
      'Axe 7. Recharge des poids lourds',
    ])(
      'refuse un titre d’axe étranger à la ligne du canevas : %s',
      async (label) => {
        const axe = config.axes.find(({ numero }) => numero === 4);
        assert(axe);
        axe.titre = 'Titre métier renommé';
        const engagements = structuredClone(template.sections[0].rows);
        engagements[5][0].text = label;
        engagements[5][2].text = 'Oui';
        await useForm({ engagements, fiches: [] });

        await expectExtractionIssue('INVALID_ELECTRIFICATION_ENGAGEMENT');
      }
    );

    test('refuse un axe officiel absent du catalogue métier', async () => {
      config.axes = config.axes.filter(({ numero }) => numero !== 4);
      const engagements = structuredClone(template.sections[0].rows);
      engagements[5][2].text = 'Oui';
      await useForm({ engagements, fiches: [] });

      await expectExtractionIssue('INVALID_ELECTRIFICATION_ENGAGEMENT');
    });

    test('refuse un engagement sélectionné dont le libellé fixe a été modifié', async () => {
      const engagements = structuredClone(template.sections[0].rows);
      engagements[5][1].text = 'Un nouvel engagement inconnu';
      engagements[5][2].text = 'Oui';
      await useForm({ engagements, fiches: [] });
      await expectExtractionIssue('INVALID_ELECTRIFICATION_ENGAGEMENT');
    });

    test('refuse une cellule supplémentaire dans A sans en perdre le contenu', async () => {
      const engagements = structuredClone(template.sections[0].rows);
      engagements[5][2].text = 'Oui';
      engagements[5].push({ text: 'Information supplémentaire renseignée' });
      await useForm({ engagements, fiches: [] });
      await expectExtractionIssue('INVALID_ELECTRIFICATION_ENGAGEMENT_TABLE');
    });
  });
});
