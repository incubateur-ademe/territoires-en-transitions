import {getAuthBaseUrl} from './pathUtils';
import {assert} from 'chai';

describe('getAuthBaseUrl', () => {
  it("donne l'url de l'auth. en mode dev", () => {
    assert.equal(getAuthBaseUrl('localhost'), 'http://localhost:3003');
  });

  it("donne l'url de l'auth. en mode preprod domaine tet", () => {
    assert.equal(
      getAuthBaseUrl('preprod-app.tet.fr'),
      'https://preprod-auth.tet.fr'
    );
  });

  it("donne l'url de l'auth. en mode preprod domaine koyeb", () => {
    assert.equal(
      getAuthBaseUrl('preprod-app-tet.koyeb.app'),
      'https://preprod-auth-tet.koyeb.app'
    );
    assert.equal(
      getAuthBaseUrl('test-app-branch-tet.koyeb.app'),
      'https://preprod-auth-tet.koyeb.app'
    );
  });

  it("donne l'url de l'auth. en mode prod domaine tet", () => {
    assert.equal(getAuthBaseUrl('app.tet.fr'), 'https://auth.tet.fr');
    assert.equal(getAuthBaseUrl('tet.fr'), 'https://auth.tet.fr');
  });
});
