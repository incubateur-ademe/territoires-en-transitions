import { describe, expect, it } from 'vitest'
import { readLeverLimits } from './read-lever-limits.ts'

const METHODOLOGY = [
  '# Levier',
  '',
  '## Limites',
  '',
  'Un paragraphe ignoré.',
  '',
  '| Limite | Effet |',
  '|---|---|',
  '| Bois | absent des données |',
  '| GPL | non modifiable |',
  '',
  '## Suite',
  '',
  '| Autre | table |',
].join('\n')

describe('readLeverLimits', () => {
  it('lit les lignes du tableau de la section Limites, sans son en-tête', () => {
    expect(readLeverLimits(METHODOLOGY)).toEqual([
      { limit: 'Bois', effect: 'absent des données' },
      { limit: 'GPL', effect: 'non modifiable' },
    ])
  })

  it('lit jusqu’à la fin du fichier quand Limites est la dernière section', () => {
    const lastSection = '## Limites\n| Limite | Effet |\n|---|---|\n| A | b |'
    expect(readLeverLimits(lastSection)).toEqual([{ limit: 'A', effect: 'b' }])
  })

  it('rend des cellules vides pour une ligne qui n’a pas deux cellules', () => {
    const shortRow = '## Limites\n| Limite | Effet |\n|---|---|\n| A |'
    expect(readLeverLimits(shortRow)).toEqual([{ limit: '', effect: '' }])
  })

  it('ne rend rien sans section Limites', () => {
    expect(readLeverLimits('# Levier\n| L | E |\n|---|---|\n| A | b |')).toEqual([])
  })
})
