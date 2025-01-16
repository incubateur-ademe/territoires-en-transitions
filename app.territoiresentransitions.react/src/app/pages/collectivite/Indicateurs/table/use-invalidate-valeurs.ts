import { useQueryClient } from 'react-query';
import { TIndicateurDefinition } from '../types';

// recharge les valeurs et l'état "rempli"
// TODO: à supprimer quand tous les composants utiliseront
// seulement l'appel trpc pour lire les données
export const useInvalidateValeurs = (definition: TIndicateurDefinition) => {
  const queryClient = useQueryClient();
  return (args: { collectiviteId: number; indicateurId: number }) => {
    const { collectiviteId } = args;
    const { id: indicateurId, estPerso, identifiant } = definition;
    const parents = estPerso ? null : definition.parents;

    if (!collectiviteId) return;
    // pour actualiser le graphe
    queryClient.invalidateQueries([
      'indicateur_chart_info',
      collectiviteId,
      indicateurId,
    ]);
    queryClient.invalidateQueries([
      'indicateur_valeurs',
      collectiviteId,
      indicateurId,
    ]);
    // pour actualiser le badge 'à compléter / complété'
    queryClient.invalidateQueries([
      'indicateur_definition',
      collectiviteId,
      identifiant || indicateurId,
    ]);
    // pour les indicateurs composés on doit recharger les définitions des enfants
    // pour que le flag 'rempli' de l'indicateur enfant modifié soit actualisé
    if (parents?.[0]) {
      queryClient.invalidateQueries([
        'indicateur_definitions',
        collectiviteId,
        parents?.[0],
      ]);
    }
  };
};
