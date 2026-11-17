import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIndicateurData } from './indicateur-data.context';
import { useIndicateurActions } from './indicateur-actions.context';
import { useIndicateurFichesLiees } from './indicateur-fiches-liees.context';

afterEach(() => vi.restoreAllMocks());

describe.each([
  ['useIndicateurData', useIndicateurData],
  ['useIndicateurActions', useIndicateurActions],
  ['useIndicateurFichesLiees', useIndicateurFichesLiees],
])('%s', (name, useContextValue) => {
  it('échoue hors de son provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useContextValue())).toThrow(
      new RegExp(`^${name} must be used within an \\w+Provider$`)
    );
  });
});
