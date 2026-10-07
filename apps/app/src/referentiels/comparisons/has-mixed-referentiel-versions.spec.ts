import { describe, expect, it } from 'vitest';
import { hasMixedReferentielVersions } from './has-mixed-referentiel-versions';

describe('hasMixedReferentielVersions', () => {
  it('détecte des sauvegardes calculées avec des versions différentes', () => {
    expect(
      hasMixedReferentielVersions([
        { referentielVersion: '1.0.1' },
        { referentielVersion: '1.0.2' },
      ])
    ).toBe(true);
  });

  it('ne signale rien quand toutes les sauvegardes partagent la même version', () => {
    expect(
      hasMixedReferentielVersions([
        { referentielVersion: '1.0.2' },
        { referentielVersion: '1.0.2' },
      ])
    ).toBe(false);
  });

  it('ignore les sauvegardes sans version connue', () => {
    expect(
      hasMixedReferentielVersions([
        { referentielVersion: null },
        { referentielVersion: '1.0.2' },
      ])
    ).toBe(false);
  });
});
