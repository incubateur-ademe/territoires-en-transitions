import type { ThousandCubicMetres, TonnesCarbon } from '../../../domain/units.ts'

type WoodProduction = {
  readonly logs: ThousandCubicMetres
  readonly industrialWood: ThousandCubicMetres
}

type ProductsCarbon = {
  readonly timber: TonnesCarbon
  readonly industrial: TonnesCarbon
}

type NationalWood = {
  readonly production: WoodProduction
  readonly productsCarbon: ProductsCarbon
}

export type { NationalWood, ProductsCarbon, WoodProduction }
