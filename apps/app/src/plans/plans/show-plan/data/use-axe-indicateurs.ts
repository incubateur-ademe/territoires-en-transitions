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
export function useAxeIndicateurs({
  axe,
  collectiviteId,
  enabled,
}: {
  axe: PlanNode;
  collectiviteId: number;
  enabled: boolean;
}) {
  //const axeDetail = useGetAxeDetail(axe.id, { disabled });
  const { data } = useListIndicateurs(
    { collectiviteId, filters: { axeIds: [axe.id] } },
    { enabled: enabled && axe.id > 0 }
  );
  const selectedIndicateurs = data?.data || [];

  const { mutate: updateAxe } = useUpdateAxe({
    collectiviteId,
    axe,
  });

  const toggleIndicateur = (indicateur: IndicateurDefinitionListItem) => {
    const isAssocie =
      selectedIndicateurs.some((i) => i.id === indicateur.id) ?? false;

    // Ajoute ou retire l'indicateur de la liste
    const indicateurs = isAssocie
      ? selectedIndicateurs.filter((i) => i.id !== indicateur.id) ?? []
      : [...selectedIndicateurs, { id: indicateur.id }];

    updateAxe({ ...axe, nom: axe.nom || '', indicateurs });
  };

  return {
    selectedIndicateurs,
    toggleIndicateur,
  };
}
