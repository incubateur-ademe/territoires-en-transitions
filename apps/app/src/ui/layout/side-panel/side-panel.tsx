import {
  SidePanelTitleProps,
  useSidePanel,
} from '@/app/ui/layout/side-panel/side-panel.context';
import { Icon } from '@tet/ui';
import { uiLabels } from '@tet/ui/labels/catalog';
import { cn } from '@tet/ui/utils/cn';
import { usePathname } from 'next/navigation';
import { JSX, useEffect, useRef } from 'react';

export const DefaultSidePanelTitle = ({
  title,
}: SidePanelTitleProps): JSX.Element => (
  <h6 className="mb-0 text-sm uppercase">{title}</h6>
);

const CloseButton = ({ onClick }: { onClick: () => void }): JSX.Element => (
  <button
    className={cn(
      'h-6 flex items-center justify-center',
      "relative before:absolute before:-inset-2 before:rounded before:content-[''] hover:before:bg-grey-2"
    )}
    onClick={onClick}
    title={uiLabels.fermer}
  >
    <Icon
      icon="arrow-right-double-line"
      size="xs"
      className="relative text-primary-8"
    />
  </button>
);

const Divider = (): JSX.Element => (
  <div className="bg-primary-3 h-6 w-[0.5px]" />
);

/**
 * Ferme le panneau a chaque changement de route, sauf si la page suivante
 * est declaree persistante via `isPersistentWithNextPath`.
 *
 * Le premier render est ignore via `previousPathname` : sans ce garde-fou,
 * l'effet fermerait un panel qu'une page venait d'ouvrir au meme cycle.
 */
const useCloseOnRouteChange = (): void => {
  const { panel, setPanel } = useSidePanel();
  const pathname = usePathname();
  const previousPathname = useRef(pathname);
  useEffect(() => {
    if (previousPathname.current === pathname) return;
    previousPathname.current = pathname;
    if (!panel.isPersistentWithNextPath?.(pathname)) {
      setPanel({ type: 'close' });
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);
};

export const SidePanel = (): JSX.Element => {
  const { panel, setPanel } = useSidePanel();
  useCloseOnRouteChange();

  const Title = panel.Title ?? DefaultSidePanelTitle;

  return (
    <aside
      aria-label={panel.title}
      aria-hidden={!panel.isOpen}
      inert={!panel.isOpen}
      className={cn(
        'sticky top-0 self-start h-screen',
        'w-[100vw] lg:w-side-panel',
        'flex flex-col border-l border-primary-3 bg-white shadow',
        !panel.isOpen && 'pointer-events-none'
      )}
    >
      <div className="shrink-0 bg-white p-4 border-b border-primary-3">
        <div className="flex items-start gap-2">
          <CloseButton onClick={() => setPanel({ type: 'close' })} />
          <Divider />
          {panel.title && <Title title={panel.title} />}
        </div>
      </div>

      <div className="grow flex flex-col overflow-y-auto">{panel.content}</div>
    </aside>
  );
};
