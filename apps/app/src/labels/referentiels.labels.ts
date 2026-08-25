import { plural } from '@tet/ui/labels/plural';

export const referentielsLabels = {
  /** Noms */
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
  actionTypeAction: 'mesure',
  mesure: 'Mesure',
  actionTypeSousAction: 'sous-mesure',
  sousMesure: plural({
    one: 'sous-mesure',
    other: 'sous-mesures',
  }),
  actionTypeTache: 'tâche',
  actionTypeReferentiel: 'référentiel',
  referentiel: 'Référentiel',
  actionTypeAxe: 'axe',
  actionTypeSousAxe: 'sous-axe',
  actionTypeExemple: 'exemple',

  /** Vue tabulaire */
  referentielTableThematiquesViewsSgpe: 'Planification Écologique',
  referentielTableThematiquesViewsAxes: 'Axes',

  /** Sous-mesures */
  phaseBases: "S'engager",
  phaseMiseEnOeuvre: 'Concrétiser',
  phaseEffets: 'Mesurer les effets',

  /** Labellisation */
  etoilePremiere: 'première',
  etoileDeuxieme: 'deuxième',
  etoileTroisieme: 'troisième',
  etoileQuatrieme: 'quatrième',
  etoileCinquieme: 'cinquième',

  /** Actions utilisateurs */
  voirLaMesure: 'Voir la mesure',
  ouvrirLaMesure: 'Ouvrir la mesure',
};
