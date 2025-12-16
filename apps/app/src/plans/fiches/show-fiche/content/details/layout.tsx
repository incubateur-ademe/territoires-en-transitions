import { cn, Icon } from '@tet/ui';
import { useCallback, useState } from 'react';

const Title = ({ children }: { children: React.ReactNode }) => (
  <h6 className="text-base leading-4 text-primary-10 font-bold">{children}</h6>
);

export const Panel = ({
  title,
  children,
}: {
  title: string;
  children: React.ReactNode;
}) => (
  <div className="rounded-[10px] bg-white border border-grey-3 p-8 w-full">
    <Title>{title}</Title>
    <form className="mt-4 flex flex-col gap-4">{children}</form>
  </div>
);

const Content = ({
  value,
}: {
  value: string | React.ReactNode | undefined | null;
}) => {
  const showFallbackValue = !value;
  if (showFallbackValue) {
    return <div className="text-grey-7">À renseigner</div>;
  }

  if (typeof value === 'string') {
    return <div className="text-grey-8">{value}</div>;
  }
  return value;
};

type ItemProps = {
  icon: string | React.ReactNode;
  label: string;
  value: string | React.ReactNode | null | undefined;
  editComponent?: (onBlur: () => void) => React.ReactNode;
  onSave?: () => void;
  isReadonly?: boolean;
  error?: string | undefined;
};

/**
 Waiting for Arthur's work here so a rough implementation is used.
 */
export const TemporaryEditableItem = ({
  icon,
  label,
  value,
  editComponent,
  onSave,
  isReadonly = true,
  error,
}: ItemProps) => {
  const [isEditing, setIsEditing] = useState(false);

  const handleClick = () => {
    if (!isReadonly && editComponent && !isEditing) {
      setIsEditing(true);
    }
  };

  const handleBlur = useCallback(() => {
    setIsEditing(false);
    onSave?.();
  }, [onSave]);

  const IconComponent = typeof icon === 'string' ? <Icon icon={icon} /> : icon;

  const isEditMode = !isReadonly && editComponent !== undefined && isEditing;
  return (
    <div
      className={cn(
        'text-sm leading-6 font-regular gap-4 mb-1 flex items-center',
        {
          'cursor-pointer': !isEditMode,
        }
      )}
      onClick={handleClick}
    >
      <div className="w-12 h-12 bg-primary-1 rounded-full self-start flex items-center justify-center flex-none text-primary-8 ">
        {IconComponent}
      </div>
      <div>
        <span className="text-primary-10 mr-2">{`${label}:`}</span>
        {isEditMode ? editComponent?.(handleBlur) : <Content value={value} />}
        {error && (
          <Icon icon="alert-line" className="text-error-3 ml-1" title={error} />
        )}
      </div>
    </div>
  );
};
