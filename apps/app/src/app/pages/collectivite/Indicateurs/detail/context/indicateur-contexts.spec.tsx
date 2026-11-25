import { renderHook } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { useIndicateurChart } from './indicateur-chart.context';
import { useIndicateurData } from './indicateur-data.context';
import { useIndicateurActions } from './indicateur-actions.context';
import { useIndicateurFichesLiees } from './indicateur-fiches-liees.context';
import { useIndicateurMesuresLiees } from './indicateur-mesures-liees.context';
import { useIndicateurPersonnalisation } from './indicateur-personnalisation.context';
import { useIndicateurSousIndicateursChart } from './indicateur-sous-indicateurs-chart.context';
import { useIndicateurSousIndicateursTable } from './indicateur-sous-indicateurs-table.context';

afterEach(() => vi.restoreAllMocks());

describe.each([
  ['useIndicateurData', useIndicateurData],
  ['useIndicateurChart', useIndicateurChart],
  ['useIndicateurActions', useIndicateurActions],
  ['useIndicateurFichesLiees', useIndicateurFichesLiees],
  ['useIndicateurMesuresLiees', useIndicateurMesuresLiees],
  ['useIndicateurPersonnalisation', useIndicateurPersonnalisation],
  ['useIndicateurSousIndicateursTable', useIndicateurSousIndicateursTable],
  ['useIndicateurSousIndicateursChart', useIndicateurSousIndicateursChart],
])('%s', (name, useContextValue) => {
  it('échoue hors de son provider', () => {
    vi.spyOn(console, 'error').mockImplementation(() => undefined);

    expect(() => renderHook(() => useContextValue())).toThrow(
      new RegExp(`^${name} must be used within an \\w+Provider$`)
    );
  });
});
