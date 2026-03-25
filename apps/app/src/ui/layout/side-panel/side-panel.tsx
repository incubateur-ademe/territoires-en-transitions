import { appLayoutGridClassnames } from '@/app/ui/layout/app-layout';
import {
  SidePanelTitleProps,
  useSidePanel,
} from '@/app/ui/layout/side-panel/side-panel.context';
import { Icon } from '@tet/ui';
import { cn } from '@tet/ui/utils/cn';
import { JSX } from 'react';

export const DefaultSidePanelTitle = ({
  title,
}: SidePanelTitleProps): JSX.Element => (
  <h6 className="mb-0 text-sm uppercase">{title}</h6>
);

const CloseButton = ({ onClick }: { onClick: () => void }): JSX.Element => (
  <button
    className={cn(
      'h-6 flex items-center justify-center',
      // Hitbox et hover étendus via ::before pour ne pas impacter le layout du header
      "relative before:absolute before:-inset-2 before:rounded before:content-[''] hover:before:bg-grey-2"
    )}
    onClick={onClick}
    title="Fermer"
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

export const SidePanel = (): JSX.Element => {
  const { panel, setPanel } = useSidePanel();
  /* TODO: Design system
  04/26: Le titre est rendu configurable pour afficher un titre plus lisible dans les mesures d'un référentiel. Dans une logique de cohérence dans l'app,
  il serait plus pertinent cependant que le side panel fournisse un style par défaut qui soit lisible pour tous ses usages.
  */
  const Title = panel.Title ?? DefaultSidePanelTitle;

  return (
    <div
      className={cn(
        `relative flex ${appLayoutGridClassnames.panel} border-l border-primary-3 bg-white shadow`
      )}
    >
      <div className="sticky inset-0 w-full flex flex-col h-screen max-h-screen">
        <div className="sticky top-0 z-10 bg-white p-4 border-b border-primary-3 ">
          <div className="flex items-start gap-2">
            <CloseButton onClick={() => setPanel({ type: 'close' })} />
            <Divider />
            {panel.title && <Title title={panel.title} />}
          </div>
        </div>

        <div className="grow flex flex-col overflow-y-auto">
          {panel.content}
        </div>
      </div>
    </div>
  );
};
