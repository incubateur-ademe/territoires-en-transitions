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
 * Le cycle de vie, en avant, et sans retour en arrière.
 *
 * Deux entrées dans la finalisation : `instruit`, atteint par le circuit d'avis
 * de la plateforme, et `instruit_hors_plateforme`, où la démarche démarre quand
 * l'instruction a eu lieu ailleurs. Une seule suite, `publier`, qui les rejoint.
 *
 * Aucune étape ne se reprend. Un dossier transmis est entre les mains des
 * instances consultatives : le rouvrir déferait sous leurs yeux le dossier même
 * sur lequel elles se prononcent, et la clôture de l'instruction recalculerait
 * une échéance sur un dossier déjà instruit. Un dossier publié vaut adopté :
 * il entre en mise en œuvre, et c'est le plan d'actions qui vit ensuite, pas le
 * dépôt.
 *
 * Trois transitions n'ont **pas d'acteur**. `avis_tous_rendus` et
 * `delai_avis_echu` mènent toutes deux à `instruit`, appliquées par le système
 * (validation du dernier avis, ou passage du cron) : deux noms au participe
 * passé plutôt qu'un seul verbe, pour que le journal des statuts garde la
 * raison de la bascule. `pcaet_suivant_adopte` archive un PCAET quand le
 * suivant est publié. D'où l'absence de guard `estPilote` sur les trois.
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
  //
  // `dossierComplet` figure ici pour le dépôt hors plateforme, dont l'amont est
  // resté ouvert jusqu'à ce point : c'est la publication qui l'atteste, faute de
  // transmission pour l'avoir fait. Un dossier transmis, lui, l'a déjà fait
  // attester — l'évaluateur du guard le sait et ne redemande rien.
  [DemarchePcaetTransitionEnum.PUBLIER]: {
    from: [
      DemarchePcaetStatusEnum.INSTRUIT,
      DemarchePcaetStatusEnum.INSTRUIT_HORS_PLATEFORME,
    ],
    to: DemarchePcaetStatusEnum.PUBLIE,
    guards: ['estPilote', 'dossierComplet', 'documentsAvalComplets'],
  },
  // Un PCAET reste en vigueur au-delà de ses six ans tant que le suivant n'est
  // pas adopté : les calendriers glissent souvent d'un an ou plus. C'est donc
  // l'adoption du suivant qui l'archive, jamais une durée ni la collectivité.
  [DemarchePcaetTransitionEnum.PCAET_SUIVANT_ADOPTE]: {
    from: [DemarchePcaetStatusEnum.PUBLIE],
    to: DemarchePcaetStatusEnum.ARCHIVE,
    guards: ['pcaetSuivantAdopte'],
  },
} as const satisfies Record<string, DemarchePcaetTransitionDef>;
