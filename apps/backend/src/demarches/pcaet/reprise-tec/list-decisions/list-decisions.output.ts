import type { DossierRef } from '../shared/dossier-ref';
import type { EtatDecision } from './decisions.rules';

export type Decisions = {
  code: string;
  sections: number[];
  etat: EtatDecision;
  nombreDossiers: number;
  nombreLignes: number | null;
  exemples: DossierRef[];
}[];
