import {FiltreValues} from '@tet/api/dist/src/collectivites/shared/domain/filtre_ressource_liees.schema';
import {FiltreSpecifique as FiltreSpecifiqueIndicateurs} from '@tet/api/dist/src/indicateurs/indicateurs.list/domain/fetch_options.schema';
import {FiltreSpecifique as FiltreSpecifiqueFicheActions} from '@tet/api/dist/src/fiche_actions/resumes.list/domain/fetch_options.schema';
import {generateTitle} from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';

type FiltreKeys = FiltreValues &
  FiltreSpecifiqueIndicateurs &
  FiltreSpecifiqueFicheActions;

/** Converti les filtres sélectionnés en tableau de string
 * afin d'afficher les Badges correspondants aux filtres */
export const filtersToBadges = (data: FiltreKeys) => {
  const dataKeys = Object.keys(data || []) as Array<keyof FiltreKeys>;

  const badgeValues: string[] = [];

  let pilotes = 'Pilotes : ';

  dataKeys.forEach(key => {
    if (key === 'utilisateurPilotes') {
      pilotes += data[key]
        ?.map(pilote => `${pilote.prenom} ${pilote.nom}`)
        .join(', ');
    }
    if (key === 'personnePilotes') {
      pilotes += data[key]?.map(pilote => pilote.nom).join(', ');
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
      badgeValues.push(`Priorité : ${data[key]}`);
    }
    if (key === 'modifiedSince') {
      badgeValues.push(
        `Sur les ${data[key]?.match(/\d+/)?.[0]} derniers jours`
      );
    }
  });

  if (
    dataKeys.some(
      key => key === 'utilisateurPilotes' || key === 'personnePilotes'
    )
  ) {
    badgeValues.push(pilotes);
  }

  return badgeValues;
};
