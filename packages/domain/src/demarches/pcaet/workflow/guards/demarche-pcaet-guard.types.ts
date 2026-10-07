import type { WorkflowGuardResults } from '../../../../utils/workflow/workflow.types';

/**
 * Conditions des transitions, **nommées** ici et **évaluées**
 * côté serveur uniquement (cf. `DemarchePcaetGuardsService`) — le front reçoit
 * leur résultat via l'API.
 *
 * - `estPilote` : l'utilisateur est pilote de la démarche (fallback : si la
 *   démarche n'a aucun pilote à compte utilisateur, tout éditeur est autorisé).
 * - `dossierComplet` : pièces amont requises couvertes, lignes requises du
 *   diagnostic renseignées et programme d'actions rattaché.
 * - `avisTousRendus` : le dossier a au moins une demande d'avis, et chacune a
 *   reçu un avis validé pour chaque titre attendu.
 * - `delaiAvisEcoule` : le délai légal laissé aux instances consultatives est
 *   écoulé. Ne dit rien des avis eux-mêmes : c'est `avisTousRendus` qui s'en
 *   charge, et les deux ouvrent chacune leur transition vers `instruit`.
 * - `evaluationFinaleDeposee` : l'évaluation finale du PCAET est déposée.
 * - `documentsAvalComplets` : les pièces attendues après les avis
 *   (délibération d'adoption…) sont déposées.
 *
 * Ajouter un guard ici oblige à écrire son évaluateur côté serveur : le
 * registre est exhaustif, il ne compilera pas sans.
 */
export type DemarchePcaetGuardId =
  | 'estPilote'
  | 'dossierComplet'
  | 'avisTousRendus'
  | 'delaiAvisEcoule'
  | 'evaluationFinaleDeposee'
  | 'documentsAvalComplets';

export type DemarchePcaetGuardResults =
  WorkflowGuardResults<DemarchePcaetGuardId>;
