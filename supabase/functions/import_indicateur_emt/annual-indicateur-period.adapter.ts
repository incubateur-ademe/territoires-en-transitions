import type { Tables } from '../_shared/typeUtils.ts';
import { InvalidEmtImportError } from './import-emt-indicateurs.error.ts';

const ANNUAL_PERIODICITE = 'annuelle';
const ANNUAL_DATE_PATTERN = /^(\d{4})-01-01$/;

export type EmtIndicateurDefinition = Pick<
  Tables<'indicateur_definition'>,
  'id' | 'identifiant_referentiel' | 'periodicite' | 'unite'
>;

export type IndicateurDefinitionWithPeriodicite = Pick<
  EmtIndicateurDefinition,
  'id' | 'periodicite'
>;

export type AnnualIndicateurPeriod = Readonly<{
  periodicite: typeof ANNUAL_PERIODICITE;
  dateDebut: string;
}>;

export class NonAnnualIndicateurDefinitionError extends InvalidEmtImportError {
  constructor(definition: IndicateurDefinitionWithPeriodicite) {
    super(
      `L'import EMT ne prend en charge que les indicateurs annuels : ` +
        `l'indicateur ${definition.id} est ${definition.periodicite}`
    );
    this.name = NonAnnualIndicateurDefinitionError.name;
  }
}

export const assertAnnualIndicateurDefinition = (
  definition: IndicateurDefinitionWithPeriodicite
): void => {
  if (definition.periodicite !== ANNUAL_PERIODICITE) {
    throw new NonAnnualIndicateurDefinitionError(definition);
  }
};

export const createAnnualIndicateurPeriod = (
  year: number
): AnnualIndicateurPeriod => {
  if (!Number.isInteger(year) || year < 1 || year > 9999) {
    throw new InvalidEmtImportError(`Année d'indicateur invalide : ${year}`);
  }

  return Object.freeze({
    periodicite: ANNUAL_PERIODICITE,
    dateDebut: `${year.toString().padStart(4, '0')}-01-01`,
  });
};

export const parseAnnualIndicateurPeriod = (
  definition: IndicateurDefinitionWithPeriodicite,
  dateValeur: string
): AnnualIndicateurPeriod => {
  // The definition discriminant is checked first: a monthly January value has
  // the same SQL date as an annual value and cannot be inferred from the date.
  assertAnnualIndicateurDefinition(definition);

  const match = ANNUAL_DATE_PATTERN.exec(dateValeur);
  if (!match || match[1] === '0000') {
    throw new InvalidEmtImportError(
      `Date annuelle non canonique pour l'indicateur ${definition.id} : ${dateValeur}`
    );
  }

  return createAnnualIndicateurPeriod(Number(match[1]));
};
