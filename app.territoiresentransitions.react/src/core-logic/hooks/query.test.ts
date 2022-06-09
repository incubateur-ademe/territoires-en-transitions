import {searchParamsToObject, objectToSearchParams} from './query';

describe('searchParamsToObject', () => {
  it("doit renvoyer un objet à partir des paramètres de l'URL, d'un objet par défaut et d'une table de correspondance entre noms raccourcis présents dans l'URL et noms des propriétés", () => {
    const result = searchParamsToObject(
      new URLSearchParams('?p1=v1&p2=v2,v3'),
      {prop3: ['v4']},
      {p1: 'prop1', p2: 'prop2', p3: 'prop3'}
    );
    expect(result).toEqual({
      prop1: ['v1'],
      prop2: ['v2', 'v3'],
      prop3: ['v4'],
    });
  });

  it('doit filtrer les paramètres non définis dans la table de correspondances', () => {
    const result = searchParamsToObject(
      new URLSearchParams('?p1=v1&p2=v2,v3'),
      {prop3: ['v4']},
      {p1: 'prop1', p3: 'prop3'}
    );
    expect(result).toEqual({
      prop1: ['v1'],
      prop3: ['v4'],
    });
  });
});

describe('objectToSearchParams', () => {
  it("doit renvoyer une chaîne de paramètres d'URL, à partir d'un objet et d'une table de correspondance entre noms des propriétés et noms raccourcis pour l'URL", () => {
    const result = objectToSearchParams(
      {
        prop1: ['v1'],
        prop2: ['v2', 'v3'],
        prop3: ['v4'],
      },
      {prop1: 'p1', prop2: 'p2', prop3: 'p3'}
    );
    expect(result).toEqual('p1=v1&p2=v2,v3&p3=v4');
  });

  it('doit filtrer les paramètres non définis dans la table de correspondances', () => {
    const result = objectToSearchParams(
      {
        prop1: ['v1'],
        prop2: ['v2', 'v3'],
        prop3: ['v4'],
      },
      {prop1: 'p1', prop2: 'p2'}
    );
    expect(result).toEqual('p1=v1&p2=v2,v3');
  });
});
