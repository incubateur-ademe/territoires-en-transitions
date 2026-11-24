import type BigNumber from 'bignumber.js'
import { err, ok, type Result } from 'neverthrow'
import { parseBig, toBig } from './big-number.ts'
import { type InvalidParameter, invalidParameter } from './invalid-parameter.ts'

type UnitName =
  | 'Fraction'
  | 'Kilometres'
  | 'Tonnes'
  | 'TonneKilometres'
  | 'BillionTonneKilometres'
  | 'GramsCo2ePerVehicleKilometre'
  | 'Hectares'
  | 'SquareMetres'
  | 'HectaresPerYear'
  | 'Years'
  | 'TCo2ePerKmPerYear'
  | 'TCo2ePerHectare'
  | 'TCo2ePerHectarePerYear'
  | 'MegawattHours'
  | 'GigawattHours'
  | 'KgCo2ePerKwh'
  | 'KgCo2ePerGigajoule'
  | 'KgCo2ePerVehicleKilometre'
  | 'KgCo2ePerTonne'
  | 'KgCo2ePerTonneKilometre'
  | 'KgCo2ePerKgNitrogen'
  | 'KgCo2ePerPassengerKilometre'
  | 'PassengerKilometresPerWeek'
  | 'Vehicles'
  | 'Heads'
  | 'ThousandCubicMetres'
  | 'TonnesCarbon'
  | 'RelativeChange'
  | 'TonnesCo2ePerYear'

type Quantity<U extends UnitName> = BigNumber & { readonly unit: U }

type Fraction = Quantity<'Fraction'>
type Kilometres = Quantity<'Kilometres'>
type Tonnes = Quantity<'Tonnes'>
type TonneKilometres = Quantity<'TonneKilometres'>
type BillionTonneKilometres = Quantity<'BillionTonneKilometres'>
type GramsCo2ePerVehicleKilometre = Quantity<'GramsCo2ePerVehicleKilometre'>
type Hectares = Quantity<'Hectares'>
type SquareMetres = Quantity<'SquareMetres'>
type HectaresPerYear = Quantity<'HectaresPerYear'>
type Years = Quantity<'Years'>
type TCo2ePerKmPerYear = Quantity<'TCo2ePerKmPerYear'>
type TCo2ePerHectare = Quantity<'TCo2ePerHectare'>
type TCo2ePerHectarePerYear = Quantity<'TCo2ePerHectarePerYear'>
type MegawattHours = Quantity<'MegawattHours'>
type GigawattHours = Quantity<'GigawattHours'>
type KgCo2ePerKwh = Quantity<'KgCo2ePerKwh'>
type KgCo2ePerGigajoule = Quantity<'KgCo2ePerGigajoule'>
type KgCo2ePerVehicleKilometre = Quantity<'KgCo2ePerVehicleKilometre'>
type KgCo2ePerTonne = Quantity<'KgCo2ePerTonne'>
type KgCo2ePerTonneKilometre = Quantity<'KgCo2ePerTonneKilometre'>
type KgCo2ePerKgNitrogen = Quantity<'KgCo2ePerKgNitrogen'>
type KgCo2ePerPassengerKilometre = Quantity<'KgCo2ePerPassengerKilometre'>
type PassengerKilometresPerWeek = Quantity<'PassengerKilometresPerWeek'>
type Vehicles = Quantity<'Vehicles'>
type Heads = Quantity<'Heads'>
type ThousandCubicMetres = Quantity<'ThousandCubicMetres'>
type TonnesCarbon = Quantity<'TonnesCarbon'>
type RelativeChange = Quantity<'RelativeChange'>
type TonnesCo2ePerYear = Quantity<'TonnesCo2ePerYear'>

function quantity<U extends UnitName>(value: string | bigint): Quantity<U> {
  return toBig(value) as Quantity<U>
}

// Source : BIPM, Le Système international d'unités (Brochure SI), 9e édition, préfixes SI :
// giga = 10^9 et méga = 10^6, donc 1 GWh = 1 000 MWh
const MEGAWATT_HOURS_PER_GIGAWATT_HOUR: BigNumber = toBig('1000')

function gigawattHoursToMegawattHours(gigawattHours: GigawattHours): MegawattHours {
  return quantity<'MegawattHours'>(gigawattHours.times(MEGAWATT_HOURS_PER_GIGAWATT_HOUR).toFixed())
}

function parseFraction(value: string): Result<Fraction, InvalidParameter> {
  const parsed = parseBig(value)
  if (parsed.isErr()) return err(invalidParameter({ parameter: 'fraction', value }))
  const isOutsideZeroToOne = parsed.value.isLessThan(0) || parsed.value.isGreaterThan(1)
  if (isOutsideZeroToOne) return err(invalidParameter({ parameter: 'fraction', value }))
  return ok(quantity<'Fraction'>(value))
}

export { gigawattHoursToMegawattHours, parseFraction, quantity }
export type {
  BillionTonneKilometres,
  Fraction,
  GramsCo2ePerVehicleKilometre,
  GigawattHours,
  Hectares,
  HectaresPerYear,
  SquareMetres,
  Heads,
  KgCo2ePerGigajoule,
  KgCo2ePerKgNitrogen,
  KgCo2ePerKwh,
  KgCo2ePerPassengerKilometre,
  KgCo2ePerTonne,
  KgCo2ePerTonneKilometre,
  KgCo2ePerVehicleKilometre,
  Kilometres,
  MegawattHours,
  PassengerKilometresPerWeek,
  Quantity,
  RelativeChange,
  TCo2ePerHectare,
  TCo2ePerHectarePerYear,
  TCo2ePerKmPerYear,
  ThousandCubicMetres,
  TonneKilometres,
  Tonnes,
  TonnesCarbon,
  TonnesCo2ePerYear,
  UnitName,
  Vehicles,
  Years,
}
