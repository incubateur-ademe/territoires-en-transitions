import type { WorkflowTransitionDef } from '../../../../utils/workflow/workflow.types';
import {
  DemarchePcaetStatusEnum,
  type DemarchePcaetStatus,
} from '../../demarche-pcaet-status.enum.schema';
import type { DemarchePcaetGuardId } from '../guards/demarche-pcaet-guard.types';
import { DemarchePcaetTransitionEnum } from './demarche-pcaet-transition.enum';

type DemarchePcaetTransitionDef = WorkflowTransitionDef<
  DemarchePcaetStatus,
  DemarchePcaetGuardId
>;

/**
 * Le cycle de vie, en avant et en arrière. Deux retours en arrière seulement :
 * reprendre l'élaboration d'un dossier transmis, et dépublier un dossier
 * publié — chacun revient à l'étape immédiatement précédente.
 *
 * L'ordre des guards est significatif : c'est celui dans lequel les refus sont
 * rapportés, donc la priorité des messages affichés — l'acteur avant l'état du
 * dossier.
 */
export const DEMARCHE_PCAET_TRANSITIONS = {
  // `dossierComplet` porte les pièces amont requises, les lignes requises du
  // diagnostic et le rattachement du programme d'actions.
  [DemarchePcaetTransitionEnum.TRANSMETTRE_POUR_AVIS]: {
    from: [DemarchePcaetStatusEnum.EN_ELABORATION],
    to: DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS,
    guards: ['estPilote', 'dossierComplet'],
  },
  [DemarchePcaetTransitionEnum.REPRENDRE_ELABORATION]: {
    from: [DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS],
    to: DemarchePcaetStatusEnum.EN_ELABORATION,
    guards: ['estPilote'],
  },
  [DemarchePcaetTransitionEnum.ADOPTER]: {
    from: [DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS],
    to: DemarchePcaetStatusEnum.ADOPTE,
    guards: ['estPilote', 'delaiAvisEcoule'],
  },
  // Un dossier non adopté n'est pas publiable : c'est la structure du cycle qui
  // le dit, pas un guard.
  [DemarchePcaetTransitionEnum.PUBLIER]: {
    from: [DemarchePcaetStatusEnum.ADOPTE],
    to: DemarchePcaetStatusEnum.PUBLIE,
    guards: ['estPilote', 'documentsAvalComplets'],
  },
  [DemarchePcaetTransitionEnum.DEPUBLIER]: {
    from: [DemarchePcaetStatusEnum.PUBLIE],
    to: DemarchePcaetStatusEnum.ADOPTE,
    guards: ['estPilote'],
  },
  [DemarchePcaetTransitionEnum.ARCHIVER]: {
    from: [DemarchePcaetStatusEnum.PUBLIE],
    to: DemarchePcaetStatusEnum.ARCHIVE,
    guards: ['estPilote', 'evaluationFinaleDeposee'],
  },
} as const satisfies Record<string, DemarchePcaetTransitionDef>;
