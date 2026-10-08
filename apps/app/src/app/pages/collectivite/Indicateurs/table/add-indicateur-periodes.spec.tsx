import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { IndicateurPeriods } from '@tet/domain/indicateurs';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AddIndicateurPeriodeHeader } from './add-indicateur-periode.header';
import { AddIndicateurPeriodesModal } from './add-indicateur-periodes.modal';
import { parseIndicateurPeriodInput } from './add-indicateur-periodes.rules';

afterEach(cleanup);
describe('ajout de périodes', () => {
  it.each([
    ['annuelle', '', '2026-01-01'],
    ['mensuelle', '2', '2026-02-01'],
    ['trimestrielle', '3', '2026-07-01'],
    ['semestrielle', '2', '2026-07-01'],
  ] as const)(
    'construit la date canonique %s',
    (periodicite, subdivision, date) => {
      expect(
        IndicateurPeriods.toDateValeur(
          parseIndicateurPeriodInput(periodicite, { year: '2026', subdivision })
        )
      ).toBe(date);
    }
  );

  it('ajoute une année depuis l’en-tête et refuse un doublon', async () => {
    const onAdd = vi.fn(async () => true);
    render(
      <AddIndicateurPeriodeHeader
        periodicite="annuelle"
        existingPeriods={[IndicateurPeriods.parse('annuelle', '2026')]}
        onAdd={onAdd}
        onOpenModal={vi.fn()}
      />
    );
    const input = screen.getByRole('textbox', { name: 'Ajouter une année' });
    fireEvent.change(input, { target: { value: '2026' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    expect(onAdd).not.toHaveBeenCalled();
    expect(
      screen.getByText('Cette période est déjà présente dans le tableau.')
    ).toBeDefined();
    fireEvent.change(input, { target: { value: '2027' } });
    fireEvent.submit(input.closest('form') as HTMLFormElement);
    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith([
        IndicateurPeriods.parse('annuelle', '2027'),
      ])
    );
  });

  it('ajoute plusieurs mois depuis la modale', async () => {
    const onAdd = vi.fn(async () => true);
    const setIsOpen = vi.fn();
    render(
      <AddIndicateurPeriodesModal
        periodicite="mensuelle"
        existingPeriods={[]}
        onAdd={onAdd}
        openState={{ isOpen: true, setIsOpen }}
      />
    );
    fireEvent.click(screen.getByRole('button', { name: 'Mois' }));
    fireEvent.click(screen.getByText('février', { exact: true }));
    fireEvent.change(screen.getByRole('textbox', { name: 'Année *' }), {
      target: { value: '2026' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Ajouter une autre colonne' })
    );
    fireEvent.click(screen.getAllByRole('button', { name: 'Mois' })[1]);
    fireEvent.click(screen.getByText('mars', { exact: true }));
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Année *' })[1], {
      target: { value: '2026' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    await waitFor(() =>
      expect(onAdd).toHaveBeenCalledWith([
        IndicateurPeriods.parse('mensuelle', '2026-02'),
        IndicateurPeriods.parse('mensuelle', '2026-03'),
      ])
    );
    expect(setIsOpen).toHaveBeenCalledWith(false);
  });

  it('ne ferme pas le formulaire lorsque l’ajout échoue', async () => {
    const setIsOpen = vi.fn();
    render(
      <AddIndicateurPeriodesModal
        periodicite="annuelle"
        existingPeriods={[]}
        onAdd={async () => false}
        openState={{ isOpen: true, setIsOpen }}
      />
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Année *' }), {
      target: { value: '2026' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    await waitFor(() =>
      expect((screen.getByRole('textbox') as HTMLInputElement).value).toBe(
        '2026'
      )
    );
    expect(setIsOpen).not.toHaveBeenCalled();
  });
  it('refuse les doublons du lot sans ajouter de colonne', async () => {
    const onAdd = vi.fn(async () => true);
    render(
      <AddIndicateurPeriodesModal
        periodicite="annuelle"
        existingPeriods={[]}
        onAdd={onAdd}
        openState={{ isOpen: true, setIsOpen: vi.fn() }}
      />
    );
    fireEvent.change(screen.getByRole('textbox', { name: 'Année *' }), {
      target: { value: '2026' },
    });
    fireEvent.click(
      screen.getByRole('button', { name: 'Ajouter une autre colonne' })
    );
    fireEvent.change(screen.getAllByRole('textbox', { name: 'Année *' })[1], {
      target: { value: '2026' },
    });
    fireEvent.click(screen.getByRole('button', { name: 'Ajouter' }));
    await screen.findByText(
      'Choisissez des périodes valides, distinctes et absentes du tableau.'
    );
    expect(onAdd).not.toHaveBeenCalled();
  });
});
