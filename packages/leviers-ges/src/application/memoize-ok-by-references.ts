import type { Result } from 'neverthrow'

function memoizeOkByReferences<First extends object, Second extends object, Value, Failure>(
  compute: (first: First, second: Second) => Result<Value, Failure>,
): (first: First, second: Second) => Result<Value, Failure> {
  const cache = new WeakMap<First, WeakMap<Second, Result<Value, Failure>>>()

  return (first, second) => {
    const bySecond = cache.get(first) ?? new WeakMap<Second, Result<Value, Failure>>()
    cache.set(first, bySecond)
    const cached = bySecond.get(second)
    if (cached !== undefined) return cached
    const computed = compute(first, second)
    if (computed.isOk()) bySecond.set(second, computed)
    return computed
  }
}

export { memoizeOkByReferences }
