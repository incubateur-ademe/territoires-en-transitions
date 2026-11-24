import { Result } from 'neverthrow'
import type { DataSource, DataSourceError } from '../../../domain/data-source.ts'
import { GRAMS_PER_KILOGRAM, TONNE_KILOMETRES_PER_BILLION } from '../../../domain/mass-conversions.ts'
import type { ComputedLevels } from '../../../domain/lever-registry.ts'
import type { Territory } from '../../../domain/territory.ts'
import { quantity } from '../../../domain/units.ts'
import { requireQuantityColumn } from '../../require-column.ts'
import type { GoodsTransportInputs } from './goods-transport-inputs.ts'

const regionsDataset = 'transport-marchandises/regions'

function readGoodsTransportInputs({
  dataSource,
  territory,
}: {
  dataSource: DataSource
  territory: Territory<ComputedLevels<'transport_marchandises_sobriete_logistique'>>
}): Result<GoodsTransportInputs, DataSourceError> {
  const dataset = regionsDataset
  return dataSource.row(dataset, territory).andThen((row) =>
    Result.combine([
      requireQuantityColumn<'BillionTonneKilometres'>({
        dataset,
        row,
        column: 'billion_tonne_kilometres',
      }),
      requireQuantityColumn<'Vehicles'>({ dataset, row, column: 'heavy_vehicle_fleet' }),
      requireQuantityColumn<'Vehicles'>({ dataset, row, column: 'zero_emission_heavy_vehicle_fleet' }),
      requireQuantityColumn<'GramsCo2ePerVehicleKilometre'>({
        dataset,
        row,
        column: 'diesel_emission_factor_g_per_vehicle_km',
      }),
      requireQuantityColumn<'Fraction'>({ dataset, row, column: 'diesel_unclassified_share' }),
    ]).map(
      ([
        billionTonneKilometres,
        heavyVehicleFleet,
        zeroEmissionFleet,
        dieselGramsPerVehicleKm,
        dieselUnclassifiedShare,
      ]) => ({
        tonneKilometres: quantity<'TonneKilometres'>(
          billionTonneKilometres.times(TONNE_KILOMETRES_PER_BILLION).toFixed(),
        ),
        heavyVehicleFleet,
        zeroEmissionFleet,
        dieselEmissionFactor: quantity<'KgCo2ePerVehicleKilometre'>(
          dieselGramsPerVehicleKm.dividedBy(GRAMS_PER_KILOGRAM).toFixed(),
        ),
        dieselUnclassifiedShare,
      }),
    ),
  )
}

export { readGoodsTransportInputs }
