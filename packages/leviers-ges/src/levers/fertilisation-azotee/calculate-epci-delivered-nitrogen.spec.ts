import { describe, expect, it } from 'vitest'
import { quantity, type Hectares, type Tonnes } from '../../domain/units.ts'
import { calculateEpciDeliveredNitrogen } from './calculate-epci-delivered-nitrogen.ts'
import type { EpciNitrogenPart } from './data/epci-nitrogen-part.ts'

function part({
  delivered,
  epci,
  epciOrganic,
  departement,
  departementOrganic,
}: {
  delivered: string
  epci: string
  epciOrganic: string
  departement: string
  departementOrganic: string
}): EpciNitrogenPart {
  const hectares = (value: string): Hectares => quantity<'Hectares'>(value)
  return {
    departementDelivered: quantity<'Tonnes'>(delivered) satisfies Tonnes,
    epciArea: hectares(epci),
    epciOrganicArea: hectares(epciOrganic),
    departementArea: hectares(departement),
    departementOrganicArea: hectares(departementOrganic),
  }
}

describe('calculateEpciDeliveredNitrogen', () => {
  it.each([
    ['la moitié de la SAU hors bio du département', '600', '150', '30', '300', '60', '300'],
    ['toute la SAU hors bio du département', '600', '240', '0', '300', '60', '600'],
    ['plus que la SAU hors bio du département : plafonné à tout le département', '600', '100', '10', '100', '50', '600'],
    ['un EPCI plus bio que cultivé : aucune part', '600', '10', '20', '300', '60', '0'],
    ['un département plus bio que cultivé : aucune part', '600', '1', '0', '1', '190', '0'],
    ['un département à SAU hors bio nulle : aucune part', '600', '5', '0', '100', '100', '0'],
  ])('%s', (_label, delivered, epci, epciOrganic, departement, departementOrganic, expected) => {
    const tonnes = calculateEpciDeliveredNitrogen([
      part({ delivered, epci, epciOrganic, departement, departementOrganic }),
    ])
    expect(tonnes.toFixed()).toBe(expected)
  })

  it('additionne les parts de chaque département : 300 + 337,5 t', () => {
    const tonnes = calculateEpciDeliveredNitrogen([
      part({ delivered: '600', epci: '150', epciOrganic: '15', departement: '300', departementOrganic: '60' }),
      part({ delivered: '1000', epci: '200', epciOrganic: '40', departement: '400', departementOrganic: '80' }),
    ])
    expect(tonnes.toFixed()).toBe('837.5')
  })

  it('un EPCI sans part ne reçoit rien : 0 t', () => {
    expect(calculateEpciDeliveredNitrogen([]).toFixed()).toBe('0')
  })
})
