import { DBClient } from '@/api';
import { ProgressionRow } from '../DEPRECATED_scores.types';
import { TFilters } from './filters';

// un sous-ensemble des champs pour alimenter notre table des taches
export type TacheDetail = ProgressionRow & { isExpanded: boolean };

/**
 * toutes les entrées d'un référentiel pour une collectivité et des filtres donnés
 * @deprecated stop using `action_statuts` PG view
 */
export const fetchActionStatutsList = async (
  supabase: DBClient,
  collectivite_id: number | null,
  referentiel: string | null,
  filters: TFilters
) => {
  // la requête
  let query = supabase
    .from('action_statuts')
    .select('action_id,type,avancement,avancement_descendants')
    .match({ collectivite_id, referentiel, concerne: true, desactive: false })
    .gt('depth', 0);

  // construit les filtres complémentaires sauf si "tous" est inclut
  const { statut } = filters;
  if (!statut.includes('tous')) {
    // traite les autres filtres à propos de l'avancement
    const filteredDescendants = statut
      .filter((s) => s !== 'non_renseigne' && s !== 'detaille')
      .join(',');
    const filteredAvancement = statut
      .filter((s) => s !== 'non_renseigne' && s !== 'detaille')
      .map((s) => `"${s}"`)
      .join(',');

    const or = [];

    if (statut.includes('non_renseigne')) {
      query.eq('renseigne', false);
    }

    if (statut.includes('detaille')) {
      or.push(
        ...[
          'and(type.eq.tache,avancement.eq.detaille)',
          'and(type.eq.sous-action,or(avancement.is.null,avancement.eq.non_renseigne),avancement_descendants.ov.{fait,programme,pas_fait,detaille})',
          'and(type.in.(axe,sous-axe,action),avancement_descendants.ov.{non_renseigne},avancement_descendants.ov.{fait,programme,pas_fait,detaille})',
        ]
      );
    }

    if (
      statut.filter((s) => s !== 'non_renseigne' && s !== 'detaille').length
    ) {
      or.push(
        ...[
          `and(type.eq.tache,avancement.in.(${filteredAvancement}))`,
          `and(type.eq.sous-action,avancement.in.(${filteredAvancement}))`,
          `and(type.eq.sous-action,or(avancement.eq.non_renseigne,avancement.is.null),avancement_descendants.ov.{${filteredDescendants}})`,
          `and(type.in.(axe,sous-axe,action),avancement_descendants.ov.{${filteredDescendants}})`,
        ]
      );
    }

    // ajoute les filtres complémentaires à la requêtes
    if (or.length > 0) {
      query = query.or(or.join(','));
    }
  }

  // attends les données
  const { error, data } = await query;

  if (error) {
    throw new Error(error.message);
  }

  const rows = data as TacheDetail[];

  // décompte les tâches uniquement
  const count = rows.reduce(
    (sum, { have_children }) => (have_children ? sum : sum + 1),
    0
  );
  return { rows, count };
};

// met à jour l'état d'une tâche
// TODO-SNAPSHOT mutualiser avec le hook similaire `useSaveActionStatut`
export const updateTacheStatut = async ({
  dbClient,
  collectivite_id,
  action_id,
  avancement,
  avancement_detaille,
}: {
  dbClient: DBClient;
  collectivite_id: number | null;
  action_id: string;
  avancement: string;
  avancement_detaille?: number[];
}) => {
  const { error, data } = await dbClient.from('action_statut').upsert(
    {
      collectivite_id,
      action_id,
      avancement,
      avancement_detaille:
        avancement_detaille ||
        (avancement === 'detaille' ? [0.25, 0.5, 0.25] : undefined),
      concerne: true,
    } as never,
    { onConflict: 'collectivite_id, action_id' }
  );
  if (error) {
    throw new Error(error.message);
  }
  return data;
};
