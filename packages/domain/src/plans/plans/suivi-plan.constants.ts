import { StatutEnum } from '../fiches/statut.enum.schema';
import { ListFichesRequestFilters } from '../filters';

export const DEBUT_HISTORIQUE_STATUTS = '2023-12-11';

export const faireAvancerLePlanFilters = {
  enCoursSansAvancement: { enCoursSansAvancement: true },
  nonModifieesDepuisPlusDUnAn: {
    notModifiedForOverAYear: true,
    statuts: [
      StatutEnum.A_VENIR,
      StatutEnum.EN_COURS,
      StatutEnum.EN_RETARD,
      StatutEnum.A_DISCUTER,
    ],
    noStatut: true,
  },
  aDecider: {
    statuts: [StatutEnum.EN_RETARD, StatutEnum.BLOQUE, StatutEnum.A_DISCUTER],
  },
  sansPilote: { noPilote: true },
} satisfies Record<string, ListFichesRequestFilters>;

export type FaireAvancerLePlanCompte = keyof typeof faireAvancerLePlanFilters;
