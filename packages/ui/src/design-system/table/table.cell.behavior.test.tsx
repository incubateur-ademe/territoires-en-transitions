import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TableCell } from './table.cell';

const EditableCell = ({ label }: { label: string }) => (
  <TableCell
    canEdit
    edit={{
      renderOnEdit: ({ openState }) => (
        <input
          aria-label={label}
          autoFocus
          onKeyDown={(event) => {
            if (event.key === 'Enter') {
              event.preventDefault();
              openState.setIsOpen(false);
            }
          }}
        />
      ),
    }}
  >
    {label}
  </TableCell>
);

const renderCells = () =>
  render(
    <table>
      <tbody>
        <tr>
          <EditableCell label="A" />
          <EditableCell label="B" />
        </tr>
        <tr>
          <EditableCell label="C" />
        </tr>
      </tbody>
    </table>
  );

const cell = (label: string) => screen.getByText(label);
const editor = (label: string) => screen.getByLabelText(label);

describe('TableCell — édition en ligne au clavier', () => {
  it('poursuit l’édition sur la cellule suivante avec Tab', async () => {
    renderCells();

    fireEvent.click(cell('A'));
    fireEvent.keyDown(editor('A'), { key: 'Tab' });

    await waitFor(() => expect(editor('B')).toBeInTheDocument());
    expect(screen.queryByLabelText('A')).not.toBeInTheDocument();
  });

  it('revient à la cellule précédente avec Maj+Tab', async () => {
    renderCells();

    fireEvent.click(cell('B'));
    fireEvent.keyDown(editor('B'), { key: 'Tab', shiftKey: true });

    await waitFor(() => expect(editor('A')).toBeInTheDocument());
  });

  it('passe à la ligne suivante en fin de ligne', async () => {
    renderCells();

    fireEvent.click(cell('B'));
    fireEvent.keyDown(editor('B'), { key: 'Tab' });

    await waitFor(() => expect(editor('C')).toBeInTheDocument());
  });

  it('laisse la tabulation au navigateur sur la dernière cellule éditable', async () => {
    renderCells();

    fireEvent.click(cell('C'));
    fireEvent.keyDown(editor('C'), { key: 'Tab' });

    expect(editor('C')).toBeInTheDocument();
  });

  it('rend le focus à la cellule quand l’édition se ferme', async () => {
    renderCells();

    fireEvent.click(cell('A'));
    fireEvent.keyDown(editor('A'), { key: 'Enter' });

    await waitFor(() => expect(cell('A')).toHaveFocus());
  });
});
