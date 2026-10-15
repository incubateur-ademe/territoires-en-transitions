import { Pertinence } from '@tet/domain/collectivites';
import { CategorieAction, Levier } from '@tet/domain/shared';
import { capitalize, plural } from '@tet/ui/labels/plural';

const pertinenceLabels = {
  non_pertinent: 'non pertinent',
  pertinent: 'pertinent',
} satisfies Record<Pertinence, string>;

const unsetPertinenceLabel = 'non renseignée';

const restartTourLabel = 'Comment ça marche ?';

const savedActionsAccessLabel = 'Voir mes actions sauvegardées';

const actionsAnalyseesLabel = plural({ one: 'action', other: 'actions' });

const plansAnalysesLabel = plural({ one: 'plan', other: 'plans' });

const issuesLabel = plural({ one: 'issue', other: 'issues' });

const categorieActionLabels = {
  amenagement: 'Aménagement & infrastructures',
  planification: 'Réglementation & planification',
  financement: 'Financement & fiscalité',
  gouvernance: 'Gouvernance & partenariats',
  exemplarite: 'Exemplarité interne',
  sensibilisation: 'Sensibilisation & accompagnement',
} satisfies Record<CategorieAction, string>;

const categorieActionShortLabels = {
  amenagement: 'Aménagement',
  planification: 'Planification',
  financement: 'Financement',
  gouvernance: 'Gouvernance',
  exemplarite: 'Exemplarité',
  sensibilisation: 'Sensibilisation',
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

  priorisationLeviersTitre: 'Aide à la priorisation',
  priorisationMethodologie: 'Méthodologie',
  priorisationVisiteRelancer: restartTourLabel,
  priorisationVisiteParcoursTitre: 'Votre parcours en 3 étapes',
  priorisationVisiteIaTitre: 'Intelligence artificielle.',
  priorisationVisiteIaDescription:
    "L'analyse est basée sur des algorithmes utilisant de l'intelligence artificielle. Les résultats de cette version alpha sont donc à prendre avec prudence.",
  priorisationVisiteReperageTitre: 'Repérer',
  priorisationVisiteReperageDescription:
    'Visualisez les leviers à prioriser pour votre collectivité : la zone rouge de la matrice.',
  priorisationVisiteExplorationTitre: 'Explorer',
  priorisationVisiteExplorationDescription:
    'Cliquez un point pour ouvrir le levier et voir les actions de référence qui y répondent.',
  priorisationVisiteSauvegardeTitre: 'Sauvegarder',
  priorisationVisiteSauvegardeDescription:
    'Sélectionnez les actions qui vous intéressent pour les sauvegarder',
  priorisationVisiteMatriceTitre: 'La matrice des leviers',
  priorisationVisiteMatriceDescription:
    'Un point = un levier. Plus il est haut, plus son potentiel de réduction de GES estimé est fort ; plus il est à droite, plus vous le mobilisez déjà.',
  priorisationVisiteLevierAPrioriserTitre: 'Commencez par le rouge',
  priorisationVisiteLevierAPrioriserDescription:
    'La zone rouge regroupe les leviers à fort impact que vous mobilisez encore peu. Ouvrez celui-ci pour voir les actions qui y répondent.',
  priorisationVisiteOuvrirLevier: 'Ouvrir ce levier',
  priorisationVisiteDetailLevierTitre: 'Le détail du levier',
  priorisationVisiteDetailLevierDescription:
    'Secteur, impact potentiel estimé et actions de référence, regroupées par catégorie. Si le levier ne concerne pas votre territoire, marquez-le non pertinent.',
  priorisationVisiteActionsTitre: 'Retenez ce qui est pertinent',
  priorisationVisiteActionsDescription: `« Sauvegarder » ajoute l'action à votre liste. « Pas intéressé » la retire des suggestions ; vous pourrez la restaurer.`,
  priorisationVisiteAideTitre: 'Retrouvez la visite ici',
  priorisationVisiteAideDescription: `« ${restartTourLabel} » relance cette visite. Votre liste apparaîtra à côté dès la première action sauvegardée.`,
  actionsSauvegardeesTitre: 'Mes actions sauvegardées',
  pertinenceInfo: (pertinence?: Pertinence): string =>
    `Pertinence : ${toPertinenceLabel(pertinence)}`,
  pertinenceLabel: (pertinence: Pertinence): string =>
    capitalize(pertinenceLabels[pertinence]),
  levierPertinence: (pertinence: Pertinence): string =>
    `Levier ${pertinenceLabels[pertinence]}`,
  pertinenceLevierLabel: (levierNom: Levier): string =>
    `Pertinence du levier ${levierNom}`,
  categorieActionLabel: (categorie: CategorieAction): string =>
    categorieActionLabels[categorie],
  categorieActionShortLabel: (categorie: CategorieAction): string =>
    categorieActionShortLabels[categorie],
  potentielsIndisponibles:
    "Le potentiel de réduction de GES par levier n'est disponible que pour les EPCI dont la trajectoire SNBC a été calculée.",
  leviersSansPotentiel: plural({
    one: 'levier hors matrice, sans potentiel de réduction connu',
    other: 'leviers hors matrice, sans potentiel de réduction connu',
  }),
  matriceLegende:
    'Leviers par potentiel de réduction de GES et mobilisation de la collectivité',
  axeMobilisation: 'Mobilisation actuelle (estimée)',
  axePotentiel: 'Potentiel de réduction de GES (estimé)',
  axePotentielMin: 'Faible',
  axePotentielMax: 'Fort',
  quadrantLevierAPrioriser: 'Levier à prioriser',
  quadrantFortImpactPeuMobilise: 'Fort impact, peu mobilisé',
  quadrantFortImpactBienMobilise: 'Fort impact, bien mobilisé',
  quadrantFaibleImpactPeuMobilise: 'Faible impact, peu mobilisé',
  quadrantFaibleImpactBienMobilise: 'Faible impact, bien mobilisé',
  levierQuadrantLecture: {
    high_impact_low_mobilisation:
      'Levier à prioriser : fort impact, peu mobilisé',
    high_impact_high_mobilisation: 'Fort impact, bien mobilisé',
    low_impact_low_mobilisation: 'Faible impact, peu mobilisé',
    low_impact_high_mobilisation: 'Faible impact, bien mobilisé',
  },
  levierSecteur: 'Secteur',
  levierImpactPotentielEstime: 'Impact potentiel estimé (/100)',
  levierMobilisationEstimee: 'Mobilisation estimée',
  levierLecture: 'Lecture',
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
  legendeActionSauvegardee: 'Au moins une action sauvegardée',

  actionsSauvegardees: plural({
    one: 'action sauvegardée',
    other: 'actions sauvegardées',
  }),
  actionsSauvegardeesDescription:
    "Pour alimenter vos discussions lors de comités de pilotage. Elles pourront alimenter l'évolution de vos plans d'action, être discutées avec vos collègues, élus, partenaires.",
  voirMesActionsSauvegardees: savedActionsAccessLabel,
  leviersAPrioriser: plural({
    one: 'levier à prioriser',
    other: 'leviers à prioriser',
  }),
  leviersAPrioriserDescription:
    "Fort impact, encore peu mobilisés : c'est par là que vous pouvez commencer.",
  ouvrirLevierLePlusImportant: 'Ouvrir le levier le plus important',
  priorisationVueBloqueeTitre: 'Ajoutez des actions pour accéder à cette vue',
  priorisationVueBloqueeDescription:
    "La matrice repose sur les actions de vos plans : elle montre où votre collectivité mobilise déjà chaque levier. Sans action, elle ne peut pas être calculée.",
  ajouterDesActions: 'Ajouter des actions',
  priorisationAnalyse: ({
    actionsCount,
    plansCount,
  }: {
    actionsCount: number;
    plansCount: number;
  }): string =>
    `Analyse de ${actionsAnalyseesLabel({
      count: actionsCount,
    })} ${issuesLabel({
      count: actionsCount,
      withoutCount: true,
    })} de vos ${plansAnalysesLabel({
      count: plansCount,
    })}. Les impacts et la mobilisation sont des estimations.`,

  selectionnerUnLevier:
    'Cliquez sur un levier de la matrice pour consulter ses actions de référence.',
  matriceDePriorisation: 'Matrice de priorisation',
  carteDesLeviers: 'Carte',
  classementSousLeviers: 'Classement',
  vueEnsembleLeviers: "Vue d'ensemble",
  sousLeviersAPrioriser: 'Sous-leviers à prioriser',
  sousLevierLabel: ({
    levierNom,
    categorie,
  }: {
    levierNom: string;
    categorie: CategorieAction;
  }): string => `${levierNom} · ${categorieActionLabels[categorie]}`,
  sousLevier: 'Sous-levier',
  sousLeviersLegende:
    'Un sous-levier (levier × catégorie) par barre, triés par potentiel de réduction estimé décroissant. Cliquez une barre pour ouvrir le levier sur cette catégorie.',
  repartitionPotentielLegende:
    'Taille du rectangle = potentiel de réduction de GES estimé. Un drapeau signale un levier à prioriser. Cliquez une zone pour ouvrir le levier.',
  impactPotentielDuTerritoire: (score: number): string =>
    `Impact potentiel : ${score}/100 du territoire`,
  impactPotentielEstime: (score: number): string =>
    `Impact potentiel estimé : ${score}/100`,
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
  sauvegarderAction: 'Sauvegarder',
  ajouteeALaPreselection: 'Ajoutée',
  pasInteresse: 'Pas intéressé',
  actionDeReferenceInteresse: "Ça m'intéresse",
  retirerDeMaListe: 'Retirer de ma liste',
  retablirAction: 'Rétablir',
  ilManqueUneAction: 'Il manque une action ?',
  listeNonExhaustiveSignalerAction:
    "Cette liste n'est pas (encore) exhaustive. Proposez-nous une action que vous jugez pertinente pour ce levier.",
  suggererUneAction: 'Suggérer une action',
  decrireLAction: "Décrivez l'action en quelques mots",
  suggestionEnvoyee: 'Merci, votre suggestion a bien été envoyée.',
  actionDescriptionRequise: "Décrivez l'action pour l'envoyer.",
  actionsIgnorees: plural({
    one: 'action marquée « Pas intéressé »',
    other: 'actions marquées « Pas intéressé »',
  }),
  actionDeReferenceAdeme: 'Action de référence ADEME',
  ajouterAuPlan: (planNom: string): string => `Ajouter à « ${planNom} »`,
  actionAjouteeAuPlanSucces: 'Action ajoutée au plan',
  actionAjouteeAuPlanErreur: "Échec de l'ajout de l'action au plan",
  ajouteAuPlan: (planNom: string): string => `Ajouté à « ${planNom} »`,
  annulerAjoutAuPlan: 'Annuler',
  ajoutAuPlanAnnuleSucces: 'Ajout au plan annulé',
  ajoutAuPlanAnnuleErreur: "Échec de l'annulation de l'ajout au plan",
  actionAjouteeAuPlanInfo:
    "Une action ajoutée à un plan y reste même si elle est retirée de cette liste. Le potentiel qu'elle couvre sera recalculé au prochain passage d'analyse, le tableau de bord de la priorisation ne le compte pas encore.",
  preselectionVide: "Aucune action dans la présélection pour l'instant",
  preselectionVideDescription:
    'Cliquez sur un levier de la matrice puis sur « Sauvegarder » pour retrouver une action ici.',
};
