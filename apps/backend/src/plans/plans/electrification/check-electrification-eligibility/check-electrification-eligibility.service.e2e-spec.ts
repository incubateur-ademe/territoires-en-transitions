import { INestApplication } from '@nestjs/common';
import { addTestCollectiviteAndUser } from '@tet/backend/collectivites/collectivites/collectivites.test-fixture';
import { GenerateImportDraftWorker } from '@tet/backend/plans/ai-plan-import/generate-import-draft/generate-import-draft.worker';
import { axeTable } from '@tet/backend/plans/fiches/shared/models/axe.table';
import { ficheActionTable } from '@tet/backend/plans/fiches/shared/models/fiche-action.table';
import {
  getAuthUserFromUserCredentials,
  getDisposableTestApp,
  getTestDatabase,
} from '@tet/backend/test';
import { PermissionService } from '@tet/backend/users/authorizations/permission.service';
import { DatabaseService } from '@tet/backend/utils/database/database.service';
import { LlmService } from '@tet/backend/utils/llm/llm.service';
import { FakeLlmRepository } from '@tet/backend/utils/llm/repositories/fake/fake-llm.repository';
import {
  ElectrificationLaureatsConfig,
  electrificationLaureatsConfig,
  electrificationLaureatsConfigSchema,
} from '@tet/domain/plans';
import { CollectiviteRole } from '@tet/domain/users';
import { count, eq } from 'drizzle-orm';
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
import { CheckElectrificationEligibilityService } from './check-electrification-eligibility.service';
import { ELECTRIFICATION_LAUREATS_CONFIG } from '../config/electrification-eligibility.constants';

