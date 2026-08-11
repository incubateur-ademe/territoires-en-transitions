import * as z from 'zod/mini';
import { type DemarchePcaetStatus } from './demarche-pcaet-status.enum.schema';
import { isActiveDemarchePcaetStatus } from './workflow/demarche-pcaet-state';
import { fenetreAvisOuverte } from './pcaet-depot-permissions.rules';

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
  if (!isActiveDemarchePcaetStatus(demarcheStatus)) {
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
