import { Button, VisibleWhen } from '@/ui';
import { ReactNode } from 'react';

type EditableSectionProps = {
  label: string;
  isReadonly?: boolean;
  hasContent: boolean;
  onEdit?: () => void;
  editButtonTitle?: string;
  emptyText?: string;
  children: ReactNode;
};

export const EditableSection = ({
  label,
  isReadonly = true,
  hasContent,
  onEdit,
  editButtonTitle,
  children,
}: EditableSectionProps) => {
  return (
    <div className="flex flex-col gap-2">
      <div className="flex justify-between items-center">
        <div>
          <span className="uppercase text-primary-9 text-sm font-bold">
            {label}
          </span>
          {!hasContent && <span className="text-grey-7">Non renseignés</span>}
        </div>
        <VisibleWhen condition={!isReadonly && !!onEdit}>
          <Button
            title={editButtonTitle}
            icon="edit-line"
            size="xs"
            variant="grey"
            disabled={isReadonly}
            onClick={onEdit}
          />
        </VisibleWhen>
      </div>
      <VisibleWhen condition={hasContent}>{children}</VisibleWhen>
    </div>
  );
};
