import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {SourceType, TIndicateurDefinition} from '../types';
import {Indicateurs} from '@tet/api';

type TEditIndicateurValeurArgs = {
  collectiviteId: number | null;
  definition: TIndicateurDefinition;
  type: SourceType;
  valeursBrutes: Indicateurs.domain.Valeur[];
};

/** Fourni des fonctions pour éditer ou "supprimer" une valeur/commentaire d'un indicateur */
export const useEditIndicateurValeur = (
  args: Omit<TEditIndicateurValeurArgs, 'collectiviteId'>
) => {
  const collectiviteId = useCollectiviteId();
  const editArgs = {collectiviteId, ...args};

  const {mutate: editValeur} = useUpsertIndicateurValeur(editArgs);
  const {mutate: deleteValue} = useDeleteIndicateurValeur(editArgs);

  return {
    editValeur,
    deleteValue,
  };
};
export type TEditIndicateurValeurHandlers = ReturnType<
  typeof useEditIndicateurValeur
>;

/** Met à jour la valeur d'un indicateur */
const useUpsertIndicateurValeur = (args: TEditIndicateurValeurArgs) => {
  const {collectiviteId, definition, type, valeursBrutes} = args;
  const indicateurId = definition.id;

  return useMutation({
    mutationKey: 'upsert_indicateur_valeur',
    mutationFn: async ({
      annee,
      valeur,
      commentaire,
      valeurId,
    }: {
      annee: number;
      valeur: number | null;
      commentaire: string | null;
      valeurId: number | null;
    }) => {
      const valeurBrute =
        valeursBrutes?.find(v => v.id === valeurId || v.annee === annee) || {};

      return (
        collectiviteId &&
        indicateurId !== undefined &&
        Indicateurs.save.upsertIndicateurValeur(supabaseClient, {
          ...valeurBrute,
          indicateurId,
          collectiviteId,
          [type]: valeur,
          [`${type}Commentaire`]: commentaire,
          annee,
        })
      );
    },
    onSuccess: useOnSuccess(args),
  });
};

const useDeleteIndicateurValeur = (args: TEditIndicateurValeurArgs) => {
  const {collectiviteId, type, valeursBrutes} = args;

  return useMutation({
    mutationKey: 'delete_indicateur_valeur',
    mutationFn: async ({valeurId}: {valeurId: number}) => {
      const valeurBrute =
          valeursBrutes?.find(v => v.id === valeurId);
      if (!collectiviteId || isNaN(valeurId) || !valeurBrute) {
        return;
      }
      return Indicateurs.save.upsertIndicateurValeur(supabaseClient, {
        ...valeurBrute,
        [type]: null,
        [`${type}Commentaire`]: null
      });
    },
    onSuccess: useOnSuccess(args),
  });
};

// recharge les valeurs et l'état "rempli"
export const useOnSuccess = (
  args: Omit<TEditIndicateurValeurArgs, 'valeursBrutes'>
) => {
  const {collectiviteId, definition, type} = args;
  const {id: indicateurId, estPerso, identifiant} = definition;
  const parents = estPerso
    ? null
    : (definition as Indicateurs.domain.IndicateurDefinitionPredefini).parents;

  const queryClient = useQueryClient();
  return () => {
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
    // pour actualiser le tableau
    queryClient.invalidateQueries([
      'indicateur_valeurs_detail',
      collectiviteId,
      indicateurId,
      type,
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
