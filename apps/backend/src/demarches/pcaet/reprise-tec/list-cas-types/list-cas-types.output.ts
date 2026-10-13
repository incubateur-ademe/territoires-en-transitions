import type { DossierRef } from '../shared/dossier-ref';
import type { CasType, Particularite } from './cas-types.rules';

export type CasTypes = {
  casTypes: {
    code: CasType;
    sections: number[];
    nombre: number;
    exemple: DossierRef | null;
    dossiers: (DossierRef & { particularites: Particularite[] })[];
  }[];
  particularites: {
    code: Particularite;
    sections: number[];
    nombre: number;
  }[];
};
