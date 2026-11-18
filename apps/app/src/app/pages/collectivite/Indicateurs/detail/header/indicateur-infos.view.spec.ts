import type { IndicateurDetaille } from '@tet/domain/indicateurs';
import { describe, expect, it } from 'vitest';
import {
  getInfosVisibility,
  hasIndicateurInfos,
} from './indicateur-infos.view';

const toIndicateur = (overrides: Partial<IndicateurDetaille>) =>
  ({
    pilotes: [],
    services: [],
    participationScore: false,
    hasOpenData: false,
    ...overrides,
  } as IndicateurDetaille);

const readonlyComposeSansAgregation = {
  isPerso: false,
  isComposeSansAgregation: true,
  isReadonly: true,
};

describe('hasIndicateurInfos', () => {
  it('masque les infos d’un composé sans agrégation en lecture seule sans pilote, service ni score', () => {
    expect(
      hasIndicateurInfos({
        indicateur: toIndicateur({}),
        ...readonlyComposeSansAgregation,
      })
    ).toBe(false);
  });

  it('affiche les infos quand l’utilisateur peut éditer', () => {
    expect(
      hasIndicateurInfos({
        indicateur: toIndicateur({}),
        ...readonlyComposeSansAgregation,
        isReadonly: false,
      })
    ).toBe(true);
  });

  it('affiche les infos quand l’indicateur n’est pas un composé sans agrégation', () => {
    expect(
      hasIndicateurInfos({
        indicateur: toIndicateur({}),
        ...readonlyComposeSansAgregation,
        isComposeSansAgregation: false,
      })
    ).toBe(true);
  });

  it.each([
    ['un pilote', { pilotes: [{ nom: 'Ada' }] }],
    ['un service pilote', { services: [{ id: 1, nom: 'Énergie' }] }],
    ['la participation au score', { participationScore: true }],
  ] as [string, Partial<IndicateurDetaille>][])(
    'affiche les infos d’un composé sans agrégation en lecture seule quand il a %s',
    (_, overrides) => {
      expect(
        hasIndicateurInfos({
          indicateur: toIndicateur(overrides),
          ...readonlyComposeSansAgregation,
        })
      ).toBe(true);
    }
  );
});

describe('getInfosVisibility', () => {
  it.each([
    { label: 'un indicateur perso', isPerso: true, hasOpenData: false },
    { label: 'un indicateur en open data', isPerso: false, hasOpenData: true },
  ])(
    'affiche les badges pour $label hors composé sans agrégation',
    ({ isPerso, hasOpenData }) => {
      expect(
        getInfosVisibility({
          indicateur: toIndicateur({ hasOpenData }),
          isPerso,
          isComposeSansAgregation: false,
          isReadonly: true,
        }).showBadges
      ).toBe(true);
    }
  );

  it('masque les badges de tout composé sans agrégation, même perso ou en open data', () => {
    expect(
      getInfosVisibility({
        indicateur: toIndicateur({ hasOpenData: true }),
        ...readonlyComposeSansAgregation,
        isPerso: true,
      }).showBadges
    ).toBe(false);
  });
});
