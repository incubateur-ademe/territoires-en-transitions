import {
  createAnnualIndicateurPeriod,
  type AnnualIndicateurPeriod,
  type EmtIndicateurDefinition,
} from './annual-indicateur-period.adapter.ts';

type ResolveDefinitionInput = Readonly<{
  rawId: unknown;
  rawName: unknown;
  referentiel: string;
  definitionsByIdentifiant: ReadonlyMap<string, EmtIndicateurDefinition>;
}>;

const resolveDefinition = ({
  rawId,
  rawName,
  referentiel,
  definitionsByIdentifiant,
}: ResolveDefinitionInput): EmtIndicateurDefinition | null => {
  let id = rawId;

  // Some merged cells only carry their identifier on the first row.
  if (!id) {
    const name = String(rawName);
    if (
      name.includes(
        'Montant des aides financières accordées aux particuliers et acteurs privés (euros/hab.an)'
      )
    ) {
      id = '49d';
    }
    if (name.includes('Budget politique cyclable  (euros/hab.an)')) {
      id = '49f';
    }
  }

  let normalizedId = String(id).replace(/(\d)([a-zA-Z])/g, '$1.$2');
  switch (normalizedId) {
    case '15.a':
    case '15.b':
      if (String(rawName).includes('DOM')) {
        normalizedId += '_dom';
      }
      break;
    case '19.a':
    case '19.b':
      normalizedId += '_hors_dom';
      break;
    case '49.a':
    case '49.d':
    case '49.f':
      if (String(rawName).includes('hab.an')) {
        normalizedId += '-hab';
      }
      break;
  }

  return definitionsByIdentifiant.get(`${referentiel}_${normalizedId}`) ?? null;
};

const normalizeValeur = (
  rawValue: unknown,
  definition: EmtIndicateurDefinition
): number | null => {
  if (rawValue == null) {
    return null;
  }

  let value = Number.parseFloat(String(rawValue).replace('%', ''));
  if (Number.isNaN(value)) {
    return null;
  }
  if (definition.unite === '%' && value < 1) {
    value *= 100;
  }
  return value;
};

const parseAnnualPeriod = (rawYear: unknown): AnnualIndicateurPeriod | null => {
  if (!rawYear) {
    return null;
  }

  const year = Number.parseInt(
    String(rawYear).replaceAll(' ', '').slice(0, 4),
    10
  );
  if (Number.isNaN(year) || year === 0) {
    return null;
  }
  return createAnnualIndicateurPeriod(year);
};

/** Pure adapter from the historical EMT worksheet grammar to domain values. */
export const EmtIndicateurData = Object.freeze({
  resolveDefinition,
  normalizeValeur,
  parseAnnualPeriod,
});
