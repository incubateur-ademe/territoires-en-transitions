import type BigNumber from 'bignumber.js'
import { sortBy, uniqBy } from 'es-toolkit'
import { sum } from '../../domain/big-number.ts'
import type { CommutingRow } from './read-commuting-passenger-km.ts'
import { isInScope, toTerritoryKey, type SourceLevel } from './source-level.ts'

type TerritoryPassengerKm = {
  readonly level: SourceLevel
  readonly code: string
  readonly carWeeklyPassengerKm: BigNumber
  readonly publicTransportWeeklyPassengerKm: BigNumber
}

// Source : DonneesTerritoires!E14, « croisement entre IPONDI et DIST_HEBDO » ; MODTRANS 5 = voiture
const CAR_MODE = '5'

// Source : DonneesTerritoires!E14, MODTRANS 6 = transport en commun
const PUBLIC_TRANSPORT_MODE = '6'

// Source : TrsptPers_SobriétéDéplacements!B13, « les émissions sont réparties à 50% pour la commune de résidence et 50% pour la commune de travail »
const SIDE_WEIGHT = '0.5'

function weightedWeeklyPassengerKm({
  rows,
  mode,
}: {
  rows: readonly CommutingRow[]
  mode: string
}): BigNumber {
  const weeklyPassengerKm = sum(
    rows.filter((row) => row.mode === mode).map((row) => row.weeklyPassengerKm),
  )
  return weeklyPassengerKm.times(SIDE_WEIGHT)
}

function toTerritoryPassengerKm({
  level,
  code,
  rows,
}: {
  level: SourceLevel
  code: string
  rows: readonly CommutingRow[]
}): TerritoryPassengerKm {
  const territoryRows = rows.filter((row) => row.level === level && row.code === code)
  return {
    level,
    code,
    carWeeklyPassengerKm: weightedWeeklyPassengerKm({ rows: territoryRows, mode: CAR_MODE }),
    publicTransportWeeklyPassengerKm: weightedWeeklyPassengerKm({
      rows: territoryRows,
      mode: PUBLIC_TRANSPORT_MODE,
    }),
  }
}

function calculateTerritoryPassengerKm(
  rows: readonly CommutingRow[],
): readonly TerritoryPassengerKm[] {
  const inScope = rows.filter(isInScope)
  const territories = uniqBy(inScope, toTerritoryKey).map(
    ({ level, code }) => toTerritoryPassengerKm({ level, code, rows: inScope }),
  )
  return sortBy(territories, [({ code }) => code])
}

export { calculateTerritoryPassengerKm }
export type { TerritoryPassengerKm }
