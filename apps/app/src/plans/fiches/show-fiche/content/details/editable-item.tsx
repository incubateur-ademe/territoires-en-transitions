import { appLabels } from '@/app/labels/catalog';
import { cn, Icon, InlineEditWrapper } from '@tet/ui';

const DisplayValue = ({ value }: { value?: string | React.ReactNode }) => {
  return typeof value === 'string' || !value ? (
    <span>{value || appLabels.placeholderARenseigner}</span>
  ) : (
    value
  );
};

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return <div className="min-w-[360px]">{children}</div>;
};

const IconComponent = ({
  icon,
  small,
}: {
  icon: string | React.ReactNode;
  small?: boolean;
}) => {
  const IconComponent = icon ? (
    typeof icon === 'string' ? (
      <Icon icon={icon} />
    ) : (
      icon
    )
  ) : null;
  if (!IconComponent) return null;
  return (
    <div
      className={cn(
        'bg-primary-1 rounded-full self-start flex items-center justify-center flex-none text-primary-9 ',
        {
          'w-12 h-12': !small,
          'w-8 h-8': small,
        }
      )}
    >
      {IconComponent}
    </div>
  );
};

export const InlineEditableItem = ({
  small,
  icon,
  label,
  value,
  isReadonly,
  renderOnEdit,
}: {
  small?: boolean;
  icon?: string | React.ReactNode;
  label?: string | React.ReactNode;
  value?: string | React.ReactNode;
  isReadonly: boolean;
  renderOnEdit: (args: {
    openState: { isOpen: boolean; setIsOpen: (v: boolean) => void };
  }) => React.ReactNode;
}) => {
  const hasLabel = !!label && typeof label === 'string';
  return (
    <div className="text-sm leading-6 font-regular gap-4 mb-1 flex items-start">
      <IconComponent icon={icon} small={small} />
      <div
        className={cn('flex flex-col self-stretch', {
          'justify-center': !hasLabel,
        })}
      >
        {typeof label === 'string' ? (
          <div className="text-primary-10 text-base flex items-center gap-1">
            {appLabels.labelDeuxPoints({ label })}{' '}
          </div>
        ) : (
          label
        )}
        <InlineEditWrapper
          disabled={isReadonly}
          renderOnEdit={({ openState }) => (
            <Wrapper>{renderOnEdit({ openState })}</Wrapper>
          )}
        >
          <div
            className={cn({
              'cursor-pointer hover:opacity-80 transition-opacity': !isReadonly,
              'cursor-not-allowed': isReadonly,
            })}
          >
            <DisplayValue value={value} />
          </div>
        </InlineEditWrapper>
      </div>
    </div>
  );
};
