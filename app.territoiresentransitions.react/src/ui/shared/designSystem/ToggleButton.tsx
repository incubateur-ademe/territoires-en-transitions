import classNames from 'classnames';
import {Ref, forwardRef} from 'react';
import IconCheck from 'ui/shared/designSystem/icons/IconCheck';

type Props = {
  isChecked?: boolean | null;
  className?: string;
  disabled?: boolean;
  onClick: (newValue: boolean) => void;
  description?: string;
  'data-test'?: string;
};

/** Boutton toggle avec description */
const ToggleButton = forwardRef(
  (
    {
      isChecked = false,
      className,
      disabled,
      description,
      onClick,
      'data-test': dataTest,
    }: Props,
    ref: Ref<HTMLButtonElement>
  ) => {
    const handleClick = () => {
      onClick(!isChecked);
    };

    return (
      <button
        data-test={dataTest}
        ref={ref}
        className={classNames(
          'flex items-center gap-3 !bg-transparent',
          className
        )}
        disabled={disabled}
        onClick={handleClick}
      >
        <div
          className={classNames('p-1 rounded-full bg-grey-4', {
            'bg-primary': isChecked,
            'opacity-50': disabled,
          })}
        >
          <div className="w-8">
            <span
              className={classNames(
                'flex w-4 h-4 rounded-full bg-grey-1 transition',
                {
                  'translate-x-4': isChecked,
                }
              )}
            >
              {isChecked && (
                <IconCheck className="w-3 h-3 m-auto fill-primary" />
              )}
            </span>
          </div>
        </div>
        {!!description && <span className="text-grey-8">{description}</span>}
      </button>
    );
  }
);

export default ToggleButton;
