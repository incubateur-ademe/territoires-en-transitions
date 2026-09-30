import { plural } from '@tet/ui/labels/plural';

export const sharedLabels = {
  /** Actions */
  valider: 'Valider',
  ajouter: 'Ajouter',
  annuler: 'Annuler',
  confirmer: 'Confirmer',
  selectionner: 'Sélectionner',
  fermer: 'Fermer',
  modifier: 'Modifier',
  supprimer: 'Supprimer',
  dupliquer: 'Dupliquer',
  telecharger: 'Télécharger',
  enregistrer: 'Enregistrer',
  reessayer: 'Réessayer',
  exporter: 'Exporter',
  exporterPdf: 'Exporter en PDF',
  rechercher: 'Rechercher',
  saisirLeTexte: 'Saisir le texte',
  telechargerLeGraphique: 'Télécharger le graphique',

  /** Filtres */
  filtrer: 'Filtrer',
  filtrerSur: 'Filtrer sur',
  filtreSort: 'Tri',
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

  modificationsGroupees: 'Modifications groupées',

  placeholderRecherchezMotsCles: 'Rechercher par mots-clés',
  placeholderRecherchezIntitule: 'Rechercher par intitulé',

  preferences: 'Préférences',

  actionsDeReference: 'Actions de référence',
  actionsDeReferenceRecherche: 'Rechercher une action de référence',
  actionsDeReferenceLeviersLabel: 'Leviers',
  actionsDeReferenceCategoriesLabel: 'Catégories',
  actionsDeReferenceAucune:
    'Aucune action de référence ne correspond à votre recherche',
  actionsDeReferenceEffacerFiltres: 'Effacer les filtres',
  actionsDeReferenceReessayer: 'Réessayer',
  actionDeReferenceTitreLabel: 'Titre',
  actionDeReferenceDescriptionLabel: 'Description',
  actionDeReferenceLevierLabel: 'Levier',
  actionDeReferenceCategorieLabel: 'Catégorie',
  actionDeReferenceModifier: (titre: string): string =>
    `Modifier l'action « ${titre} »`,
  actionDeReferenceModificationTitre: "Modifier l'action de référence",
  actionDeReferenceModificationSucces: 'Action de référence modifiée',
  actionDeReferenceModificationErreur:
    "La modification de l'action de référence a échoué",
  actionDeReferenceModificationsNonEnregistreesTitre:
    'Modifications non enregistrées',
  actionDeReferenceModificationsNonEnregistreesDescription:
    'Les modifications apportées à cette action seront perdues.',
  actionDeReferenceAbandonnerModifications: 'Fermer sans enregistrer',
  actionDeReferencePoursuivreModification: 'Poursuivre la modification',
};
