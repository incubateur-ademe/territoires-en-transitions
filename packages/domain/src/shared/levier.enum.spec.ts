import { describe, expect, it } from 'vitest';
import { levierEnumValues } from './levier.enum';

describe('levierEnumValues', () => {
  it('déclare 29 leviers distincts', () => {
    expect({
      total: levierEnumValues.length,
      distincts: new Set(levierEnumValues).size,
    }).toEqual({ total: 29, distincts: 29 });
  });
});
