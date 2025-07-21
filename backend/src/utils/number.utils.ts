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

/**
 * Transforme un nombre avec le nombre de décimales voulu.
 *
 * Permet de palier aux résultats inattendus de la méthode native `Number.toFixed`
 * dûes aux imprécisions de la représentation des nombres à virgule flottante (IEEE 754).
 *
 * @example
 * roundTo(2.35, 1); // 2.4
 * roundTo(2.55, 1); // 2.6
 */
export function roundTo(num: number, precision: number): number {
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
