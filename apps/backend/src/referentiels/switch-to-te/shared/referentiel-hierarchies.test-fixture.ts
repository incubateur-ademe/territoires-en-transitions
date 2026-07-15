import {
  ActionTypeEnum,
  ReferentielIdEnum,
  type ActionType,
  type ReferentielId,
} from '@tet/domain/referentiels';

export const hierarchieCae = [
  ActionTypeEnum.REFERENTIEL,
  ActionTypeEnum.AXE,
  ActionTypeEnum.SOUS_AXE,
  ActionTypeEnum.ACTION,
  ActionTypeEnum.SOUS_ACTION,
  ActionTypeEnum.TACHE,
] as const;

// ECI : même profondeur que CAE sauf qu'il n'a pas de sous-axe
export const hierarchieEci = [
  ActionTypeEnum.REFERENTIEL,
  ActionTypeEnum.AXE,
  ActionTypeEnum.ACTION,
  ActionTypeEnum.SOUS_ACTION,
  ActionTypeEnum.TACHE,
] as const;

export const hierarchiesByReferentielIdForTests = new Map<
  ReferentielId,
  ActionType[]
>([
  [ReferentielIdEnum.CAE, [...hierarchieCae]],
  [ReferentielIdEnum.ECI, [...hierarchieEci]],
]);
