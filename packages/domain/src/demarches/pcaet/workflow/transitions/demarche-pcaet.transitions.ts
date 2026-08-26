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
 * publié — chacun revient à l'étape immédiatement précédente. La clôture de
 * l'instruction, elle, ne se défait pas : reprendre l'élaboration après des avis
 * rendus recalculerait une échéance sur un dossier déjà instruit.
 *
 * Deux transitions n'ont **pas d'acteur** : `avis_tous_rendus` et
 * `delai_avis_echu` mènent toutes deux à `instruit`, appliquées par le système
 * (validation du dernier avis, ou passage du cron). D'où l'absence de guard
 * `estPilote`, et deux noms au participe passé plutôt qu'un seul verbe : le
 * journal des statuts garde ainsi la raison de la bascule.
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
  [DemarchePcaetTransitionEnum.AVIS_TOUS_RENDUS]: {
    from: [DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS],
    to: DemarchePcaetStatusEnum.INSTRUIT,
    guards: ['avisTousRendus'],
  },
  [DemarchePcaetTransitionEnum.DELAI_AVIS_ECHU]: {
    from: [DemarchePcaetStatusEnum.TRANSMIS_POUR_AVIS],
    to: DemarchePcaetStatusEnum.INSTRUIT,
    guards: ['delaiAvisEcoule'],
  },
  // Publier vaut adopter : la délibération d'adoption est donc exigée ici, et
  // un dossier encore en instruction n'est pas publiable — c'est la structure du
  // cycle qui le dit, pas un guard.
  [DemarchePcaetTransitionEnum.PUBLIER]: {
    from: [DemarchePcaetStatusEnum.INSTRUIT],
    to: DemarchePcaetStatusEnum.PUBLIE,
    guards: ['estPilote', 'documentsAvalComplets'],
  },
  [DemarchePcaetTransitionEnum.DEPUBLIER]: {
    from: [DemarchePcaetStatusEnum.PUBLIE],
    to: DemarchePcaetStatusEnum.INSTRUIT,
    guards: ['estPilote'],
  },
  [DemarchePcaetTransitionEnum.ARCHIVER]: {
    from: [DemarchePcaetStatusEnum.PUBLIE],
    to: DemarchePcaetStatusEnum.ARCHIVE,
    guards: ['estPilote', 'evaluationFinaleDeposee'],
  },
} as const satisfies Record<string, DemarchePcaetTransitionDef>;
