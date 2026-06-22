import { uiLabels } from '@tet/ui/labels/catalog';
import { JSX, ReactNode } from 'react';
import { Button } from '../Button';
import { Divider } from '../Divider';

export type FloatingPanelProps = {
  title: string;
  onClose: () => void;
  closeLabel?: string;
  children: ReactNode;
};

export const FloatingPanel = ({
  title,
  onClose,
  closeLabel,
  children,
}: FloatingPanelProps): JSX.Element => (
  <aside
    aria-label={title}
    className="fixed bottom-6 right-6 z-modal flex max-w-modal-xs flex-col gap-3 rounded-md border border-grey-4 bg-white p-6 shadow-[0_4px_30px_0px_rgba(0,0,0,0.02)]"
  >
    <div className="flex shrink-0 items-start justify-between gap-3">
      <h3 className="mb-0 text-base font-semibold leading-6 text-primary-9">
        {title}
      </h3>
      <Button
        title={closeLabel ?? uiLabels.fermer}
        onClick={onClose}
        icon="close-line"
        variant="unstyled"
        size="xs"
      />
    </div>
    <Divider />
    <div className="flex max-h-[70vh] flex-col gap-6 overflow-y-auto">
      {children}
    </div>
  </aside>
);
