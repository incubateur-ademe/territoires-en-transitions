import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIndicateurChart } from './indicateur-chart.context';
import { useIndicateurDefinition } from './indicateur-definition.context';
import { useIndicateurActions } from './indicateur-actions.context';
import { useIndicateurFichesLiees } from './indicateur-fiches-liees.context';
import { useIndicateurValeurs } from './indicateur-valeurs.context';

afterEach(() => vi.restoreAllMocks());

describe.each([
  ['useIndicateurDefinition', useIndicateurDefinition],
  ['useIndicateurChart', useIndicateurChart],
  ['useIndicateurValeurs', useIndicateurValeurs],
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
