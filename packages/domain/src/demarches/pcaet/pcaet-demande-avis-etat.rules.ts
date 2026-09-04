import * as z from 'zod/mini';
import { type DemarchePcaetStatus } from './demarche-pcaet-status.enum.schema';
import { isDemarchePcaetEnCours } from './workflow/demarche-pcaet-state';
import { fenetreAvisOuverte } from './pcaet-depot-permissions.rules';
import type { DemandeAvisAchevement } from './workflow/guards/demarche-pcaet-guard.rules';
import { isDemarchePcaetAvisTousRendus } from './workflow/guards/demarche-pcaet-guard.rules';

export const PcaetDemandeAvisEtatEnum = {
  A_TRAITER: 'a_traiter',
  BROUILLON_EN_COURS: 'brouillon_en_cours',
  AVIS_RENDU: 'avis_rendu',
  DELAI_ECOULE: 'delai_ecoule',
  CLOS: 'clos',
} as const;

export const pcaetDemandeAvisEtatValues = [
  PcaetDemandeAvisEtatEnum.A_TRAITER,
  PcaetDemandeAvisEtatEnum.BROUILLON_EN_COURS,
  PcaetDemandeAvisEtatEnum.AVIS_RENDU,
  PcaetDemandeAvisEtatEnum.DELAI_ECOULE,
  PcaetDemandeAvisEtatEnum.CLOS,
] as const;

export const pcaetDemandeAvisEtatSchema = z.enum(pcaetDemandeAvisEtatValues);

export type PcaetDemandeAvisEtat = z.infer<typeof pcaetDemandeAvisEtatSchema>;

export type DemandeAvisEtatEntree = {
  demarcheStatus: DemarchePcaetStatus;
  avisDeadlineAt: string | null;
  nbAvisValides: number;
  nbAvisBrouillons: number;
};

export const getDemandeAvisEtat = (
  {
    demarcheStatus,
    avisDeadlineAt,
    nbAvisValides,
    nbAvisBrouillons,
  }: DemandeAvisEtatEntree,
  now: Date
): PcaetDemandeAvisEtat => {
  if (nbAvisValides > 0) {
    return PcaetDemandeAvisEtatEnum.AVIS_RENDU;
  }
  // « En cours », pas « dépôt d'avis ouvert » : un dossier instruit sans avis
  // rendu n'est pas clos, il a juste vu son délai expirer — le test suivant le
  // dira. Ne restent ici que les dossiers publiés ou archivés.
  if (!isDemarchePcaetEnCours(demarcheStatus)) {
    return PcaetDemandeAvisEtatEnum.CLOS;
  }
  if (!fenetreAvisOuverte({ demarcheStatus, avisDeadlineAt }, now)) {
    return PcaetDemandeAvisEtatEnum.DELAI_ECOULE;
  }
  if (nbAvisBrouillons > 0) {
    return PcaetDemandeAvisEtatEnum.BROUILLON_EN_COURS;
  }
  return PcaetDemandeAvisEtatEnum.A_TRAITER;
};

/**
 * L'état du dossier, pour un destinataire qui n'y dépose aucun avis — une DDT,
 * une DR ADEME, un service national.
 *
 * L'état de *sa* demande ne lui dit rien : elle restera éternellement sans avis,
 * et son délai passé la faisait afficher « Pas d'avis déposé » sur un dossier
 * pourtant instruit. Ce qu'il suit, c'est l'avancement du dossier : les titres
 * attendus des destinataires saisis ont-ils été rendus, `avisTousRendus` étant
 * la règle même qui fait basculer la démarche.
 *
 * Seuls les avis **validés** entrent dans `achevement` : le brouillon d'un autre
 * ne sort pas de son espace, et « Brouillon en cours » ne se dit donc jamais
 * ici.
 */
export const getEtatDossierEnLecture = (
  {
    demarcheStatus,
    avisDeadlineAt,
    achevement,
  }: Omit<DemandeAvisEtatEntree, 'nbAvisValides' | 'nbAvisBrouillons'> & {
    achevement: readonly DemandeAvisAchevement[];
  },
  now: Date
): PcaetDemandeAvisEtat => {
  if (isDemarchePcaetAvisTousRendus(achevement)) {
    return PcaetDemandeAvisEtatEnum.AVIS_RENDU;
  }
  if (!isDemarchePcaetEnCours(demarcheStatus)) {
    return PcaetDemandeAvisEtatEnum.CLOS;
  }
  if (!fenetreAvisOuverte({ demarcheStatus, avisDeadlineAt }, now)) {
    return PcaetDemandeAvisEtatEnum.DELAI_ECOULE;
  }
  // Le dossier avance sans que ce destinataire ait quoi que ce soit à produire :
  // « À instruire » serait faux pour lui, d'où un libellé propre à sa famille.
  return PcaetDemandeAvisEtatEnum.A_TRAITER;
};
