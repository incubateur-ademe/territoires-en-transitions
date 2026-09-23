import { Pertinence } from '@tet/domain/collectivites';
import { CategorieAction, Levier } from '@tet/domain/shared';
import { capitalize, plural } from '@tet/ui/labels/plural';

const pertinenceLabels = {
  non_pertinent: 'non pertinent',
  a_discuter: "à discuter avec l'élu",
  pertinent: 'pertinent',
} satisfies Record<Pertinence, string>;

const unsetPertinenceLabel = 'non renseignée';

const categorieActionLabels = {
  amenagement: 'Aménagement & infrastructures',
  planification: 'Réglementation & planification',
  financement: 'Financement & fiscalité',
  gouvernance: 'Gouvernance & partenariats',
  exemplarite: 'Exemplarité interne',
  sensibilisation: 'Sensibilisation & accompagnement',
} satisfies Record<CategorieAction, string>;

const toPertinenceLabel = (pertinence?: Pertinence): string => {
  if (pertinence === undefined) {
    return unsetPertinenceLabel;
  }
  return pertinenceLabels[pertinence];
};

export const collectivitesLabels = {
  collectivite: plural({ one: 'collectivité', other: 'collectivités' }),
  collectivitesActives: plural({
    one: 'collectivité active',
    other: 'collectivités actives',
  }),
  correspondAVotreRecherche: ({
    count,
    label,
  }: {
    count: number;
    label: string;
  }): string =>
    `${label} ${
      count === 1 ? 'correspond' : 'correspondent'
    } à votre recherche`,

  rejoindreUneCollectivite: "Rejoindre l'espace d'une collectivité",
  rejoindreUneCollectiviteDescription:
    "Rejoindre l'espace d'une autre collectivité",
  rejoindreUneCollectivitePlaceholder:
    'Renseigner le nom de la collectivité et sélectionner votre collectivité',
  rejoindreUneCollectiviteJeSuisReferent:
    'Je suis la personne référente dans le programme Territoire Engagé Transition Ecologique',

  priorisationLeviersTitre: 'Priorisation des leviers',
  pertinenceInfo: (pertinence?: Pertinence): string =>
    `Pertinence : ${toPertinenceLabel(pertinence)}`,
  pertinenceHeriteeDuLevier: 'Non pertinent, comme le levier',
  pertinenceLabel: (pertinence: Pertinence): string =>
    capitalize(pertinenceLabels[pertinence]),
  pertinenceLevierLabel: (levierNom: Levier): string =>
    `Pertinence du levier ${levierNom}`,
  categorieActionLabel: (categorie: CategorieAction): string =>
    categorieActionLabels[categorie],
  categories: 'Catégories',
  actionsRattachees: plural({
    zero: 'Aucune action rattachée',
    one: 'action déjà rattachée',
    other: 'actions déjà rattachées',
  }),
  mobilisationAbsente:
    "Aucune action de la collectivité n'est encore rattachée à un levier",
};
