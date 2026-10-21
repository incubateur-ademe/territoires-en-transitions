import { plural } from '@tet/ui/labels/plural';

export const sharedLabels = {
  /** Actions */
  valider: 'Valider',
  ajouter: 'Ajouter',
  annuler: 'Annuler',
  envoyer: 'Envoyer',
  confirmer: 'Confirmer',
  selectionner: 'Sélectionner',
  fermer: 'Fermer',
  modifier: 'Modifier',
  supprimer: 'Supprimer',
  deplacer: 'Déplacer',
  dupliquer: 'Dupliquer',
  telecharger: 'Télécharger',
  enregistrer: 'Enregistrer',
  reessayer: 'Réessayer',
  exporter: 'Exporter',
  exporterPdf: 'Exporter en PDF',
  rechercher: 'Rechercher',
  saisirLeTexte: 'Saisir le texte',
  telechargerLeGraphique: 'Télécharger le graphique',

  beta: 'Bêta',

  visiteGuideeEtape: ({
    index,
    size,
  }: {
    index: number;
    size: number;
  }): string => `Étape ${index} sur ${size}`,
  visiteGuidee: 'Visite guidée',
  visiteGuideePasser: 'Passer la visite',
  visiteGuideeQuitter: 'Quitter la visite',
  visiteGuideeCommencer: 'Commencer la visite',
  precedent: 'Précédent',
  suivant: 'Suivant',
  terminer: 'Terminer',
  visiteGuideeProgression: 'Progression de la visite',

  /** Filtres */
  filtrer: 'Filtrer',
  filtrerSur: 'Filtrer sur',
  filtreSort: 'Tri',
  reinitialiserLesFiltres: 'Réinitialiser les filtres',
  resultat: plural({
    one: 'résultat',
    other: 'résultats',
    zero: 'Aucun résultat',
  }),

  /** Autres */
  description: plural({ one: 'description', other: 'descriptions' }),
  descriptionWritePlaceholder: 'Saisir une description',
  supprimerDescription: 'Supprimer la description',
  ajouterDescription: 'Ajouter une description',

  thematique: plural({ one: 'Thématique', other: 'Thématiques' }),
  thematiquePlaceholderSelection: 'Sélectionner une ou plusieurs thématiques',
  sousThematique: plural({ one: 'Sous-thématique', other: 'Sous-thématiques' }),
  sousThematiqueSelectionTooltip:
    'Sélectionner une thématique pour pouvoir sélectionner une ou plusieurs sous-thématiques',
  historique: 'Historique',
  source: 'Source',
  sources: plural({ one: 'source', other: 'sources' }),

  modificationsGroupees: 'Modifications groupées',

  placeholderRecherchezMotsCles: 'Rechercher par mots-clés',
  placeholderRecherchezIntitule: 'Rechercher par intitulé',

  preferences: 'Préférences',

  champObligatoireErreur: 'Ce champ est obligatoire',
  champTropLongErreur: (maximum: number | bigint): string =>
    `${maximum} caractères maximum`,
  champValeurInvalideErreur: 'Valeur invalide',

  actionsDeReference: 'Actions de référence',
  actionsDeReferenceRecherche: 'Rechercher une action de référence',
  actionsDeReferenceLeviersLabel: 'Leviers',
  actionsDeReferenceCategoriesLabel: 'Catégories',
  actionsDeReferenceAucune:
    'Aucune action de référence ne correspond à votre recherche',
  actionsDeReferenceTrouvees: plural({
    one: 'action de référence trouvée',
    other: 'actions de référence trouvées',
  }),
  actionsDeReferenceEffacerFiltres: 'Effacer les filtres',
  actionsDeReferenceTriLabel: 'Trier par',
  actionsDeReferenceTriTitre: 'Titre',
  actionsDeReferenceTriLevier: 'Levier',
  actionsDeReferenceTriCategorie: 'Catégorie',
  actionDeReferenceTitre: 'Action de référence',
  actionDeReferenceIntrouvable: "Cette action de référence n'existe pas",
  actionDeReferenceTitreLabel: 'Titre',
  actionDeReferenceDescriptionLabel: 'Description',
  actionDeReferenceLevierLabel: 'Levier',
  actionDeReferenceCategorieLabel: 'Catégorie',
  actionDeReferenceSecteurInfo: 'Secteur :',
  actionDeReferenceLevierInfo: 'Levier :',
  actionDeReferenceCategorieInfo: 'Catégorie :',
  actionDeReferenceImpactInfo: 'Impact potentiel du levier :',
  actionDeReferenceImpactValeur: (score: number): string =>
    `${score}/100 du territoire (estimé)`,
  actionDeReferenceImpactValeurDuLevier: ({
    levierNom,
    score,
  }: {
    levierNom: string;
    score: number;
  }): string => `${levierNom} : ${score}/100 du territoire (estimé)`,
  actionDeReferenceFichesLieesLabel: 'Fiches liées',
  actionDeReferenceFichesLieesHint:
    'Identifiants des fiches données en exemple, séparés par des virgules',
  actionDeReferenceFichesLieesErreur:
    'Saisissez des identifiants de fiche séparés par des virgules',
  actionDeReferenceFichesLieesTitre: 'Mises en œuvre',
  actionDeReferenceFichesLieesVide:
    "Aucune collectivité n'a encore partagé d'action liée.",
  actionDeReferenceModifier: (titre: string): string =>
    `Modifier l'action « ${titre} »`,
  actionDeReferenceModificationTitre: "Modifier l'action de référence",
  actionDeReferenceModificationSucces: 'Action de référence modifiée',
  actionDeReferenceModificationsNonEnregistreesTitre:
    'Modifications non enregistrées',
  actionDeReferenceModificationsNonEnregistreesDescription:
    'Les modifications apportées à cette action seront perdues.',
  actionDeReferenceAbandonnerModifications: 'Fermer sans enregistrer',
  actionDeReferencePoursuivreModification: 'Poursuivre la modification',
  actionDeReferenceUtileQuestion:
    'Cette action de référence vous a-t-elle été utile ?',
  actionDeReferenceUtileOui: 'Oui',
  actionDeReferenceUtileNon: 'Non',
  actionDeReferenceUtileMerci: 'Merci pour votre retour',
  actionDeReferenceCollectivitesLiees: (count: number): string =>
    count === 1
      ? '1 collectivité a des actions liées'
      : `${count} collectivités ont des actions liées`,
  actionDeReferenceSauvegarder: 'Sauvegarder',
  actionDeReferenceRetirer: 'Retirer',
  actionDeReferencePasInteresse: 'Pas intéressé',
  actionDeReferenceRestaurer: 'Restaurer',
  actionDeReferenceMarqueesPasInteresse: (count: number): string =>
    count === 1
      ? '1 action marquée « Pas intéressé »'
      : `${count} actions marquées « Pas intéressé »`,
  actionDeReferenceToutesMarquees:
    'Toutes les actions affichées sont marquées « Pas intéressé »',
  actionDeReferenceMarqueesReplier: 'Replier',
  actionDeReferenceMarqueesDeplier: 'Déplier',
  actionDeReferenceCollectivitesVoir: 'Voir',
  actionDeReferenceCollectivitesMasquer: 'Masquer',
  actionDeReferenceCollectivitesReplier: 'Replier les actions liées',
  actionDeReferenceCollectivitesErreur:
    "Les actions liées n'ont pas pu être chargées",
};
