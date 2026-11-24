import fc from 'fast-check'
import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import { calculateProduitsBoisStorage } from './calculate-produits-bois-storage.ts'
import type { WoodProduction } from './data/wood-production.ts'

function woodProduction(logs: string, industrialWood: string): WoodProduction {
  return {
    logs: quantity<'ThousandCubicMetres'>(logs),
    industrialWood: quantity<'ThousandCubicMetres'>(industrialWood),
  }
}

const NATIONAL_PRODUCTION = woodProduction('1000', '500')

const PRODUCTS_CARBON = {
  timber: quantity<'TonnesCarbon'>('1000'),
  industrial: quantity<'TonnesCarbon'>('2000'),
}

function storage({
  increase,
  territoryProduction,
}: {
  increase: string
  territoryProduction: WoodProduction
}): string {
  return calculateProduitsBoisStorage({
    woodProductionIncrease: quantity<'RelativeChange'>(increase),
    territoryProduction,
    nationalProduction: NATIONAL_PRODUCTION,
    productsCarbon: PRODUCTS_CARBON,
  }).toFixed()
}

describe('calculateProduitsBoisStorage', () => {
  it('le territoire de 25 % des grumes et 20 % du bois d’industrie, à +12 %, stocke 286 tCO2e', () => {
    expect(storage({ increase: '0.12', territoryProduction: woodProduction('250', '100') })).toBe('286')
  })

  it('le territoire qui produit tout le national, à +100 %, stocke (1 000 + 2 000) × 44/12 = 11 000 tCO2e', () => {
    expect(storage({ increase: '1', territoryProduction: NATIONAL_PRODUCTION })).toBe('11000')
  })

  it('une baisse de production de 12 % libère le carbone : -286 tCO2e', () => {
    expect(storage({ increase: '-0.12', territoryProduction: woodProduction('250', '100') })).toBe(
      '-286',
    )
  })

  it('une hausse supérieure à 100 % est admise, comme dans le tableur : +200 % stocke deux fois plus', () => {
    expect(storage({ increase: '2', territoryProduction: NATIONAL_PRODUCTION })).toBe('22000')
  })

  it('sans hausse de production, rien n’est stocké', () => {
    expect(storage({ increase: '0', territoryProduction: woodProduction('250', '100') })).toBe('0')
  })

  it('un territoire sans récolte ne stocke rien', () => {
    expect(storage({ increase: '1', territoryProduction: woodProduction('0', '0') })).toBe('0')
  })

  it('le bois d’œuvre et le bois d’industrie pèsent avec leur propre carbone : 25 % des grumes seules', () => {
    expect(storage({ increase: '1', territoryProduction: woodProduction('250', '0') })).toBe(
      '916.666666666666666666666666666667',
    )
  })

  it('le stockage est proportionnel à la hausse : f(a) = a × f(1)', () => {
    fc.assert(
      fc.property(fc.integer({ min: -100, max: 300 }), (percent) => {
        const territoryProduction = woodProduction('250', '100')
        const partial = storage({ increase: (percent / 100).toFixed(2), territoryProduction })
        const full = storage({ increase: '1', territoryProduction })
        expect(Number(partial)).toBeCloseTo((percent / 100) * Number(full), 6)
      }),
    )
  })
})
