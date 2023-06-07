import {makeCollectiviteTacheUrl} from 'app/paths';
import {THistoriqueItem} from '../types';
import {referentielId} from 'utils/actions';

/** Génère les propriétés communes aux modifications (statut, précision) sur les
 * actions du référentiel */
export const getItemActionProps = (item: THistoriqueItem) => {
  const {
    action_id,
    action_identifiant,
    action_nom,
    tache_identifiant,
    tache_nom,
    collectivite_id,
  } = item;

  // génère le description de l'action et de la tâche auxquelles se rapporte la modification
  const descriptions = [];
  const isValidAction = action_identifiant && action_nom;
  if (isValidAction) {
    descriptions.push({
      titre: 'Action',
      description: `${action_identifiant} ${action_nom}`,
    });
  }
  if (tache_identifiant && tache_nom) {
    descriptions.push({
      // cas particulier : l'identifiant et le nom de l'action sont dans les
      // champs `tache_` pour la modification sur les précisions de l'action =>
      // on affiche alors "Action" au lieu de "Tâche"
      titre: isValidAction ? 'Tâche' : 'Action',
      description: `${tache_identifiant} ${tache_nom}`,
    });
  }

  // génère le lien vers la page concernée
  const pageLink = makeCollectiviteTacheUrl({
    referentielId: referentielId(action_id || ''),
    collectiviteId: collectivite_id,
    actionId: action_id!,
  });

  return {descriptions, pageLink};
};
