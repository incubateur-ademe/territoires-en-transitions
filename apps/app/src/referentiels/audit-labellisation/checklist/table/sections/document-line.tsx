import { Icon } from '@tet/ui';
import { ReactElement, ReactNode } from 'react';
import { RiFileTextLine } from '@remixicon/react';

export const DocumentLine = ({
  filename,
  children,
}: {
  filename: string | undefined;
  children: ReactNode;
}): ReactElement => (
  <div className="flex items-center gap-2 text-sm text-grey-9">
    <Icon icon={<RiFileTextLine />} size="sm" className="shrink-0 text-grey-7" />
    <span className="min-w-0 flex-1 truncate font-medium" title={filename}>
      {filename}
    </span>
    <div className="flex shrink-0 items-center gap-1">{children}</div>
  </div>
);
