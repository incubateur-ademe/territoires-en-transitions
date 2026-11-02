import type { Indicateur } from './indicateur.schema';

export type IndicateurInGroup = Pick<
  Indicateur,
  'id' | 'collectiviteId' | 'unite' | 'periodicite'
> &
  Readonly<{
    parentId: number | null;
    hasChildren: boolean;
  }>;

export type SousIndicateurPersoError =
  | 'SOUS_INDICATEUR_SELF_REFERENCE'
  | 'SOUS_INDICATEUR_PARENT_NOT_PERSO'
  | 'SOUS_INDICATEUR_CHILD_NOT_PERSO'
  | 'SOUS_INDICATEUR_DIFFERENT_COLLECTIVITE'
  | 'SOUS_INDICATEUR_PARENT_ALREADY_CHILD'
  | 'SOUS_INDICATEUR_CHILD_HAS_CHILDREN'
  | 'SOUS_INDICATEUR_CHILD_ALREADY_ATTACHED'
  | 'SOUS_INDICATEUR_DIFFERENT_UNITE'
  | 'SOUS_INDICATEUR_DIFFERENT_PERIODICITE';

export type SousIndicateurPersoResult =
  | Readonly<{ success: true }>
  | Readonly<{ success: false; error: SousIndicateurPersoError }>;

const refuse = (
  error: SousIndicateurPersoError
): SousIndicateurPersoResult => ({
  success: false,
  error,
});

export const validateSousIndicateurPerso = ({
  parent,
  child,
}: {
  parent: IndicateurInGroup;
  child: IndicateurInGroup;
}): SousIndicateurPersoResult => {
  if (parent.id === child.id) {
    return refuse('SOUS_INDICATEUR_SELF_REFERENCE');
  }
  if (parent.collectiviteId === null) {
    return refuse('SOUS_INDICATEUR_PARENT_NOT_PERSO');
  }
  if (child.collectiviteId === null) {
    return refuse('SOUS_INDICATEUR_CHILD_NOT_PERSO');
  }
  if (parent.collectiviteId !== child.collectiviteId) {
    return refuse('SOUS_INDICATEUR_DIFFERENT_COLLECTIVITE');
  }
  if (parent.parentId !== null) {
    return refuse('SOUS_INDICATEUR_PARENT_ALREADY_CHILD');
  }
  if (child.hasChildren) {
    return refuse('SOUS_INDICATEUR_CHILD_HAS_CHILDREN');
  }
  if (child.parentId !== null) {
    return refuse('SOUS_INDICATEUR_CHILD_ALREADY_ATTACHED');
  }
  if (parent.unite !== child.unite) {
    return refuse('SOUS_INDICATEUR_DIFFERENT_UNITE');
  }
  if (parent.periodicite !== child.periodicite) {
    return refuse('SOUS_INDICATEUR_DIFFERENT_PERIODICITE');
  }
  return { success: true };
};

export const listSousIndicateursBecomingAutonomous = ({
  parentId,
  indicateurs,
}: {
  parentId: number;
  indicateurs: readonly IndicateurInGroup[];
}): readonly IndicateurInGroup[] =>
  indicateurs.filter((indicateur) => indicateur.parentId === parentId);
