import {FiltreValues} from '@tet/api/dist/src/collectivites/shared/domain/filtre_ressource_liees.schema';
import {FiltreSpecifique as FiltreSpecifiqueIndicateurs} from '@tet/api/dist/src/indicateurs/indicateurs.list/domain/fetch_options.schema';
import {FiltreSpecifique as FiltreSpecifiqueFicheActions} from '@tet/api/dist/src/fiche_actions/fiche_resumes.list/domain/fetch_options.schema';
import {generateTitle} from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';

type FiltreKeys = FiltreValues &
  FiltreSpecifiqueIndicateurs &
  FiltreSpecifiqueFicheActions;

/** Converti les filtres sélectionnés en tableau de string
 * afin d'afficher les Badges correspondants aux filtres */
export const filtersToBadges = (data: FiltreKeys) => {
  const dataKeys = Object.keys(data || []) as Array<keyof FiltreKeys>;

  const badgeValues: string[] = [];

  const pilotes: string[] = [];

  dataKeys.forEach(key => {
    if (key === 'utilisateurPilotes') {
      const users = data[key]?.map(user => `${user.prenom} ${user.nom}`);
      users && pilotes.push(...users);
    }
    if (key === 'personnePilotes') {
      const personnes = data[key]?.map(tag => tag.nom);
      personnes && pilotes.push(...personnes);
    }
    if (key === 'thematiques') {
      badgeValues.push(
        `Thématiques : ${data[key]
          ?.map(thematique => thematique.nom)
          .join(', ')}`
      );
    }
    if (key === 'planActions') {
      badgeValues.push(
        `Plans d'action : ${data[key]
          ?.map(plan => generateTitle(plan.nom))
          .join(', ')}`
      );
    }
    if (key === 'estComplet') {
      badgeValues.push(data[key] ? 'Complet' : 'Incomplet');
    }
    if (key === 'priorites') {
      badgeValues.push(`Priorité : ${data[key]?.join(', ')}`);
    }
    if (key === 'statuts') {
      badgeValues.push(`Statuts : ${data[key]?.join(', ')}`);
    }
    if (key === 'modifiedSince') {
      badgeValues.push(
        `Sur les ${data[key]?.match(/\d+/)?.[0]} derniers jours`
      );
    }
  });

  if (pilotes.length > 0) {
    badgeValues.push(`Pilotes : ${pilotes.join(', ')}`);
  }

  return badgeValues;
};
