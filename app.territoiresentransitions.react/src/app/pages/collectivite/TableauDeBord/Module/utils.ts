import {FiltreValues} from '@tet/api/dist/src/collectivites/shared/domain/filtre_ressource_liees.schema';
import {Indicateurs} from '@tet/api';
import {FiltreSpecifique as FiltreSpecifiqueFicheActions} from '@tet/api/dist/src/fiche_actions/fiche_resumes.list/domain/fetch_options.schema';
import {generateTitle} from 'app/pages/collectivite/PlansActions/FicheAction/data/utils';

type FiltreKeys = FiltreValues &
  Indicateurs.domain.FiltreSpecifique &
  FiltreSpecifiqueFicheActions;

/** Converti les filtres sélectionnés en tableau de string
 * afin d'afficher les Badges correspondants aux filtres */
export const filtersToBadges = (data: FiltreKeys) => {
  const dataKeys = Object.keys(data || []) as Array<keyof FiltreKeys>;

  const badgeValues: string[] = [];

  const pilotes: string[] = [];
  const referents: string[] = [];

  dataKeys.forEach(key => {
    if (key === 'utilisateurPilotes') {
      const users = data[key]?.map(user => `${user.prenom} ${user.nom}`);
      users && pilotes.push(...users);
    }
    if (key === 'personnePilotes') {
      const personnes = data[key]?.map(tag => tag.nom);
      personnes && pilotes.push(...personnes);
    }
    if (key === 'utilisateurReferents') {
      const users = data[key]?.map(user => `${user.prenom} ${user.nom}`);
      users && referents.push(...users);
    }
    if (key === 'personneReferentes') {
      const personnes = data[key]?.map(tag => tag.nom);
      personnes && referents.push(...personnes);
    }
    if (key === 'thematiques') {
      badgeValues.push(
        `Thématique : ${data[key]
          ?.map(thematique => thematique.nom)
          .join(', ')}`
      );
    }
    if (key === 'planActions') {
      badgeValues.push(
        `Plan d'action : ${data[key]
          ?.map(plan => generateTitle(plan.nom))
          .join(', ')}`
      );
    }
    if (key === 'estComplet') {
      badgeValues.push(`Complétion : ${data[key] ? 'Complet' : 'Incomplet'}`);
    }
    if (key === 'budgetPrevisionnel') {
      data[key] && badgeValues.push('Budget renseigné');
    }
    if (key === 'restreint') {
      data[key] && badgeValues.push('Confidentialité');
    }
    if (key === 'hasIndicateurLies') {
      data[key] && badgeValues.push('Indicateur(s) lié(s)');
    }
    if (key === 'priorites') {
      badgeValues.push(`Priorité : ${data[key]?.join(', ')}`);
    }
    if (key === 'statuts') {
      badgeValues.push(`Statut : ${data[key]?.join(', ')}`);
    }
    if (key === 'servicePilotes') {
      badgeValues.push(
        `Direction ou service pilote : ${data[key]
          ?.map(service => service.nom)
          .join(', ')}`
      );
    }
    if (key === 'financeurs') {
      badgeValues.push(`Financeur : ${data[key]?.map(i => i.nom).join(', ')}`);
    }
    if (key === 'modifiedSince') {
      badgeValues.push(
        `Sur les ${data[key]?.match(/\d+/)?.[0]} derniers jours`
      );
    }
  });

  if (pilotes.length > 0) {
    badgeValues.push(`Pilote : ${pilotes.join(', ')}`);
  }

  if (referents.length > 0) {
    badgeValues.push(`Élu·e référent·e : ${referents.join(', ')}`);
  }

  return badgeValues;
};
