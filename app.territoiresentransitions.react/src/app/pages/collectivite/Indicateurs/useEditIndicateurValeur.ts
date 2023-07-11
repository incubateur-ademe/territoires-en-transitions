import {useMutation, useQueryClient} from 'react-query';
import {supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TIndicateurDefinition} from './types';

type TypeValeur = 'resultat' | 'objectif';

type TEditIndicateurValeurArgs = {
  collectivite_id: number | null;
  definition: TIndicateurDefinition;
  type: TypeValeur;
};

/** Fourni des fonctions pour éditer ou "supprimer" une valeur/commentaire d'un indicateur */
export const useEditIndicateurValeur = (
  args: Omit<TEditIndicateurValeurArgs, 'collectivite_id'>
) => {
  const collectivite_id = useCollectiviteId();
  const editArgs = {collectivite_id, ...args};

  const {mutate: editValeur} = useUpsertIndicateurValeur(editArgs);
  const {mutate: editComment} = useUpsertIndicateurCommentaire(editArgs);
  const {mutate: deleteValue} = useDeleteIndicateurValeur(editArgs);

  return {
    editValeur,
    editComment,
    deleteValue,
  };
};
export type TEditIndicateurValeurHandlers = ReturnType<
  typeof useEditIndicateurValeur
>;

// où écrire en fonction du type de valeur et si c'est un indicateur personnalisé ou non
const tableValeur = (type: TypeValeur, isPerso?: boolean) =>
  isPerso ? `indicateur_personnalise_${type}` : `indicateur_${type}`;
const tableCommentaire = (type: TypeValeur, isPerso?: boolean) =>
  isPerso
    ? `indicateur_perso_${type}_commentaire`
    : `indicateur_${type}_commentaire`;

/** Met à jour la valeur d'un indicateur */
const useUpsertIndicateurValeur = (args: TEditIndicateurValeurArgs) => {
  const {collectivite_id, definition, type} = args;
  const {id: indicateur_id, isPerso} = definition;

  return useMutation({
    mutationKey: 'upsert_indicateur_valeur',
    mutationFn: async ({
      annee,
      valeur,
    }: {
      annee: number;
      valeur: number | null;
    }) => {
      return (
        collectivite_id &&
        indicateur_id !== undefined &&
        supabaseClient.from(tableValeur(type, isPerso)).upsert(
          {
            collectivite_id,
            indicateur_id: indicateur_id as string,
            annee,
            valeur,
          },
          {onConflict: 'collectivite_id,indicateur_id,annee'}
        )
      );
    },
    onSuccess: useOnSuccess(args),
  });
};

/** Met à jour la valeur d'un commentaire */
const useUpsertIndicateurCommentaire = (args: TEditIndicateurValeurArgs) => {
  const {collectivite_id, definition, type} = args;
  const {id: indicateur_id, isPerso} = definition;

  return useMutation({
    mutationKey: 'upsert_indicateur_commentaire',
    mutationFn: async ({
      annee,
      commentaire,
    }: {
      annee: number;
      commentaire: string;
    }) => {
      return (
        collectivite_id &&
        indicateur_id !== undefined &&
        supabaseClient.from(tableCommentaire(type, isPerso)).upsert(
          {
            collectivite_id,
            indicateur_id: indicateur_id as string,
            annee,
            commentaire,
          },
          {onConflict: 'collectivite_id,indicateur_id,annee'}
        )
      );
    },
    onSuccess: useOnSuccess(args),
  });
};

const useDeleteIndicateurValeur = (args: TEditIndicateurValeurArgs) => {
  const {collectivite_id, definition, type} = args;
  const {id: indicateur_id, isPerso} = definition;

  return useMutation({
    mutationKey: 'delete_indicateur_valeur',
    mutationFn: async ({annee}: {annee: number}) => {
      if (!collectivite_id || isNaN(annee) || indicateur_id === undefined) {
        return;
      }
      return Promise.all([
        supabaseClient
          .from(tableValeur(type, isPerso))
          .update({valeur: null})
          .match({collectivite_id, indicateur_id, annee}),

        supabaseClient
          .from(tableCommentaire(type, isPerso))
          .update({commentaire: ''})
          .match({collectivite_id, indicateur_id, annee}),
      ]);
    },
    onSuccess: useOnSuccess(args),
  });
};

// recharge les valeurs et l'état "rempli"
const useOnSuccess = (args: TEditIndicateurValeurArgs) => {
  const {collectivite_id, definition, type} = args;
  const {id: indicateur_id} = definition;

  const queryClient = useQueryClient();
  return () => {
    if (!collectivite_id) return;
    queryClient.invalidateQueries([
      'indicateur_valeurs',
      collectivite_id,
      indicateur_id,
    ]);
    queryClient.invalidateQueries([
      'indicateur_valeurs_detail',
      collectivite_id,
      indicateur_id,
      type,
    ]);
    queryClient.invalidateQueries(['indicateur_rempli', collectivite_id]);
  };
};
