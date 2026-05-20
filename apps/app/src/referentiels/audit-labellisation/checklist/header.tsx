import { Icon } from '@tet/ui';
import { ReactElement, ReactNode } from 'react';

export const Header = ({
  title,
  subtitle,
  action,
}: {
  title: string;
  subtitle: string;
  action: ReactNode;
}): ReactElement => (
  <div className="flex items-start justify-between gap-6">
    <div>
      <h2 className="text-lg font-bold text-primary-10 leading-tight">
        {title}
      </h2>
      <p className="flex items-center gap-1 m-0 p-0 text-xs text-info-1 font-weight-500">
        <Icon icon="information-fill" size="sm" className="text-info-1" />
        {subtitle}
      </p>
    </div>
    <div className="flex items-center gap-2">{action}</div>
  </div>
);
