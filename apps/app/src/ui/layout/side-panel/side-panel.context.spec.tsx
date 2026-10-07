import { fireEvent, render, screen } from '@testing-library/react';
import { uiLabels } from '@tet/ui/labels/catalog';
import { JSX, ReactNode, useState } from 'react';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { SidePanel } from './side-panel';
import { SidePanelProvider, useSidePanel } from './side-panel.context';
import type {
  CloseRequestOutcome,
  UseSidePanelOptions,
} from './side-panel.contract';

const INITIAL_PATHNAME = '/collectivite/1/actions-reference';
const NEXT_PATHNAME = '/collectivite/1/actions';
const PANEL_TITLE = 'Modifier une action de référence';
const OPEN_PANEL = 'Ouvrir le volet';
const PANEL_CONTENT = 'Formulaire de modification';
const REMOVE_FIRST_DECLARATION = 'Retirer la première déclaration';

const currentRoute = vi.hoisted(() => ({ pathname: '' }));

vi.mock('next/navigation', () => ({
  usePathname: () => currentRoute.pathname,
}));

const PanelContent = ({
  onClose,
  onCloseRequest,
}: UseSidePanelOptions): JSX.Element => {
  useSidePanel({ onClose, onCloseRequest });
  return <p>{PANEL_CONTENT}</p>;
};

const PanelOpener = ({
  content,
}: {
  readonly content: ReactNode;
}): JSX.Element => {
  const { setPanel } = useSidePanel();
  return (
    <button
      onClick={() => setPanel({ type: 'open', title: PANEL_TITLE, content })}
    >
      {OPEN_PANEL}
    </button>
  );
};

const SidePanelOpening = ({
  content,
}: {
  readonly content: ReactNode;
}): JSX.Element => (
  <SidePanelProvider>
    <PanelOpener content={content} />
    <SidePanel />
  </SidePanelProvider>
);

const SidePanelWithOpener = (options: UseSidePanelOptions): JSX.Element => (
  <SidePanelOpening content={<PanelContent {...options} />} />
);

const closeWithoutAsking = (): CloseRequestOutcome => 'close';

const CloseRequestDeclaration = ({
  onCloseRequest,
}: {
  readonly onCloseRequest: () => CloseRequestOutcome;
}): null => {
  useSidePanel({ onCloseRequest });
  return null;
};

const TwoCloseRequestDeclarations = ({
  onLaterCloseRequest,
}: {
  readonly onLaterCloseRequest: () => CloseRequestOutcome;
}): JSX.Element => {
  const [hasFirstDeclaration, setHasFirstDeclaration] = useState(true);
  return (
    <>
      {hasFirstDeclaration ? (
        <CloseRequestDeclaration onCloseRequest={closeWithoutAsking} />
      ) : null}
      <CloseRequestDeclaration onCloseRequest={onLaterCloseRequest} />
      <button onClick={() => setHasFirstDeclaration(false)}>
        {REMOVE_FIRST_DECLARATION}
      </button>
    </>
  );
};

const openPanel = (): void => {
  fireEvent.click(screen.getByRole('button', { name: OPEN_PANEL }));
};

const clickCloseButton = (): void => {
  fireEvent.click(screen.getByRole('button', { name: uiLabels.fermer }));
};

const queryOpenPanel = (): HTMLElement | null =>
  screen.queryByRole('complementary', { name: PANEL_TITLE });

describe('fermer-volet-modifications-non-enregistrees', () => {
  beforeEach(() => {
    currentRoute.pathname = INITIAL_PATHNAME;
  });

  it('le bouton de fermeture laisse le volet ouvert quand le contenu répond stay-open', () => {
    const onCloseRequest = vi.fn((): CloseRequestOutcome => 'stay-open');
    render(<SidePanelWithOpener onCloseRequest={onCloseRequest} />);
    openPanel();

    clickCloseButton();

    expect(onCloseRequest).toHaveBeenCalledTimes(1);
    expect(queryOpenPanel()).not.toBeNull();
    expect(screen.queryByText(PANEL_CONTENT)).not.toBeNull();
  });

  it('le bouton de fermeture ferme le volet quand le contenu répond close', () => {
    const onCloseRequest = vi.fn((): CloseRequestOutcome => 'close');
    render(<SidePanelWithOpener onCloseRequest={onCloseRequest} />);
    openPanel();
    expect(queryOpenPanel()).not.toBeNull();

    clickCloseButton();

    expect(onCloseRequest).toHaveBeenCalledTimes(1);
    expect(queryOpenPanel()).toBeNull();
  });

  it("le bouton de fermeture ferme le volet quand le contenu n'a déclaré aucune demande de fermeture", () => {
    const onClose = vi.fn();
    render(<SidePanelWithOpener onClose={onClose} />);
    openPanel();
    expect(queryOpenPanel()).not.toBeNull();

    clickCloseButton();

    expect(queryOpenPanel()).toBeNull();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it('un changement de route ferme le volet sans interroger le contenu', () => {
    const onCloseRequest = vi.fn((): CloseRequestOutcome => 'stay-open');
    const { rerender } = render(
      <SidePanelWithOpener onCloseRequest={onCloseRequest} />
    );
    openPanel();
    expect(queryOpenPanel()).not.toBeNull();

    currentRoute.pathname = NEXT_PATHNAME;
    rerender(<SidePanelWithOpener onCloseRequest={onCloseRequest} />);

    expect(queryOpenPanel()).toBeNull();
    expect(onCloseRequest).not.toHaveBeenCalled();
  });

  it("onClose n'est pas appelé tant que la fermeture demandée est refusée", () => {
    const onClose = vi.fn();
    const onCloseRequest = vi
      .fn<() => CloseRequestOutcome>()
      .mockReturnValueOnce('stay-open')
      .mockReturnValue('close');
    render(
      <SidePanelWithOpener onClose={onClose} onCloseRequest={onCloseRequest} />
    );
    openPanel();
    expect(queryOpenPanel()).not.toBeNull();

    clickCloseButton();
    expect(onClose).not.toHaveBeenCalled();

    clickCloseButton();
    expect(onClose).toHaveBeenCalledTimes(1);
  });

  it("le retrait d'une première déclaration garde la demande de fermeture déclarée après elle", () => {
    const onLaterCloseRequest = vi.fn((): CloseRequestOutcome => 'stay-open');
    render(
      <SidePanelOpening
        content={
          <TwoCloseRequestDeclarations
            onLaterCloseRequest={onLaterCloseRequest}
          />
        }
      />
    );
    openPanel();
    fireEvent.click(
      screen.getByRole('button', { name: REMOVE_FIRST_DECLARATION })
    );

    clickCloseButton();

    expect(onLaterCloseRequest).toHaveBeenCalledTimes(1);
    expect(queryOpenPanel()).not.toBeNull();
  });
});
