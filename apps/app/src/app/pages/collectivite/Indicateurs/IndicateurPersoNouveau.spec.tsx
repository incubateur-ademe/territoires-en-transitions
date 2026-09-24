import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import type { ReactNode } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { appLabels } from '@/app/labels/catalog';
import IndicateurPersoNouveau from './IndicateurPersoNouveau';

const mocks = vi.hoisted(() => ({
  createIndicateur: vi.fn(),
  push: vi.fn(),
}));

vi.mock('@tet/api/collectivites', () => ({
  useCollectiviteId: () => 42,
}));

vi.mock('next/navigation', () => ({
  useRouter: () => ({ push: mocks.push }),
}));

vi.mock(
  '@/app/indicateurs/indicateurs/use-create-indicateur-definition',
  () => ({
    useCreateIndicateurDefinition: () => ({
      mutate: mocks.createIndicateur,
      isPending: false,
    }),
  })
);

vi.mock('@/app/shared/thematiques/thematiques.dropdown', () => ({
  default: () => null,
}));

vi.mock('@tet/ui', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@tet/ui')>();
  return {
    ...actual,
    Select: ({
      values,
      options,
      onChange,
    }: {
      values: string;
      options: Array<{ value: string; label: string }>;
      onChange: (value: string) => void;
    }) => (
      <select
        aria-label={
          options.some((option) => option.value === 'annuelle')
            ? appLabels.champPeriodiciteIndicateur
            : undefined
        }
        value={values}
        onChange={(event) => onChange(event.target.value)}
      >
        <option value="" />
        {options.map(({ value, label }) => (
          <option key={value} value={value}>
            {label}
          </option>
        ))}
      </select>
    ),
    FormSectionGrid: ({ children }: { children: ReactNode }) => (
      <div>{children}</div>
    ),
  };
});

describe('IndicateurPersoNouveau', () => {
  beforeEach(() => {
    mocks.createIndicateur.mockReset();
    mocks.push.mockReset();
  });

  it.each(['annuelle', 'semestrielle', 'trimestrielle', 'mensuelle'])(
    'transmet la périodicité %s choisie à la création',
    async (periodicite) => {
      render(<IndicateurPersoNouveau />);

      fireEvent.change(screen.getByLabelText(appLabels.champNomIndicateur), {
        target: { value: 'Consommation mensuelle' },
      });
      fireEvent.change(
        screen.getByLabelText(appLabels.champPeriodiciteIndicateur),
        { target: { value: periodicite } }
      );

      const submit = screen.getByRole('button', { name: appLabels.valider });
      await waitFor(() =>
        expect((submit as HTMLButtonElement).disabled).toBe(false)
      );
      fireEvent.click(submit);

      await waitFor(() =>
        expect(mocks.createIndicateur).toHaveBeenCalledWith({
          collectiviteId: 42,
          titre: 'Consommation mensuelle',
          commentaire: '',
          thematiques: [],
          unite: '',
          periodicite,
          aggregationResultat: null,
          aggregationObjectif: null,
          ficheId: undefined,
          estFavori: false,
        })
      );
    }
  );
});
