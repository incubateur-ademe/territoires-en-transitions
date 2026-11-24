import type BigNumber from 'bignumber.js'
import { toBig } from '../../domain/big-number.ts'
import { quantity, type RelativeChange, type TonnesCo2ePerYear } from '../../domain/units.ts'
import type { ProductsCarbon, WoodProduction } from './data/wood-production.ts'

// Source : PlanET V1, onglet ProduitsBois, formule : 44/12, masse molaire du CO2 (44 g/mol)
const CARBON_DIOXIDE_MOLAR_MASS: BigNumber = toBig('44')

// Source : PlanET V1, onglet ProduitsBois, formule : 44/12, masse molaire du carbone (12 g/mol)
const CARBON_MOLAR_MASS: BigNumber = toBig('12')

function calculateProduitsBoisStorage({
  woodProductionIncrease,
  territoryProduction,
  nationalProduction,
  productsCarbon,
}: {
  woodProductionIncrease: RelativeChange
  territoryProduction: WoodProduction
  nationalProduction: WoodProduction
  productsCarbon: ProductsCarbon
}): TonnesCo2ePerYear {
  const logsShare = territoryProduction.logs.dividedBy(nationalProduction.logs)
  const industrialWoodShare = territoryProduction.industrialWood.dividedBy(
    nationalProduction.industrialWood,
  )
  const territoryTimberCarbon = productsCarbon.timber.times(logsShare)
  const territoryIndustrialCarbon = productsCarbon.industrial.times(industrialWoodShare)
  const territoryProductsCarbon = territoryTimberCarbon.plus(territoryIndustrialCarbon)
  const storedCarbonIncrease = territoryProductsCarbon.times(woodProductionIncrease)
  const storedCarbonDioxideMass = storedCarbonIncrease.times(CARBON_DIOXIDE_MOLAR_MASS)
  const storedCarbonDioxide = storedCarbonDioxideMass.dividedBy(CARBON_MOLAR_MASS)
  return quantity<'TonnesCo2ePerYear'>(storedCarbonDioxide.toFixed())
}

export { calculateProduitsBoisStorage }
