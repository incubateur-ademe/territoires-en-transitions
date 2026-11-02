import {
  type IndicateurInGroup,
  listSousIndicateursBecomingAutonomous,
  validateSousIndicateurPerso,
} from './sous-indicateur.rules';

const toIndicateurInGroup = (
  overrides: Partial<IndicateurInGroup>
): IndicateurInGroup => ({
  id: 1,
  collectiviteId: 12,
  unite: 'tonnes',
  periodicite: 'annuelle',
  parentId: null,
  hasChildren: false,
  ...overrides,
});

describe('validateSousIndicateurPerso', () => {
  const parent = toIndicateurInGroup({ id: 1 });
  const child = toIndicateurInGroup({ id: 2 });

  it('accepte un enfant personnalisé libre de même collectivité, unité et périodicité', () => {
    expect(validateSousIndicateurPerso({ parent, child })).toEqual({
      success: true,
    });
  });

  it.each([
    {
      label: 'un indicateur rattaché à lui-même',
      parent,
      child: toIndicateurInGroup({ id: 1 }),
      error: 'SOUS_INDICATEUR_SELF_REFERENCE',
    },
    {
      label: 'un enfant d’une autre collectivité',
      parent,
      child: toIndicateurInGroup({ id: 2, collectiviteId: 99 }),
      error: 'SOUS_INDICATEUR_DIFFERENT_COLLECTIVITE',
    },
    {
      label: 'un enfant prédéfini',
      parent,
      child: toIndicateurInGroup({ id: 2, collectiviteId: null }),
      error: 'SOUS_INDICATEUR_CHILD_NOT_PERSO',
    },
    {
      label: 'un parent prédéfini',
      parent: toIndicateurInGroup({ id: 1, collectiviteId: null }),
      child,
      error: 'SOUS_INDICATEUR_PARENT_NOT_PERSO',
    },
    {
      label: 'un parent qui est déjà un enfant',
      parent: toIndicateurInGroup({ id: 1, parentId: 7 }),
      child,
      error: 'SOUS_INDICATEUR_PARENT_ALREADY_CHILD',
    },
    {
      label: 'un enfant qui a déjà des enfants',
      parent,
      child: toIndicateurInGroup({ id: 2, hasChildren: true }),
      error: 'SOUS_INDICATEUR_CHILD_HAS_CHILDREN',
    },
    {
      label: 'un enfant déjà rattaché à un autre parent',
      parent,
      child: toIndicateurInGroup({ id: 2, parentId: 7 }),
      error: 'SOUS_INDICATEUR_CHILD_ALREADY_ATTACHED',
    },
    {
      label: 'un enfant d’une autre unité',
      parent,
      child: toIndicateurInGroup({ id: 2, unite: 'kg' }),
      error: 'SOUS_INDICATEUR_DIFFERENT_UNITE',
    },
    {
      label: 'un enfant d’une autre périodicité',
      parent,
      child: toIndicateurInGroup({ id: 2, periodicite: 'mensuelle' }),
      error: 'SOUS_INDICATEUR_DIFFERENT_PERIODICITE',
    },
  ] as const)('refuse $label', ({ parent, child, error }) => {
    expect(validateSousIndicateurPerso({ parent, child })).toEqual({
      success: false,
      error,
    });
  });
});

describe('listSousIndicateursBecomingAutonomous', () => {
  const firstChild = toIndicateurInGroup({ id: 2, parentId: 1 });
  const secondChild = toIndicateurInGroup({ id: 3, parentId: 1 });
  const childOfAnotherParent = toIndicateurInGroup({ id: 5, parentId: 4 });
  const standalone = toIndicateurInGroup({ id: 6 });

  it('liste uniquement les enfants du parent supprimé', () => {
    expect(
      listSousIndicateursBecomingAutonomous({
        parentId: 1,
        indicateurs: [
          firstChild,
          childOfAnotherParent,
          secondChild,
          standalone,
        ],
      })
    ).toEqual([firstChild, secondChild]);
  });

  it('renvoie une liste vide quand le parent n’a aucun enfant', () => {
    expect(
      listSousIndicateursBecomingAutonomous({
        parentId: 1,
        indicateurs: [childOfAnotherParent, standalone],
      })
    ).toEqual([]);
  });
});