describe('Éligibilité au programme Électrification', () => {
  const llm = new FakeLlmRepository();
  let app: INestApplication;
  let db: DatabaseService;
  let service: CheckElectrificationEligibilityService;
  let context: Awaited<ReturnType<typeof createContext>>;
  const fixture = {
    source: 'Liste de lauréats — fixture synthétique',
    version: 'test-laureats-v1',
    validFrom: '2026-01-01T00:00:00.000Z',
    validUntil: '2027-01-01T00:00:00.000Z',
    laureats: [],
  } satisfies ElectrificationLaureatsConfig;
  const config: ElectrificationLaureatsConfig = structuredClone(fixture);
  const checkedAt = '2026-06-01T12:00:00.000Z';

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
  const check = () =>
    service.check(
      { collectiviteId: context.collectiviteId },
      { user: context.user }
    );

  beforeAll(async () => {
    app = await getDisposableTestApp({
      overrides: (builder) => {
        builder.overrideProvider(LlmService).useValue(new LlmService(llm));
        builder.overrideProvider(GenerateImportDraftWorker).useValue({});
        builder
          .overrideProvider(ELECTRIFICATION_LAUREATS_CONFIG)
          .useValue(config);
      },
    });
    db = await getTestDatabase(app);
    service = app.get(CheckElectrificationEligibilityService);
  });
  beforeEach(async () => {
    vi.spyOn(llm, 'complete');
    vi.spyOn(llm, 'chat');
    Object.assign(config, structuredClone(fixture));
    context = await createContext();
    config.laureats = [
      { reference: 'laureat-test', collectiviteId: context.collectiviteId },
    ];
    vi.spyOn(Date, 'now').mockReturnValue(Date.parse(checkedAt));
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
    ]);
    expect(counts).toEqual([[{ count: 0 }], [{ count: 0 }]]);
  });
  afterAll(async () => {
    await app?.close();
  });

  test('identifie un lauréat avec la source, la version et la validité de la décision', async () => {
    expect(await check()).toEqual({
      success: true,
      data: {
        eligible: true,
        laureatReference: 'laureat-test',
        provenance: {
          source: config.source,
          version: config.version,
          validFrom: config.validFrom,
          validUntil: config.validUntil,
          checkedAt,
        },
      },
    });
  });

  test("refuse l'éligibilité à l'import d'une collectivité absente du mapping", async () => {
    const other = await createContext();
    config.laureats[0].collectiviteId = other.collectiviteId;
    expect(await check()).toMatchObject({
      success: true,
      data: {
        eligible: false,
        laureatReference: null,
        provenance: { version: config.version },
      },
    });
  });

  test('une liste vide peut établir la non-éligibilité', async () => {
    config.laureats = [];
    expect(await check()).toMatchObject({
      success: true,
      data: { eligible: false },
    });
  });

  test('une configuration non livrée reste indisponible', async () => {
    const unavailable = new CheckElectrificationEligibilityService(
      null,
      app.get(PermissionService)
    );
    expect(
      await unavailable.check(
        { collectiviteId: context.collectiviteId },
        { user: context.user }
      )
    ).toEqual({
      success: false,
      error: 'ELECTRIFICATION_LAUREATS_UNAVAILABLE',
    });
  });

  test('le mapping livré conserve les identités corrigées et des rattachements uniques', () => {
    const delivered = electrificationLaureatsConfigSchema.parse(
      electrificationLaureatsConfig
    );
    expect(delivered.laureats).toEqual(
      expect.arrayContaining([
        { reference: '200070092', collectiviteId: 4323 }, // CA du Libournais
        { reference: '200035087', collectiviteId: 3980 }, // CA Terre de Provence
      ])
    );
    expect(
      new Set(delivered.laureats.map(({ reference }) => reference)).size
    ).toBe(delivered.laureats.length);
    expect(
      new Set(delivered.laureats.map(({ collectiviteId }) => collectiviteId))
        .size
    ).toBe(delivered.laureats.length);
    const unresolvedReferences = new Set([
      'grp-d59b5d2e4ffa', // PETR Pays Lédonien : correspondance erronée
      'grp-068dc0193e5e', // PETR Pays-du-Bocage : correspondance erronée
      'grp-e520acb2c2b0', // SCOT Périgord Vert : collectivité absente
      'grp-0cd41611e76d', // SIEDS : collectivité absente
    ]);
    expect(
      delivered.laureats.filter(({ reference }) =>
        unresolvedReferences.has(reference)
      )
    ).toEqual([]);
  });

  test.each([
    ['source absente', { source: '' }],
    ['version absente', { version: '  ' }],
    ['date invalide', { validUntil: 'pas-une-date' }],
    [
      'bornes inversées',
      { validFrom: fixture.validUntil, validUntil: fixture.validFrom },
    ],
    ['bornes égales', { validUntil: fixture.validFrom }],
  ])(
    'refuse une configuration invalide : %s',
    async (_description, invalid) => {
      Object.assign(config, invalid);
      expect(await check()).toEqual({
        success: false,
        error: 'INVALID_ELECTRIFICATION_LAUREATS_CONFIG',
      });
    }
  );

  test('le début de validité est inclus', async () => {
    vi.mocked(Date.now).mockReturnValue(Date.parse(config.validFrom));
    expect(await check()).toMatchObject({
      success: true,
      data: { eligible: true },
    });
  });

  test('une liste sans date de fin reste active', async () => {
    config.validUntil = null;
    vi.mocked(Date.now).mockReturnValue(Date.parse(fixture.validUntil));

    expect(await check()).toMatchObject({
      success: true,
      data: { eligible: true, provenance: { validUntil: null } },
    });
  });

  test('une liste sans date de fin respecte son début de validité', async () => {
    config.validUntil = null;
    vi.mocked(Date.now).mockReturnValue(Date.parse(config.validFrom) - 1);

    expect(await check()).toEqual({
      success: false,
      error: 'INACTIVE_ELECTRIFICATION_LAUREATS_CONFIG',
    });
  });

  test.each([
    ['pas encore valide', fixture.validFrom, -1],
    ['expire à la borne de fin', fixture.validUntil, 0],
    ['obsolète', fixture.validUntil, 1],
  ] as const)(
    'rend le profil indisponible si le mapping est %s',
    async (_description, date, offset) => {
      vi.mocked(Date.now).mockReturnValue(Date.parse(date) + offset);
      expect(await check()).toEqual({
        success: false,
        error: 'INACTIVE_ELECTRIFICATION_LAUREATS_CONFIG',
      });
    }
  );

  test('refuse un lauréat associé à plusieurs collectivités', async () => {
    const other = await createContext();
    config.laureats.push({
      reference: 'laureat-test',
      collectiviteId: other.collectiviteId,
    });
    expect(await check()).toEqual({
      success: false,
      error: 'AMBIGUOUS_ELECTRIFICATION_LAUREATS_CONFIG',
    });
  });

  test('refuse plusieurs lauréats associés à la même collectivité', async () => {
    config.laureats.push({
      reference: 'autre-laureat',
      collectiviteId: context.collectiviteId,
    });
    expect(await check()).toEqual({
      success: false,
      error: 'AMBIGUOUS_ELECTRIFICATION_LAUREATS_CONFIG',
    });
  });

  test('refuse une ligne dupliquée', async () => {
    config.laureats.push({ ...config.laureats[0] });
    expect(await check()).toEqual({
      success: false,
      error: 'AMBIGUOUS_ELECTRIFICATION_LAUREATS_CONFIG',
    });
  });

  test('vérifie les permissions avant la configuration et ne les accorde pas aux lauréats', async () => {
    const viewer = await createContext(CollectiviteRole.LECTURE);
    config.laureats.push({
      reference: 'laureat-lecture',
      collectiviteId: viewer.collectiviteId,
    });
    config.source = '';
    expect(
      await service.check(
        { collectiviteId: viewer.collectiviteId },
        { user: viewer.user }
      )
    ).toEqual({
      success: false,
      error: 'UNAUTHORIZED',
    });
    expect(
      await service.check(
        { collectiviteId: context.collectiviteId },
        { user: viewer.user }
      )
    ).toEqual({
      success: false,
      error: 'UNAUTHORIZED',
    });
  });

  test('refuse un identifiant de collectivité invalide', async () => {
    expect(
      await service.check({ collectiviteId: -1 }, { user: context.user })
    ).toEqual({
      success: false,
      error: 'INVALID_ELIGIBILITY_INPUT',
    });
  });
});
