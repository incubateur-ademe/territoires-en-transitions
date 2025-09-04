import Link from 'next/link';

import { appLayoutGridClassnames } from '@/app/ui/layout/app-layout';
import { useSidePanel } from '@/app/ui/layout/side-panel/side-panel.context';
import { Icon } from '@/ui';
import { cn } from '@/ui/utils/cn';

export const SidePanel = () => {
  const { panel, setPanel } = useSidePanel();

  return (
    <div
      className={cn(
        `relative flex ${appLayoutGridClassnames.panel} border-l border-primary-3 bg-white shadow`
      )}
    >
      <div className="sticky inset-0 w-full flex flex-col h-screen max-h-screen">
        {/** Header */}
        <div className="sticky top-0 z-10 bg-white">
          <div className="flex items-center border-b border-primary-3">
            {/* Fermer  */}
            <button
              className="p-2 w-10 h-10"
              onClick={() => setPanel({ type: 'close' })}
              title="Fermer"
            >
              <Icon
                icon="arrow-right-double-line"
                size="xs"
                className="text-primary-8"
              />
            </button>
            {/* Expand - ouvrir en pleine page */}
            {panel.expand && (
              <Link
                className="flex p-2 w-10 h-10 bg-none hover:!bg-grey-2"
                href={panel.expand.href}
                onClick={() => setPanel({ type: 'close' })}
                title="Ouvrir"
              >
                <Icon
                  icon="expand-diagonal-s-line"
                  size="xs"
                  className="m-auto text-primary-8"
                />
              </Link>
            )}
            <div className="mr-4 bg-primary-3 h-8 w-[0.5px]" />
            {panel.title && (
              <h6 className="mb-0 text-sm uppercase">{panel.title}</h6>
            )}
          </div>
        </div>

        {/** Content */}
        <div className="grow">{panel.content}</div>
      </div>
    </div>
  );
};
