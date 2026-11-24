import type BigNumber from 'bignumber.js'
import { sum, toBig } from '../../domain/big-number.ts'

type LivestockCategories = ReadonlyMap<string, string>

type LivestockHeadcount = {
  readonly dairyCows: BigNumber
  readonly otherCattle: BigNumber
  readonly sows: BigNumber
  readonly otherPigs: BigNumber
  readonly goats: BigNumber
  readonly sheep: BigNumber
  readonly horses: BigNumber
  readonly mulesAndDonkeys: BigNumber
  readonly layingHens: BigNumber
  readonly broilers: BigNumber
  readonly otherPoultry: BigNumber
}

// Source : Agreste, recensement agricole 2020, cheptels : la valeur « s » marque le secret statistique
const SECRET_STATISTIC_MARK = 's'

// Source : tableur PlanET V1, DonneesTerritoires!D23 : correspondance à décliner entre l'OMINEA et le recensement agricole 2020 (choix de conception, non validé)
const CATEGORY_CODES = {
  cattle: '1',
  equids: '2',
  mulesAndDonkeys: '2.15',
  goats: '3',
  sheep: '4',
  pigs: '5',
  sows: '5.11',
  poultry: '7',
  hensAndPullets: '7.11',
  layingHensForConsumption: '7.11.1',
  layingHensForHatching: '7.11.2',
  pullets: '7.11.3',
  broilers: '7.11.4',
} as const

// Source : choix de conception, non validé : une catégorie sous secret statistique ou absente compte pour zéro tête
const NO_HEADS: BigNumber = toBig('0')

function headsOf(categories: LivestockCategories, code: string): BigNumber {
  const text = categories.get(code)
  if (text === undefined || text === SECRET_STATISTIC_MARK) return NO_HEADS
  return toBig(text)
}

function isReadable(categories: LivestockCategories, code: string): boolean {
  const text = categories.get(code)
  return text !== undefined && text !== SECRET_STATISTIC_MARK
}

function nonNegative(heads: BigNumber): BigNumber {
  return heads.isNegative() ? NO_HEADS : heads
}

function listSecretCategories(categories: LivestockCategories): readonly string[] {
  return Object.values(CATEGORY_CODES).filter((code) => categories.get(code) === SECRET_STATISTIC_MARK)
}

function toLivestockHeadcount({
  categories,
  dairyCows,
}: {
  categories: LivestockCategories
  dairyCows: BigNumber
}): LivestockHeadcount {
  const headsOfCategory = (code: string) => headsOf(categories, code)
  const totalCattle = headsOfCategory(CATEGORY_CODES.cattle)
  const totalPigs = headsOfCategory(CATEGORY_CODES.pigs)
  const sows = headsOfCategory(CATEGORY_CODES.sows)
  const totalEquids = headsOfCategory(CATEGORY_CODES.equids)
  const mulesAndDonkeys = headsOfCategory(CATEGORY_CODES.mulesAndDonkeys)
  const totalPoultry = headsOfCategory(CATEGORY_CODES.poultry)
  const layingHens = sum([
    headsOfCategory(CATEGORY_CODES.layingHensForConsumption),
    headsOfCategory(CATEGORY_CODES.layingHensForHatching),
    headsOfCategory(CATEGORY_CODES.pullets),
  ])
  const broilers = headsOfCategory(CATEGORY_CODES.broilers)
  const readableHensAndPullets = headsOfCategory(CATEGORY_CODES.hensAndPullets)
  const hensAndPullets = isReadable(categories, CATEGORY_CODES.hensAndPullets)
    ? readableHensAndPullets
    : layingHens.plus(broilers)
  return {
    dairyCows,
    otherCattle: nonNegative(totalCattle.minus(dairyCows)),
    sows,
    otherPigs: nonNegative(totalPigs.minus(sows)),
    goats: headsOfCategory(CATEGORY_CODES.goats),
    sheep: headsOfCategory(CATEGORY_CODES.sheep),
    horses: nonNegative(totalEquids.minus(mulesAndDonkeys)),
    mulesAndDonkeys,
    layingHens,
    broilers,
    otherPoultry: nonNegative(totalPoultry.minus(hensAndPullets)),
  }
}

export { listSecretCategories, NO_HEADS, SECRET_STATISTIC_MARK, toLivestockHeadcount }
export type { LivestockCategories, LivestockHeadcount }
