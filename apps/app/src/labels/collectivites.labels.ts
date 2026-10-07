import { Pertinence } from '@tet/domain/collectivites';
import { CategorieAction, Levier } from '@tet/domain/shared';
import { capitalize, plural } from '@tet/ui/labels/plural';

const pertinenceLabels = {
  non_pertinent: 'non pertinent',
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
  pertinenceLabel: (pertinence: Pertinence): string =>
    capitalize(pertinenceLabels[pertinence]),
  marquerPertinence: (pertinence: Pertinence): string =>
    `Marquer ${pertinenceLabels[pertinence]}`,
  pertinenceLevierLabel: (levierNom: Levier): string =>
    `Pertinence du levier ${levierNom}`,
  categorieActionLabel: (categorie: CategorieAction): string =>
    categorieActionLabels[categorie],
  mobilisationAbsente:
    "Aucune action de la collectivité n'est encore rattachée à un levier",

  potentielsIndisponibles:
    "Le potentiel de réduction de GES par levier n'est disponible que pour les EPCI dont la trajectoire SNBC a été calculée.",
  leviersSansPotentiel: plural({
    one: 'levier hors matrice, sans potentiel de réduction connu',
    other: 'leviers hors matrice, sans potentiel de réduction connu',
  }),
  matriceLegende:
    'Leviers par potentiel de réduction de GES et mobilisation de la collectivité',
  axeMobilisation: 'Mobilisation',
  axeMobilisationMin: 'Peu mobilisé',
  axeMobilisationMax: 'Bien mobilisé',
  axePotentiel: 'Potentiel de réduction de GES',
  axePotentielMin: 'Faible',
  axePotentielMax: 'Fort',
  quadrantFortImpactPeuMobilise:
    'Leviers à prioriser : fort impact, peu mobilisés',
  quadrantFortImpactBienMobilise: 'Fort impact, bien mobilisés',
  quadrantFaibleImpactPeuMobilise: 'Faible impact, peu mobilisés',
  quadrantFaibleImpactBienMobilise: 'Faible impact, bien mobilisés',
  levierActionsDeMaCollectivite: plural({
    one: 'action de ma collectivité',
    other: 'actions de ma collectivité',
  }),
  levierActionsPreselectionnees: plural({
    one: 'action ajoutée à la présélection',
    other: 'actions ajoutées à la présélection',
  }),
  cliquerPourVoirLesActions: 'Cliquez sur le point pour voir les actions',
  voirLesDonneesDuGraphique: 'Voir les données du graphique',
  levier: 'Levier',
  legendePreselection: 'Au moins une action dans la présélection',

  actionsPreselectionnees: plural({
    one: 'action à potentiel de réduction de GES présélectionnée',
    other: 'actions à potentiel de réduction de GES présélectionnées',
  }),
  actionsPreselectionneesAide: 'À choisir depuis les leviers de la matrice.',
  leviersEnAngleMort: plural({
    one: 'levier en angle mort',
    other: 'leviers en angle mort',
  }),
  leviersEnAngleMortAide:
    'Leviers pertinents à fort potentiel et encore peu mobilisés.',
  actionsAnalysees: plural({
    one: 'action de la collectivité rattachée à un levier',
    other: 'actions de la collectivité rattachées à un levier',
  }),

  selectionnerUnLevier:
    'Cliquez sur un levier de la matrice pour consulter ses actions de référence.',
  leviersAPrioriser: 'Leviers à prioriser',
  vueEnsembleLeviers: "Vue d'ensemble",
  repartitionPotentielInfo:
    "Chaque case montre la part du potentiel de réduction de GES d'un levier qui revient à une catégorie d'action ; plus sa couleur est soutenue, plus la collectivité y est mobilisée. Cliquez sur un levier pour consulter ses actions de référence.",
  repartitionPotentielLegende:
    "Potentiel de réduction de GES par levier et par catégorie d'action, nuancé par la mobilisation de la collectivité",
  impactPotentielDuTerritoire: (score: number): string =>
    `Impact potentiel : ${score}/100 du territoire`,
  cliquerPourVoirLesActionsDuLevier: 'Cliquez pour voir les actions du levier',
  mobilisationNulle: 'Non mobilisé',
  mobilisationFaible: 'Peu mobilisé',
  mobilisationMoyenne: 'Bien mobilisé',
  mobilisationForte: 'Très mobilisé',
  rechercherUneActionDeReference:
    'Rechercher une action par titre ou description',
  filtrerParLevier: 'Tous les leviers',
  filtrerParCategorie: 'Toutes les catégories',
  aucuneActionDeReferenceDuLevier:
    "Nous n'avons pas de recommandation sur ce levier.",
  ajouterALaPreselection: 'Ajouter à la présélection',
  ajouteeALaPreselection: 'Ajoutée',
  pasInteresse: 'Pas intéressé',
  retirerDeLaPreselection: 'Retirer',
  retablirAction: 'Rétablir',
  actionsIgnorees: plural({
    one: 'action marquée « Pas intéressé »',
    other: 'actions marquées « Pas intéressé »',
  }),
  votrePreselection: 'Votre présélection',
  actionDeReferenceAdeme: 'Action de référence ADEME',
  ajouterAuPlan: (planNom: string): string => `Ajouter à « ${planNom} »`,
  actionAjouteeAuPlanSucces: 'Action ajoutée au plan',
  actionAjouteeAuPlanErreur: "Échec de l'ajout de l'action au plan",
  ajouteAuPlan: (planNom: string): string => `Ajouté à « ${planNom} »`,
  annulerAjoutAuPlan: 'Annuler',
  ajoutAuPlanAnnuleSucces: 'Ajout au plan annulé',
  ajoutAuPlanAnnuleErreur: "Échec de l'annulation de l'ajout au plan",
  actionAjouteeAuPlanInfo:
    "Une action ajoutée à un plan y reste même si elle est retirée de la présélection. Le potentiel qu'elle couvre sera recalculé au prochain passage d'analyse, le tableau de bord ci-dessus ne le compte pas encore.",
  preselectionVide: "Aucune action dans la présélection pour l'instant",
  preselectionVideDescription:
    'Cliquez sur un levier de la matrice puis sur « Ajouter à la présélection » pour retrouver une action ici.',
};
