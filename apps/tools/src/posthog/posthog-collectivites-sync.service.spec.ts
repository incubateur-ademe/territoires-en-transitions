import { Test, TestingModule } from '@nestjs/testing';
import { DatabaseService } from '../utils/database/database.service';
import { PostHogClientService } from './posthog-client.service';
import { PostHogCollectivitesSyncService } from './posthog-collectivites-sync.service';

const EXPECTED_KEYS = [
  'collectivite_id',
  'created_at',
  'modified_at',
  'access_restreint',
  'nom',
  'type',
  'commune_code',
  'siren',
  'nic',
  'departement_code',
  'region_code',
  'nature_insee',
  'population',
  'dans_aire_urbaine',
] as const;

const row = (overrides: Record<string, unknown> = {}) => ({
  collectivite_id: 1,
  created_at: '2024-05-14T09:46:00.000Z',
  modified_at: '2024-05-14T09:46:04.000Z',
  access_restreint: false,
  nom: 'Velleron',
  type: 'commune',
  commune_code: '84142',
  siren: null,
  nic: null,
  departement_code: '84',
  region_code: '93',
  nature_insee: 'commune',
  population: 3101,
  dans_aire_urbaine: null,
  ...overrides,
});

describe('PostHogCollectivitesSyncService', () => {
  let service: PostHogCollectivitesSyncService;
  let posthogClient: {
    isEnabled: ReturnType<typeof vi.fn>;
    groupIdentify: ReturnType<typeof vi.fn>;
    flush: ReturnType<typeof vi.fn>;
  };
  let databaseService: { db: { select: ReturnType<typeof vi.fn> } };
  let selectRows: unknown[];
  let whereCalls: unknown[][];

  type ChainMock = PromiseLike<unknown[]> & {
    [k: string]: (...args: unknown[]) => ChainMock;
  };
  const buildDrizzleChain = (): ChainMock =>
    new Proxy({} as ChainMock, {
      get(_target, prop) {
        if (prop === 'then') {
          return (resolve: (rows: unknown[]) => unknown) => resolve(selectRows);
        }
        return (...args: unknown[]) => {
          if (prop === 'where') {
            whereCalls.push(args);
          }
          return buildDrizzleChain();
        };
      },
    });

  const buildModule = async () => {
    selectRows = [];
    whereCalls = [];
    posthogClient = {
      isEnabled: vi.fn().mockReturnValue(true),
      groupIdentify: vi.fn(),
      flush: vi.fn().mockResolvedValue(undefined),
    };
    databaseService = {
      db: { select: vi.fn().mockImplementation(() => buildDrizzleChain()) },
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [PostHogCollectivitesSyncService],
    })
      .useMocker((token) => {
        if (token === PostHogClientService) return posthogClient;
        if (token === DatabaseService) return databaseService;
      })
      .compile();

    service = module.get(PostHogCollectivitesSyncService);
  };

  beforeEach(async () => {
    await buildModule();
  });

  test('ne fait rien quand le client PostHog est désactivé', async () => {
    posthogClient.isEnabled.mockReturnValue(false);
    selectRows = [row()];

    const result = await service.process();

    expect(result).toEqual({ synced: 0, skipped: true });
    expect(databaseService.db.select).not.toHaveBeenCalled();
    expect(posthogClient.groupIdentify).not.toHaveBeenCalled();
  });

  test('rejette le job quand aucune collectivité n’est lue', async () => {
    selectRows = [];

    await expect(service.process()).rejects.toThrow(/aucune collectivité lue/i);

    expect(posthogClient.groupIdentify).not.toHaveBeenCalled();
    expect(posthogClient.flush).not.toHaveBeenCalled();
  });

  test('émet un $groupidentify par collectivité avec toutes les clés (null compris)', async () => {
    selectRows = [
      row({ collectivite_id: 1 }),
      row({ collectivite_id: 2 }),
      // ligne volontairement clairsemée : les clés restent présentes à null
      {
        collectivite_id: 3,
        created_at: '2024-01-01T00:00:00.000Z',
        modified_at: '2024-01-01T00:00:00.000Z',
        access_restreint: null,
        nom: 'CC Test',
        type: 'EPCI',
        commune_code: null,
        siren: '200066975',
        nic: null,
        departement_code: null,
        region_code: null,
        nature_insee: null,
        population: null,
        dans_aire_urbaine: null,
      },
    ];

    const result = await service.process();

    expect(result).toEqual({ synced: 3, skipped: false });
    expect(posthogClient.groupIdentify).toHaveBeenCalledTimes(3);

    for (const [index, expectedId] of [1, 2, 3].entries()) {
      const [groupType, groupKey, properties] =
        posthogClient.groupIdentify.mock.calls[index];
      expect(groupType).toBe('collectivite');
      expect(groupKey).toBe(expectedId);
      expect(Object.keys(properties).sort()).toEqual([...EXPECTED_KEYS].sort());
    }

    // 3ᵉ ligne : les colonnes vides sont bien envoyées à null
    const sparseProps = posthogClient.groupIdentify.mock.calls[2][2];
    expect(sparseProps.population).toBeNull();
    expect(sparseProps.nature_insee).toBeNull();
    expect(sparseProps.siren).toBe('200066975');

    expect(posthogClient.flush).toHaveBeenCalled();
  });
});
