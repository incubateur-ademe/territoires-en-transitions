import { Checkbox, VisibleWhen } from '@tet/ui';
import { ReactNode } from 'react';

type EditableSectionProps = {
  label: string;
  children: ReactNode;
  toggleChecked?: boolean;
  onToggleChange?: (checked: boolean) => void;
};

export const EditableSection = ({
  label,
  children,
  toggleChecked = false,
  onToggleChange,
}: EditableSectionProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center sticky top-0 z-[3] bg-white">
        <h6 className="text-primary-9 text-base font-bold m-0 pt-1">{label}</h6>
        <VisibleWhen condition={!!onToggleChange}>
          <Checkbox
            variant="switch"
            label="Détailler par année"
            checked={toggleChecked}
            onChange={(e) => onToggleChange?.(e.target.checked)}
          />
        </VisibleWhen>
      </div>
      {children}
    </div>
  );
};
