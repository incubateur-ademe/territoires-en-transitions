import { plural } from '@tet/ui/labels/plural';

export const referentielsLabels = {
  /** Noms */
  referentielArchiveSuffixe: (nom: string): string => `${nom} (archivé)`,
  referentielCae: 'Climat Air Énergie',
  referentielEci: 'Économie Circulaire',
  referentielCrte: 'Contrat Relance Transition Écologique',
  referentielTe: 'Climat Ressources',
  referentielTeTest: 'Climat Ressources (test)',

  /** Préférences d'affichage (écran super-admin) */
  choisirReferentielsAffichesEtatDesLieux:
    'Choisir le mode de chaque référentiel et sa présence dans le menu « Programmes & Démarches » pour cette collectivité.',
  referentielPreferenceReferentiel: 'Référentiel',
  referentielPreferenceMode: 'Mode',
  referentielPreferenceModeWrite: 'Écriture',
  referentielPreferenceModeReadonly: 'Lecture seule',
  referentielPreferenceModeArchived: 'Archivé',
  referentielPreferenceDisplay: 'Visible',
  referentielPreferenceAlerteTitle:
    'Ces réglages s’appliquent immédiatement et sans contrôle',
  referentielPreferenceAlerteIntro:
    'Chaque modification est enregistrée dès la sélection, sans vérification du remplissage ni de l’activité de la collectivité, et sans ajustement automatique des autres référentiels.',
  referentielPreferenceAlerteConsequences: [
    {
      titre: 'Mode',
      description:
        ' : en « Écriture », les membres peuvent modifier le référentiel. En « Lecture seule » ou « Archivé », il n’est plus modifiable ; un référentiel archivé est signalé « (archivé) » dans le menu et n’est plus pris en compte dans la personnalisation.',
    },
    {
      titre: 'Visible',
      description:
        ' : retire ou ajoute le référentiel dans le menu « Programmes & Démarches », sans changer son mode.',
    },
    {
      titre: 'Bascule vers Climat Ressources',
      description:
        ' : elle n’est proposée à la collectivité que si Climat Ressources est en « Lecture seule » et que CAE ou ECi est en « Écriture ». Modifier ces modes peut donc faire apparaître ou disparaître la possibilité de faire la bascule.',
    },
    {
      titre: 'Après la bascule',
      description:
        ' : elle ne peut pas être rejouée. Les données saisies dans un référentiel CAE ou ECi repassé en « Écriture » ne seront pas reprises dans Climat Ressources.',
    },
  ],
  referentielPreferenceBasculeRealisee: ({
    date,
    heure,
    auteur,
  }: {
    date: string;
    heure: string;
    auteur?: string;
  }): string =>
    `Bascule réalisée le ${date} à ${heure}${auteur ? ` par ${auteur}` : ''}`,

  /** Statuts */
  nonRenseigne: 'Non renseigné',
  nonRenseignable: 'Non renseignable',
  avancementFait: 'Fait',
  avancementPasFait: 'Pas fait',
  avancementDetaille: 'Détaillé au %',
  avancementDetailleALaTache: 'Détaillé à la tâche',
  avancementProgramme: 'Programmé',
  avancementNonConcerne: 'Non concerné',

  /** Types */
  actionTypeReferentiel: 'référentiel',
  referentiel: plural({ one: 'référentiel', other: 'référentiels' }),
  actionTypeAction: 'mesure',
  mesure: 'Mesure',
  actionTypeSousAction: 'sous-mesure',
  sousMesure: plural({
    one: 'sous-mesure',
    other: 'sous-mesures',
  }),
  actionTypeTache: 'tâche',
  actionTypeAxe: 'axe',
  actionTypeSousAxe: 'sous-axe',
  actionTypeExemple: 'exemple',

  /** Vue tabulaire */
  referentielTableThematiquesViewsSgpe: 'Planification Écologique',
  referentielTableThematiquesViewsAxes: 'Axes',
  referentielTableColonneLabels: 'Volets',
  referentielTableColonneAdaptation: 'Adaptation',
  referentielTableAdaptationExpositionForte: 'Exposition forte',
  referentielTableAdaptationExpositionPartielle: 'Exposition partielle',
  referentielTableColonneLabellisationGold: 'Labellisation Gold',
  referentielTableLabellisationGoldAvec: 'Avec',
  referentielTableLabellisationGoldSans: 'Sans',

  /** Onglets de la vue référentiel */
  referentielOngletMesures: 'Mesures',
  referentielOngletSynthese: 'Synthèse',
  referentielOngletEvolutions: 'Évolutions du score',
  referentielOngletCommentaires: 'Commentaires',
  referentielOngletDocuments: 'Documents',
  referentielOngletHistorique: "Journal d'activité",

  /** Mesure */
  actionLiee: plural({ one: 'action liée', other: 'actions liées' }),
  document: plural({ one: 'document', other: 'documents' }),
  commentaires: plural({ one: 'commentaire', other: 'commentaires' }),
  pasDocumentAttenduAction:
    'Aucun document attendu pour cette mesure du référentiel',
  documentDerniereModification: ({
    date,
    auteur,
  }: {
    date?: string;
    auteur?: string;
  }): string => {
    if (date && auteur) {
      return `Modifié le ${date} par ${auteur}`;
    }
    if (date) {
      return `Modifié le ${date}`;
    }
    return auteur ? `Modifié par ${auteur}` : '';
  },

  /** Sous-mesures */
  phaseBases: "S'engager",
  phaseMiseEnOeuvre: 'Concrétiser',
  phaseEffets: 'Mesurer les effets',
  pasDocumentAttenduSousAction:
    'Aucun document attendu pour cette sous-mesure du référentiel',

  /** Labellisation */
  obtenirDesEtoiles: 'Obtenir des étoiles',

  etoilePremiere: 'première',
  etoileDeuxieme: 'deuxième',
  etoileTroisieme: 'troisième',
  etoileQuatrieme: 'quatrième',
  etoileCinquieme: 'cinquième',

  auditAudite: 'Audité',
  auditNonAudite: 'Non audité',
  auditEnCours: 'Audit en cours',
  auditDemande: 'Audit demandé',
  auditAttribue: 'Audit attribué',
  auditTermine: 'Audit terminé',
  auditTermineLabellisationEnCours: 'Audit terminé et labellisation en cours',
  auditEnCoursParAuditeur: ({ auditeur }: { auditeur: string }): string =>
    `Audit en cours par ${auditeur}`,

  evolutionScoreEnPoints: 'Évolution du score en points',

  /** Personnalisation */
  afficherLesElementsAffectesEtLesReglesAssociees:
    'Afficher les mesures affectées et règles associées',

  /** Actions */
  commencerReferentiel: 'Commencer le référentiel',
  voirReferentiel: 'Voir le référentiel',
  figerEtatDesLieux: 'Figer le référentiel',
  editerReferentiel: 'Éditer le référentiel',
  telechargerEtatDesLieux: 'Télécharger le référentiel',
  selectionnerVersionsTelecharger:
    'Sélectionner la ou les versions à télécharger',

  voirLaMesure: 'Voir la mesure',
  voirLaSousMesure: 'Voir la sous-mesure',
  voirLaTache: 'Voir la tâche',
  ouvrirLaMesure: 'Ouvrir la mesure',
  dissocierLaMesure: 'Dissocier la mesure',
  saisirLetatDavancement: "Saisir l'état d'avancement",

  renommerLeFichier: 'Renommer le fichier',
  supprimerDocument: 'Supprimer le document',
  telechargerFichier: 'Télécharger le fichier',

  /** Autres */
  mesuresDesReferentiels: 'Mesures des référentiels',
  documentsVisiblesAvertissement:
    'Tous les documents sont visibles par les membres de la communauté Territoires en Transitions, en dehors des documents en mode privé.',
  fichierModePrive: 'Fichier en mode privé',
  fichierIndisponible: 'Fichier indisponible',
  fichierIndisponibleInfo:
    "Ce document est référencé mais son contenu est introuvable dans l'espace de stockage. Il ne peut pas être téléchargé.",

  /** Score indicateur */
  selectionValeurIndicateurNotAvailable: `La sélection des résultats des indicateurs n'est pas encore disponible. En attendant, vous pouvez déjà renseigner vos données directement depuis la fiche de l'indicateur, en cliquant sur "Voir la fiche de l'indicateur". Nous vous informerons dès que la fonctionnalité sera disponible.`,
  selectionnerResultatPourCalculerScore:
    'Sélectionnez un résultat ci-dessous pour activer le calcul du score lié à cet indicateur.',
  sourceResultatSelectionne: (source: string, annee: number): string =>
    `Source : ${source} (${annee})`,
  aucunResultatIndicateurDisponible:
    "Aucun résultat n'a encore été renseigné pour cet indicateur.",
  resultatsIndicateurErreur:
    "Les résultats de l'indicateur n'ont pas pu être chargés.",
  scoreIndicatifPasDeDonnee: 'Pas de donnée renseignée',
  scoreIndicatifDonneeRenseignee: 'Donnée renseignée',
  scoreIndicatifDonneeRenseigneePositive: 'Donnée renseignée et > 0',
  scoreIndicatifReference: (valeur: string, annee: string): string =>
    `Réf : ${valeur} (${annee})`,
  scoreIndicatifCible: (valeur: string, annee: string): string =>
    `Cible : ${valeur} (${annee})`,
  scoreIndicatifCibleSelonResultat: 'Cible : selon le résultat sélectionné',
  scoreIndicatifAnneeSnbc: (annee: number): string => `SNBC ${annee}`,
  scoreIndicatifReductionCible: (reduction: string, annee: number): string =>
    `Objectif de réduction : -${reduction} % en ${annee}`,
  scoreIndicatifResultatsAnterieursNonPrisEnCompte: (annee: number): string =>
    `Les résultats antérieurs à l’année de référence ${annee} ne peuvent pas être pris en compte`,

  /** Libellés et saisie du score indicatif */
  scoreIndicatifFait: (percent: string): string =>
    `Score indicatif Fait de ${percent}, basé sur`,
  scoreIndicatifProgramme: ({
    annee,
    percent,
  }: {
    annee: string | number;
    percent: string;
  }): string => `Score indicatif Fait en ${annee} de ${percent}, basé sur`,
  valeurDeLIndicateur: (titre?: string): string =>
    titre
      ? `la valeur de l'indicateur "${titre}" de`
      : "la valeur de l'indicateur de",
  valeurSelectionneePourPourcentageIndicatif: (avancement: string): string =>
    `Valeur sélectionnée pour le calcul du pourcentage indicatif ${avancement} :`,

  scoreIndicatifContexteLibelle: 'Le libellé du score indicatif',
  scoreIndicatifContexteIndicateur: (indicateurId: number): string =>
    `Le score indicatif (${indicateurId})`,
  scoreIndicatifAnnee: (annee: number): string => `en ${annee}`,
  scoreIndicatifSource: (source: string): string => `(source : ${source})`,
  scoreIndicatifObjectifAtteint: 'atteint',
  scoreIndicatifIndicateursNecessaires: (nombre: number): string =>
    `${
      nombre === 2 ? 'Deux' : nombre
    } indicateurs sont nécessaires au calcul du score de cette tâche.`,
  scoreIndicatifAnneesResultatsDifferentes: (nombre: number): string =>
    `Des années différentes ont été choisies pour les valeurs résultats entre les ${nombre} indicateurs`,
  scoreIndicatifAnneesObjectifsDifferentes: (nombre: number): string =>
    `Des années différentes ont été choisies pour les valeurs objectifs entre les ${nombre} indicateurs`,

  /** Sauvegardes */
  sauvegardeVersionReferentiel: (version: string): string =>
    `Référentiel v${version}`,
  sauvegardeCreeePar: (nom: string): string => `Créée par ${nom}`,
  sauvegardeAutomatique: 'Sauvegarde automatique',
};
