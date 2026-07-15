import {
  ReferentielIdEnum,
  type ActionScore,
  type ReferentielId,
} from '@tet/domain/referentiels';
import {
  dedupeFicheActionLinks,
  ficheActionLinkDedupKey,
  isSourceActionConcernee,
} from './merge-fiche-action-links.rules';

describe('isSourceActionConcernee', () => {
  const scoreMapsByReferentiel = new Map<
    ReferentielId,
    Map<string, ActionScore>
  >([
    [
      ReferentielIdEnum.CAE,
      new Map([
        [
          'cae_1.1.2',
          { actionId: 'cae_1.1.2', concerne: true } as ActionScore,
        ],
        [
          'cae_6.1.3',
          { actionId: 'cae_6.1.3', concerne: false } as ActionScore,
        ],
      ]),
    ],
  ]);

  it('retourne false si la source est non concernée', () => {
    expect(isSourceActionConcernee('cae_6.1.3', scoreMapsByReferentiel)).toBe(
      false
    );
  });

  it('retourne false si la source est absente du snapshot', () => {
    expect(isSourceActionConcernee('cae_99.99', scoreMapsByReferentiel)).toBe(
      false
    );
  });

  it('retourne true si la source est concernée', () => {
    expect(isSourceActionConcernee('cae_1.1.2', scoreMapsByReferentiel)).toBe(
      true
    );
  });
});

describe('dedupeFicheActionLinks', () => {
  it('déduplique sur (ficheId, teActionId)', () => {
    const rows = [
      { ficheId: 1, actionId: 'te_6.1.4' },
      { ficheId: 1, actionId: 'te_6.1.4' },
    ];

    expect(dedupeFicheActionLinks(rows)).toEqual([
      { ficheId: 1, actionId: 'te_6.1.4' },
    ]);
  });

  it('conserve deux fiches distinctes pour la même action TE', () => {
    const rows = [
      { ficheId: 1, actionId: 'te_6.1.4' },
      { ficheId: 2, actionId: 'te_6.1.4' },
    ];

    expect(dedupeFicheActionLinks(rows)).toEqual(rows);
  });
});

describe('ficheActionLinkDedupKey', () => {
  it('formate la clé ficheId:actionId', () => {
    expect(
      ficheActionLinkDedupKey({ ficheId: 42, actionId: 'te_1.1.1' })
    ).toBe('42:te_1.1.1');
  });
});
