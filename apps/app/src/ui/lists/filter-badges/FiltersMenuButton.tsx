import { Badge } from '@/ui';
import { DEPRECATED_ButtonMenu } from '@/ui/design-system/Button';
import { ButtonSize } from '@/ui/design-system/Button/types';
import { VisibleWhen } from '@/ui/design-system/VisibleWhen';
import { ReactNode, useState } from 'react';

export const FiltersMenuButton = ({
  children,
  activeFiltersCount,
  size = 'xs',
}: {
  children: ReactNode;
  activeFiltersCount: number;
  size?: ButtonSize;
}) => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <div className="relative">
      <DEPRECATED_ButtonMenu
        icon="equalizer-line"
        variant="outlined"
        text="Filtrer"
        size={size}
        openState={{
          isOpen,
          setIsOpen,
        }}
        menuPlacement="bottom-end"
      >
        <div className="p-4 min-w-[400px]">{children}</div>
      </DEPRECATED_ButtonMenu>
      <VisibleWhen condition={activeFiltersCount > 0}>
        <Badge
          className="absolute -top-2 -right-2 rounded-full border-2 border-white"
          title={activeFiltersCount}
          state="info"
          size="sm"
        />
      </VisibleWhen>
    </div>
  );
};
