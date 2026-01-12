import { cn, Icon, InlineEditWrapper } from '@tet/ui';

const DisplayValue = ({
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

const Wrapper = ({ children }: { children: React.ReactNode }) => {
  return <div className="min-w-[360px]">{children}</div>;
};

export const InlineEditableItem = ({
  icon,
  label,
  value,
  isReadonly,
  renderOnEdit,
}: {
  icon: string | React.ReactNode;
  label?: string;
  value: string | React.ReactNode | undefined | null;
  isReadonly: boolean;
  renderOnEdit: (args: {
    openState: { isOpen: boolean; setIsOpen: (v: boolean) => void };
  }) => React.ReactNode;
}) => {
  const IconComponent = typeof icon === 'string' ? <Icon icon={icon} /> : icon;

  return (
    <div className="text-sm leading-6 font-regular gap-4 mb-1 flex items-center">
      <div className="w-12 h-12 bg-primary-1 rounded-full self-start flex items-center justify-center flex-none text-primary-8 ">
        {IconComponent}
      </div>
      <div className="flex flex-col">
        {label && <div className="text-primary-10">{label}</div>}
        <InlineEditWrapper
          disabled={isReadonly}
          renderOnEdit={({ openState }) => (
            <Wrapper>{renderOnEdit({ openState })}</Wrapper>
          )}
        >
          <div
            className={cn({
              'cursor-pointer hover:opacity-80 transition-opacity': !isReadonly,
            })}
          >
            <DisplayValue value={value} />
          </div>
        </InlineEditWrapper>
      </div>
    </div>
  );
};
