import { expectTypeOf } from 'vitest';
import type { IndicateurDefinition } from './indicateur-definition.schema';
import type { IndicateurNatureError } from './indicateur-nature.rules';
import {
  type Indicateur,
  indicateurSchema,
  toIndicateur,
} from './indicateur.schema';

const toIndicateurDefinition = (
  overrides: Partial<IndicateurDefinition>
): IndicateurDefinition => ({
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
    definition: toIndicateurDefinition({ collectiviteId: 12 }),
  },
  {
    label: 'un prédéfini commun',
    definition: toIndicateurDefinition({ identifiantReferentiel: 'cae_1.a' }),
  },
  {
    label: 'un prédéfini de groupement',
    definition: toIndicateurDefinition({
      identifiantReferentiel: 'sydev_1',
      groupementId: 3,
    }),
  },
];

const incoherentDefinitions: ReadonlyArray<{
  label: string;
  definition: IndicateurDefinition;
  error: IndicateurNatureError;
}> = [
  {
    label: 'un perso qui porte un identifiant référentiel',
    definition: toIndicateurDefinition({
      collectiviteId: 12,
      identifiantReferentiel: 'cae_1.a',
    }),
    error: 'PERSO_WITH_IDENTIFIANT_REFERENTIEL',
  },
  {
    label: 'un perso rattaché à un groupement',
    definition: toIndicateurDefinition({ collectiviteId: 12, groupementId: 3 }),
    error: 'PERSO_WITH_GROUPEMENT',
  },
  {
    label: 'une définition sans collectivité ni identifiant référentiel',
    definition: toIndicateurDefinition({}),
    error: 'PREDEFINI_WITHOUT_IDENTIFIANT_REFERENTIEL',
  },
];

describe('toIndicateur', () => {
  it.each(coherentDefinitions)('accepte $label tel quel', ({ definition }) => {
    expect(toIndicateur(definition)).toEqual({
      success: true,
      data: definition,
    });
  });

  it.each(incoherentDefinitions)(
    'refuse $label avec $error',
    ({ definition, error }) => {
      expect(toIndicateur(definition)).toEqual({ success: false, error });
    }
  );
});

describe('indicateurSchema', () => {
  it.each(coherentDefinitions)('accepte $label', ({ definition }) => {
    expect(indicateurSchema.safeParse(definition).success).toBe(true);
  });

  it.each(incoherentDefinitions)('refuse $label', ({ definition }) => {
    expect(indicateurSchema.safeParse(definition).success).toBe(false);
  });
});

describe('type Indicateur', () => {
  it('reste assignable à IndicateurDefinition', () => {
    expectTypeOf<Indicateur>().toExtend<IndicateurDefinition>();
  });

  it('n’accepte pas une définition plate sans passer par toIndicateur', () => {
    expectTypeOf<IndicateurDefinition>().not.toExtend<Indicateur>();
  });
});
