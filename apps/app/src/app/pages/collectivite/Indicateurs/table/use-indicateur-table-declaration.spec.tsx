import { act, renderHook } from '@testing-library/react';
import {
  IndicateurPeriodes,
  IndicateurPeriodiciteEnum,
} from '@tet/domain/indicateurs';
import { type ReactElement, isValidElement } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { useIndicateurTableDeclaration } from './use-indicateur-table-declaration';

type OnAdd = (
  periode: ReturnType<typeof IndicateurPeriodes.fromYear>
) => Promise<boolean>;

const toOnAdd = (header: unknown): OnAdd => {
  if (!isValidElement(header)) {
    throw new Error('Le bandeau d’ajout de période est absent');
  }
  return (header as ReactElement<{ onAdd: OnAdd }>).props.onAdd;
};

const renderDeclaration = ({
  declarePeriode,
  canWrite = true,
  existingYears = [],
}: {
  declarePeriode: () => Promise<void>;
  canWrite?: boolean;
  existingYears?: number[];
}) =>
  renderHook(() =>
    useIndicateurTableDeclaration({
      canWrite,
      periodicite: IndicateurPeriodiciteEnum.ANNUELLE,
      existingPeriodes: existingYears.map(IndicateurPeriodes.fromYear),
      declarePeriode,
    })
  );

describe('useIndicateurTableDeclaration', () => {
  it('déclare la période ajoutée et la met en avant', async () => {
    const declarePeriode = vi.fn().mockResolvedValue(undefined);
    const periode = IndicateurPeriodes.fromYear(2024);
    const { result } = renderDeclaration({ declarePeriode });

    let isAdded = false;
    await act(async () => {
      isAdded = await toOnAdd(result.current.header)(periode);
    });

    expect(isAdded).toBe(true);
    expect(declarePeriode).toHaveBeenCalledWith(periode);
    expect(result.current.periodeToReveal).toEqual(periode);
  });

  it('refuse une période déjà présente sans rien déclarer', async () => {
    const declarePeriode = vi.fn().mockResolvedValue(undefined);
    const { result } = renderDeclaration({
      declarePeriode,
      existingYears: [2024],
    });

    let isAdded = true;
    await act(async () => {
      isAdded = await toOnAdd(result.current.header)(
        IndicateurPeriodes.fromYear(2024)
      );
    });

    expect(isAdded).toBe(false);
    expect(declarePeriode).not.toHaveBeenCalled();
  });

  it('ne met pas la période en avant quand la déclaration échoue', async () => {
    const declarePeriode = vi.fn().mockRejectedValue(new Error('échec'));
    const { result } = renderDeclaration({ declarePeriode });

    let isAdded = true;
    await act(async () => {
      isAdded = await toOnAdd(result.current.header)(
        IndicateurPeriodes.fromYear(2024)
      );
    });

    expect(isAdded).toBe(false);
    expect(result.current.periodeToReveal).toBeUndefined();
  });

  it('n’affiche pas le bandeau d’ajout sans droit d’écriture', () => {
    const { result } = renderDeclaration({
      declarePeriode: vi.fn(),
      canWrite: false,
    });

    expect(result.current.header).toBe(false);
  });
});
