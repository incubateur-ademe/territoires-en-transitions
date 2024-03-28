import {useQuery} from 'react-query';
import {DISABLE_AUTO_REFETCH, supabaseClient} from 'core-logic/api/supabase';
import {useCollectiviteId} from 'core-logic/hooks/params';
import {TIndicateurChartInfo} from '../types';

// cas spécial pour cet indicateur
// TODO: utiliser un champ distinct dans les markdowns plutôt que cet ID "en dur"
const ID_COMPACITE_FORMES_URBAINES = 'cae_9';

/**
 * Charge les données nécessaires à l'affichage d'un graphique indicateur.
 *
 * Détermine notamment l'id à utiliser pour lire les valeurs à afficher dans le graphe
 * ou le décompte à afficher à la place du graphe.
 */

export const useIndicateurChartInfo = (indicateur_id: number | string) => {
  const collectivite_id = useCollectiviteId();

  return useQuery(
    ['indicateur_chart_info', collectivite_id, indicateur_id],
    async () => {
      if (!collectivite_id) return;

      const isPerso = typeof indicateur_id === 'number';
      const colonnes = isPerso
        ? 'nom, unite, rempli, confidentiel'
        : 'nom, unite, rempli, confidentiel,...definition_referentiel(sans_valeur, titre_long, participation_score), enfants(rempli)';

      const {data, error} = await supabaseClient
        .from('indicateur_definitions')
        .select(colonnes)
        .eq('collectivite_id', collectivite_id)
        .eq(isPerso ? 'indicateur_perso_id' : 'indicateur_id', indicateur_id)
        .returns<TIndicateurChartInfo[]>();

      if (error) {
        throw new Error(error.message);
      }

      const info = data?.[0] || {};
      const {sans_valeur, enfants} = info;

      // pour un indicateur composé (sans parent)
      if (sans_valeur && enfants?.length) {
        const count = nombreIndicateursRemplis(enfants);
        const total = enfants.length;

        // afficher le graphique du 1er enfant rempli pour
        // 1. COMPACITÉ DES FORMES URBAINES : au moins 1 des enfants est “complété”
        if (
          (indicateur_id === ID_COMPACITE_FORMES_URBAINES && count >= 1) ||
          // 2. OU si tous les enfants sont remplis
          count === total
        ) {
          const premierRempli = enfants.find(definition => definition.rempli);
          return {...info, id: premierRempli?.id || indicateur_id};
        }

        // sinon renvoi le décompte des indicateurs restants à compléter
        return {...info, id: indicateur_id, count, total};
      }

      // dans tous les autres cas utilise l'id de la définition
      return {...info, id: indicateur_id};
    },
    DISABLE_AUTO_REFETCH
  );
};
// compte dans une liste d'indicateurs ceux qui sont remplis
const nombreIndicateursRemplis = (liste: TIndicateurChartInfo['enfants']) =>
  liste?.reduce((count, d) => count + (d.rempli ? 1 : 0), 0) || 0;
