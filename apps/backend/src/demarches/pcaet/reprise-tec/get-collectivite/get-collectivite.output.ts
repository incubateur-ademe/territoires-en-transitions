import type { DemarchePcaetStatus } from '@tet/domain/demarches';

export type RecetteCollectiviteDetail = {
  collectivite: {
    id: number;
    nom: string;
    siren: string | null;
    population: number | null;
    region: string | null;
    departement: string | null;
  };
  tec: {
    tecCollectiviteId: number;
    nom: string;
    siren: string | null;
    population: number | null;
    suiviObligation: string | null;
    suiviAvisEtatLe: string | null;
    suiviApprobationLe: string | null;
  }[];
  dossiers: {
    tecDossierId: number;
    tecCollectiviteId: number | null;
    nom: string | null;
    etat: string | null;
    motif: string | null;
    copieId: number | null;
    demarcheId: number | null;
    statut: DemarchePcaetStatus | null;
  }[];
};
