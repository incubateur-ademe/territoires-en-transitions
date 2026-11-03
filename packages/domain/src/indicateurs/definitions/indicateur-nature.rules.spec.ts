import { expectTypeOf } from 'vitest';
import type { IndicateurDefinition } from './indicateur-definition.schema';
import {
  getIncoherentNatureError,
  type IndicateurNatureError,
  type IndicateurNatureFields,
  isIndicateurPerso,
  isIndicateurPredefini,
} from './indicateur-nature.rules';
import type {
  IndicateurPersoNatureFields,
  IndicateurPredefiniNatureFields,
} from './indicateur-nature.schema';
import type { IndicateurPerso, IndicateurPredefini } from './indicateur.schema';

const perso: IndicateurNatureFields = {
  collectiviteId: 12,
  identifiantReferentiel: null,
  groupementId: null,
};
const predefiniShared: IndicateurNatureFields = {
  collectiviteId: null,
  identifiantReferentiel: 'cae_1.a',
  groupementId: null,
};
const predefiniWithGroupement: IndicateurNatureFields = {
  collectiviteId: null,
  identifiantReferentiel: 'sydev_1',
  groupementId: 3,
};
const persoWithIdentifiantReferentiel: IndicateurNatureFields = {
  collectiviteId: 12,
  identifiantReferentiel: 'cae_1.a',
  groupementId: null,
};
const persoWithGroupement: IndicateurNatureFields = {
  collectiviteId: 12,
  identifiantReferentiel: null,
  groupementId: 3,
};
const withoutCollectiviteNorIdentifiantReferentiel: IndicateurNatureFields = {
  collectiviteId: null,
  identifiantReferentiel: null,
  groupementId: null,
};

describe('isIndicateurPerso', () => {
  it.each([
    { label: 'un perso', fields: perso, expected: true },
    { label: 'un prédéfini commun', fields: predefiniShared, expected: false },
    {
      label: 'un prédéfini de groupement',
      fields: predefiniWithGroupement,
      expected: false,
    },
    {
      label: 'un perso qui porte un identifiant référentiel',
      fields: persoWithIdentifiantReferentiel,
      expected: false,
    },
    {
      label: 'un perso rattaché à un groupement',
      fields: persoWithGroupement,
      expected: false,
    },
  ])('répond $expected pour $label', ({ fields, expected }) => {
    expect(isIndicateurPerso(fields)).toBe(expected);
  });
});

describe('isIndicateurPredefini', () => {
  it.each([
    { label: 'un perso', fields: perso, expected: false },
    { label: 'un prédéfini commun', fields: predefiniShared, expected: true },
    {
      label: 'un prédéfini de groupement',
      fields: predefiniWithGroupement,
      expected: true,
    },
    {
      label: 'un perso qui porte un identifiant référentiel',
      fields: persoWithIdentifiantReferentiel,
      expected: false,
    },
    {
      label: 'une définition sans collectivité ni identifiant référentiel',
      fields: withoutCollectiviteNorIdentifiantReferentiel,
      expected: false,
    },
  ])('répond $expected pour $label', ({ fields, expected }) => {
    expect(isIndicateurPredefini(fields)).toBe(expected);
  });
});

describe('getIncoherentNatureError', () => {
  it.each<{
    label: string;
    fields: IndicateurNatureFields;
    error: IndicateurNatureError;
  }>([
    {
      label: 'un perso qui porte un identifiant référentiel',
      fields: persoWithIdentifiantReferentiel,
      error: 'PERSO_WITH_IDENTIFIANT_REFERENTIEL',
    },
    {
      label: 'un perso rattaché à un groupement',
      fields: persoWithGroupement,
      error: 'PERSO_WITH_GROUPEMENT',
    },
    {
      label: 'une définition sans collectivité ni identifiant référentiel',
      fields: withoutCollectiviteNorIdentifiantReferentiel,
      error: 'PREDEFINI_WITHOUT_IDENTIFIANT_REFERENTIEL',
    },
  ])('nomme $error pour $label', ({ fields, error }) => {
    expect(getIncoherentNatureError(fields)).toBe(error);
  });
});

describe('types des gardes', () => {
  it('affinent une définition vers un perso ou un prédéfini', () => {
    expectTypeOf(
      isIndicateurPerso<IndicateurDefinition>
    ).guards.toExtend<IndicateurPerso>();
    expectTypeOf(
      isIndicateurPredefini<IndicateurDefinition>
    ).guards.toExtend<IndicateurPredefini>();
  });

  it('affinent les seuls champs de nature sans exiger la définition entière', () => {
    expectTypeOf(
      isIndicateurPerso<IndicateurNatureFields>
    ).guards.toExtend<IndicateurPersoNatureFields>();
    expectTypeOf(
      isIndicateurPredefini<IndicateurNatureFields>
    ).guards.toExtend<IndicateurPredefiniNatureFields>();
  });

  it('ne laissent pas le type de départ inchangé', () => {
    expectTypeOf(
      isIndicateurPerso<IndicateurDefinition>
    ).guards.not.toEqualTypeOf<IndicateurDefinition>();
  });
});
