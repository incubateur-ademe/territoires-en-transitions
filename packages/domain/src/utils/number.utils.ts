import { isNil, sumBy } from 'es-toolkit';

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

function groupThousands(integerPart: string): string {
  return integerPart.replace(/\B(?=(\d{3})+(?!\d))/g, ' ');
}

export function getFormattedNumber(nb: number): string {
  const [integerPart, decimalPart] = nb.toString().split('.');
  return decimalPart === undefined
    ? groupThousands(integerPart)
    : `${groupThousands(integerPart)},${decimalPart}`;
}

export function roundTo(num: number, precision: number): number {
  const factor = Math.pow(10, precision);
  return Math.round(num * factor + Number.EPSILON) / factor;
}

export function sumRoundedTo(
  values: readonly (number | null | undefined)[],
  precision = 2
): number {
  return roundTo(
    sumBy(values, (value) => value ?? 0),
    precision
  );
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

  const fraction = shiftedValue - Math.floor(shiftedValue);
  if (fraction === 0.5 || fraction === -0.5) {
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


