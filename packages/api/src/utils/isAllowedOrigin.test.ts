import {isAllowedOrigin} from './isAllowedOrigin';
import {assert} from 'chai';

describe('isAllowedOrigin', () => {
  it('renvoi true en mode autre que "production"', () => {
    assert.equal(
      isAllowedOrigin(
        'http://localhost:3000/collectivite/1/users',
        'development'
      ),
      true
    );
  });

  it('renvoi true pour le domaine par défaut', () => {
    assert.equal(
      isAllowedOrigin(
        'https://app.territoiresentransitions.fr/collectivite/1/users',
        'production'
      ),
      true
    );
  });

  it('renvoi false pour un domaine non valide', () => {
    assert.equal(
      isAllowedOrigin('https://app.tet.fr/collectivite/1/users', 'production'),
      false
    );
  });

  it('renvoi true pour un domaine correspondant au pattern donné', () => {
    assert.equal(
      isAllowedOrigin(
        'https://test-app-branch-tet.koyeb.app/collectivite/1/users',
        'production',
        'https://test-app-*-tet.koyeb.app'
      ),
      true
    );
  });

  it('renvoi false pour un domaine ne correspondant pas au pattern donné', () => {
    assert.equal(
      isAllowedOrigin(
        'https://non-reconnu-tet.koyeb.app/collectivite/1/users',
        'production',
        'https://test-app-*-tet.koyeb.app'
      ),
      false
    );
  });
});
