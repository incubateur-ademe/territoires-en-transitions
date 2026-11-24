import { sum } from '../../../domain/big-number.ts'
import { quantity, type Fraction, type Hectares } from '../../../domain/units.ts'

type LocatedArea = {
  readonly commune: string
  readonly region: string
  readonly hectares: Hectares
}

function calculateRegionalAreaShares({
  areas,
  territoryCommunes,
}: {
  areas: readonly LocatedArea[]
  territoryCommunes: ReadonlySet<string>
}): ReadonlyMap<string, Fraction> {
  const shareEntries = [...Map.groupBy(areas, (area) => area.region)]
    .map(([region, regionAreas]) => {
      const territoryAreas = regionAreas.filter((area) => territoryCommunes.has(area.commune))
      return {
        region,
        regionHectares: sum(regionAreas.map((area) => area.hectares)),
        territoryHectares: sum(territoryAreas.map((area) => area.hectares)),
      }
    })
    .filter(({ territoryHectares }) => territoryHectares.isGreaterThan(0))
    .map(({ region, regionHectares, territoryHectares }) => {
      const share = territoryHectares.dividedBy(regionHectares)
      return [region, quantity<'Fraction'>(share.toFixed())] as const
    })
  return new Map(shareEntries)
}

export { calculateRegionalAreaShares }
export type { LocatedArea }
