import type { IndicateurAncestor } from '@tet/domain/indicateurs';

type PublicApiParent = IndicateurAncestor & {
  parent: (IndicateurAncestor & { parent: null }) | null;
};

export const toPublicApiParents = (
  ancestors: IndicateurAncestor[]
): PublicApiParent[] => {
  const parent = ancestors.at(-1);
  if (!parent) {
    return [];
  }
  const grandParent = ancestors.at(-2);
  return [
    {
      ...parent,
      parent: grandParent ? { ...grandParent, parent: null } : null,
    },
  ];
};
