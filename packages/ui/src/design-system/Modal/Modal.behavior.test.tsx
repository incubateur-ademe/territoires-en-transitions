import '@testing-library/jest-dom/vitest';

import { uiLabels } from '@tet/ui/labels/catalog';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { Modal } from './Modal';

/**
 * Le trigger doit être un élément hôte : `Modal` clone `children` et y injecte
 * les props Floating UI (onClick, ref). Un composant qui ne les transmet pas
 * n'ouvrirait jamais la modale.
 */
const trigger = <button type="button">Ouvrir</button>;

const openByTrigger = () =>
  fireEvent.click(screen.getByRole('button', { name: 'Ouvrir' }));

const openState = () => ({ isOpen: true, setIsOpen: vi.fn() });

describe('Modal — ouverture / fermeture', () => {
  it('ne rend rien tant que la modale est fermée', () => {
    render(<Modal title="Titre">{trigger}</Modal>);
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ouvre la modale au clic sur le trigger', () => {
    render(<Modal title="Titre">{trigger}</Modal>);
    openByTrigger();
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('affiche la modale quand openState.isOpen est vrai', () => {
    render(<Modal title="Titre" openState={openState()} />);
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it('ferme via le bouton fermer et appelle onClose', () => {
    const onClose = vi.fn();
    render(
      <Modal title="Titre" onClose={onClose}>
        {trigger}
      </Modal>
    );
    openByTrigger();
    fireEvent.click(screen.getByRole('button', { name: uiLabels.fermer }));
    expect(screen.queryByRole('dialog')).toBeNull();
    expect(onClose).toHaveBeenCalledOnce();
  });

  it('ferme avec la touche Échap', () => {
    render(<Modal title="Titre">{trigger}</Modal>);
    openByTrigger();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.queryByRole('dialog')).toBeNull();
  });

  it('ne ferme pas avec Échap quand disableDismiss est actif', () => {
    render(
      <Modal title="Titre" disableDismiss>
        {trigger}
      </Modal>
    );
    openByTrigger();
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    expect(screen.getByRole('dialog')).toBeInTheDocument();
  });

  it("n'affiche pas le bouton fermer avec noCloseButton", () => {
    render(<Modal title="Titre" noCloseButton openState={openState()} />);
    expect(screen.queryByRole('button', { name: uiLabels.fermer })).toBeNull();
  });

  it('la fonction close passée à render ferme la modale', () => {
    render(
      <Modal
        title="Titre"
        render={({ close }) => (
          <button type="button" onClick={close}>
            Valider
          </button>
        )}
      >
        {trigger}
      </Modal>
    );
    openByTrigger();
    fireEvent.click(screen.getByRole('button', { name: 'Valider' }));
    expect(screen.queryByRole('dialog')).toBeNull();
  });
});

describe('Modal — accessibilité', () => {
  it('a le rôle dialog et un aria-labelledby résolvant vers le titre', () => {
    render(<Modal title="Mon titre" openState={openState()} />);
    const dialog = screen.getByRole('dialog');
    const labelId = dialog.getAttribute('aria-labelledby') ?? '';
    expect(document.getElementById(labelId)).toHaveTextContent('Mon titre');
  });

  it("n'expose pas d'aria-labelledby quand la modale n'a pas de titre", () => {
    render(
      <Modal
        openState={openState()}
        render={() => <p className="mb-0">Sans titre</p>}
      />
    );
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-labelledby');
  });

  it('a un aria-describedby résolvant vers le corps rendu', () => {
    render(
      <Modal
        title="Titre"
        openState={openState()}
        render={() => <p className="mb-0">Une description</p>}
      />
    );
    const dialog = screen.getByRole('dialog');
    const describedBy = dialog.getAttribute('aria-describedby') ?? '';
    expect(document.getElementById(describedBy)).toHaveTextContent(
      'Une description'
    );
  });

  it("n'expose pas d'aria-describedby quand la modale n'a pas de corps", () => {
    render(<Modal title="Titre" openState={openState()} />);
    expect(screen.getByRole('dialog')).not.toHaveAttribute('aria-describedby');
  });

  it("place le focus dans la modale à l'ouverture", async () => {
    render(<Modal title="Titre">{trigger}</Modal>);
    openByTrigger();
    const dialog = screen.getByRole('dialog');
    await waitFor(() =>
      expect(dialog.contains(document.activeElement)).toBe(true)
    );
  });

  it('restaure le focus sur le trigger à la fermeture', async () => {
    render(<Modal title="Titre">{trigger}</Modal>);
    const triggerButton = screen.getByRole('button', { name: 'Ouvrir' });
    fireEvent.click(triggerButton);
    fireEvent.keyDown(screen.getByRole('dialog'), { key: 'Escape' });
    await waitFor(() => expect(document.activeElement).toBe(triggerButton));
  });
});

describe('Modal — sections et dividers', () => {
  it('rend le titre et le sous-titre quand ils sont fournis', () => {
    render(
      <Modal title="Titre" subTitle="Sous-titre" openState={openState()} />
    );
    expect(screen.getByRole('heading', { name: 'Titre' })).toBeInTheDocument();
    expect(screen.getByText('Sous-titre')).toBeInTheDocument();
  });

  it('insère un divider entre header/body et entre body/footer', () => {
    render(
      <Modal
        title="Titre"
        openState={openState()}
        render={() => <p>Corps</p>}
        renderFooter={() => <button type="button">OK</button>}
      />
    );
    expect(screen.getAllByRole('separator')).toHaveLength(2);
  });

  it('ne rend aucun divider pour une modale sans body ni footer', () => {
    render(<Modal title="Titre" openState={openState()} />);
    expect(screen.queryAllByRole('separator')).toHaveLength(0);
  });

  it('applique la classe de largeur correspondant à size', () => {
    render(<Modal title="Titre" size="lg" openState={openState()} />);
    expect(screen.getByRole('dialog')).toHaveClass('max-w-modal-lg');
  });
});

describe('Modal — scrollableContent', () => {
  it('rend le conteneur en overflow-hidden et le body scrollable', () => {
    render(
      <Modal
        title="Titre"
        scrollableContent
        openState={openState()}
        render={() => <p>Corps</p>}
      />
    );
    expect(screen.getByRole('dialog')).toHaveClass('overflow-hidden');
    expect(screen.getByText('Corps').parentElement).toHaveClass(
      'overflow-y-auto'
    );
  });
});
