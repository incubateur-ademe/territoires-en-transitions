import {supabaseClient} from 'core-logic/api/supabase';
import {IActionStatutsRead} from 'generated/dataLayer/action_statuts_read';

// un sous-ensemble des champs pour alimenter notre table des taches
export type TacheDetail = Pick<
  IActionStatutsRead,
  'action_id' | 'identifiant' | 'nom' | 'avancement' | 'have_children' | 'depth'
>;

// toutes les entrées d'un référentiel pour une collectivité donnée
export const fetchActionStatutsList = async (
  collectivite_id: number | null,
  referentiel: string | null,
  filters: string[]
) => {
  // la requête
  let query = supabaseClient
    .from<IActionStatutsRead>('action_statuts')
    .select('action_id,identifiant,nom,avancement,have_children,depth')
    .match({collectivite_id, referentiel})
    .gt('depth', 0);

  // construit les filtres complémentaires sauf si "tous" est inclut
  if (!filters.includes('tous')) {
    const descendants = filters.join(',');
    const avancement = filters.map(s => `"${s}"`).join(',');
    const or = [
      `avancement_descendants.cs.{${descendants}}`,
      `avancement.in.(${avancement})`,
    ];
    if (filters.includes('non_renseigne')) {
      or.push('avancement.is.null');
    }

    // ajoute les filtres complétaires à la requêtes
    query = query.or(or.join(','));
  }

  // attends les données
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }
  return data as TacheDetail[];
};

// le statut d'une tâche du référentiel pour une collectivité donnée
export const fetchActionStatut = async (
  collectivite_id: number,
  action_id: number
) => {
  const {error, data} = await supabaseClient
    .from<IActionStatutsRead>('action_statuts')
    .select('action_id,avancement')
    .eq('collectivite_id', collectivite_id)
    .eq('action_id', action_id);
  if (error) {
    throw new Error(error.message);
  }
  return data;
};

// nombre de total de taches (entrées n'ayant pas d'enfants) dans un référentiel
export const getTotalTachesCount = async (referentiel: string) => {
  const {error, count} = await supabaseClient
    .from<IActionStatutsRead>('action_statuts')
    .select('identifiant', {count: 'exact', head: true})
    .eq('collectivite_id', 1)
    .eq('referentiel', referentiel)
    .eq('have_children', false)
    .limit(1);
  if (error) {
    throw new Error(error.message);
  }
  return count;
};
