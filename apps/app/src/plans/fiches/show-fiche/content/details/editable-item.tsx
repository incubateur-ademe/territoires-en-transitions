import {
  cn,
  Icon,
  InfoTooltip,
  InlineEditWrapper,
  RichTextEditor,
} from '@tet/ui';
import { useMemo } from 'react';

const DisplayValue = ({
  value,
  helperText,
}: {
  value?: string;
  helperText?: string;
}) => {
  return (
    <div className="text-grey-8 flex items-center gap-1">
      {helperText && (
        <InfoTooltip
          label={helperText}
          size="sm"
          iconClassName="flex-shrink-0 text-info-500"
        />
      )}
      <span>{value || 'À renseigner'}</span>
    </div>
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

export const EditableRichTextView = ({
  value,
  isReadonly,
  icon,
  label,
  small,
  onChange,
}: {
  value: string;
  isReadonly: boolean;
  icon?: string | React.ReactNode;
  label?: string | React.ReactNode;
  small?: boolean;
  onChange: (value: string) => void;
}) => {
  // RichTextEditor behaves strangely when controlled hence
  // only the initial value is used on first mount
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const initialValue = useMemo(() => value, []);
  return (
    <div className="text-sm leading-6 font-regular gap-4 mb-1 flex items-start">
      <IconComponent icon={icon} small={small} />
      <div className="flex flex-col">
        {typeof label === 'string' ? (
          <div className="text-primary-10 text-base">{`${label} : `}</div>
        ) : (
          label
        )}
        <RichTextEditor
          unstyled
          disabled={isReadonly}
          initialValue={initialValue}
          onChange={onChange}
        />
      </div>
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
  helperText,
}: {
  small?: boolean;
  icon?: string | React.ReactNode;
  label?: string | React.ReactNode;
  value?: string;
  isReadonly: boolean;
  renderOnEdit: (args: {
    openState: { isOpen: boolean; setIsOpen: (v: boolean) => void };
  }) => React.ReactNode;
  helperText?: string;
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
            {`${label} : `}
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
            })}
          >
            <DisplayValue value={value} helperText={helperText} />
          </div>
        </InlineEditWrapper>
      </div>
    </div>
  );
};
