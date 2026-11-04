import type { RouterInput } from '@tet/api';
import {
  Etoile,
  EtoileEnum,
  ReferentielId,
  SujetDemande,
  SujetDemandeEnum,
} from '@tet/domain/referentiels';
import { match } from 'ts-pattern';

type SujetLabellisation =
  | typeof SujetDemandeEnum.LABELLISATION
  | typeof SujetDemandeEnum.LABELLISATION_COT;

export type DemandeVisee =
  | { kind: 'premiere-etoile'; sujet: SujetLabellisation }
  | { kind: 'audit-labellisation'; sujet: SujetLabellisation; etoile: Etoile }
  | { kind: 'audit-cot' };

export type SendDemandeInput =
  RouterInput['referentiels']['labellisations']['requestLabellisation'];

export const toDemandeVisee = ({
  sujetVise,
  etoile,
}: {
  sujetVise: SujetDemande;
  etoile: Etoile;
}): DemandeVisee => {
  if (sujetVise === SujetDemandeEnum.COT) {
    return { kind: 'audit-cot' };
  }
  if (etoile === EtoileEnum.PREMIERE_ETOILE) {
    return { kind: 'premiere-etoile', sujet: sujetVise };
  }
  return { kind: 'audit-labellisation', sujet: sujetVise, etoile };
};

export const toSendDemandeInput = (
  {
    collectiviteId,
    referentiel,
  }: { collectiviteId: number; referentiel: ReferentielId },
  demande: DemandeVisee
): SendDemandeInput =>
  match(demande)
    .with({ kind: 'audit-cot' }, () => ({
      collectiviteId,
      referentiel,
      sujet: SujetDemandeEnum.COT,
      etoiles: null,
    }))
    .with({ kind: 'premiere-etoile' }, ({ sujet }) => ({
      collectiviteId,
      referentiel,
      sujet,
      etoiles: EtoileEnum.PREMIERE_ETOILE,
    }))
    .with({ kind: 'audit-labellisation' }, ({ sujet, etoile }) => ({
      collectiviteId,
      referentiel,
      sujet,
      etoiles: etoile,
    }))
    .exhaustive();
