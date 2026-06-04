import { ButtonMenu } from '@tet/ui';
import { ReactNode } from 'react';
import { appLabels } from '@/app/labels/catalog';

export const FiltersGenericButtonMenu = ({
  children,
  activeFiltersCount,
  menuClassName,
}: {
  children: ReactNode;
  activeFiltersCount: number;
  menuClassName?: string;
}) => (
  <ButtonMenu
    icon="equalizer-line"
    variant="outlined"
    size="sm"
    notification={
      activeFiltersCount > 0 ? { number: activeFiltersCount } : undefined
    }
    menu={{
      className: menuClassName,
      startContent: <div className="p-4">{children}</div>,
    }}
  >
    {appLabels.filtrer}
  </ButtonMenu>
);
