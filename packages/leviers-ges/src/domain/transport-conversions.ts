import type BigNumber from 'bignumber.js'
import { toBig } from './big-number.ts'

// Source : TrsptPers_Efficacité, formule dessinée dans les formes de la feuille (fiche d'analyse 13) : « × 52,14 », semaines par an
const WEEKS_PER_YEAR: BigNumber = toBig('52.14')

export { WEEKS_PER_YEAR }
