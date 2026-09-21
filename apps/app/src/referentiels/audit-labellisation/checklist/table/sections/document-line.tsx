import { MissingFileBadge } from '@/app/referentiels/preuves/Bibliotheque/missing-file.badge';
import { Icon } from '@tet/ui';
import { ReactElement, ReactNode } from 'react';

type DocumentLineProps = {
  filename: string | null;
  isMissing: boolean;
  children: ReactNode;
};

export const DocumentLine = ({
  filename,
  isMissing,
  children,
}: DocumentLineProps): ReactElement => (
  <div className="flex items-center gap-2 text-sm text-grey-9">
    <Icon icon="file-text-line" size="sm" className="shrink-0 text-grey-7" />
    <span
      className="min-w-0 flex-1 truncate font-medium"
      title={filename ?? undefined}
    >
      {filename}
    </span>
    {isMissing && <MissingFileBadge />}
    <div className="flex shrink-0 items-center gap-1">{children}</div>
  </div>
);
