import { DemarchePcaetStatusEnum } from '@tet/domain/demarches';
import type { DossierRecette } from '../shared/dossiers-recette.repository';

export const casTypes = [
  'C1',
  'C2',
  'C3',
  'C4',
  'C5',
  'C6',
  'C7',
  'C8',
  'C9',
  'C10',
  'C11',
  'C12',
  'C13',
] as const;
export type CasType = (typeof casTypes)[number];

export const particularites = ['P1', 'P2', 'P3', 'P4'] as const;
export type Particularite = (typeof particularites)[number];

export const SECTIONS_PAR_CAS_TYPE: Record<CasType, number[]> = {
  C1: [1, 2],
  C2: [1, 2],
  C3: [1, 12],
  C4: [1, 12],
  C5: [1],
  C6: [1],
  C7: [1, 2],
  C8: [1, 4],
  C9: [1],
  C10: [1],
  C11: [1],
  C12: [1],
  C13: [1],
};

export const SECTIONS_PAR_PARTICULARITE: Record<Particularite, number[]> = {
  P1: [9],
  P2: [2],
  P3: [2],
  P4: [1],
};

export const getCasType = (d: DossierRecette): CasType => {
  if (d.motif) {
    switch (d.motif) {
      case 'doublon':
        return 'C9';
      case 'coquille_vide':
        return 'C10';
      case 'elaboration_doublon':
        return 'C11';
      case 'sans_etat_invisible':
        return 'C12';
      default:
        return 'C13';
    }
  }
  const parSuivi = d.adoptionDecideePar === 'suivi';
  switch (d.etat) {
    case 'mise_en_oeuvre':
      return parSuivi ? 'C1' : 'C2';
    case 'depot_pour_avis':
      return d.statut === DemarchePcaetStatusEnum.INSTRUIT ? 'C6' : 'C5';
    case 'en_cours_elaboration':
      return d.statut === DemarchePcaetStatusEnum.PUBLIE ? 'C7' : 'C8';
    default:
      return parSuivi ? 'C3' : 'C4';
  }
};

export const getParticularites = (d: DossierRecette): Particularite[] => {
  if (d.motif) {
    return [];
  }
  const liste: Particularite[] = [];
  if (d.melange) liste.push('P1');
  if (d.transmisLe && d.transmisDansTec && d.transmisLe !== d.transmisDansTec)
    liste.push('P2');
  if (d.lanceBrut && Number(d.lanceBrut.slice(0, 4)) < 2000) liste.push('P3');
  if (d.sirenTec && d.sirenTet && d.sirenTec !== d.sirenTet) liste.push('P4');
  return liste;
};
