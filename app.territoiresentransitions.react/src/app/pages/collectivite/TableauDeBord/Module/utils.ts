import {FiltreValues} from '@tet/api/dist/src/collectivites/shared/domain/filtre_ressource_liees.schema';
import {generateTitle} from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';

/** Converti les filtres sélectionnés en tableau de string
 * afin d'afficher les Badges correspondants aux filtres */
export const filtersToBadges = (data: FiltreValues) => {
  const dataKeys = Object.keys(data || []) as Array<keyof FiltreValues>;

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
        `Plans  d'action : ${data[key]
          ?.map(plan => generateTitle(plan.nom))
          .join(', ')}`
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
