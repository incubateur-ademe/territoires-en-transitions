import { render, screen } from '@testing-library/react';
import { useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import { SidePanel } from './side-panel';
import { SidePanelProvider, useSidePanel } from './side-panel.context';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

const HEADER_EXTRA = 'Transports · Impact potentiel estimé : 19/100';

const CONTENT = 'Contenu du volet';

const OpenedPanel = () => {
  const { setPanel } = useSidePanel();
  useEffect(() => {
    setPanel({
      type: 'open',
      title: 'Covoiturage',
      headerExtra: <p>{HEADER_EXTRA}</p>,
      content: <p>{CONTENT}</p>,
    });
  }, [setPanel]);
  return null;
};

const renderOpenedPanel = () =>
  render(
    <SidePanelProvider>
      <OpenedPanel />
      <SidePanel />
    </SidePanelProvider>
  );

describe('SidePanel', () => {
  it("garde le bouton de fermeture et le titre quand le panneau ajoute un complément d'en-tête", () => {
    renderOpenedPanel();

    expect({
      closeButton: screen.queryByRole('button', { name: 'Fermer' }) !== null,
      title: screen.queryByText('Covoiturage') !== null,
      headerExtra: screen.queryByText(HEADER_EXTRA) !== null,
    }).toEqual({ closeButton: true, title: true, headerExtra: true });
  });
});
