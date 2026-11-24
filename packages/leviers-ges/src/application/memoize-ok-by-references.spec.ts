import { err, ok, type Result } from 'neverthrow'
import { describe, expect, it, vi } from 'vitest'
import { memoizeOkByReferences } from './memoize-ok-by-references.ts'

describe('memoizeOkByReferences', () => {
  it('computes once for the same pair of references', () => {
    const compute = vi.fn((): Result<number, string> => ok(1))
    const memoized = memoizeOkByReferences(compute)
    const first = {}
    const second = {}

    const results = [memoized(first, second), memoized(first, second)]

    expect(compute).toHaveBeenCalledTimes(1)
    expect(results[1]).toBe(results[0])
  })

  it('computes again when either reference changes', () => {
    const compute = vi.fn((): Result<number, string> => ok(1))
    const memoized = memoizeOkByReferences(compute)
    const first = {}
    const second = {}

    memoized(first, second)
    memoized(first, {})
    memoized({}, second)

    expect(compute).toHaveBeenCalledTimes(3)
  })

  it('does not keep a failure, so a transient error can recover', () => {
    const compute = vi
      .fn<(first: object, second: object) => Result<number, string>>()
      .mockReturnValueOnce(err('unreadable'))
      .mockReturnValueOnce(ok(2))
    const memoized = memoizeOkByReferences(compute)
    const first = {}
    const second = {}

    const results = [memoized(first, second), memoized(first, second), memoized(first, second)]

    expect(results.map((result) => result.isOk())).toEqual([false, true, true])
    expect(compute).toHaveBeenCalledTimes(2)
  })
})
