import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
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
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import {
  ElectrificationConfig,
  electrificationConfig,
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
  vi,
} from 'vitest';
import { ELECTRIFICATION_CONFIG } from '../electrification.constants';
import { GenerateImportDraftWorker } from '../../generate-import-draft/generate-import-draft.worker';
import { ImportSource } from '../../models/import-source.schema';
import { PrepareFicheRules } from '../../prepare-fiche/prepare-fiche.rules';
import {
  ElectrificationFichesInput,
  ElectrificationIndicateurInput,
} from './electrification-fiches.schema';
import { ResolveElectrificationFichesService } from './resolve-electrification-fiches.service';

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

  test('signale une périodicité catalogue non validée comme une configuration manquante', async () => {
    definition().periodicite = null;
    fiche().indicateurs = [quantitatif('test-I')];
    await expectIssue('FICHES_CONFIG_UNAVAILABLE', 'configuration-error');
  });

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

  test.each(['absente', 'invalide', 'Ponctuelle'] as const)(
    'refuse une période %s sans inventer une date ou une fréquence',
    async (period) => {
      const indicateur = quantitatif();
      if (period === 'absente') indicateur.resultat.periode = null;
      if (period === 'invalide') indicateur.resultat.periode = '2025-99';
      if (period === 'Ponctuelle') indicateur.periodicite = 'Ponctuelle';
      fiche().indicateurs = [indicateur];
      await expectIssue('INVALID_INDICATEUR_PERIOD');
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
    await expectIssue('INVALID_INDICATEUR_PERIOD');
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
});
