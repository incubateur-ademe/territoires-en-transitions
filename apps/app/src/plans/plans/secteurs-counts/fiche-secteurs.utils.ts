import { FicheSecteursAVerifier } from './data/use-list-plan-fiches-secteurs-a-verifier';

export const isFicheSecteursARenseigner = (
  fiche: Pick<FicheSecteursAVerifier, 'etat'>
) => fiche.etat === 'a_renseigner' || fiche.etat === 'non_attribuable';
