import {
  fireEvent,
  render,
  screen,
  waitFor,
  within,
} from '@testing-library/react';
import type { ComponentProps } from 'react';
import { assert, describe, expect, it, vi } from 'vitest';

import type { RichTextEditorProps } from '../RichTextEditor/RichTextEditor';
import { TableCellRichTextEditor } from './table.cell-rich-text-editor';
import { TableRow } from './table.row';

vi.mock('../RichTextEditor', () => ({
  RichTextEditor: ({ initialValue, onChange }: RichTextEditorProps) => (
    <textarea
      aria-label="État d'avancement"
      defaultValue={initialValue}
      onChange={(event) => onChange?.(event.target.value)}
    />
  ),
}));

const FULL_TEXT =
  "Une description complète de l'avancement de la mesure. ".repeat(20);

const renderCell = (
  props: ComponentProps<typeof TableCellRichTextEditor> = {}
) =>
  render(
    <table>
      <tbody>
        <TableRow>
          <TableCellRichTextEditor
            tabIndex={-1}
            canEdit={false}
            initialValue={`<p>${FULL_TEXT}</p>`}
            {...props}
          />
        </TableRow>
      </tbody>
    </table>
  );

const getReadOnlyContent = () =>
  document.querySelector<HTMLElement>(
    '[data-test="table.rich-text.read-only-content"]'
  );

describe('TableCellRichTextEditor', () => {
  it.each(['clic', 'Entrée'])(
    'permet de lire le texte complet sans droit de modification par %s',
    async (interaction) => {
      const onValueChange = vi.fn();
      renderCell({ onValueChange });
      const cell = screen.getByRole('cell');

      expect(cell).toHaveAttribute('tabindex', '0');
      expect(getReadOnlyContent()).toBeNull();

      if (interaction === 'clic') {
        fireEvent.click(cell);
      } else {
        fireEvent.keyDown(cell, { key: 'Enter' });
      }

      await waitFor(() => expect(getReadOnlyContent()).not.toBeNull());
      const content = getReadOnlyContent();
      assert.isNotNull(content);
      expect(content.textContent).toBe(FULL_TEXT);
      expect(content).not.toHaveClass('overflow-hidden');
      expect(screen.queryByRole('textbox')).not.toBeInTheDocument();

      fireEvent.keyDown(content, { key: 'Escape' });
      await waitFor(() => expect(getReadOnlyContent()).toBeNull());
      expect(onValueChange).not.toHaveBeenCalled();
    }
  );

  it('ferme la lecture avec le bouton sans enregistrer', async () => {
    const onValueChange = vi.fn();
    renderCell({ onValueChange });
    fireEvent.click(screen.getByRole('cell'));
    fireEvent.click(await screen.findByRole('button', { name: 'Fermer' }));

    await waitFor(() => expect(getReadOnlyContent()).toBeNull());
    expect(screen.getByRole('cell')).toHaveFocus();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('ferme la lecture au clic extérieur sans enregistrer', async () => {
    const onValueChange = vi.fn();
    renderCell({ onValueChange });
    fireEvent.click(screen.getByRole('cell'));
    await waitFor(() => expect(getReadOnlyContent()).not.toBeNull());

    fireEvent.pointerDown(document.body);

    await waitFor(() => expect(getReadOnlyContent()).toBeNull());
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it('conserve le formatage et assainit le contenu développé', async () => {
    renderCell({
      initialValue:
        '<p><strong>Avancement</strong></p><a href="javascript:alert(1)">Détail</a><script>alert(1)</script>',
    });
    fireEvent.click(screen.getByRole('cell'));
    await waitFor(() => expect(getReadOnlyContent()).not.toBeNull());

    const content = getReadOnlyContent();
    assert.isNotNull(content);
    expect(within(content).getByText('Avancement').tagName).toBe('STRONG');
    expect(within(content).getByText('Détail')).not.toHaveAttribute('href');
    expect(content.querySelector('script')).toBeNull();
  });

  it('ne rend pas une cellule vide interactive en lecture seule', () => {
    const onValueChange = vi.fn();
    renderCell({ initialValue: undefined, onValueChange });
    const cell = screen.getByRole('cell');

    expect(cell).toHaveAttribute('tabindex', '-1');
    fireEvent.click(cell);
    expect(getReadOnlyContent()).toBeNull();
    expect(screen.queryByRole('textbox')).not.toBeInTheDocument();
    expect(onValueChange).not.toHaveBeenCalled();
  });

  it.each(['Échap', 'fermeture'])(
    'enregistre les modifications à la fermeture par %s',
    async (interaction) => {
      const onValueChange = vi.fn();
      renderCell({ canEdit: true, initialValue: 'Avant', onValueChange });
      fireEvent.click(screen.getByRole('cell'));

      const editor = await screen.findByRole('textbox', {
        name: "État d'avancement",
      });
      expect(editor).toHaveValue('Avant');
      expect(getReadOnlyContent()).toBeNull();
      fireEvent.change(editor, { target: { value: 'Après' } });
      if (interaction === 'fermeture') {
        fireEvent.click(screen.getByRole('button', { name: 'Fermer' }));
      } else {
        fireEvent.keyDown(editor, { key: 'Escape' });
      }

      await waitFor(() =>
        expect(screen.queryByRole('textbox')).not.toBeInTheDocument()
      );
      expect(onValueChange).toHaveBeenCalledExactlyOnceWith('Après');
    }
  );
});
