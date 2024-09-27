import { describe, it, expect } from 'vitest';
import { isAllowedOrigin } from './isAllowedOrigin';

describe('isAllowedOrigin', () => {
  it('renvoi true en mode autre que "production"', () => {
    const isAllowed = isAllowedOrigin(
      'http://localhost:3000/collectivite/1/users',
      'development'
    );

    expect(isAllowed).toBe(true);
  });

  it('renvoi true pour le domaine par défaut', () => {
    const isAllowed = isAllowedOrigin(
      'https://app.territoiresentransitions.fr/collectivite/1/users',
      'production'
    );
    expect(isAllowed).toBe(true);
  });

  it('renvoi false pour un domaine non valide', () => {
    expect(
      isAllowedOrigin('https://app.tet.fr/collectivite/1/users', 'production')
    ).toBe(false);
  });

  it('renvoi true pour un domaine correspondant au pattern donné', () => {
    expect(
      isAllowedOrigin(
        'https://test-app-branch-tet.koyeb.app/collectivite/1/users',
        'production',
        'https://test-app-*-tet.koyeb.app'
      )
    ).toBe(true);
  });

  it('renvoi false pour un domaine ne correspondant pas au pattern donné', () => {
    expect(
      isAllowedOrigin(
        'https://non-reconnu-tet.koyeb.app/collectivite/1/users',
        'production',
        'https://test-app-*-tet.koyeb.app'
      )
    ).toBe(false);
  });
});
