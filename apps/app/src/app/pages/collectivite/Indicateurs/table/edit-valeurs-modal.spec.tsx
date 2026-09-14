import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { IndicateurPeriods } from '@tet/domain/indicateurs';
import type { PreparedData } from '../data/prepare-data';
import { EditValeursModal } from './edit-valeurs-modal';

const { upsertValeur } = vi.hoisted(() => ({
  upsertValeur: vi.fn(),
}));

vi.mock('@/app/indicateurs/valeurs/use-upsert-indicateur-valeur', () => ({
  useUpsertIndicateurValeur: () => ({
    mutateAsync: upsertValeur,
    isPending: false,
  }),
}));

const data = { valeursExistantes: [] } as unknown as PreparedData;

const fillAnnualValue = (): void => {
  const inputs = screen.getAllByRole('textbox');
  fireEvent.change(inputs[0], { target: { value: '2026' } });
  fireEvent.change(inputs[1], { target: { value: '12' } });
};

const fillAnnualValueFor = (year: string): void => {
  const inputs = screen.getAllByRole('textbox');
  fireEvent.change(inputs[0], { target: { value: year } });
  fireEvent.change(inputs[1], { target: { value: '12' } });
};

const renderModal = (setIsOpen = vi.fn()) => {
  render(
    <EditValeursModal
      collectiviteId={1}
      definition={{ id: 2, periodicite: 'annuelle' }}
      openState={{ isOpen: true, setIsOpen }}
      data={data}
    />
  );
  fillAnnualValue();
  return { setIsOpen };
};

beforeEach(() => {
  upsertValeur.mockReset();
});

describe('EditValeursModal', () => {
  it.each([
    { periodicite: 'annuelle', periode: '2026' },
    { periodicite: 'mensuelle', periode: '2026-02' },
  ] as const)(
    'conserve le brouillon après un retour au champ de période $periodicite inchangé',
    ({ periodicite, periode }) => {
      render(
        <EditValeursModal
          collectiviteId={1}
          definition={{ id: 2, periodicite }}
          openState={{ isOpen: true, setIsOpen: vi.fn() }}
          data={data}
        />
      );
      const periodInput = document.querySelector<HTMLInputElement>('input');
      expect(periodInput).not.toBeNull();
      fireEvent.change(periodInput as HTMLInputElement, {
        target: { value: periode },
      });
      fireEvent.blur(periodInput as HTMLInputElement);

      const valueInputs = screen
        .getAllByRole('textbox')
        .filter((input) => input !== periodInput);
      const draftValues = [
        '12',
        'Commentaire résultat',
        '20',
        'Commentaire objectif',
      ];
      valueInputs.forEach((input, index) => {
        fireEvent.change(input, { target: { value: draftValues[index] } });
      });

      fireEvent.focus(periodInput as HTMLInputElement);
      fireEvent.blur(periodInput as HTMLInputElement);

      expect(
        valueInputs.map((input) => (input as HTMLInputElement).value)
      ).toEqual(draftValues);
    }
  );

  it('charge les valeurs existantes puis vide le brouillon quand la période change', () => {
    render(
      <EditValeursModal
        collectiviteId={1}
        definition={{ id: 2, periodicite: 'annuelle' }}
        openState={{ isOpen: true, setIsOpen: vi.fn() }}
        data={{
          ...data,
          valeursExistantes: [
            {
              id: 3,
              collectiviteId: 1,
              dateValeur: '2026-01-01',
              periodicite: 'annuelle',
              periode: IndicateurPeriods.parse('annuelle', '2026'),
              periodeLabel: '2026',
              resultat: 12,
              objectif: 20,
              resultatCommentaire: 'Commentaire existant',
            },
          ],
        }}
      />
    );
    const [periodInput, resultatInput, commentaireInput, objectifInput] =
      screen.getAllByRole('textbox') as HTMLInputElement[];
    fireEvent.change(periodInput, { target: { value: '2026' } });
    expect(resultatInput.value).toBe('12');
    expect(commentaireInput.value).toBe('Commentaire existant');
    expect(objectifInput.value).toBe('20');

    fireEvent.change(resultatInput, { target: { value: '42' } });
    fireEvent.change(periodInput, { target: { value: '2027' } });

    expect(resultatInput.value).toBe('');
    expect(commentaireInput.value).toBe('');
    expect(objectifInput.value).toBe('');
  });

  it("reste ouverte et conserve le draft quand l'enregistrement échoue", async () => {
    upsertValeur.mockRejectedValue(new Error('network'));
    const { setIsOpen } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

    await waitFor(() => expect(upsertValeur).toHaveBeenCalledOnce());
    expect(setIsOpen).not.toHaveBeenCalled();
    expect((screen.getAllByRole('textbox')[1] as HTMLInputElement).value).toBe(
      '12'
    );
  });

  it("attend la fin du rafraichissement avant de fermer l'editeur", async () => {
    let resolveSave: () => void = () => undefined;
    upsertValeur.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveSave = resolve;
        })
    );
    const { setIsOpen } = renderModal();

    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    await waitFor(() => expect(upsertValeur).toHaveBeenCalledOnce());
    expect(setIsOpen).not.toHaveBeenCalled();

    resolveSave();
    await waitFor(() => expect(setIsOpen).toHaveBeenCalledWith(false));
  });

  it('enregistre la dernière année sans proposer une période hors calendrier', async () => {
    upsertValeur.mockResolvedValue(undefined);
    const setIsOpen = vi.fn();
    render(
      <EditValeursModal
        collectiviteId={1}
        definition={{ id: 2, periodicite: 'annuelle' }}
        openState={{ isOpen: true, setIsOpen }}
        data={data}
      />
    );
    fillAnnualValueFor('9999');

    expect(
      (
        screen.getByRole('button', {
          name: 'Valider et ajouter une année',
        }) as HTMLButtonElement
      ).disabled
    ).toBe(true);

    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

    await waitFor(() => expect(upsertValeur).toHaveBeenCalledOnce());
    expect(upsertValeur).toHaveBeenCalledWith(
      expect.objectContaining({ dateValeur: '9999-01-01' })
    );
    await waitFor(() => expect(setIsOpen).toHaveBeenCalledWith(false));
  });

  it('enregistre un mois avec sa date canonique', async () => {
    upsertValeur.mockResolvedValue(undefined);
    render(
      <EditValeursModal
        collectiviteId={1}
        definition={{ id: 2, periodicite: 'mensuelle' }}
        openState={{ isOpen: true, setIsOpen: vi.fn() }}
        data={data}
      />
    );
    const monthInput = document.querySelector<HTMLInputElement>(
      'input[type="month"]'
    );
    expect(monthInput).not.toBeNull();
    fireEvent.change(monthInput as HTMLInputElement, {
      target: { value: '2026-02' },
    });
    fireEvent.change(screen.getAllByRole('textbox')[0], {
      target: { value: '12' },
    });

    expect(
      screen.getByRole('button', { name: 'Valider et ajouter un mois' })
    ).toBeDefined();
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));

    await waitFor(() => expect(upsertValeur).toHaveBeenCalledOnce());
    expect(upsertValeur).toHaveBeenCalledWith(
      expect.objectContaining({ dateValeur: '2026-02-01', resultat: 12 })
    );
  });
});
