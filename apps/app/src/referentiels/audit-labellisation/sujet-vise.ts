import { SujetDemande, SujetDemandeEnum } from '@tet/domain/referentiels';

export type SujetCotVise =
  | typeof SujetDemandeEnum.LABELLISATION_COT
  | typeof SujetDemandeEnum.COT;

export const toSujetVise = ({
  isCOT,
  sujetCotVise,
}: {
  isCOT: boolean;
  sujetCotVise: SujetCotVise;
}): SujetDemande => (isCOT ? sujetCotVise : SujetDemandeEnum.LABELLISATION);

export const isLabellisationVisee = (sujet: SujetDemande): boolean =>
  sujet !== SujetDemandeEnum.COT;
