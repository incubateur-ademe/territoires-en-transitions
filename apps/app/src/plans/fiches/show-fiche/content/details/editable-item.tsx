import { appLabels } from '@/app/labels/catalog';
import { DetailedAction } from '@/app/ui/detailed-action/detailed-action.layout';
import { cn, InlineEditWrapper } from '@tet/ui';

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
  return (
    <DetailedAction.Item small={small} icon={icon} label={label}>
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
    </DetailedAction.Item>
  );
};
