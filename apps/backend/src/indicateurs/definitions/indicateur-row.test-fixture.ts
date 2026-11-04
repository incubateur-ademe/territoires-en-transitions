import type { IndicateurCandidate } from '@tet/domain/indicateurs';

export const toIndicateurRow = (
  overrides: Partial<IndicateurCandidate>
): IndicateurCandidate => ({
  id: 1,
  version: '1',
  groupementId: null,
  collectiviteId: null,
  identifiantReferentiel: null,
  titre: 'Émissions de GES',
  titreLong: null,
  titreCourt: null,
  description: null,
  unite: 'tCO2e',
  periodicite: 'annuelle',
  precision: 2,
  borneMin: null,
  borneMax: null,
  participationScore: false,
  sansValeurUtilisateur: false,
  valeurCalcule: null,
  exprCible: null,
  exprSeuil: null,
  libelleCibleSeuil: null,
  createdAt: '2026-01-01T00:00:00.000Z',
  modifiedAt: '2026-01-01T00:00:00.000Z',
  createdBy: null,
  modifiedBy: null,
  ...overrides,
});
