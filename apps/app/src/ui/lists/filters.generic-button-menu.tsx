import { ButtonMenu } from '@tet/ui';
import { ReactNode } from 'react';
import { appLabels } from '@/app/labels/catalog';

export const FiltersGenericButtonMenu = ({
  children,
  activeFiltersCount,
  menuClassName,
  dataTest,
}: {
  children: ReactNode;
  activeFiltersCount: number;
  menuClassName?: string;
  dataTest?: string;
}) => (
  <ButtonMenu
    icon="equalizer-line"
    variant="outlined"
    size="sm"
    notification={
      activeFiltersCount > 0 ? { number: activeFiltersCount } : undefined
    }
    dataTest={dataTest}
    menu={{
      className: menuClassName,
      startContent: <div className="p-4">{children}</div>,
    }}
  >
    {appLabels.filtrer}
  </ButtonMenu>
);
