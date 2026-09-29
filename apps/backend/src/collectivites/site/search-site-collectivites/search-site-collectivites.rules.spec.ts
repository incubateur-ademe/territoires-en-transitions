import { buildPrefixTsquery } from './search-site-collectivites.rules';

describe('buildPrefixTsquery', () => {
  test('préfixe chaque mot et les combine en ET', () => {
    expect(buildPrefixTsquery('  nantes   métro ')).toBe('nantes:* & métro:*');
  });

  test('retire les caractères de la syntaxe tsquery', () => {
    expect(buildPrefixTsquery("saint-étienne & l'île !")).toBe(
      'saintétienne:* & lîle:*'
    );
  });

  test('renvoie null quand il ne reste aucun mot', () => {
    expect(buildPrefixTsquery('')).toBeNull();
    expect(buildPrefixTsquery(' & | ! ')).toBeNull();
  });
});
