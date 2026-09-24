import { describe, expect, test, vi } from 'vitest';
import { AirtableService } from '../../airtable/airtable.service';
import ConfigurationService from '../../config/configuration.service';
import { DatabaseService } from '../../utils/database/database.service';
import {
  BuildCrispCrmNoteService,
  CrmNoteData,
  formatCrmNote,
} from './build-crisp-crm-note.service';

const APP_URL = 'https://app.tet.fr';

const baseData: CrmNoteData = {
  email: 'agent@example.com',
  user: {
    prenom: 'Jean',
    nom: 'Dupont',
    createdAt: '2024-03-12T10:00:00Z',
  },
  identites: [],
  collectivites: [],
};

describe('formatCrmNote', () => {
  test('signale l’absence de compte TeT', () => {
    expect(formatCrmNote({ ...baseData, user: null }, APP_URL)).toBe(
      '👤 Aucun compte TeT pour agent@example.com'
    );
  });

  test('compte sans ProConnect ni collectivité', () => {
    expect(formatCrmNote(baseData, APP_URL)).toBe(
      [
        '👤 Jean Dupont — compte TeT créé le 12/03/2024',
        '🔐 Connexion par email (pas de ProConnect)',
        '',
        '🏛 Rattaché à aucune collectivité',
      ].join('\n')
    );
  });

  test('récapitule identités, collectivités, référentiels et plans', () => {
    const note = formatCrmNote(
      {
        ...baseData,
        identites: [
          { provider: 'moncompteademe', email: 'jean.dupont@ville.fr' },
        ],
        collectivites: [
          {
            id: 12,
            nom: 'Ville de X',
            role: 'admin',
            ficheCrmUrl: 'https://airtable.com/app/tbl/rec1',
            referentiels: [
              {
                referentiel: 'cae',
                realise: 52.345,
                programme: 18.1,
                etoiles: 3,
                anneeLabellisation: 2023,
              },
              {
                referentiel: 'eci',
                realise: 31,
                programme: null,
                etoiles: null,
                anneeLabellisation: null,
              },
            ],
            plans: [
              { id: 456, nom: 'Plan climat' },
              { id: 789, nom: null },
            ],
          },
        ],
      },
      APP_URL
    );

    expect(note).toBe(
      [
        '👤 Jean Dupont — compte TeT créé le 12/03/2024',
        '🔐 ProConnect : jean.dupont@ville.fr (MonCompteAdeme)',
        '',
        '🏛 Ville de X — Admin',
        '   Fiche CRM : https://airtable.com/app/tbl/rec1',
        '   Référentiels :',
        '     • CAE : 3★ (2023) · réalisé 52,3 % · programmé 18,1 %',
        '     • ECI : non labellisée · réalisé 31 %',
        '   Plans (2) : https://app.tet.fr/collectivite/12/plans',
        '     • Plan climat → https://app.tet.fr/collectivite/12/plans/456',
        '     • Sans titre → https://app.tet.fr/collectivite/12/plans/789',
      ].join('\n')
    );
  });

  test('omet les liens vers l’app sans APP_URL', () => {
    const note = formatCrmNote(
      {
        ...baseData,
        collectivites: [
          {
            id: 12,
            nom: 'Ville de X',
            role: 'lecture',
            referentiels: [],
            plans: [{ id: 456, nom: 'Plan climat' }],
          },
        ],
      },
      undefined
    );

    expect(note).toContain('   Plans (1)\n     • Plan climat');
    expect(note).not.toContain('http');
  });
});

describe('BuildCrispCrmNoteService', () => {
  // Chaque `select()` renvoie le résultat suivant de la file, dans l'ordre des
  // requêtes du service : compte, identités, droits, plans, scores, labellisations.
  const buildDatabase = (results: unknown[][]) => {
    const queue = [...results];
    const buildChain = (rows: unknown[]) => {
      const chain: Record<string, unknown> = new Proxy(
        {},
        {
          get: (_target, prop) =>
            prop === 'then'
              ? (resolve: (value: unknown[]) => unknown) => resolve(rows)
              : () => chain,
        }
      );
      return chain;
    };
    return {
      db: { select: () => buildChain(queue.shift() ?? []) },
    } as unknown as DatabaseService;
  };

  test('construit la note sans fiche CRM si Airtable est indisponible', async () => {
    const service = new BuildCrispCrmNoteService(
      buildDatabase([
        [{ id: 'u1', createdAt: null, prenom: 'Jean', nom: 'Dupont' }],
        [],
        [{ id: 12, nom: 'Ville de X', role: 'admin' }],
        [{ id: 456, nom: 'Plan climat', collectiviteId: 12 }],
        [],
        [],
      ]),
      {
        getCollectiviteUrlsByIds: vi
          .fn()
          .mockRejectedValue(new Error('Airtable 503')),
      } as unknown as AirtableService,
      { get: () => undefined } as unknown as ConfigurationService
    );

    const note = await service.buildCrmNote('agent@example.com');

    expect(note).toContain('🏛 Ville de X — Admin');
    expect(note).toContain('• Plan climat');
    expect(note).not.toContain('Fiche CRM');
  });
});
