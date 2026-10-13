import type { DemarchePcaetStatus } from '@tet/domain/demarches';

export type Entonnoir = {
  total: number;
  repris: number;
  flux: {
    etat: string | null;
    statut: DemarchePcaetStatus | null;
    motif: string | null;
    nombre: number;
  }[];
};
