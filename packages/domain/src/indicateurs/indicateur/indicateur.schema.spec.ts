import { expectTypeOf } from 'vitest';
import {
  type Indicateur,
  type IndicateurCandidate,
  indicateurSchema,
} from './indicateur.schema';

const toIndicateurCandidate = (
  overrides: Partial<IndicateurCandidate>
): IndicateurCandidate => ({
  id: 1,
  version: '1',
  groupementId: null,
  collectiviteId: null,
  identifiantReferentiel: null,
  titre: 'Émissions de GES',
  titreLong: null,
  titreCourt: null,
  description: null,
  unite: 'tCO2e',
  periodicite: 'annuelle',
  precision: 2,
  borneMin: null,
  borneMax: null,
  participationScore: false,
  sansValeurUtilisateur: false,
  valeurCalcule: null,
  exprCible: null,
  exprSeuil: null,
  libelleCibleSeuil: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  createdBy: null,
  modifiedBy: null,
  ...overrides,
});

const coherentDefinitions = [
  {
    label: 'un perso',
    definition: toIndicateurCandidate({ collectiviteId: 12 }),
  },
  {
    label: 'un prédéfini commun',
    definition: toIndicateurCandidate({ identifiantReferentiel: 'cae_1.a' }),
  },
  {
    label: 'un prédéfini de groupement',
    definition: toIndicateurCandidate({
      identifiantReferentiel: 'sydev_1',
      groupementId: 3,
    }),
  },
];

const incoherentDefinitions = [
  {
    label: 'un perso qui porte un identifiant référentiel',
    definition: toIndicateurCandidate({
      collectiviteId: 12,
      identifiantReferentiel: 'cae_1.a',
    }),
  },
  {
    label: 'un perso rattaché à un groupement',
    definition: toIndicateurCandidate({ collectiviteId: 12, groupementId: 3 }),
  },
  {
    label: 'une définition sans collectivité ni identifiant référentiel',
    definition: toIndicateurCandidate({}),
  },
];

describe('indicateurSchema', () => {
  it.each(coherentDefinitions)('accepte $label', ({ definition }) => {
    expect(indicateurSchema.safeParse(definition).success).toBe(true);
  });

  it.each(incoherentDefinitions)('refuse $label', ({ definition }) => {
    expect(indicateurSchema.safeParse(definition).success).toBe(false);
  });
});

describe('type Indicateur', () => {
  it('reste assignable à IndicateurCandidate', () => {
    expectTypeOf<Indicateur>().toExtend<IndicateurCandidate>();
  });

  it('n’accepte pas une définition plate sans passer par les gardes de nature', () => {
    expectTypeOf<IndicateurCandidate>().not.toExtend<Indicateur>();
  });
});
