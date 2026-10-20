import { appLabels } from '@/app/labels/catalog';
import {
  cleanup,
  fireEvent,
  render,
  screen,
  waitFor,
} from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { SuggestActionForm } from './suggest-action.form';

const setToast = vi.fn();
const sendSuggestion = vi.fn();

vi.mock('@/app/utils/toast/toast-context', () => ({
  useToastContext: () => ({ setToast }),
}));

vi.mock('./use-send-action-suggestion', () => ({
  useSendActionSuggestion: () => sendSuggestion,
}));

const renderForm = (): HTMLTextAreaElement => {
  render(<SuggestActionForm levierId="covoiturage" onCancel={vi.fn()} />);
  return screen.getByRole('textbox', { name: appLabels.decrireLAction });
};

const submitDescription = async (
  description: string
): Promise<HTMLTextAreaElement> => {
  const textbox = renderForm();
  fireEvent.change(textbox, { target: { value: description } });
  fireEvent.click(screen.getByRole('button', { name: appLabels.envoyer }));
  await waitFor(() => expect(sendSuggestion).toHaveBeenCalled());
  return textbox;
};

afterEach(() => {
  cleanup();
  setToast.mockClear();
  sendSuggestion.mockClear();
});

describe('SuggestActionForm', () => {
  it('envoie la description pour le levier', async () => {
    await submitDescription('Une prime aux covoitureurs');

    expect(sendSuggestion).toHaveBeenCalledExactlyOnceWith(
      'covoiturage',
      'Une prime aux covoitureurs'
    );
  });

  it('confirme l’envoi par un toast de succès', async () => {
    await submitDescription('Une prime aux covoitureurs');

    expect(setToast).toHaveBeenCalledExactlyOnceWith(
      'success',
      appLabels.suggestionEnvoyee
    );
  });

  it('laisse le formulaire vide et remplissable après l’envoi', async () => {
    const textbox = await submitDescription('Une prime aux covoitureurs');

    await waitFor(() => expect(textbox.value).toBe(''));
    expect(
      screen.getByRole('button', { name: appLabels.envoyer })
    ).toBeTruthy();
  });

  it("n'envoie rien quand la description est vide", async () => {
    renderForm();

    fireEvent.click(screen.getByRole('button', { name: appLabels.envoyer }));

    await waitFor(() =>
      expect(screen.getByText(appLabels.actionDescriptionRequise)).toBeTruthy()
    );
    expect(sendSuggestion).not.toHaveBeenCalled();
    expect(setToast).not.toHaveBeenCalled();
  });
});
