import { Test } from '@nestjs/testing';
import { beforeEach, describe, expect, test, vi } from 'vitest';
import { AirtableService } from '../../airtable/airtable.service';
import { DatabaseService } from '../../utils/database/database.service';
import {
  BuildCrispUserDataService,
  resolveConnexionMode,
} from './build-crisp-user-data.service';

describe('resolveConnexionMode', () => {
  test.each([
    [[], 'Email'],
    [['proconnect'], 'ProConnect'],
    [['moncompteademe'], 'ProConnect'],
    [['proconnect', 'moncompteademe'], 'ProConnect'],
  ] as const)('%j → %s', (providers, expected) => {
    expect(resolveConnexionMode([...providers])).toBe(expected);
  });
});

describe('BuildCrispUserDataService', () => {
  let service: BuildCrispUserDataService;
  let selectRows: unknown[];
  const getUsersByEmail = vi.fn();

  beforeEach(async () => {
    selectRows = [];
    getUsersByEmail.mockReset().mockResolvedValue([]);

    const chain = {
      from: () => chain,
      leftJoin: () => chain,
      where: () => Promise.resolve(selectRows),
    };

    const module = await Test.createTestingModule({
      providers: [
        BuildCrispUserDataService,
        { provide: DatabaseService, useValue: { db: { select: () => chain } } },
        { provide: AirtableService, useValue: { getUsersByEmail } },
      ],
    }).compile();

    service = module.get(BuildCrispUserDataService);
  });

  test('renvoie null si aucun compte TeT ne correspond', async () => {
    expect(await service.buildUserData('inconnu@example.com')).toBeNull();
    expect(getUsersByEmail).not.toHaveBeenCalled();
  });

  test('ProConnect et lien CRM pour un compte lié à MonCompteAdeme', async () => {
    selectRows = [{ id: 'u1', provider: 'moncompteademe' }];
    getUsersByEmail.mockResolvedValue([
      { id: 'rec1', url: 'https://airtable.com/app/tbl/rec1' },
    ]);

    expect(await service.buildUserData('agent@example.com')).toEqual({
      connexion: 'ProConnect',
      fiche_crm: 'https://airtable.com/app/tbl/rec1',
    });
  });

  test('retrouve la fiche CRM malgré une casse différente', async () => {
    selectRows = [{ id: 'u1', provider: 'proconnect' }];
    getUsersByEmail.mockResolvedValue([
      {
        id: 'rec1',
        url: 'https://airtable.com/app/tbl/rec1',
        fields: { email: 'agent@example.com' },
      },
    ]);

    const userData = await service.buildUserData(' Agent@Example.COM ');

    expect(getUsersByEmail).toHaveBeenCalledWith(['agent@example.com']);
    expect(userData?.fiche_crm).toBe('https://airtable.com/app/tbl/rec1');
  });

  test('Email sans lien CRM si la personne est absente d’Airtable', async () => {
    selectRows = [{ id: 'u1', provider: null }];

    expect(await service.buildUserData('agent@example.com')).toEqual({
      connexion: 'Email',
    });
  });
});
