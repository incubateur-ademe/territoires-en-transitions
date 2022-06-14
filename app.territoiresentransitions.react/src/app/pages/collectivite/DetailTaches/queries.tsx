import {supabaseClient} from 'core-logic/api/supabase';
import {IActionStatutsRead} from 'generated/dataLayer/action_statuts_read';
import {ActionReferentiel} from '../ReferentielTable/useReferentiel';
import {TFilters} from './filters';

// un sous-ensemble des champs pour alimenter notre table des taches
export type TacheDetail = ActionReferentiel & ActionStatut;
export type ActionStatut = Pick<IActionStatutsRead, 'action_id' | 'avancement'>;

// toutes les entrées d'un référentiel pour une collectivité et des filtres donnés
export const fetchActionStatutsList = async (
  collectivite_id: number | null,
  referentiel: string | null,
  filters: TFilters
) => {
  // la requête
  let query = supabaseClient
    .from<IActionStatutsRead>('action_statuts')
    .select('action_id,avancement')
    .match({collectivite_id, referentiel})
    .gt('depth', 0);

  // construit les filtres complémentaires sauf si "tous" est inclut
  const {statut} = filters;
  if (!statut.includes('tous')) {
    // traite les autres filtres à propos de l'avancement
    const descendants = statut.join(',');
    const avancement = statut.map(s => `"${s}"`).join(',');
    const or = statut.length
      ? [
          `avancement_descendants.ov.{${descendants}}`,
          `avancement.in.(${avancement})`,
        ]
      : [];
    // gère le cas où null veut dire "non renseigné"
    if (statut.includes('non_renseigne')) {
      or.push('and(avancement.is.null,have_children.is.false)');
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

// met à jour l'état d'une tâche
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
      avancement,
      avancement_detaille:
        avancement_detaille ||
        (avancement === 'detaille' ? [0.3, 0.4, 0.3] : undefined),
      concerne: true,
    },
    {onConflict: 'collectivite_id, action_id'}
  );
  if (error) {
    throw new Error(error.message);
  }
  return data;
};
