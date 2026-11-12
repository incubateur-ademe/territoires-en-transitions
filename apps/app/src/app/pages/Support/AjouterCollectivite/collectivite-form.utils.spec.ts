import { describe, expect, it } from 'vitest';
import { isIncomplete } from './collectivite-form.utils';

describe('isIncomplete', () => {
  it('ignore une valeur absente ou vide', () => {
    expect(isIncomplete(undefined, 9)).toBe(false);
    expect(isIncomplete(null, 9)).toBe(false);
    expect(isIncomplete('', 9)).toBe(false);
  });

  it('accepte la longueur attendue', () => {
    expect(isIncomplete('123456789', 9)).toBe(false);
  });

  it('signale une valeur trop courte ou trop longue', () => {
    expect(isIncomplete('12345', 9)).toBe(true);
    expect(isIncomplete('1234567890', 9)).toBe(true);
  });
});
