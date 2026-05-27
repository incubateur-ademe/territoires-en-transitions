import '@testing-library/jest-dom/vitest';

import { uiLabels } from '@tet/ui/labels/catalog';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { EditableTitle, TITLE_MAX_LENGTH } from './EditableTitle';

const getHeading = (name?: string): HTMLElement =>
  screen.getByRole('heading', name ? { level: 1, name } : { level: 1 });

const openEdit = (name = 'Mon plan'): void => {
  fireEvent.click(getHeading(name));
};

const getTextarea = (): HTMLElement => screen.getByRole('textbox');

describe('EditableTitle — affichage', () => {
  it('affiche le titre fourni dans un <h1>', () => {
    render(
      <EditableTitle title="Mon plan" isReadonly={false} onUpdate={vi.fn()} />
    );
    expect(getHeading('Mon plan')).toBeInTheDocument();
  });

  it('affiche le fallback uiLabels.sansTitre quand le titre est null', () => {
    render(<EditableTitle title={null} isReadonly={false} onUpdate={vi.fn()} />);
    expect(getHeading(uiLabels.sansTitre)).toBeInTheDocument();
  });

  it('affiche le fallback quand le titre est une chaîne vide', () => {
    render(<EditableTitle title="" isReadonly={false} onUpdate={vi.fn()} />);
    expect(getHeading(uiLabels.sansTitre)).toBeInTheDocument();
  });
});

describe('EditableTitle — mode lecture seule', () => {
  it("le click sur le titre n'ouvre pas l'éditeur en mode lecture seule", () => {
    render(
      <EditableTitle title="Mon plan" isReadonly={true} onUpdate={vi.fn()} />
    );
    fireEvent.click(getHeading('Mon plan'));
    expect(screen.queryByRole('textbox')).toBeNull();
  });
});

describe("EditableTitle — flux d'édition", () => {
  it("ouvre la zone d'édition au clic sur le titre", () => {
    render(
      <EditableTitle title="Mon plan" isReadonly={false} onUpdate={vi.fn()} />
    );
    openEdit();
    expect(getTextarea()).toBeInTheDocument();
  });

  it('appelle onUpdate avec la nouvelle valeur après blur', () => {
    const onUpdate = vi.fn();
    render(
      <EditableTitle title="Mon plan" isReadonly={false} onUpdate={onUpdate} />
    );
    openEdit();
    fireEvent.change(getTextarea(), { target: { value: 'Nouveau titre' } });
    fireEvent.blur(getTextarea());
    expect(onUpdate).toHaveBeenCalledWith('Nouveau titre');
  });

  it('appelle onUpdate à la pression de Entrée', () => {
    const onUpdate = vi.fn();
    render(
      <EditableTitle title="Mon plan" isReadonly={false} onUpdate={onUpdate} />
    );
    openEdit();
    fireEvent.change(getTextarea(), { target: { value: 'Nouveau titre' } });
    fireEvent.keyDown(getTextarea(), { key: 'Enter' });
    expect(onUpdate).toHaveBeenCalledWith('Nouveau titre');
  });

  it(`tronque la valeur saisie à ${TITLE_MAX_LENGTH} caractères`, () => {
    const onUpdate = vi.fn();
    render(
      <EditableTitle
        title="placeholder"
        isReadonly={false}
        onUpdate={onUpdate}
      />
    );
    openEdit('placeholder');
    fireEvent.change(getTextarea(), {
      target: { value: 'a'.repeat(TITLE_MAX_LENGTH + 50) },
    });
    fireEvent.blur(getTextarea());
    expect(onUpdate).toHaveBeenCalledWith('a'.repeat(TITLE_MAX_LENGTH));
  });

  it("trim les espaces en début et fin avant d'appeler onUpdate", () => {
    const onUpdate = vi.fn();
    render(
      <EditableTitle
        title="placeholder"
        isReadonly={false}
        onUpdate={onUpdate}
      />
    );
    openEdit('placeholder');
    fireEvent.change(getTextarea(), { target: { value: '  Mon titre  ' } });
    fireEvent.blur(getTextarea());
    expect(onUpdate).toHaveBeenCalledWith('Mon titre');
  });
});

describe('EditableTitle — annulation par Échap', () => {
  it("Échap restaure la valeur d'avant édition dans le titre affiché", async () => {
    render(
      <EditableTitle title="Original" isReadonly={false} onUpdate={vi.fn()} />
    );
    openEdit('Original');
    fireEvent.change(getTextarea(), { target: { value: 'Modifié' } });
    fireEvent.keyDown(getTextarea(), { key: 'Escape' });
    await waitFor(() => {
      expect(getHeading()).toHaveTextContent('Original');
    });
  });

  it("Échap n'appelle pas onUpdate", async () => {
    const onUpdate = vi.fn();
    render(
      <EditableTitle title="Original" isReadonly={false} onUpdate={onUpdate} />
    );
    openEdit('Original');
    fireEvent.change(getTextarea(), { target: { value: 'Modifié' } });
    fireEvent.keyDown(getTextarea(), { key: 'Escape' });
    await waitFor(() => {
      expect(screen.queryByRole('textbox')).toBeNull();
    });
    expect(onUpdate).not.toHaveBeenCalled();
  });
});

describe('EditableTitle — compteur de caractères', () => {
  it('affiche "0 / 300 caractères" quand le titre est vide', () => {
    render(<EditableTitle title="" isReadonly={false} onUpdate={vi.fn()} />);
    openEdit(uiLabels.sansTitre);
    expect(
      screen.getByText(`0 / ${TITLE_MAX_LENGTH} caractères`)
    ).toBeInTheDocument();
  });

  it('met à jour le compteur quand la saisie change', () => {
    render(<EditableTitle title="" isReadonly={false} onUpdate={vi.fn()} />);
    openEdit(uiLabels.sansTitre);
    fireEvent.change(getTextarea(), { target: { value: 'Hello' } });
    expect(
      screen.getByText(`5 / ${TITLE_MAX_LENGTH} caractères`)
    ).toBeInTheDocument();
  });
});

describe('EditableTitle — accessibilité', () => {
  it('le <h1> reste un heading (pas de role=button qui casserait la navigation par headings)', () => {
    render(
      <EditableTitle title="Mon plan" isReadonly={false} onUpdate={vi.fn()} />
    );
    expect(getHeading('Mon plan')).not.toHaveAttribute('role', 'button');
  });

  it('rend le focus au titre après fermeture par Entrée', async () => {
    render(
      <EditableTitle title="Mon plan" isReadonly={false} onUpdate={vi.fn()} />
    );
    const heading = getHeading('Mon plan');
    fireEvent.click(heading);
    fireEvent.keyDown(getTextarea(), { key: 'Enter' });
    await waitFor(() => {
      expect(document.activeElement).toBe(heading);
    });
  });
});
