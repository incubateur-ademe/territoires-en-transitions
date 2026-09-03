import { plural } from '@tet/ui/labels/plural';

export const referentielsLabels = {
  /** Noms */
  referentielArchiveSuffixe: (nom: string): string => `${nom} (archivé)`,
  referentielCae: 'Climat Air Énergie',
  referentielEci: 'Économie Circulaire',
  referentielCrte: 'Contrat Relance Transition Écologique',
  referentielTe: 'Climat Ressources',
  referentielTeTest: 'Climat Ressources (test)',

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
};
