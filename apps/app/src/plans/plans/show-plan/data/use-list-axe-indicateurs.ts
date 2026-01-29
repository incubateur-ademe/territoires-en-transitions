import {
  IndicateurDefinitionListItem,
  useListIndicateurs,
} from '@/app/indicateurs/indicateurs/use-list-indicateurs';
import { PlanNode } from '@tet/domain/plans';
import { useUpdateAxe } from './use-update-axe';

/**
 * Charge la liste des indicateurs associés à un axe et fourni une
 * fonction pour mettre à jour celle-ci
 */
export function useListAxeIndicateurs({
  axe,
  collectiviteId,
  planId,
  enabled,
}: {
  axe: PlanNode;
  collectiviteId: number;
  planId: number;
  enabled: boolean;
}) {
  const { data } = useListIndicateurs(
    { collectiviteId, filters: { axeIds: [axe.id] } },
    { enabled: enabled && axe.id > 0 }
  );
  const selectedIndicateurs = data?.data || [];

  const { mutateAsync: updateAxe } = useUpdateAxe({
    collectiviteId,
    axe,
    planId,
  });

  const toggleIndicateur = async (indicateur: IndicateurDefinitionListItem) => {
    const isAssocie =
      selectedIndicateurs.some((i) => i.id === indicateur.id) ?? false;

    // Ajoute ou retire l'indicateur de la liste
    const indicateurs = isAssocie
      ? selectedIndicateurs.filter((i) => i.id !== indicateur.id) ?? []
      : [...selectedIndicateurs, indicateur];

    await updateAxe({ ...axe, nom: axe.nom || '', indicateurs });
  };

  return {
    selectedIndicateurs,
    toggleIndicateur,
  };
}
