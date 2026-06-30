import { appLabels } from '@/app/labels/catalog';
import { FloatingPanel } from '@tet/ui';
import { JSX, ReactNode } from 'react';

type ArchivesPanelLayoutProps = {
  children: ReactNode;
  onClose: () => void;
  action?: ReactNode;
};

export function ArchivesPanelLayout({
  children,
  onClose,
  action,
}: ArchivesPanelLayoutProps): JSX.Element {
  return (
    <FloatingPanel
      title={appLabels.preuvesArchivePanelTitre}
      onClose={onClose}
      closeLabel={appLabels.preuvesArchiveFermerPanel}
    >
      <FloatingPanel.Content>
        <ul className="m-0 flex list-none flex-col gap-6 p-0">{children}</ul>
      </FloatingPanel.Content>
      {action && (
        <FloatingPanel.Footer>
          <div className="flex justify-end">{action}</div>
        </FloatingPanel.Footer>
      )}
    </FloatingPanel>
  );
}
