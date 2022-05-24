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
    // exclus le filtre "non concerné"
    const tousSaufNonConcerne = filters.filter(f => f !== 'non_concerne');
    // traite les autres filtres à propos de l'avancement
    const descendants = tousSaufNonConcerne.join(',');
    const avancement = tousSaufNonConcerne.map(s => `"${s}"`).join(',');
    const or = tousSaufNonConcerne.length
      ? [
          `avancement_descendants.ov.{${descendants}}`,
          `avancement.in.(${avancement})`,
        ]
      : [];
    // gère le cas où null veut dire "non renseigné"
    if (tousSaufNonConcerne.includes('non_renseigne')) {
      or.push('and(avancement.is.null,have_children.is.false)');
    }
    // gère le filtre "non concerné"
    if (tousSaufNonConcerne.length !== filters.length) {
      or.push('non_concerne_descendants.is.true');
    }

    // ajoute les filtres complétaires à la requêtes
    query = query.or(or.join(','));
  }

  // attends les données
  const {error, data} = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data as TacheDetail[];

  // décompte les tâches uniquement
  const count = rows.reduce(
    (sum, {have_children}) => (have_children ? sum : sum + 1),
    0
  );
  return {rows, count};
};

// nombre de total de taches (entrées n'ayant pas d'enfants) dans un référentiel
export const getTotalTachesCount = async (referentiel: string | null) => {
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

export const updateTacheStatut = async ({
  collectivite_id,
  action_id,
  avancement,
  avancement_detaille,
}: {
  collectivite_id: number | null;
  action_id: string;
  avancement: string;
  avancement_detaille?: number[];
}) => {
  const {error, data} = await supabaseClient.from('action_statut').upsert(
    {
      collectivite_id,
      action_id,
      avancement: avancement === 'non_concerne' ? 'non_renseigne' : avancement,
      avancement_detaille:
        avancement_detaille ||
        (avancement === 'detaille' ? [0.3, 0.4, 0.3] : undefined),
      concerne: avancement !== 'non_concerne',
    },
    {onConflict: 'collectivite_id, action_id'}
  );
  if (error) {
    throw new Error(error.message);
  }
  return data;
};
