import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it } from 'vitest';

import { TableCell } from './table.cell';

const EditableCell = ({ label }: { label: string }) => (
  <TableCell
    canEdit
    edit={{
      renderOnEdit: () => <input aria-label={label} autoFocus />,
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

  it('ferme l’édition avec Échap', async () => {
    renderCells();

    fireEvent.click(cell('A'));
    fireEvent.keyDown(editor('A'), { key: 'Escape' });

    await waitFor(() =>
      expect(screen.queryByLabelText('A')).not.toBeInTheDocument()
    );
    await waitFor(() => expect(cell('A')).toHaveFocus());
  });

  it('n’insère pas de span comme enfant direct d’une ligne de tableau', () => {
    const { container } = renderCells();
    fireEvent.click(cell('A'));

    expect(editor('A')).toBeInTheDocument();
    expect(container.querySelector('tr > span')).toBeNull();
  });

  it('laisse l’édition ouverte si l’input empêche le comportement par défaut de Entrée', async () => {
    render(
      <table>
        <tbody>
          <tr>
            <TableCell
              canEdit
              edit={{
                renderOnEdit: () => (
                  <input
                    aria-label="A"
                    autoFocus
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        event.preventDefault();
                      }
                    }}
                  />
                ),
              }}
            >
              A
            </TableCell>
          </tr>
        </tbody>
      </table>
    );

    fireEvent.click(cell('A'));
    fireEvent.keyDown(editor('A'), { key: 'Enter' });

    expect(editor('A')).toBeInTheDocument();
  });
});
