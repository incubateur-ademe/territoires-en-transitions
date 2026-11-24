import { err, ok, type Result } from 'neverthrow'
import { match } from 'ts-pattern'
import {
  getStatus,
  isComputedLevel,
  type ComputedLevels,
  type ComputedStatus,
  type LeverId,
} from '../../domain/lever-registry.ts'
import type { Level } from '../../domain/territory.ts'
import { levelNotComputed, type LevelNotComputed } from './estimation-error.ts'

function ensureLevelComputed<L extends LeverId>({
  lever,
  level,
}: {
  lever: L
  level: Level
}): Result<ComputedLevels<L>, LevelNotComputed> {
  return isComputedLevel(lever, level) ? ok(level) : err(levelNotComputed({ lever, level }))
}

function computedStatusOf({
  lever,
  level,
}: {
  lever: LeverId
  level: Level
}): Result<ComputedStatus, LevelNotComputed> {
  return match(getStatus({ lever, level }))
    .with('no_open_question', 'workaround', (status) => ok(status))
    .with('not_computed', () => err(levelNotComputed({ lever, level })))
    .exhaustive()
}

export { computedStatusOf, ensureLevelComputed }
