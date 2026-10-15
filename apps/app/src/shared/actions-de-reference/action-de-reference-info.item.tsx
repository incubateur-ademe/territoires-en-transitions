import { Icon } from '@tet/ui';
import type { JSX, ReactNode } from 'react';

type ActionDeReferenceInfoItemProps = {
  readonly icon: string;
  readonly label: string;
  readonly children: ReactNode;
};

const ActionDeReferenceInfoItem = ({
  icon,
  label,
  children,
}: ActionDeReferenceInfoItemProps): JSX.Element => (
  <div className="flex items-start gap-4">
    <span className="flex size-10 shrink-0 items-center justify-center rounded-full bg-primary-1 text-primary-9">
      <Icon icon={icon} aria-hidden />
    </span>
    <div className="flex flex-col gap-0.5 text-sm">
      <span className="text-primary-9">{label}</span>
      <span className="text-grey-8">{children}</span>
    </div>
  </div>
);

export { ActionDeReferenceInfoItem };
