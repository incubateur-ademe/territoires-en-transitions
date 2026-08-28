import {
  IndicateurDefinition,
  IndicateurValeur,
} from '@tet/domain/indicateurs';
import { IndicateurTableRow } from '../types';

const currentYear = new Date().getFullYear();

export const fakeReferenceYear = currentYear;
export const fakeYears: number[] = [
  currentYear,
  currentYear + 4,
  currentYear + 10,
  currentYear + 24,
];

const sectors = [
  'Résidentiel',
  'Tertiaire',
  'Transport routier',
  'Agriculture',
  'Industrie',
];
const pollutants = ['NOx', 'PM10', 'PM2,5', 'COVNM', 'SO2', 'NH3'];

const fakeIndicateurDefinition = (
  id: number,
  titre: string
): IndicateurDefinition => ({
  id,
  version: '1.0.0',
  groupementId: null,
  collectiviteId: null,
  identifiantReferentiel: `fake_${id}`,
  titre,
  titreLong: null,
  titreCourt: null,
  description: null,
  unite: 't/an',
  precision: 2,
  borneMin: null,
  borneMax: null,
  participationScore: false,
  sansValeurUtilisateur: false,
  valeurCalcule: null,
  exprCible: null,
  exprSeuil: null,
  libelleCibleSeuil: null,
  createdAt: '2024-01-01T00:00:00.000Z',
  modifiedAt: '2024-01-01T00:00:00.000Z',
  createdBy: null,
  modifiedBy: null,
});

const referenceValueOf = (indicateurId: number): number =>
  200 + (indicateurId % 6) * 60;

const yearFactor = (year: number): number => {
  const horizon = year - currentYear;
  if (horizon <= 0) {
    return 1;
  }
  if (horizon <= 4) {
    return 0.82;
  }
  if (horizon <= 10) {
    return 0.58;
  }
  return 0.31;
};

const trajectoryValue = (indicateurId: number, year: number): number =>
  Math.round(referenceValueOf(indicateurId) * yearFactor(year));

const fakeIndicateurValeurs = (indicateurId: number): IndicateurValeur[] =>
  fakeYears.map((year, index) => {
    const value = trajectoryValue(indicateurId, year);
    const isReference = year === fakeReferenceYear;
    return {
      id: indicateurId * 100 + index,
      collectiviteId: 1,
      indicateurId,
      dateValeur: `${year}-01-01`,
      metadonneeId: null,
      resultat: isReference ? value : null,
      resultatCommentaire: null,
      objectif: isReference ? null : value,
      objectifCommentaire: null,
      estimation: null,
      calculAuto: null,
      calculAutoIdentifiantsManquants: null,
      createdAt: '2024-01-01T00:00:00.000Z',
      modifiedAt: '2024-01-01T00:00:00.000Z',
      createdBy: null,
      modifiedBy: null,
    };
  });

export const fakeRow = ({
  indicateurId,
  indicateurLabel,
  indicateurValeurs = fakeIndicateurValeurs(indicateurId),
  optionalYears,
}: {
  indicateurId: number;
  indicateurLabel: string;
  indicateurValeurs?: IndicateurValeur[];
  optionalYears?: readonly number[];
}): IndicateurTableRow => ({
  indicateurId,
  indicateurLabel,
  indicateurDefinition: fakeIndicateurDefinition(
    indicateurId,
    indicateurLabel
  ),
  indicateurValeurs,
  optionalYears,
});

export const fakeRows: IndicateurTableRow[] = sectors.flatMap(
  (_sector, sectorIndex) =>
    pollutants.map((pollutant, pollutantIndex) => {
      const indicateurId = 1200 + sectorIndex * 10 + pollutantIndex;
      return fakeRow({
        indicateurId,
        indicateurLabel: pollutant,
        indicateurValeurs: fakeIndicateurValeurs(indicateurId),
      });
    })
);