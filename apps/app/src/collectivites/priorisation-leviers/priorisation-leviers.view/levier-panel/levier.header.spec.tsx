import { SidePanel } from '@/app/ui/layout/side-panel/side-panel';
import {
  SidePanelProvider,
  useSidePanel,
} from '@/app/ui/layout/side-panel/side-panel.context';
import { render } from '@testing-library/react';
import { RefCallback, useEffect } from 'react';
import { describe, expect, it, vi } from 'vitest';
import {
  LevierPriorisation,
  NO_MOBILISATION,
} from '../data/to-leviers-priorisation';
import { LevierHeader } from './levier.header';

vi.mock('next/navigation', () => ({ usePathname: () => '/' }));

const COVOITURAGE: LevierPriorisation = {
  levierId: 'covoiturage',
  nom: 'Covoiturage',
  secteur: 'Transports',
  ficheCount: 0,
  mobilisationScore: 0,
  noteByCategorie: NO_MOBILISATION,
};

const SUBTITLE = 'Transports · Impact potentiel estimé : 19/100';

const OpenedLevierPanel = ({
  headerRef,
}: {
  headerRef: RefCallback<HTMLElement>;
}) => {
  const { setPanel } = useSidePanel();
  useEffect(() => {
    setPanel({
      type: 'open',
      title: COVOITURAGE.nom,
      headerExtra: (
        <LevierHeader
          levier={COVOITURAGE}
          subtitle={SUBTITLE}
          headerRef={headerRef}
        />
      ),
    });
  }, [setPanel, headerRef]);
  return null;
};

describe('LevierHeader', () => {
  it('cible un en-tête du volet qui contient le titre du levier et son sous-titre', () => {
    const headerRef = vi.fn<(element: HTMLElement | null) => void>();

    render(
      <SidePanelProvider>
        <OpenedLevierPanel headerRef={headerRef} />
        <SidePanel />
      </SidePanelProvider>
    );

    const target = headerRef.mock.lastCall?.[0];
    expect({
      title: target?.textContent?.includes(COVOITURAGE.nom),
      subtitle: target?.textContent?.includes(SUBTITLE),
    }).toEqual({ title: true, subtitle: true });
  });

  it("désenregistre l'en-tête du volet quand le levier quitte le volet", () => {
    const unregister = vi.fn();
    const headerRef = vi.fn<RefCallback<HTMLElement>>(() => unregister);

    const { unmount } = render(
      <SidePanelProvider>
        <OpenedLevierPanel headerRef={headerRef} />
        <SidePanel />
      </SidePanelProvider>
    );
    unmount();

    expect(unregister).toHaveBeenCalledOnce();
  });
});
