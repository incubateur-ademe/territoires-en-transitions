type InvalidParameter = {
  readonly kind: 'invalid_parameter'
  readonly parameter: string
  readonly value: string
}

function invalidParameter({
  parameter,
  value,
}: Pick<InvalidParameter, 'parameter' | 'value'>): InvalidParameter {
  return { kind: 'invalid_parameter', parameter, value }
}

export { invalidParameter }
export type { InvalidParameter }
