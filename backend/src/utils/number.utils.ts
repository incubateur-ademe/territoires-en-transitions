import { isNil } from 'es-toolkit';

export function divisionOrZero(a: number | null, b: number | null) {
  return division(a, b, 0);
}

export function division<T extends number | null>(
  a: number | null,
  b: number | null,
  defaultValue: T = null as T
): number | T {
  if (isNil(a) || isNil(b) || b === 0) {
    return defaultValue;
  }

  return a / b;
}

export function roundTo(
  num: number | null | undefined,
  precision?: number
): number | null {
  if (!num || isNil(precision)) {
    return !isNil(num) ? num : null;
  }
  const factor = Math.pow(10, precision);
  return Math.round(num * factor + Number.EPSILON) / factor;
}

export function pythonRoundTo(
  value: number | null,
  precision: number
): number | null {
  if (!value || isNil(precision)) {
    return value;
  }

  const factor = Math.pow(10, precision);
  const shiftedValue = value * factor;

  // Round the shifted value to the nearest integer using "round half to even"
  const roundedValue = Math.round((shiftedValue + Number.EPSILON) * 100) / 100;

  // Check if the value is exactly halfway
  const fraction = shiftedValue - Math.floor(shiftedValue);
  if (fraction === 0.5 || fraction === -0.5) {
    // If integer part is even, round down; if odd, round up
    const integerPart = Math.floor(shiftedValue);
    if (integerPart % 2 === 0) {
      return integerPart / factor;
    } else {
      return (integerPart + 1) / factor;
    }
  } else {
    return Math.round(shiftedValue) / factor;
  }
}
