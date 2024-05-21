/**
 * Utilitaires pour appliquer des données open-data aux objectifs et résultats d'une collectivité
 */

import {useMutation} from 'react-query';
import {useEventTracker} from '@tet/ui';
import {supabaseClient} from 'core-logic/api/supabase';
import {
  TIndicateurValeurEtCommentaires,
  useIndicateurValeursEtCommentaires,
} from '../useIndicateurValeurs';
import {SourceType, TIndicateurDefinition} from '../types';
import {SOURCE_TYPE_LABEL} from '../constants';
import {useOnSuccess} from './useEditIndicateurValeur';

/**
 * Compare les données actuelles et les données importées
 */
export const compareOpenData = (
  /** données actuelles */
  currentData: TIndicateurValeurEtCommentaires[],
  /** données à appliquer */
  openData: TIndicateurValeurEtCommentaires[]
) => {
  if (!openData.length) {
    // rien à appliquer
    return null;
  }

  // pour compter les lignes en conflit
  let conflits = 0;
  // et celles à insérer
  let ajouts = 0;

  // parcours chaque ligne à appliquer
  const lignes = openData.map(({annee, valeur, source}) => {
    // cherche si une valeur a déjà été saisie pour la même année
    const existingData = currentData?.find(d => d.annee === annee);

    // si pas de valeur pré-existante ou valeur identique => pas de conflit
    if (!existingData || existingData.valeur === valeur) {
      if (!existingData) {
        // si la donnée n'existe pas encore c'est un ajout
        ajouts++;
      }
      return {
        conflit: false as const,
        annee,
        valeur: existingData?.valeur ?? null,
        nouvelleValeur: valeur,
        source,
      };
    }

    // sinon, la donnée est en conflit avec la valeur existante
    conflits++;
    return {
      conflit: true as const,
      annee,
      valeur: existingData.valeur,
      nouvelleValeur: valeur,
      source,
    };
  });

  // renvoi le nombre et le détail des conflits relevés
  return {
    lignes,
    conflits,
    ajouts,
  };
};

export type OpenDataComparaison = ReturnType<typeof compareOpenData>;

/**
 * Applique les changements
 */
type UseApplyOpenDataArgs = {
  collectivite_id: number | null;
  definition: TIndicateurDefinition;
  source?: {id: string; nom: string; type: SourceType};
};

export const useApplyOpenData = ({
  collectivite_id,
  definition,
  source,
}: UseApplyOpenDataArgs) => {
  const trackEvent = useEventTracker('app/indicateurs/predefini');

  const type = source?.type || 'resultat';
  const onSuccess = useOnSuccess({
    collectivite_id,
    definition,
    type,
  });

  return useMutation(
    async ({
      comparaison,
      overwrite,
    }: {
      comparaison: OpenDataComparaison;
      overwrite: boolean;
    }) => {
      if (!source || !collectivite_id) return null;

      // filtre si nécessaire les lignes en conflit avec les données existantes
      const filteredData = overwrite
        ? comparaison?.lignes
        : comparaison?.lignes?.filter(c => !c.conflit);

      // prépare les lignes à mettre à jour
      const toUpsert = filteredData?.map(({annee, nouvelleValeur}) => ({
        annee,
        valeur: nouvelleValeur,
        collectivite_id,
        indicateur_id: definition.id as string,
      }));
      if (!toUpsert?.length) return false;

      // enregistre les changements
      // TODO: à changer quand le modèle aura changé
      const table = `indicateur_${source.type}` as const;
      const {error} = await supabaseClient.from(table).upsert(toUpsert);
      if (error) {
        return false;
      }

      // enregistre aussi le champ `source` en commentaire
      const commentsToUpsert = filteredData!
        .filter(({source}) => !!source)
        .map(({annee, source}) => ({
          annee,
          commentaire: source!,
          collectivite_id,
          indicateur_id: definition.id as string,
        }));
      const commentsTable = `indicateur_${source.type}_commentaire` as const;
      return supabaseClient.from(commentsTable).upsert(commentsToUpsert, {
        onConflict: 'collectivite_id,indicateur_id,annee',
      });
    },
    {
      mutationKey: 'apply_open_data',
      meta: {
        success:
          source &&
          `Les ${SOURCE_TYPE_LABEL[source.type]} ${
            source.nom
          } ont bien été appliqués`,
      },
      onSuccess: (data, {overwrite}) => {
        onSuccess();
        trackEvent('apply_open_data', {
          collectivite_id: collectivite_id!,
          indicateur_id: definition.id as string,
          source_id: source!.id,
          type,
          overwrite,
        });
      },
    }
  );
};

/**
 * Charge les données et fait la comparaison
 */
export const useOpenDataComparaison = ({
  definition,
  importSource,
  type,
}: {
  definition: TIndicateurDefinition;
  importSource: string;
  type: SourceType | null;
}) => {
  const {data: currentData} = useIndicateurValeursEtCommentaires({
    definition,
    type,
  });
  const {data: openData} = useIndicateurValeursEtCommentaires({
    definition,
    type,
    importSource,
    enabled: !!importSource,
  });
  return compareOpenData(currentData || [], openData || []);
};
