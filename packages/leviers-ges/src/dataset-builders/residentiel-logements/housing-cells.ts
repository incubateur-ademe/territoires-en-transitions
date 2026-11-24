// Source : documentation fonctionnelle PlanET (juin 2026), p. 51 : type de logement en collectif privé, collectif social ou maison individuelle
const HOUSING_TYPES = ['house', 'private_apartment', 'social_apartment'] as const

// Source : INSEE, fichier détail Logements RP2022, variable CMBL : six modalités, le bois n'y figure pas (documentation fonctionnelle PlanET, p. 52)
const HEATING_VECTORS = [
  'heat_network',
  'natural_gas',
  'fuel_oil',
  'electricity',
  'lpg',
  'other',
] as const

// Source : documentation fonctionnelle PlanET (juin 2026), p. 51 : avant 1971, entre 1971 et 2005, après 2005
const CONSTRUCTION_PERIODS = ['before_1971', '1971_to_2005', 'after_2005'] as const

type HousingType = (typeof HOUSING_TYPES)[number]
type HeatingVector = (typeof HEATING_VECTORS)[number]
type ConstructionPeriod = (typeof CONSTRUCTION_PERIODS)[number]

type HousingCell = {
  readonly type: HousingType
  readonly vector: HeatingVector
  readonly period: ConstructionPeriod
}

// Source : INSEE, fichier détail Logements RP2022, variable CMBL (1 chauffage urbain, 2 gaz de ville ou de réseau, 3 fioul, 4 électricité, 5 gaz en bouteilles ou en citerne, 6 autre)
const HEATING_VECTOR_BY_FUEL_CODE: Readonly<Record<string, HeatingVector>> = {
  '1': 'heat_network',
  '2': 'natural_gas',
  '3': 'fuel_oil',
  '4': 'electricity',
  '5': 'lpg',
  '6': 'other',
}

// Source : documentation fonctionnelle PlanET (juin 2026), p. 51 : milieu de chaque fourchette de superficie de l'INSEE (variable SURF), 130 m² pour 120 m² ou plus
const SURFACE_SQUARE_METRES_BY_CLASS: Readonly<Record<string, string>> = {
  '1': '20',
  '2': '35',
  '3': '50',
  '4': '70',
  '5': '90',
  '6': '110',
  '7': '130',
}

// Source : INSEE, fichier détail Logements RP2022, variable ACHL : « avant 1919 », « de 1919 à 1945 » et « de 1946 à 1970 »
const BEFORE_1971_COMPLETION_CODES: ReadonlySet<string> = new Set(['A11', 'A12', 'B11'])

// Source : INSEE, fichier détail Logements RP2022, variable ACHL : « de 1971 à 1990 » et « de 1991 à 2005 »
const FROM_1971_TO_2005_COMPLETION_CODES: ReadonlySet<string> = new Set(['B12', 'C100'])

// Source : INSEE, fichier détail Logements RP2022, variable ACHL : les années 2006 à 2020 commencent par la lettre C
const AFTER_2005_COMPLETION_PREFIX = 'C'

// Source : INSEE, fichier détail Logements RP2022, variable TYPL : 1 maison, 2 appartement
const HOUSE_TYPE_CODE = '1'

// Source : INSEE, fichier détail Logements RP2022, variable TYPL : 2 appartement
const APARTMENT_TYPE_CODE = '2'

// Source : INSEE, fichier détail Logements RP2022, variable HLML : 1 appartient à un organisme HLM
const SOCIAL_LANDLORD_CODE = '1'

// Source : INSEE, fichier détail Logements RP2022, variable HLML : 2 n'appartient pas à un organisme HLM
const PRIVATE_LANDLORD_CODE = '2'

function toHousingType({
  typeCode,
  landlordCode,
}: {
  typeCode: string
  landlordCode: string
}): HousingType | undefined {
  if (typeCode === HOUSE_TYPE_CODE) return 'house'
  if (typeCode !== APARTMENT_TYPE_CODE) return undefined
  if (landlordCode === SOCIAL_LANDLORD_CODE) return 'social_apartment'
  return landlordCode === PRIVATE_LANDLORD_CODE ? 'private_apartment' : undefined
}

function toConstructionPeriod(completionCode: string): ConstructionPeriod | undefined {
  if (BEFORE_1971_COMPLETION_CODES.has(completionCode)) return 'before_1971'
  if (FROM_1971_TO_2005_COMPLETION_CODES.has(completionCode)) return '1971_to_2005'
  return completionCode.startsWith(AFTER_2005_COMPLETION_PREFIX) ? 'after_2005' : undefined
}

type HousingColumn = `housing_m2_${HousingType}_${HeatingVector}_${ConstructionPeriod}`

function toHousingColumn({ type, vector, period }: HousingCell): HousingColumn {
  return `housing_m2_${type}_${vector}_${period}`
}

// Source : data/residentiel-logements/manifest.json : une colonne de surface par type de logement, combustible et période, soit 54 colonnes
const HOUSING_COLUMNS: readonly HousingColumn[] = HOUSING_TYPES.flatMap((type) =>
  HEATING_VECTORS.flatMap((vector) =>
    CONSTRUCTION_PERIODS.map((period) => toHousingColumn({ type, vector, period })),
  ),
)

function toHousingRecord<Value>(
  entries: readonly (readonly [HousingColumn, Value])[],
): Readonly<Record<HousingColumn, Value>> {
  return Object.fromEntries(entries) as Record<HousingColumn, Value>
}

export {
  HEATING_VECTOR_BY_FUEL_CODE,
  HOUSING_COLUMNS,
  SURFACE_SQUARE_METRES_BY_CLASS,
  toConstructionPeriod,
  toHousingColumn,
  toHousingRecord,
  toHousingType,
}
export type { HousingCell, HousingColumn }
