export const toNodesQueryKey = ({
  listQueryKey,
  indicateurId,
}: {
  listQueryKey: readonly unknown[];
  indicateurId: number;
}): readonly unknown[] => [...listQueryKey, 'sous-indicateurs', indicateurId];
