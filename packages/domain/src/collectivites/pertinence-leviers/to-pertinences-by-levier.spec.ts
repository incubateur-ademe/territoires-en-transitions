import { describe, expect, it } from 'vitest';
import { toPertinencesByLevier } from './to-pertinences-by-levier';

describe('toPertinencesByLevier', () => {
  it('range la pertinence du levier à côté de celles de ses catégories', () => {
    const pertinencesByLevier = toPertinencesByLevier([
      {
        levierId: 'covoiturage',
        categorie: 'financement',
        pertinence: 'a_discuter',
      },
      { levierId: 'covoiturage', pertinence: 'pertinent' },
      {
        levierId: 'covoiturage',
        categorie: 'gouvernance',
        pertinence: 'non_pertinent',
      },
    ]);

    expect([...pertinencesByLevier]).toStrictEqual([
      [
        'covoiturage',
        {
          levier: 'pertinent',
          categories: new Map([
            ['financement', 'a_discuter'],
            ['gouvernance', 'non_pertinent'],
          ]),
        },
      ],
    ]);
  });

  it("indexe une catégorie dont le levier n'a pas de pertinence", () => {
    const pertinencesByLevier = toPertinencesByLevier([
      { levierId: 'biogaz', categorie: 'amenagement', pertinence: 'pertinent' },
      { levierId: 'covoiturage', pertinence: 'non_pertinent' },
    ]);

    expect([...pertinencesByLevier]).toStrictEqual([
      ['biogaz', { categories: new Map([['amenagement', 'pertinent']]) }],
      ['covoiturage', { levier: 'non_pertinent', categories: new Map() }],
    ]);
  });
});
