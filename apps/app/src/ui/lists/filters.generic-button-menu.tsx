import { ButtonMenu } from '@tet/ui';
import { ReactNode } from 'react';

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
    Filtrer
  </ButtonMenu>
);
