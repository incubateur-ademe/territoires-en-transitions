export enum ReferentielType {
  ECI = 'eci',
  CAE = 'cae',
}
// WARNING: not using Object.values to use it with pgTable
export const referentielList = [
  ReferentielType.CAE,
  ReferentielType.ECI,
] as const;
