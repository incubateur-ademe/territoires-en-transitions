import { describe, expect, it } from 'vitest'
import { quantity } from '../../domain/units.ts'
import type { CurrentUsefulShares } from './calculate-residentiel-changement-systeme-chauffage-reduction.ts'
import type { HeatingVector } from './heating-reference.ts'
import { resolveTargetShares } from './resolve-target-shares.ts'

type Shares = Readonly<Record<HeatingVector, string>>

const CURRENT: Shares = { electricity: '0.5', naturalGas: '0.3', fuelOil: '0.2', wood: '0', heat: '0' }

function currentOf({ shares, usefulEnergy = '100' }: { shares: Shares; usefulEnergy?: string }): CurrentUsefulShares {
  return {
    usefulEnergy: quantity<'MegawattHours'>(usefulEnergy),
    shares: {
      electricity: quantity<'Fraction'>(shares.electricity),
      naturalGas: quantity<'Fraction'>(shares.naturalGas),
      fuelOil: quantity<'Fraction'>(shares.fuelOil),
      wood: quantity<'Fraction'>(shares.wood),
      heat: quantity<'Fraction'>(shares.heat),
    },
  }
}

function resolved(
  requested: Partial<Record<HeatingVector, string>>,
  current: CurrentUsefulShares = currentOf({ shares: CURRENT }),
) {
  const result = resolveTargetShares({
    requested: {
      electricity: requested.electricity === undefined ? undefined : quantity<'Fraction'>(requested.electricity),
      naturalGas: requested.naturalGas === undefined ? undefined : quantity<'Fraction'>(requested.naturalGas),
      fuelOil: requested.fuelOil === undefined ? undefined : quantity<'Fraction'>(requested.fuelOil),
      wood: requested.wood === undefined ? undefined : quantity<'Fraction'>(requested.wood),
      heat: requested.heat === undefined ? undefined : quantity<'Fraction'>(requested.heat),
    },
    current,
  })
  return result.map((shares) => ({
    electricity: shares.electricity.toFixed(),
    naturalGas: shares.naturalGas.toFixed(),
    fuelOil: shares.fuelOil.toFixed(),
    wood: shares.wood.toFixed(),
    heat: shares.heat.toFixed(),
  }))
}

describe('resolveTargetShares', () => {
  it('sans part précisée, la cible est le mix actuel', () => {
    expect(resolved({})._unsafeUnwrap()).toEqual(CURRENT)
  })

  it('le fioul à 0 : les autres vecteurs gardent leurs proportions et se partagent les 20 %', () => {
    expect(resolved({ fuelOil: '0' })._unsafeUnwrap()).toEqual({
      electricity: '0.625',
      naturalGas: '0.375',
      fuelOil: '0',
      wood: '0',
      heat: '0',
    })
  })

  it('le fioul à 0 et le bois à 10 % : 90 % pour électricité et gaz, en proportion de 5 pour 3', () => {
    expect(resolved({ fuelOil: '0', wood: '0.1' })._unsafeUnwrap()).toEqual({
      electricity: '0.5625',
      naturalGas: '0.3375',
      fuelOil: '0',
      wood: '0.1',
      heat: '0',
    })
  })

  it('cinq parts précisées : elles sont reprises telles quelles', () => {
    const all = { electricity: '0.1', naturalGas: '0.2', fuelOil: '0.3', wood: '0.25', heat: '0.15' }
    expect(resolved(all)._unsafeUnwrap()).toEqual(all)
  })

  it('une seule part non précisée prend tout le reste, même sans usage actuel : le bois à 20 %', () => {
    expect(resolved({ electricity: '0.3', naturalGas: '0.3', fuelOil: '0.1', heat: '0.1' })._unsafeUnwrap()).toEqual({
      electricity: '0.3',
      naturalGas: '0.3',
      fuelOil: '0.1',
      wood: '0.2',
      heat: '0.1',
    })
  })

  it('les parts résolues font 100 % à 10⁻²⁰ près même avec des parts actuelles en tiers', () => {
    const thirds = currentOf({
      shares: {
        electricity: '0.333333333333333333333333333333',
        naturalGas: '0.333333333333333333333333333333',
        fuelOil: '0.333333333333333333333333333333',
        wood: '0',
        heat: '0',
      },
    })
    const shares = resolved({ wood: '0.1' }, thirds)._unsafeUnwrap()
    const total = Object.values(shares).reduce((accumulated, share) => accumulated + Number(share), 0)
    expect(Math.abs(total - 1)).toBeLessThan(1e-12)
  })

  it('refuse un reste à répartir entre plusieurs vecteurs sans usage actuel', () => {
    expect(resolved({ electricity: '0.3', naturalGas: '0.3', fuelOil: '0.1' })._unsafeUnwrapErr()).toEqual({
      kind: 'invalid_request',
      issues: [
        {
          parameter: 'parameters',
          message:
            'the unspecified target shares have no current use to share the remaining part of the energy: give all but one of them',
        },
      ],
    })
  })

  it('sans énergie actuelle, les parts non précisées valent 0 plutôt que de refuser', () => {
    const none = currentOf({
      shares: { electricity: '0', naturalGas: '0', fuelOil: '0', wood: '0', heat: '0' },
      usefulEnergy: '0',
    })
    expect(resolved({ fuelOil: '0.4' }, none)._unsafeUnwrap()).toEqual({
      electricity: '0',
      naturalGas: '0',
      fuelOil: '0.4',
      wood: '0',
      heat: '0',
    })
  })
})
