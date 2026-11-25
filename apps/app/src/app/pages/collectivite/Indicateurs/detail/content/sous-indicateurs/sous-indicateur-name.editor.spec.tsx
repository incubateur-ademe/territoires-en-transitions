import { appLabels } from '@/app/labels/catalog';
import { act, fireEvent, render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import { SousIndicateurNameEditor } from './sous-indicateur-name.editor';

const renderEditor = ({ shouldEdit }: { shouldEdit: boolean }) =>
  render(
    <SousIndicateurNameEditor
      label="Verre"
      shouldEdit={shouldEdit}
      onRename={vi.fn()}
      onEditingEnd={vi.fn()}
    />
  );

describe('SousIndicateurNameEditor', () => {
  it("ouvre l'édition quand la ligne existe déjà puis est désignée à éditer", () => {
    const { rerender } = renderEditor({ shouldEdit: false });
    expect(
      screen.queryByRole('textbox', {
        name: appLabels.indicateurSousIndicateurNom,
      })
    ).toBeNull();

    rerender(
      <SousIndicateurNameEditor
        label="Verre"
        shouldEdit
        onRename={vi.fn()}
        onEditingEnd={vi.fn()}
      />
    );

    expect(
      screen.getByRole('textbox', {
        name: appLabels.indicateurSousIndicateurNom,
      })
    ).toBeDefined();
  });

  it("n'enregistre pas le nom quand Entrée valide une composition de saisie", () => {
    const onRename = vi.fn();
    render(
      <SousIndicateurNameEditor
        label="Verre"
        shouldEdit
        onRename={onRename}
        onEditingEnd={vi.fn()}
      />
    );
    const input = screen.getByRole('textbox', {
      name: appLabels.indicateurSousIndicateurNom,
    });

    fireEvent.change(input, { target: { value: 'Pap' } });
    fireEvent.keyDown(input, { key: 'Enter', isComposing: true });

    expect(onRename).not.toHaveBeenCalled();
    expect(
      screen.getByRole('textbox', {
        name: appLabels.indicateurSousIndicateurNom,
      })
    ).toBeDefined();
  });

  it("n'enregistre le nom qu'une fois quand le blur suit Entrée avant le rendu", () => {
    const onRename = vi.fn();
    render(
      <SousIndicateurNameEditor
        label="Verre"
        shouldEdit
        onRename={onRename}
        onEditingEnd={vi.fn()}
      />
    );
    const input = screen.getByRole('textbox', {
      name: appLabels.indicateurSousIndicateurNom,
    });

    fireEvent.change(input, { target: { value: 'Papier' } });
    act(() => {
      fireEvent.keyDown(input, { key: 'Enter' });
      fireEvent.blur(input);
    });

    expect(onRename).toHaveBeenCalledTimes(1);
    expect(onRename).toHaveBeenCalledWith('Papier');
  });
});
