import { appLabels } from '@/app/labels/catalog';
import { FloatingPanel } from '@tet/ui';
import { JSX, ReactNode } from 'react';

type DownloadsPanelProps = {
  children: ReactNode;
  onClose: () => void;
  action?: ReactNode;
};

export function DownloadsPanel({
  children,
  onClose,
  action,
}: DownloadsPanelProps): JSX.Element {
  return (
    <FloatingPanel
      title={appLabels.mesTelechargements}
      onClose={onClose}
      closeLabel={appLabels.preuvesArchiveFermerPanel}
    >
      <ul className="m-0 flex list-none flex-col gap-6 p-0">{children}</ul>
      {action && <div className="mt-4 flex justify-end">{action}</div>}
    </FloatingPanel>
  );
}
