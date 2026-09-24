import { ReferencedIndicateur } from '@tet/backend/indicateurs/valeurs/referenced-indicateur.dto';
import { IndicateurAssocie, ValeurUtilisee } from '@tet/domain/referentiels';
import {
  buildValeursProgression,
  collectProgressionNeeds,
} from './valeurs-progression.rules';

const associe = (
  indicateurId: number,
  identifiantReferentiel: string
): IndicateurAssocie => ({
  actionId: 'cae_1.1.1',
  indicateurId,
  identifiantReferentiel,
  titre: '',
  unite: '',
  isApplicable: true,
});

const valeur = (overrides: Partial<ValeurUtilisee>): ValeurUtilisee => ({
  actionId: 'cae_1.1.1',
  indicateurId: 1,
  indicateurValeurId: 1,
  valeur: 10,
  dateValeur: '2025-05-29',
  typeScore: 'fait',
  sourceLibelle: null,
  sourceMetadonnee: null,
  ...overrides,
});

describe('collectProgressionNeeds', () => {
  const refs: Record<string, ReferencedIndicateur[]> = {
    'cae_1.1.1': [
      {
        identifiant: 'ind_a',
        optional: false,
        tokens: ['reduction'],
        progressions: [
          {
            token: 'reduction',
            anneeDepart: 2015,
            anneeCible: 2030,
            reductionCible: 0.4,
          },
        ],
      },
      { identifiant: 'ind_b', optional: false, tokens: ['val'] },
    ],
  };

  it('collecte les indicateurs concernés et les années de départ et utilisées (fait)', () => {
    const result = collectProgressionNeeds(
      refs,
      [associe(1, 'ind_a'), associe(2, 'ind_b')],
      {
        'cae_1.1.1': [
          valeur({ indicateurId: 1, dateValeur: '2023-03-01' }),
          valeur({
            indicateurId: 1,
            dateValeur: '2024-03-01',
            typeScore: 'programme',
          }),
          valeur({ indicateurId: 2, dateValeur: '2020-03-01' }),
        ],
      }
    );
    expect(result.indicateurIdParIdentifiant).toEqual({ ind_a: 1 });
    expect(result.annees.sort()).toEqual([2015, 2023]);
  });

  it("ne renvoie rien si aucune formule n'utilise progression_snbc/reduction", () => {
    expect(
      collectProgressionNeeds(
        {
          'cae_1.1.1': [
            { identifiant: 'ind_b', optional: false, tokens: ['val'] },
          ],
        },
        [associe(2, 'ind_b')],
        {}
      )
    ).toEqual({ indicateurIdParIdentifiant: {}, annees: [] });
  });
});

describe('buildValeursProgression', () => {
  it('résout objectif snbc et résultat de départ par indicateur et année', () => {
    const result = buildValeursProgression(
      { ind_a: 1 },
      [2015, 2025],
      [
        {
          indicateurId: 1,
          metadonneeId: 5,
          sourceId: 'snbc',
          ordreAffichage: null,
          dateVersion: '2024-01-01',
          dateValeur: '2025-01-01',
          objectif: 80,
          resultat: null,
        },
        {
          indicateurId: 1,
          metadonneeId: null,
          sourceId: null,
          ordreAffichage: null,
          dateVersion: null,
          dateValeur: '2015-01-01',
          objectif: null,
          resultat: 100,
        },
        {
          indicateurId: 2,
          metadonneeId: null,
          sourceId: null,
          ordreAffichage: null,
          dateVersion: null,
          dateValeur: '2015-01-01',
          objectif: null,
          resultat: 999,
        },
      ]
    );
    expect(result).toEqual({
      ind_a: { 2015: { resultatDepart: 100 }, 2025: { objectifSnbc: 80 } },
    });
  });
});
