import { Meta, StoryObj } from '@storybook/nextjs-vite';
import { useId, useRef, useState } from 'react';
import { expect, waitFor, within } from 'storybook/test';
import { Button } from '../Button';
import { Input } from '../Input';
import { Select } from '../Select';
import { InlineEditWrapper } from './inline-edit.wrapper';

const meta: Meta<typeof InlineEditWrapper> = {
  component: InlineEditWrapper,
  title: 'Design System/Inline edit',
};

export default meta;

type Story = StoryObj<typeof InlineEditWrapper>;

const RenderDefault = () => {
  const options = [
    { label: 'Victor', value: 'victor' },
    { label: 'Elsa', value: 'elsa' },
    { label: 'Camille', value: 'camille' },
  ];

  const [value, setValue] = useState(options[0].value);

  return (
    <InlineEditWrapper
      renderOnEdit={({ openState }) => (
        <Select
          buttonClassName="w-64"
          values={value}
          onChange={(value) => setValue(value as string)}
          inlineEdit
          openState={openState}
          options={options}
        />
      )}
    >
      <div className="inline-flex items-center gap-2 py-3 px-2 border border-primary-3 rounded-lg">
        <div className="w-8 h-8 bg-primary-6 rounded-full" />
        <div className="text-primary-8 font-medium">{value}</div>
      </div>
    </InlineEditWrapper>
  );
};

export const Default: Story = {
  render: () => <RenderDefault />,
};

const INITIAL_VALUE = 'Valeur initiale';

const RenderAsyncSaveWithRetry = () => {
  const statusId = useId();
  const [value, setValue] = useState(INITIAL_VALUE);
  const [draft, setDraft] = useState(value);
  const [status, setStatus] = useState<'idle' | 'saving' | 'error'>('idle');
  const [hasFailed, setHasFailed] = useState(false);
  const pendingSaveRef = useRef<Promise<boolean> | null>(null);

  const handleClose = () => {
    if (pendingSaveRef.current) return pendingSaveRef.current;

    const save = async () => {
      setStatus('saving');
      // Simule un appel réseau : le premier échoue, le suivant réussit.
      await new Promise((resolve) => setTimeout(resolve, 800));
      if (!hasFailed) {
        setHasFailed(true);
        setStatus('error');
        return false;
      }
      setValue(draft);
      setStatus('idle');
      return true;
    };

    pendingSaveRef.current = save().finally(() => {
      pendingSaveRef.current = null;
    });
    return pendingSaveRef.current;
  };

  return (
    <div className="flex max-w-md flex-col gap-4">
      <p className="text-sm text-grey-7">
        Modifiez la valeur, puis appuyez sur Entrée ou cliquez à l’extérieur. La
        première sauvegarde échoue et conserve le brouillon ouvert. Réessayez
        pour enregistrer et fermer l’éditeur.
      </p>
      <InlineEditWrapper
        onClose={handleClose}
        renderOnEdit={({ openState }) => (
          <div
            className="flex w-80 flex-col gap-3 p-4"
            aria-busy={status === 'saving'}
          >
            <Input
              type="text"
              aria-label="Valeur à enregistrer"
              aria-describedby={statusId}
              aria-invalid={status === 'error'}
              value={draft}
              readOnly={status === 'saving'}
              onChange={(event) => setDraft(event.currentTarget.value)}
              onKeyDown={(event) => {
                if (event.key === 'Enter') {
                  event.preventDefault();
                  openState.setIsOpen(false);
                }
              }}
            />
            <p id={statusId} role="status" className="text-sm">
              {status === 'saving'
                ? 'Enregistrement en cours…'
                : status === 'error'
                ? 'Échec de l’enregistrement. Votre saisie est conservée.'
                : 'Validez pour enregistrer la valeur.'}
            </p>
            <Button
              size="sm"
              loading={status === 'saving'}
              disabled={status === 'saving'}
              onClick={() => openState.setIsOpen(false)}
            >
              {status === 'error' ? 'Réessayer' : 'Enregistrer'}
            </Button>
          </div>
        )}
      >
        <button
          type="button"
          className="rounded-lg border border-primary-3 px-4 py-3 text-primary-8"
        >
          {value}
        </button>
      </InlineEditWrapper>
      {hasFailed && status === 'idle' && (
        <Button
          size="sm"
          variant="secondary"
          onClick={() => {
            setValue(INITIAL_VALUE);
            setDraft(INITIAL_VALUE);
            setHasFailed(false);
          }}
        >
          Rejouer le scénario
        </Button>
      )}
    </div>
  );
};

export const AsyncSaveWithRetry: Story = {
  name: 'Sauvegarde asynchrone avec nouvelle tentative',
  render: () => <RenderAsyncSaveWithRetry />,
  play: async ({ canvas, canvasElement, userEvent }) => {
    const body = within(canvasElement.ownerDocument.body);
    await userEvent.click(
      canvas.getByRole('button', { name: 'Valeur initiale' })
    );
    const input = await body.findByRole('textbox', {
      name: 'Valeur à enregistrer',
    });
    await userEvent.clear(input);
    await userEvent.type(input, 'Nouvelle valeur{Enter}');

    await expect(body.getByRole('status')).toHaveTextContent(
      'Enregistrement en cours…'
    );
    await expect(input).toBeVisible();
    await waitFor(
      () =>
        expect(body.getByRole('status')).toHaveTextContent(
          'Échec de l’enregistrement.'
        ),
      { timeout: 3000 }
    );
    await expect(input).toBeVisible();
    await expect(input).toHaveValue('Nouvelle valeur');
    await expect(input).toHaveAttribute('aria-invalid', 'true');

    await userEvent.click(body.getByRole('button', { name: 'Réessayer' }));
    await waitFor(() => expect(body.queryByRole('textbox')).toBeNull(), {
      timeout: 3000,
    });
    await expect(
      canvas.getByRole('button', { name: 'Nouvelle valeur' })
    ).toBeVisible();
    await userEvent.click(
      canvas.getByRole('button', { name: 'Rejouer le scénario' })
    );
    await expect(
      canvas.getByRole('button', { name: INITIAL_VALUE })
    ).toBeVisible();
  },
};
