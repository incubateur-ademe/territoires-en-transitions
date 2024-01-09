import {unaccent} from './unaccent';
import {assert} from 'chai';

it('Suppression des accents et autres diacritiques', () => {
  const result = unaccent('chaîne avec des lettres accentuées : à èê ô ù ç');
  assert.equal(result, 'chaine avec des lettres accentuees : a ee o u c');
});
